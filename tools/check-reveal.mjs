/**
 * Does a reveal actually ANIMATE, or does it just appear?
 *
 * check-design.mjs only proved the `is-revealed` class goes on and off. The
 * owner's report was "no on-scroll animation, it just appeared" — which is
 * exactly what a correct class toggle with a dead transition looks like. This
 * samples real opacity over real frames.
 */
import { chromium } from 'playwright';

const url = process.argv[2] || 'http://localhost:8080/reports/2026-07-july/index.html';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(1500);

const report = await page.evaluate(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const html = document.documentElement;

  const env = {
    calmClass: html.classList.contains('calm'),
    calmStored: localStorage.getItem('bugemco-calm'),
    prefersReducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches
  };

  // Pick a target well down the page that has not been revealed yet.
  const all = [...document.querySelectorAll('[data-reveal-on-scroll]')];
  const target = all.find((el) => !el.classList.contains('is-revealed') &&
    el.getBoundingClientRect().top > window.innerHeight * 2) || all[all.length - 1];
  if (!target) return { env, error: 'no reveal targets' };

  const cs = getComputedStyle(target);
  const declared = {
    transitionProperty: cs.transitionProperty,
    transitionDuration: cs.transitionDuration,
    transitionDelay: cs.transitionDelay,
    opacityBefore: cs.opacity,
    translateBefore: cs.translate
  };

  // Scroll it into view and sample opacity every frame for ~700ms.
  html.style.scrollBehavior = 'auto';
  target.scrollIntoView({ block: 'center' });

  const samples = [];
  const t0 = performance.now();
  await new Promise((resolve) => {
    const sample = () => {
      samples.push({
        t: Math.round(performance.now() - t0),
        opacity: Number(getComputedStyle(target).opacity).toFixed(3),
        translate: getComputedStyle(target).translate
      });
      if (performance.now() - t0 < 700) requestAnimationFrame(sample);
      else resolve();
    };
    requestAnimationFrame(sample);
  });
  await wait(200);

  const values = [...new Set(samples.map((s) => s.opacity))];
  return {
    env,
    declared,
    distinctOpacityValues: values.length,
    firstFew: samples.slice(0, 6),
    last: samples[samples.length - 1],
    animated: values.length > 3
  };
});

await browser.close();

console.log(JSON.stringify(report, null, 2));
if (report.error) process.exit(1);
if (!report.animated) {
  console.log('\nVERDICT: the element did NOT animate — it snapped straight to its final state.');
  process.exit(1);
}
console.log('\nVERDICT: the element animated across ' + report.distinctOpacityValues + ' distinct opacity values.');
