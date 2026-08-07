/**
 * Look at a built report in a real browser and report what is actually wrong.
 *
 * This exists because the report was redesigned three times without anyone
 * seeing it render. Every defect the owner found by eye — text clipped out of
 * a tile, a list item breaking mid-sentence, the sign-off colliding with the
 * month's plan — was visible in the DOM the whole time and nobody looked.
 *
 *   node tools/check-design.mjs [url] [--shots]
 *
 * Exit code 1 if anything failed, so it can gate a publish.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const url = process.argv[2] || 'http://localhost:8080/reports/2026-07-july/index.html';
const wantShots = process.argv.includes('--shots');
const SHOT_DIR = 'tools/design-shots';

/* Projector shapes this report is actually shown on. */
const VIEWPORTS = [
  { name: '16-9',  width: 1920, height: 1080 },
  { name: '16-10', width: 1680, height: 1050 },
  { name: '4-3',   width: 1024, height: 768 }
];

const problems = [];
const note = (viewport, kind, detail) => problems.push({ viewport, kind, detail });

const browser = await chromium.launch();

for (const vp of VIEWPORTS) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  const consoleErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => consoleErrors.push(String(e)));

  await page.goto(url, { waitUntil: 'load' });
  // Long enough for the frame-rate watchdog to have made up its mind. The
  // first version of this script looked after 1.2s, reported "no problems",
  // and the screenshot taken moments later showed calm mode had switched
  // itself on and removed the whole animated background. Check after the
  // watchdog can act, not before.
  await page.waitForTimeout(12000);
  // Scroll about a bit first: an idle page is not the page anyone uses, and
  // the watchdog only trips under real work.
  await page.evaluate(async () => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    for (let i = 0; i < 6; i++) { window.scrollBy(0, window.innerHeight * 0.9); await wait(320); }
    window.scrollTo(0, 0); await wait(500);
  });
  await page.waitForTimeout(2500);

  /* ── The moving layers ──────────────────────────────── */
  const layers = await page.evaluate(() => {
    const seen = (el) => {
      if (!el) return { present: false };
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        present: true,
        display: s.display,
        visibility: s.visibility,
        opacity: Number(s.opacity),
        animationName: s.animationName,
        animationPlayState: s.animationPlayState,
        zIndex: s.zIndex,
        area: Math.round(r.width * r.height)
      };
    };
    return {
      calmOn: document.documentElement.classList.contains('calm'),
      toast: document.querySelector('.deck-toast')?.textContent?.trim() || null,
      glow: seen(document.querySelector('.layer-glow')),
      capsules: seen(document.querySelector('.layer-capsules')),
      particles: seen(document.querySelector('canvas.layer-particles')),
      backdropAfterZ: getComputedStyle(document.querySelector('.backdrop'), '::after').zIndex,
      backdropBeforeZ: getComputedStyle(document.querySelector('.backdrop'), '::before').zIndex
    };
  });

  if (layers.calmOn) {
    note(vp.name, 'ANIMATED BACKGROUND OFF',
      'html.calm is set, which hides the glow and the particles. ' +
      (layers.toast ? `Toast on screen: "${layers.toast}"` : 'No toast — so this was not the frame-rate watchdog.'));
  }
  if (!layers.particles.present) {
    note(vp.name, 'ANIMATED BACKGROUND OFF', 'No canvas.layer-particles in the DOM — the particle layer never started.');
  } else if (layers.particles.display === 'none' || layers.particles.opacity === 0) {
    note(vp.name, 'ANIMATED BACKGROUND OFF', `Particle canvas is present but not visible (display:${layers.particles.display}, opacity:${layers.particles.opacity}).`);
  }
  if (layers.glow.present && layers.glow.animationName === 'none') {
    note(vp.name, 'ANIMATED BACKGROUND OFF', 'The glow layer has no animation running.');
  }
  if (layers.glow.present && layers.glow.display === 'none') {
    note(vp.name, 'ANIMATED BACKGROUND OFF', 'The glow layer is display:none.');
  }

  /* Is the glow actually reaching the screen, or is it buried under a wash?
     This is the exact bug that hid the animated layer once before. */
  const glowBuried = await page.evaluate(() => {
    const glow = document.querySelector('.layer-glow');
    if (!glow) return null;
    const z = (el, pseudo) => parseInt(getComputedStyle(el, pseudo).zIndex, 10) || 0;
    const bd = document.querySelector('.backdrop');
    return { glowZ: z(glow), washZ: z(bd, '::after'), vignetteZ: z(bd, '::before') };
  });
  if (glowBuried && glowBuried.washZ > glowBuried.glowZ) {
    note(vp.name, 'ANIMATED BACKGROUND OFF',
      `The white wash (z-index ${glowBuried.washZ}) paints over the glow (z-index ${glowBuried.glowZ}).`);
  }

  /* ── Sideways scroll ────────────────────────────────── */
  const overflow = await page.evaluate(() => ({
    doc: document.documentElement.scrollWidth,
    win: window.innerWidth
  }));
  if (overflow.doc > overflow.win + 1) {
    note(vp.name, 'SIDEWAYS SCROLL', `The page is ${overflow.doc}px wide in a ${overflow.win}px window.`);
  }

  /* ── Content cut off inside its own box ─────────────── */
  const clipped = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('.metric, .card, .tag, .badge, .summary-strip, .checks li, .band')) {
      const s = getComputedStyle(el);
      const hiddenX = s.overflowX === 'hidden' || s.overflow === 'hidden';
      const cut = el.scrollWidth - el.clientWidth;
      if (hiddenX && cut > 2) {
        out.push({
          sel: el.className.toString().slice(0, 60),
          cutBy: cut,
          text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 70)
        });
      }
    }
    return out;
  });
  for (const c of clipped) {
    note(vp.name, 'CONTENT CUT OFF', `.${c.sel} loses ${c.cutBy}px — "${c.text}"`);
  }

  /* ── Things overlapping things ──────────────────────── */
  const collisions = await page.evaluate(() => {
    const out = [];
    const panel = document.querySelector('.closing-panel');
    if (panel) {
      const sal = panel.querySelector('.salamat');
      const next = panel.querySelector('.closing-next');
      if (sal && next) {
        const a = sal.getBoundingClientRect(), b = next.getBoundingClientRect();
        if (b.top < a.bottom) out.push(`The sign-off and the next-month list overlap by ${Math.round(a.bottom - b.top)}px.`);
      }
    }
    return out;
  });
  for (const c of collisions) note(vp.name, 'OVERLAP', c);

  /* ── Do reveals actually replay? ────────────────────── */
  if (vp.name === '16-9') {
    const replay = await page.evaluate(async () => {
      const first = document.querySelector('[data-reveal-on-scroll]');
      if (!first) return { ok: false, why: 'nothing to reveal' };
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      // The page sets scroll-behavior: smooth. Jumping the length of the
      // document then checking 900ms later measures the smooth scroll, not the
      // reveal. Turn it off for the duration of the check.
      const prev = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = 'auto';
      const restore = () => { document.documentElement.style.scrollBehavior = prev; };
      first.scrollIntoView(); await wait(900);
      const revealedFirst = first.classList.contains('is-revealed');
      window.scrollTo(0, document.body.scrollHeight); await wait(1400);
      const clearedOnExit = !first.classList.contains('is-revealed');
      window.scrollTo(0, 0); await wait(1200);
      const revealedAgain = first.classList.contains('is-revealed');
      restore();
      return { ok: revealedFirst && clearedOnExit && revealedAgain, revealedFirst, clearedOnExit, revealedAgain };
    });
    if (!replay.ok) {
      note(vp.name, 'ANIMATION DOES NOT REPLAY', JSON.stringify(replay));
    }
  }

  for (const e of consoleErrors) note(vp.name, 'CONSOLE ERROR', e);

  if (wantShots) {
    mkdirSync(SHOT_DIR, { recursive: true });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${SHOT_DIR}/${vp.name}-top.png` });
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 2.2));
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${SHOT_DIR}/${vp.name}-mid.png` });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${SHOT_DIR}/${vp.name}-end.png` });
  }

  await page.close();
}

await browser.close();

if (problems.length === 0) {
  console.log('No problems found.');
  process.exit(0);
}
const byKind = new Map();
for (const p of problems) {
  const list = byKind.get(p.kind) || [];
  list.push(p);
  byKind.set(p.kind, list);
}
console.log(`${problems.length} problem(s):\n`);
for (const [kind, list] of byKind) {
  console.log(`## ${kind}`);
  for (const p of list) console.log(`  [${p.viewport}] ${p.detail}`);
  console.log('');
}
process.exit(1);
