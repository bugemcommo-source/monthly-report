/**
 * Do the system screenshots work, and are they big enough to be worth putting
 * on a wall?
 *
 * Checks every .shot on the page: the image actually loads, it is rendered
 * wide enough to read projected, it has real alt text, the frame is reachable
 * by keyboard, and the enlarged view opens, holds the page still behind it,
 * closes on Escape and gives focus back.
 *
 * Also refuses to pass if a member's name reaches the page. The screenshots
 * are cropped before they get here; this is the check that the crop held.
 */
import { chromium } from 'playwright';

const url = process.argv[2] || 'http://localhost:8080/reports/2026-07-july/index.html';
const fails = [];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const missing = [];
page.on('response', (r) => { if (r.status() >= 400) missing.push(`${r.status()} ${r.url()}`); });

await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(1200);

// Nudge every screenshot into view so lazy loading actually fires.
await page.evaluate(async () => {
  for (const f of document.querySelectorAll('.shot-frame')) {
    f.scrollIntoView({ block: 'center', behavior: 'instant' });
    await new Promise((r) => setTimeout(r, 120));
  }
  window.scrollTo({ top: 0, behavior: 'instant' });
});
await page.waitForTimeout(800);

const shots = await page.evaluate(() =>
  Array.from(document.querySelectorAll('.shot-frame')).map((f) => {
    const img = f.querySelector('img');
    const fig = f.closest('.shot');
    const cap = fig && fig.querySelector('figcaption');
    return {
      src: img ? img.getAttribute('src') : null,
      loaded: img ? img.naturalWidth > 0 : false,
      renderedWidth: Math.round(f.getBoundingClientRect().width),
      alt: img ? (img.alt || '').replace(/\s+/g, ' ').trim() : '',
      caption: cap ? cap.textContent.replace(/\s+/g, ' ').trim() : '',
      name: (f.querySelector('.shot-name') || {}).textContent || '',
      hasShotAttr: !!f.dataset.shot,
      tag: f.tagName
    };
  })
);

if (shots.length === 0) fails.push('No screenshots found on the page at all.');

for (const s of shots) {
  const id = s.src || '(no src)';
  if (!s.loaded) fails.push(`${id}: the image did not load`);
  if (s.tag !== 'BUTTON') fails.push(`${id}: the frame is a <${s.tag}>, so it cannot be opened from the keyboard`);
  if (!s.hasShotAttr) fails.push(`${id}: no data-shot, so enlarging will do nothing`);
  // 380px is roughly where a dashboard stops being readable when projected.
  if (s.renderedWidth < 380) fails.push(`${id}: rendered only ${s.renderedWidth}px wide — too small to read projected`);
  if (s.alt.length < 40) fails.push(`${id}: alt text is thin (${s.alt.length} chars): "${s.alt}"`);
  if (s.caption.length < 20) fails.push(`${id}: caption is thin (${s.caption.length} chars)`);
  if (!s.name.trim()) fails.push(`${id}: the window frame has no title`);
}

// Open the first one and put the enlarged view through its paces.
if (shots.length > 0) {
  const frame = page.locator('.shot-frame').first();
  await frame.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const scrollBefore = await page.evaluate(() => window.scrollY);
  await frame.click();
  await page.waitForTimeout(500);

  const open = await page.evaluate(() => {
    const box = document.querySelector('.lightbox');
    if (!box) return null;
    const img = box.querySelector('img');
    return {
      hidden: box.hidden,
      opacity: Number(getComputedStyle(box).opacity),
      imgLoaded: img ? img.naturalWidth > 0 : false,
      imgWidth: img ? Math.round(img.getBoundingClientRect().width) : 0,
      alt: img ? img.alt.trim().length : 0,
      caption: (box.querySelector('figcaption') || {}).textContent?.trim().length || 0,
      focusInside: box.contains(document.activeElement)
    };
  });

  if (!open) fails.push('Enlarging: no .lightbox was created');
  else {
    if (open.hidden || open.opacity < 0.9) fails.push(`Enlarging: it did not become visible (${JSON.stringify(open)})`);
    if (!open.imgLoaded) fails.push('Enlarging: the full-size image did not load');
    if (open.imgWidth < 700) fails.push(`Enlarging: only ${open.imgWidth}px wide — no bigger than the thumbnail`);
    if (open.alt < 40) fails.push('Enlarging: the enlarged image lost its alt text');
    if (open.caption < 20) fails.push('Enlarging: the enlarged image lost its caption');
    if (!open.focusInside) fails.push('Enlarging: focus did not move into it');
  }

  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  const after = await page.evaluate(() => ({
    open: document.querySelector('.lightbox')?.classList.contains('is-open'),
    focusOnFrame: document.activeElement?.classList?.contains('shot-frame'),
    scrollY: window.scrollY
  }));
  if (after.open) fails.push('Enlarging: Escape did not close it');
  if (!after.focusOnFrame) fails.push('Enlarging: focus did not return to the screenshot');
  if (Math.abs(after.scrollY - scrollBefore) > 4) {
    fails.push(`Enlarging: the page behind moved (${scrollBefore} → ${after.scrollY})`);
  }
}

// The crop is the only thing standing between a member's name and a public
// website. Check it every time, not once.
const leaks = await page.evaluate(() => {
  const text = document.body.innerText;
  const bad = [];
  if (/\bWatchlist\b/i.test(text)) bad.push('the word "Watchlist" (the member table) is in the page text');
  if (/[\w.+-]+@[\w-]+\.[\w.]+/.test(text)) bad.push('an email address is in the page text');
  return bad;
});
for (const l of leaks) fails.push(`REDACTION: ${l}`);

for (const m of missing) fails.push(`MISSING FILE: ${m}`);
for (const e of errors) fails.push(`CONSOLE: ${e}`);

await browser.close();

if (fails.length === 0) {
  console.log(`Screenshots: ${shots.length} checked, all pass.`);
  for (const s of shots) console.log(`  ${s.src} — ${s.renderedWidth}px wide on a 1600px page`);
  process.exit(0);
}
console.log(`${fails.length} problem(s):`);
for (const f of fails) console.log('  - ' + f);
process.exit(1);
