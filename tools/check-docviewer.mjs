/**
 * Do the proposal panels actually work?
 *
 * Opens each one, checks it is visible and scrollable, checks Escape closes
 * it, checks focus returns to the button, and checks the page behind stays
 * put. Written because "it renders" and "it works" are different claims and
 * only one of them can be made without a browser.
 */
import { chromium } from 'playwright';

const url = process.argv[2] || 'http://localhost:8080/reports/2026-07-july/index.html';
const fails = [];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(1500);

for (const id of ['proposal-summary', 'proposal-document']) {
  const button = page.locator(`[data-doc-open="${id}"]`);
  if (await button.count() === 0) { fails.push(`${id}: no button opens it`); continue; }

  // Bring the button into view FIRST, then record where the page sits. Clicking
  // scrolls the button into view on its own, so recording beforehand measured
  // Playwright's scroll rather than anything the panel did.
  await button.first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const scrollBefore = await page.evaluate(() => window.scrollY);
  await button.first().click();
  await page.waitForTimeout(500);

  const state = await page.evaluate((panelId) => {
    const panel = document.getElementById(panelId);
    const body = panel.querySelector('.doc-body');
    return {
      hidden: panel.hidden,
      open: panel.classList.contains('is-open'),
      opacity: Number(getComputedStyle(panel).opacity),
      scrollable: body ? body.scrollHeight > body.clientHeight : false,
      scrollHeight: body ? body.scrollHeight : 0,
      clientHeight: body ? body.clientHeight : 0,
      focusInside: panel.contains(document.activeElement),
      textLength: (panel.textContent || '').trim().length
    };
  }, id);

  if (state.hidden || !state.open || state.opacity < 0.9) fails.push(`${id}: did not become visible (${JSON.stringify(state)})`);
  if (!state.scrollable) fails.push(`${id}: does not scroll — content ${state.scrollHeight}px in a ${state.clientHeight}px panel`);
  if (!state.focusInside) fails.push(`${id}: focus did not move into the panel`);
  if (state.textLength < 400) fails.push(`${id}: suspiciously little content (${state.textLength} chars)`);

  // Scroll the document body and confirm it moved. The panel uses smooth
  // scrolling, so reading scrollTop on the same tick returns the OLD value —
  // wait for it to land before asking.
  await page.evaluate((panelId) => {
    document.getElementById(panelId).querySelector('.doc-body').scrollTop = 400;
  }, id);
  await page.waitForTimeout(700);
  const scrolled = await page.evaluate((panelId) =>
    document.getElementById(panelId).querySelector('.doc-body').scrollTop, id);
  if (scrolled < 100) fails.push(`${id}: scrolling the panel body had no effect`);

  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  const after = await page.evaluate((panelId) => ({
    open: document.getElementById(panelId).classList.contains('is-open'),
    focusOnButton: document.activeElement?.dataset?.docOpen === panelId,
    scrollY: window.scrollY
  }), id);

  if (after.open) fails.push(`${id}: Escape did not close it`);
  if (!after.focusOnButton) fails.push(`${id}: focus did not return to the opening button`);
  if (Math.abs(after.scrollY - scrollBefore) > 4) {
    fails.push(`${id}: the page behind moved (${scrollBefore} → ${after.scrollY})`);
  }
}

// Nothing sensitive should be reachable in the published markup.
const leaks = await page.evaluate(() => {
  const text = document.body.innerText;
  const patterns = [
    { name: 'an email address', re: /[\w.+-]+@[\w-]+\.[\w.]+/ },
    { name: 'a street address', re: /San Victores|Capitol Compound/i }
  ];
  return patterns.filter((p) => p.re.test(text)).map((p) => p.name);
});
for (const l of leaks) fails.push(`REDACTION: ${l} is visible in the page text`);

for (const e of errors) fails.push(`CONSOLE: ${e}`);

await browser.close();

if (fails.length === 0) { console.log('Proposal panels: all checks passed.'); process.exit(0); }
console.log(`${fails.length} problem(s):`);
for (const f of fails) console.log('  - ' + f);
process.exit(1);
