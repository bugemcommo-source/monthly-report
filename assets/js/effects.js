/**
 * Motion layer. Listens to the page controller's events; never decides where
 * you are on the page and never scrolls anything.
 *
 * Calm mode (the C key) sets html.calm, which flattens every animation in CSS
 * and stops the particle loop. It removes decoration only — every figure, bar
 * width and chart keeps its true value. If calm mode ever hides information,
 * that is a bug.
 *
 * Both shortcuts also exist as buttons, in the presenter panel this module
 * builds in the bottom-left corner. That panel is not a convenience: a bare
 * single-key shortcut with no way to switch it off fails WCAG 2.1 SC 2.1.4,
 * and calm mode — the control that matters to a reader who cannot take the
 * motion — could not be reached at all without a keyboard.
 */

import { lineChart } from './charts.js';

const CALM_KEY = 'bugemco-calm';
// '0' switches the bare C and P shortcuts off. WCAG 2.1 SC 2.1.4 asks for a
// way to turn a single-character shortcut off or remap it; this is the off
// switch, and the panel built by buildPresenterPanel is where it lives.
const KEYS_KEY = 'bugemco-keys';

export function initEffects(root) {
  const state = {
    calm: localStorage.getItem(CALM_KEY) === '1',
    keys: localStorage.getItem(KEYS_KEY) !== '0',
    particles: null,
    resize: null
  };

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) state.calm = true;
  // `true` = this is the opening state, not a change of mind. It matters: the
  // safety net in the else branch below would mark every block that happens to
  // be on screen as already revealed, and the page would open with its entrance
  // animation missing.
  applyCalm(state.calm, true);

  // THE DOCUMENT TELLS THE TRUTH FIRST AND ANIMATES SECOND.
  //
  // Every metric figure ships as a literal "0" in the markup, with the real
  // number in data-count for the count-up to land on. Until that count-up runs
  // the DOM says zero — and a screen reader in browse mode, find-in-page and
  // Print all read the DOM, not the viewport. On the August page that was
  // thirteen figures reading "0 SYSTEM PRESENTATIONS HELD", "0 APPROVAL
  // GRANTED", for every section the reader had not yet scrolled to.
  //
  // So the true value goes in immediately, before anything moves. The count-up
  // still plays: it paints its own starting value on screen, on the frame it
  // starts, and only while it is actually running does the document hold
  // anything but the real figure. The page controller's rearm() no longer
  // writes zeros back on the way out for the same reason.
  document.querySelectorAll('[data-count]').forEach(settleCount);
  document.querySelectorAll('[data-fill]').forEach(settleFill);

  // One place each of these can happen, so the key, the button in the panel
  // and the automatic frame-rate fallback all end up in the same state.
  const setCalm = (on) => {
    state.calm = on;
    localStorage.setItem(CALM_KEY, on ? '1' : '0');
    applyCalm(on);
    toast(on ? 'Calm mode ON — heavy effects off' : 'Calm mode OFF — full effects');
  };
  const setNotes = (on) => {
    // Held still. Speaker notes are inserted into the document flow, so every
    // note above the reader's position lengthens the page underneath them:
    // measured, pressing P at scrollY 14650 put the page at 15570 — 920px, most
    // of a screen. You press P to read your note about the slide you are on and
    // the slide you are on scrolls away. See holdScroll.
    holdScroll(() => document.body.classList.toggle('show-notes', on));
    // The old message said "only on your screen". It was not true: these notes
    // are put into the page itself, so a mirrored projector shows them to the
    // room. The presenter window (P) is the private way; this is the in-page
    // way, and it says so.
    toast(on ? 'Speaker notes shown on this page — visible on any mirrored screen. Press P for the private presenter window.'
             : 'Speaker notes hidden');
    document.dispatchEvent(new CustomEvent('notes:change', { detail: { shown: on } }));
  };
  const setKeys = (on) => {
    state.keys = on;
    localStorage.setItem(KEYS_KEY, on ? '1' : '0');
    toast(on
      ? 'Single-key shortcuts ON — C calm mode, F fullscreen, P presenter window, Shift+P notes on this page'
      : 'Single-key shortcuts OFF — use this panel instead');
    document.dispatchEvent(new CustomEvent('keys:change', { detail: { keys: on } }));
  };

  document.addEventListener('keydown', (e) => {
    // The off switch. Everything the keys do is still reachable from the
    // presenter panel, which is what makes turning them off safe to offer.
    if (!state.keys) return;
    // Ctrl+C is copy, Ctrl+P is print. Without this guard, copying a figure
    // off the page silently turned calm mode on and remembered it for every
    // future visit.
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target?.matches?.('input, textarea')) return;
    // A single letter must never fire while somebody is typing into a control
    // or reading a field — including one a future month adds.
    if (e.target?.isContentEditable) return;
    // Not while something is open over the page. C pressed with a picture
    // enlarged used to switch calm mode on behind it, unseen.
    if (e.defaultPrevented) return;
    if (document.querySelector('.lightbox.is-open, .doc-overlay.is-open, .povw.is-open')) return;

    if (e.key === 'c' || e.key === 'C') {
      setCalm(!state.calm);
    } else if (e.key === 'p' || e.key === 'P') {
      // P opens the presenter window (present.js): notes on the laptop only.
      // Shift+P is the old behaviour — notes inserted into this page — kept for
      // presenting from a single screen, and it says plainly that a mirrored
      // projector will show them.
      if (e.shiftKey) setNotes(!document.body.classList.contains('show-notes'));
      else document.dispatchEvent(new CustomEvent('presenter:open'));
    }
  });

  buildPresenterPanel(state, { setCalm, setNotes, setKeys });

  // Every reveal starts its numbers and bars — not only the first one. The
  // page controller clears the done-flags when a block leaves the screen, so
  // coming back to a section plays it again from the beginning.
  document.addEventListener('reveal', (e) => {
    const el = e.detail.el;
    countUp(el);
    fillBars(el);
    revealTitle(el);
  });

  bindTilt(root, state);
  bindLightbox(root);
  bindChartFit();
  bindFocusScroll();
  bindPaceKey();
  labelWaitBoards();
  watchFrameRate(state);

  // The hero is on screen before any scrolling happens, so it never receives a
  // reveal event. Start it directly.
  requestAnimationFrame(() => {
    const hero = document.querySelector('.band--hero');
    if (hero) { countUp(hero); fillBars(hero); revealTitle(hero); }
  });

  function applyCalm(on, opening) {
    document.documentElement.classList.toggle('calm', on);
    if (on) {
      stopParticles(state);
      // Snap anything mid-flight to its true value rather than leaving it
      // frozen part-way.
      document.querySelectorAll('[data-count]').forEach(settleCount);
      document.querySelectorAll('[data-fill]').forEach(settleFill);
    } else {
      // LEAVING CALM MODE MUST NOT BLANK ANYTHING THAT IS ON SCREEN.
      // See holdVisible. It runs before the particles because it is the one
      // thing here that can hide information — and never on the opening state,
      // where nothing is hidden yet and marking the first screen revealed would
      // simply skip the page's own entrance.
      if (!opening) holdVisible();
      startParticles(state);
    }
    document.dispatchEvent(new CustomEvent('calm:change', { detail: { calm: on } }));
  }
}

/* ── Coming OUT of calm mode without blanking the page ── */
/**
 * Everything already in the viewport stays visible when calm mode is switched
 * off.
 *
 * THIS IS THE ONE THING THE CONTRACT SAYS MUST NEVER HAPPEN, and it happened.
 * Calm mode holds every revealed block open with
 *     html.calm [data-reveal-on-scroll] { opacity: 1 !important }
 * Taking the class off hands those blocks straight back to the reveal observer
 * — and the observer only reports a CHANGE. A block whose state it last
 * reported while calm mode was holding everything open will not be reported
 * again until it crosses the viewport edge. (The observer used to need 12% of
 * a block on screen, outside the bottom 8%; it now fires on the first pixel,
 * which narrows this window but does not close it.) So the block drops to opacity 0 and stays blank until the reader
 * scrolls. Observed at 1920×1080: two cards partly in view at scrollY 10053,
 * blank for at least two and a half seconds after pressing C.
 *
 * The window is narrow and is exactly what a presenter does: jump to a band,
 * then reach for calm mode.
 *
 * So anything whose box is on screen at the moment calm mode ends is marked
 * revealed by hand. Nothing else is touched, and the observer stays in charge
 * from the next crossing onwards: when one of these blocks does leave the
 * screen it is un-revealed as usual, and when it comes back it plays its
 * entrance as usual.
 *
 * The `reveal` event is deliberately NOT dispatched. Every counter and every
 * bar already holds its true value (applyCalm settles them on the way in), so
 * this only has to make the block visible — firing the event would restart the
 * count-ups and repaint the bars from 0%, which is motion the reader did not
 * ask for on a block they are already looking at.
 */
function holdVisible() {
  const vh = window.innerHeight || document.documentElement.clientHeight;
  const vw = window.innerWidth || document.documentElement.clientWidth;
  document.querySelectorAll('[data-reveal-on-scroll]:not(.is-revealed)').forEach((el) => {
    const r = el.getBoundingClientRect();
    // A display:none block — a speaker note with the notes hidden — measures as
    // all zeros and is not on screen.
    if (r.width === 0 && r.height === 0) return;
    if (r.bottom <= 0 || r.top >= vh || r.right <= 0 || r.left >= vw) return;
    el.classList.add('is-revealed');
  });
}

/* ── Keeping the reader's place ───────────────────────── */
/**
 * Run a change that alters the height of the document, and put the page back
 * where it was relative to whatever the reader was actually looking at.
 *
 * Used by the P key. The notes are real blocks in the flow, so showing them
 * pushes everything below each note further down the page; the reader's scroll
 * position is an absolute offset and has no idea that happened.
 *
 * The anchor is the element at the top of the viewport, found by asking the
 * browser rather than by guessing at a band: the shift depends on how many
 * notes lie above the reader, which can be part-way through the band they are
 * reading. Fixed chrome is walked past — the progress hairline is up there and
 * is not part of the page's flow. The correction is a delta on the element's
 * own box, so it is exact whatever moved.
 *
 * behavior:'instant' is required, not tidiness: the page sets scroll-behavior
 * smooth (except in calm mode, now), and a smooth correction here would be a
 * visible lurch in the opposite direction.
 */
function holdScroll(mutate) {
  const anchor = topOfViewport();
  const before = anchor ? anchor.getBoundingClientRect() : null;
  mutate();
  if (!before) return;
  const after = anchor.getBoundingClientRect();
  // The anchor can be the thing that just disappeared — the element at the top
  // of the viewport is a note panel itself when the notes are being hidden. A
  // display:none element measures as all zeros, and "correcting" by that would
  // throw the reader further than doing nothing.
  if (after.width === 0 && after.height === 0) return;
  const delta = after.top - before.top;
  if (Math.abs(delta) < 0.5) return;
  window.scrollBy({ top: delta, left: 0, behavior: 'instant' });
}

function topOfViewport() {
  let el = document.elementFromPoint(Math.round(window.innerWidth / 2), 8);
  while (el && el !== document.body && el !== document.documentElement
         && getComputedStyle(el).position === 'fixed') {
    el = el.parentElement;
  }
  if (!el || el === document.body || el === document.documentElement) return null;
  return el;
}

/* ── Presenter controls ───────────────────────────────── */
/**
 * The same two things the C and P keys do, as buttons, plus a switch that
 * turns the bare keys off.
 *
 * Three problems, one control:
 *   - WCAG 2.1 SC 2.1.4. A single-character shortcut needs a way to switch it
 *     off or remap it. This is the off switch.
 *   - Nothing on screen said the keys existed at all, so the only person who
 *     knew was whoever read the source.
 *   - Calm mode is the control that matters most to a reader who cannot take
 *     the motion, and it could only be reached from a keyboard. On a phone it
 *     was unreachable.
 *
 * The look is in report.css. This builds the markup and keeps it honest.
 */
function buildPresenterPanel(state, api) {
  if (document.querySelector('.pkeys')) return;

  const wrap = document.createElement('div');
  wrap.className = 'pkeys';
  wrap.innerHTML =
    '<button class="pkeys-btn" type="button" aria-expanded="false" aria-controls="pkeys-panel">' +
      // Drawn inline, not an icon font — this report has to open with no
      // internet and no external file of any kind.
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
        '<rect x="1.6" y="5" width="20.8" height="14" rx="3" fill="none" ' +
              'stroke="currentColor" stroke-width="2"/>' +
        '<path d="M6 9.5h1M9.5 9.5h1M13 9.5h1M16.5 9.5h1M6 13h1M9.5 13h1M13 13h1' +
                 'M16.5 13h1M8.5 16.2h7" stroke="currentColor" stroke-width="2" ' +
              'stroke-linecap="round"/>' +
      '</svg>' +
      '<span class="sr-only">Presenter controls</span>' +
    '</button>' +
    '<div class="pkeys-panel" id="pkeys-panel" hidden>' +
      '<h2 class="pkeys-title">Presenter controls</h2>' +
      '<button class="pkeys-opt" type="button" data-act="window">' +
        'Presenter window<span class="pkeys-state">Open</span></button>' +
      '<button class="pkeys-opt" type="button" data-act="calm" aria-pressed="false">' +
        'Calm mode<span class="pkeys-state">Off</span></button>' +
      '<button class="pkeys-opt" type="button" data-act="notes" aria-pressed="false">' +
        'Notes on this page<span class="pkeys-state">Hidden</span></button>' +
      '<button class="pkeys-opt" type="button" data-act="keys" aria-pressed="true">' +
        'Single-key shortcuts<span class="pkeys-state">On</span></button>' +
      '<p class="pkeys-hint"><kbd>&rarr;</kbd> <kbd>PgDn</kbd> <kbd>Space</kbd> next · ' +
        '<kbd>&larr;</kbd> <kbd>PgUp</kbd> back · <kbd>Esc</kbd> sections. ' +
        'Single keys: <kbd>F</kbd> fullscreen · <kbd>C</kbd> calm · <kbd>P</kbd> presenter ' +
        'window · <kbd>Shift</kbd>+<kbd>P</kbd> notes on this page (a mirrored projector shows them).</p>' +
    '</div>';
  document.body.appendChild(wrap);

  const btn = wrap.querySelector('.pkeys-btn');
  const panel = wrap.querySelector('.pkeys-panel');
  const opts = Object.fromEntries(
    Array.from(wrap.querySelectorAll('.pkeys-opt')).map((b) => [b.dataset.act, b])
  );

  const set = (key, on, onLabel, offLabel) => {
    opts[key].setAttribute('aria-pressed', on ? 'true' : 'false');
    opts[key].querySelector('.pkeys-state').textContent = on ? onLabel : offLabel;
  };
  const sync = () => {
    set('calm', document.documentElement.classList.contains('calm'), 'On', 'Off');
    set('notes', document.body.classList.contains('show-notes'), 'Shown', 'Hidden');
    set('keys', state.keys, 'On', 'Off');
  };
  sync();

  // The frame-rate watchdog can switch calm mode on by itself, so the panel
  // listens rather than assuming it is the only thing that changes state.
  document.addEventListener('calm:change', sync);
  document.addEventListener('notes:change', sync);
  document.addEventListener('keys:change', sync);

  const open = (on) => {
    panel.hidden = !on;
    btn.setAttribute('aria-expanded', on ? 'true' : 'false');
  };

  /**
   * SPACE IS WHAT A PRESENTER PRESSES, and a button that keeps the focus
   * swallows it.
   *
   * Clicking any of these controls with a mouse or a finger leaves focus
   * sitting on the button, so the next press of Space re-activates that button
   * instead of paging the document. Measured: after one click on the panel
   * button, Space left scrollY exactly where it was and flipped aria-expanded
   * instead. Arrows, PageUp/PageDown, Home and End all still worked, which is
   * what made it easy to miss — Space is the one key that was taken.
   *
   * So a POINTER activation gives the focus back. `detail` is the click count:
   * a real pointer click reports 1 or more, a click synthesised by Enter or
   * Space on a focused button reports 0. That distinction is the whole trick —
   * a keyboard user must keep focus, or activating a control would drop them
   * out of the tab order entirely.
   */
  const releaseAfterPointer = (e) => { if (e.detail > 0) e.currentTarget.blur(); };

  btn.addEventListener('click', (e) => { open(panel.hidden); releaseAfterPointer(e); });

  opts.window.addEventListener('click', (e) => {
    open(false);
    releaseAfterPointer(e);
    document.dispatchEvent(new CustomEvent('presenter:open'));
  });
  opts.calm.addEventListener('click', (e) => {
    api.setCalm(!document.documentElement.classList.contains('calm'));
    releaseAfterPointer(e);
  });
  opts.notes.addEventListener('click', (e) => {
    api.setNotes(!document.body.classList.contains('show-notes'));
    releaseAfterPointer(e);
  });
  opts.keys.addEventListener('click', (e) => {
    api.setKeys(!state.keys);
    releaseAfterPointer(e);
  });

  // ESCAPE CLOSES IT FROM ANYWHERE, and it is bound on the document for that
  // reason. It was bound on the panel's own wrapper, which only ever sees the
  // key while focus is inside the panel — and focus is no longer inside the
  // panel after a pointer click (see above), so Escape did nothing at all: the
  // panel stayed display:grid with aria-expanded="true", sitting over the
  // bottom-right corner and over the rail. A panel that covers the page has to
  // be dismissable by the key everyone reaches for, whatever has focus.
  // Focus is only pulled back to the button when it was inside the panel — a
  // keyboard user is put back where they came from, and nobody else is yanked
  // out of what they were doing.
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || panel.hidden) return;
    e.preventDefault();   // spent — see the lightbox's Escape for why
    const inside = wrap.contains(document.activeElement);
    open(false);
    if (inside) btn.focus();
  });
  document.addEventListener('click', (e) => {
    if (!panel.hidden && !wrap.contains(e.target)) open(false);
  });
}

/* ── Numbers counting up ──────────────────────────────── */
/* Grouped with separators — 1,472 not 1472. A four-figure number without
   them is genuinely harder to read at a glance across a meeting room, and the
   tile was disagreeing with its own caption, which already wrote "1,472". */
function fmtNumber(value, decimals) {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

function settleCount(el) {
  const target = Number(el.dataset.count);
  if (!Number.isFinite(target)) return;
  el.textContent = fmtNumber(target, Number(el.dataset.decimals || 0)) + (el.dataset.suffix || '');
}

function countUp(scope) {
  scope.querySelectorAll?.('[data-count]').forEach((el) => {
    if (el.dataset.counted === '1') return;
    el.dataset.counted = '1';
    const target = Number(el.dataset.count);
    if (!Number.isFinite(target)) return;
    if (document.documentElement.classList.contains('calm')) { settleCount(el); return; }

    const decimals = Number(el.dataset.decimals || 0);
    const suffix = el.dataset.suffix || '';
    const dur = 1100, t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmtNumber(target * eased, decimals) + suffix;
      if (p < 1) requestAnimationFrame(tick);
      else { settleCount(el); fitMetricsSoon(); }   // land on the exact figure, never an eased one
    };
    requestAnimationFrame(tick);
  });
  if (scope.matches?.('[data-count]')) countUp({ querySelectorAll: () => [scope] });
}

/* ── Bars ─────────────────────────────────────────────── */
function settleFill(el) {
  el.style.setProperty('--fill', `${clampPct(el.dataset.fill)}%`);
}
function clampPct(v) { return Math.min(100, Math.max(0, Number(v) || 0)); }

function fillBars(scope) {
  const bars = Array.from(scope.querySelectorAll?.('[data-fill]') || []);
  if (scope.matches?.('[data-fill]')) bars.push(scope);
  const fresh = bars.filter((el) => el.dataset.filled !== '1');
  if (fresh.length === 0) return;
  fresh.forEach((el) => { el.dataset.filled = '1'; });

  if (document.documentElement.classList.contains('calm')) {
    fresh.forEach(settleFill);
    return;
  }

  // Paint the empty state first, with the transition suppressed, so the
  // browser has a genuinely rendered "before" to animate away from.
  //
  // Deferring by two frames alone was not enough and the bars never moved:
  // the width transition carries a 120ms delay, two frames is about 32ms, so
  // the real value arrived while the 0% transition was still inside its own
  // delay. The browser retargeted from the unchanged before-value to the
  // same final value, decided nothing had changed, and painted the bar full
  // width instantly. Measured on the May page: --fill went 50% → 0% → 50%
  // across three frames while the rendered width sat at 575px throughout.
  fresh.forEach((el) => {
    el.style.transition = 'none';
    el.style.setProperty('--fill', '0%');
  });
  void document.documentElement.offsetHeight;   // flush the empty state
  requestAnimationFrame(() => fresh.forEach((el) => {
    el.style.transition = '';
    settleFill(el);
  }));
}

/* ── Hero title, letter by letter ─────────────────────── */
function revealTitle(scope) {
  const el = scope.querySelector?.('[data-reveal]');
  if (!el || el.dataset.revealDone === '1') return;
  el.dataset.revealDone = '1';
  const text = el.textContent;
  el.textContent = '';
  // One span per character would be read out letter by letter by a screen
  // reader, so the real text is kept in an aria-label and the spans hidden.
  el.setAttribute('aria-label', text);
  [...text].forEach((ch, i) => {
    const s = document.createElement('span');
    s.className = 'reveal-char';
    s.setAttribute('aria-hidden', 'true');
    s.style.setProperty('--c', i);
    s.textContent = ch === ' ' ? ' ' : ch;
    el.appendChild(s);
  });
}

/* ── Chart text that survives a narrow card ─────────────
   Text drawn inside an SVG is measured in viewBox units, so what it actually
   paints is `unit × scale`, where the scale is the rendered width over the
   viewBox width. Nothing in CSS can read that scale, which is why the same
   chart type painted its dates at 26.7px in one card and 14.0px in the card
   beside it, and at 7.0px on a phone — a chart's own data, well under the 16px
   floor, with 57 runs of text like it on one page.

   report.css caps the scale from above (see --ch-w on .ch-line). This is the
   floor under it, for the widths where there is not room for the cap: measure
   the real scale, hand it to the stylesheet as --ch-scale, and let a max() in
   the stylesheet decide. The design sizes are untouched wherever they fit — the
   comment in charts.js is right that the remedy is a wider box and not smaller
   type, and nothing here makes any type smaller.

   THIS IS NOT DECORATION AND IT IS NOT AFFECTED BY CALM MODE. It moves nothing
   and animates nothing; it only sizes text. Calm mode leaves it alone on
   purpose — switching effects off must not shrink a chart's labels.

   Cost: a handful of measurements on a resize, and nothing at all while the
   reader is only scrolling (each chart remembers the width it was last fitted
   at and returns immediately). Measured against a 113fps page, no frame budget
   is touched. */
function bindChartFit() {
  let queued = false, force = false;
  const refit = (again) => {
    if (again === true) force = true;
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      const f = force; force = false;
      fitCharts(f);
    });
  };
  // The month's own script fills the chart containers AFTER this module runs,
  // so the first pass has to wait a frame. Fonts decide how wide a label is, so
  // the labels are re-measured once they have loaded — and that is a forced
  // pass, because the box has not changed width and the guard below would
  // otherwise skip it.
  refit(true);
  window.addEventListener('load', () => refit(true));
  window.addEventListener('resize', refit, { passive: true });
  document.fonts?.ready?.then?.(() => refit(true));
  // A chart in a block that has just been revealed may be measuring for the
  // first time; the width guard below makes a repeat call almost free.
  document.addEventListener('reveal', refit);
  document.addEventListener('notes:change', refit);
}

/* Units per CSS pixel at the type's designed size. Must equal the 1.35 in
   report.css (.ch-line max-width: calc(var(--ch-w) * 1.35px)). */
const CH_UNIT_PX = 1.35;

/* Redraw a trend line on a wider viewBox when its box has room for one, so it
   uses the card instead of stopping at its natural width with the rest of the
   card empty. The type stays at its designed size because the scale stays at
   1.35. Never narrower than the chart's own natural width: below that the
   ordinary scaling (and label thinning) below takes over, as before. */
function widenLine(svg) {
  if (!svg.dataset.refit) return svg;
  const host = svg.parentElement;
  if (!host) return svg;
  const cs = getComputedStyle(host);
  const avail = host.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  if (!(avail > 0)) return svg;
  const natural = Number(svg.dataset.natural) || svg.viewBox.baseVal.width;
  const target = Math.max(natural, Math.floor(avail / CH_UNIT_PX));
  if (Math.abs(target - svg.viewBox.baseVal.width) < 12) return svg;
  let data;
  try { data = JSON.parse(svg.dataset.refit); } catch { return svg; }
  const tmp = document.createElement('div');
  tmp.innerHTML = lineChart(data.points, { ...data.opts, width: target });
  const next = tmp.firstElementChild;
  if (!next) return svg;
  next.dataset.refit = svg.dataset.refit;
  next.dataset.natural = String(natural);
  svg.replaceWith(next);
  return next;
}

/* A metric figure that is wider than its tile is set smaller, just enough to
   fit — never larger than the design size, and only that tile. The figure is
   measured at its TRUE value (settleCount writes it at start-up), which is
   also the widest it ever gets: a count-up only ever shows fewer digits. */
let fitMetricsQueued = false;
function fitMetricsSoon() {
  if (fitMetricsQueued) return;
  fitMetricsQueued = true;
  requestAnimationFrame(() => { fitMetricsQueued = false; fitMetrics(); });
}

function fitMetrics() {
  document.querySelectorAll('.metric-num').forEach((el) => {
    // Mid count-up the figure is shorter than it will be; keep whatever size
    // was fitted to the real figure rather than re-measure a partial one.
    const c = el.querySelector('[data-count]');
    if (c && Number.isFinite(Number(c.dataset.count))) {
      const final = fmtNumber(Number(c.dataset.count), Number(c.dataset.decimals || 0)) + (c.dataset.suffix || '');
      if (c.textContent !== final) return;
    }
    el.style.fontSize = '';
    // Measured against the TILE's content box, not the figure's own: as a
    // grid/flex item with nowrap the figure's box simply grows to its text and
    // the tile clips it, so its own clientWidth never shows the overflow.
    const tile = el.parentElement;
    const tcs = getComputedStyle(tile);
    const avail = tile.clientWidth - parseFloat(tcs.paddingLeft) - parseFloat(tcs.paddingRight);
    const range = document.createRange();
    range.selectNodeContents(el);
    const need = range.getBoundingClientRect().width;
    if (!avail || need <= avail + 1) return;
    const size = parseFloat(getComputedStyle(el).fontSize);
    el.style.fontSize = `${Math.floor(size * (avail / need) * 0.98)}px`;
  });
}

function fitCharts(force) {
  fitMetrics();
  document.querySelectorAll('svg.ch-line, .gauge svg').forEach((found) => {
    const svg = found.matches('svg.ch-line') ? widenLine(found) : found;
    if (svg !== found) svg.dataset.fitAt = '';
    const vb = svg.viewBox?.baseVal;
    if (!vb || !vb.width || !vb.height) return;
    const box = svg.getBoundingClientRect();
    if (!box.width || !box.height) return;              // not on the page yet
    const seen = Math.round(box.width);
    if (!force && Number(svg.dataset.fitAt) === seen) return;   // nothing changed
    svg.dataset.fitAt = String(seen);
    // preserveAspectRatio is 'meet', so the drawing is scaled by whichever axis
    // runs out first — not simply by the width.
    const scale = Math.min(box.width / vb.width, box.height / vb.height);
    if (!(scale > 0)) return;
    svg.style.setProperty('--ch-scale', scale.toFixed(4));
    thinPointLabels(svg, scale);
  });
}

/**
 * Ten dates cannot be READ in a 236px box at any size.
 *
 * Making the type bigger on a narrow screen fixes the size and makes the
 * crowding worse: at 320 the visitors chart has 23px of room per point and its
 * dates are 6 characters long. The measured gaps between them were
 * 8.6, 8.6, 8.7, 8.7, 2.4, -4.0, -4.0, -4.0, -4.1 px — the last five sat on top
 * of one another and read as one run of ink, "10 Aug11 Aug12 Aug13 Aug14 Aug".
 *
 * So where the labels no longer fit, some of them stand down. Each row is
 * measured on its own — the dates are longer than the figures, so the figures
 * usually keep more of themselves — and the kept ones are counted back from the
 * LAST point, so the most recent reading is always labelled and the spacing is
 * even. Nothing is lost that is not also somewhere else: every point keeps its
 * <title>, the chart keeps the aria-label listing every figure in the series,
 * and the prose beside it carries the numbers that matter. A run of overlapping
 * ink carried none of that.
 *
 * Widening the window puts them all back on the next frame.
 */
function thinPointLabels(svg, scale) {
  const axis = Array.from(svg.querySelectorAll('.ch-xlabel'));
  if (axis.length < 3) return;
  const pitch = Math.abs(Number(axis[1].getAttribute('x')) - Number(axis[0].getAttribute('x'))) * scale;
  if (!(pitch > 0)) return;

  [axis, Array.from(svg.querySelectorAll('.ch-value'))].forEach((row) => {
    if (row.length < 3) return;
    // Every write first, then every read: interleaving them makes the browser
    // re-lay-out the chart once per label instead of once per chart.
    row.forEach((t) => { t.style.display = ''; });
    let widest = 0;
    row.forEach((t) => {
      const len = t.getComputedTextLength ? t.getComputedTextLength() * scale : 0;
      if (len > widest) widest = len;
    });
    const stride = Math.max(1, Math.ceil((widest + 8) / pitch));
    if (stride === 1) return;
    const keep = new Set();
    for (let i = row.length - 1; i >= 0; i -= stride) keep.add(i);
    row.forEach((t, i) => { if (!keep.has(i)) t.style.display = 'none'; });
  });
}

/* ── Tab lands on screen at once ────────────────────────
   The page scrolls smoothly (report.css), and that includes the scroll the
   browser makes to show an element Tab has just focused — so a focused control
   far down the page stayed off screen for about a second, its focus ring
   invisible. When focus arrives from the Tab key and the element is not on
   screen, it is brought to the middle of the screen instantly, here, in the
   capture phase of focusin — before the browser's own (smooth) focus scroll,
   which then finds nothing left to do. Pointer focus and script focus are
   left alone. */
function bindFocusScroll() {
  let tabbing = false;
  document.addEventListener('keydown', (e) => { tabbing = e.key === 'Tab'; }, true);
  document.addEventListener('pointerdown', () => { tabbing = false; }, true);
  document.addEventListener('focusin', (e) => {
    if (!tabbing) return;
    tabbing = false;
    const el = e.target;
    if (!el || el === document.body || !el.getBoundingClientRect) return;
    if (el.closest?.('.lightbox, .doc-overlay, .povw, .pkeys, .site-nav')) return;   // fixed layers
    const r = el.getBoundingClientRect();
    if (r.top >= 0 && r.bottom <= window.innerHeight) return;
    el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
  }, true);
}

/* ── The pace key, as real text ─────────────────────────
   report.css draws a pace post on every target bar that is not finished, and
   a key — "75% expected by now" — under the first of them. The key used to be
   a ::before, which a screen reader reads inside the first bar's group only,
   as if it described that one target. Here it becomes a real element in the
   same place, and every bar that has a post is described by it
   (aria-describedby), so each target is announced with the key that explains
   its post. The element is aria-hidden so it is not ALSO read as content of
   the first group; aria-describedby still reads hidden text by design.
   The bars are written by the month's own script, which runs after this
   module, so this waits for DOMContentLoaded (and again at load, which costs
   nothing: it is idempotent). With no JavaScript the ::before remains. */
let paceKeys = 0;
function bindPaceKey() {
  const run = () => {
    const parents = new Set(Array.from(document.querySelectorAll('.tbar[data-pace]'), (b) => b.parentElement));
    parents.forEach((parent) => {
      if (!parent || parent.querySelector(':scope > .tbar > .tbar-key')) return;
      const bars = Array.from(parent.children).filter((el) => el.matches('.tbar[data-pace]'));
      const posted = bars.filter((b) => b.dataset.state !== 'met' && b.dataset.state !== 'ahead');
      if (posted.length === 0) return;      // nothing has a post, so nothing to explain
      const id = `tbar-key-${++paceKeys}`;
      const key = document.createElement('span');
      key.className = 'tbar-key';
      key.id = id;
      key.setAttribute('aria-hidden', 'true');
      key.textContent = `${posted[0].dataset.pace}% expected by now`;
      posted[0].appendChild(key);
      bars.forEach((b) => { b.dataset.keyed = '1'; });
      posted.forEach((b) => {
        const had = b.getAttribute('aria-describedby');
        b.setAttribute('aria-describedby', had ? `${had} ${id}` : id);
      });
    });
  };
  if (document.readyState !== 'complete') document.addEventListener('DOMContentLoaded', run);
  window.addEventListener('load', run);
  run();
}

/* ── Narrow-screen labels for the waiting board ─────────
   Below 600px a .wait-board stops being a table and each row becomes a card,
   so the column headings are restated in front of each cell. They are taken
   from the table's own <thead> here (see the note in report.css) so a table of
   minutes is not labelled "Waiting for:". Only <td> cells are labelled — the
   row's own <th> is the card's title. Nothing changes on a wide screen. */
function labelWaitBoards() {
  document.querySelectorAll('table.wait-board').forEach((t) => {
    const heads = Array.from(t.querySelectorAll('thead tr:first-child > th, thead tr:first-child > td'),
      (h) => h.textContent.replace(/\s+/g, ' ').trim());
    if (heads.length === 0) return;
    t.querySelectorAll('tbody tr').forEach((tr) => {
      let col = 0;
      Array.from(tr.children).forEach((cell) => {
        const label = heads[col];
        if (cell.tagName === 'TD' && label && !cell.hasAttribute('data-label')) cell.dataset.label = label;
        col += Number(cell.getAttribute('colspan')) || 1;
      });
    });
  });
}

/* ── 3D card tilt ─────────────────────────────────────── */
function bindTilt(root, state) {
  root.addEventListener('pointermove', (e) => {
    if (state.calm) return;
    const card = e.target.closest?.('.tilt');
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--tx', (((e.clientX - r.left) / r.width) - 0.5).toFixed(3));
    card.style.setProperty('--ty', (((e.clientY - r.top) / r.height) - 0.5).toFixed(3));
  });
  root.addEventListener('pointerleave', () => {
    root.querySelectorAll('.tilt').forEach((c) => {
      c.style.setProperty('--tx', 0); c.style.setProperty('--ty', 0);
    });
  }, true);
}

/* ── Particles ────────────────────────────────────────── */
/* One canvas for the whole page, living on the fixed backdrop — the old build
   made one per slide, which no longer makes sense when everything is one
   continuous document. */
function startParticles(state) {
  stopParticles(state);
  const backdrop = document.querySelector('.backdrop');
  if (!backdrop) return;

  let canvas = backdrop.querySelector('canvas.layer-particles');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.className = 'layer-particles';
    canvas.setAttribute('aria-hidden', 'true');
    backdrop.appendChild(canvas);
  }
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(2, window.devicePixelRatio || 1);

  let dots = [];
  const resize = () => {
    const w = backdrop.clientWidth, h = backdrop.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    // Denser, larger and more opaque than the first pass. The particle layer
    // was previously painted underneath a 90% white wash, so it was tuned
    // against something nobody could see. Above the wash these values read as
    // a soft drifting field rather than nothing at all.
    // Denser, bigger, more opaque and appreciably faster than before. Seen in
    // a real browser the old field read as dust on the screen — present in the
    // DOM, invisible to a person, and the owner's verdict was simply "the
    // animated background is gone". A background animation that has to be
    // pointed out is not doing its job.
    // Seeded by two irrational steps rather than integer modulo. The old
    // `((i * 97) % 100) / 100` had period 100, and 5 and 4 both divide 100, so
    // dots i, i+100 and i+200 shared a position, a radius AND a velocity —
    // exact triples that never drifted apart. The field was a third of its
    // intended size at three times the intended opacity. A golden-ratio step
    // never repeats and spreads evenly; the sizes and speeds key off 7 and 11
    // so they cannot fall back into step with it.
    const frac = (n) => n - Math.floor(n);
    const count = Math.round((w * h) / 7000);
    dots = Array.from({ length: count }, (_, i) => ({
      x: frac((i + 1) * 0.6180339887) * canvas.width,
      y: frac((i + 1) * 0.7548776662) * canvas.height,
      r: (2.2 + (i % 7) * 1.1) * dpr,
      // Every one of these keys off a DIFFERENT modulus on purpose. Sharing one
      // is the bug that produced the stacked triples, and it has a quieter
      // cousin: with size and drift both on `i % 7`, the biggest dots always
      // drifted right and the smallest always drifted left, which an eye picks
      // up over a forty-minute meeting. 5 and 6 share no factor with 7, and
      // alpha is on 5 rather than 6 so it does not lock to the colour, which is
      // on 3 — otherwise the faintest dot in the field is always yellow.
      vx: ((i % 6) - 2.5) * 0.13 * dpr,
      vy: -(0.30 + (i % 11) * 0.06) * dpr,
      // Safe to be generous: the canvas screens onto the artwork, so a denser
      // dot only lightens further and can never cost contrast.
      a: 0.38 + (i % 5) * 0.10,
      green: i % 3 !== 0
    }));
  };
  resize();

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // The dots blend normally WITHIN the canvas. The canvas as a whole is what
    // screens onto the artwork, and that is set in CSS — `mix-blend-mode` on
    // `.layer-particles`. Setting `globalCompositeOperation` here instead was
    // tried and does nothing useful: it composites each dot against the
    // canvas's own contents, which are cleared to transparent every frame, so
    // the canvas still landed on the page with ordinary alpha and still
    // darkened the text behind it.
    for (const d of dots) {
      d.x += d.vx; d.y += d.vy;
      const m = d.r + 2;
      if (d.y < -m) d.y = canvas.height + m;
      if (d.x < -m) d.x = canvas.width + m;
      if (d.x > canvas.width + m) d.x = -m;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      // These are the SCREEN-mode source colours, not the brand values. Screen
      // lightens by 1-(1-bg)(1-src), so a dark source has almost nothing to
      // give: the coop's #006633 lifted red by 48 and left green flat, and the
      // field read chartreuse. A light green screens to a green tint, which is
      // what was wanted. The brand greens elsewhere are untouched.
      ctx.fillStyle = d.green ? `rgba(120,200,140,${d.a})` : `rgba(250,250,0,${d.a})`;
      ctx.fill();
    }
    state.particles = requestAnimationFrame(draw);
  };
  state.particles = requestAnimationFrame(draw);
  state.resize = resize;
  window.addEventListener('resize', resize);
}

function stopParticles(state) {
  if (state.particles) cancelAnimationFrame(state.particles);
  state.particles = null;
  if (state.resize) { window.removeEventListener('resize', state.resize); state.resize = null; }
  document.querySelectorAll('canvas.layer-particles').forEach((c) => {
    c.getContext('2d')?.clearRect(0, 0, c.width, c.height);
  });
}

/* ── Screenshot lightbox ────────────────────────────────
   A dashboard shrunk into half a card is a picture of a dashboard, not a
   dashboard. Every screenshot sits in a window frame that IS a <button>
   (see .shot-frame), and this puts the full image over the page with its
   caption underneath.

   The frame used to be the <figure> itself, given tabindex and role="button"
   by this function. A real button is better: it needs no synthetic role, it
   already answers Enter and Space, and it leaves the caption outside the
   control so the caption is read as description rather than as label.

   BOTH PATTERNS ARE SUPPORTED, deliberately. May 2026 is published and uses
   the old one, and a past month whose screenshots stopped enlarging would be
   a regression nobody was watching for. Old figures keep the delegated click
   and the synthetic role; new ones bind to their button. */
function bindLightbox(root) {
  const frames = Array.from(root.querySelectorAll('.shot-frame'));
  const legacy = Array.from(root.querySelectorAll('.shot')).filter((f) => !f.querySelector('.shot-frame'));
  if (frames.length === 0 && legacy.length === 0) return;

  // Tell the two apart in CSS without :has(), which is newer than some of the
  // machines this gets projected from.
  frames.forEach((f) => f.closest('.shot')?.classList.add('shot--framed'));

  const box = document.createElement('div');
  box.className = 'lightbox';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  // A dialog with no accessible name is announced as "dialog" and nothing else,
  // which tells a reader that something has opened over the page and not what.
  // It is refined per picture in open() below; this is the floor.
  box.setAttribute('aria-label', 'Enlarged picture');
  box.hidden = true;
  box.innerHTML =
    '<button class="lightbox-close" type="button" aria-label="Close the enlarged picture">&times;</button>' +
    '<figure><img alt=""><figcaption></figcaption></figure>';
  document.body.appendChild(box);

  const img = box.querySelector('img');
  const cap = box.querySelector('figcaption');
  const closeBtn = box.querySelector('.lightbox-close');
  let lastFocus = null;
  let scrollLock = 0;
  let preClick = null;
  // How the picture was opened. See close().
  let byPointer = false;

  // `origin` is the frame button on new months and the <figure> itself on old
  // ones. Everything below works off the picture and the caption, which both
  // patterns have.
  const open = (origin, pointer = false) => {
    const source = origin.querySelector('img');
    if (!source) return;
    lastFocus = document.activeElement;
    byPointer = pointer;

    img.src = origin.dataset.shot || source.currentSrc || source.src;
    // Whitespace in the markup's alt text is real to a screen reader.
    img.alt = source.alt.replace(/\s+/g, ' ').trim();

    // The caption belongs to the <figure>, not the button, so it survives the
    // enlargement. An enlarged picture that explains less than the small one
    // did is a step backwards.
    const figure = origin.closest('.shot');
    // The caption is COPIED, not flattened to text. A caption that opens with
    // a qualifying chip ("Read off the screen, 7 October") used to come out as
    // one run of words — "Read off the screen, 7 October The real system…" —
    // with nothing to say where the qualifier stopped. The chip is now carried
    // across as a chip (styled for the dark surround in report.css).
    // Old months ended every caption with "· Click to enlarge". Repeating that
    // instruction to someone who has already enlarged it is noise.
    cap.replaceChildren();
    const srcCap = figure?.querySelector('figcaption');
    if (srcCap) {
      srcCap.childNodes.forEach((n) => cap.appendChild(n.cloneNode(true)));
      const lastText = [...cap.childNodes].reverse().find((n) => n.nodeType === 3 && n.nodeValue.trim());
      if (lastText) lastText.nodeValue = lastText.nodeValue.replace(/\s*·\s*Click to enlarge\s*$/i, '');
      cap.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
    }
    const text = cap.textContent.replace(/\s+/g, ' ').trim();
    cap.hidden = text === '';

    // Name the dialog after the screen being shown, so it is announced as
    // "Enlarged picture: Mart Online Store — credit console, dialog" rather
    // than just "dialog". The window frame's own title bar is the best source;
    // the picture's alt text is the fallback for months built before it.
    const name = origin.querySelector('.shot-name')?.textContent?.trim() || img.alt;
    box.setAttribute('aria-label', name ? `Enlarged picture: ${name}` : 'Enlarged picture');

    box.hidden = false;
    void box.offsetHeight;              // a rendered start state for the fade
    box.classList.add('is-open');

    // Hold the page still behind the overlay — at where the reader WAS, not
    // where the click left them. Pressing a mouse button on a frame focuses
    // it, and a focused element the browser thinks is not fully in view is
    // scrolled into view first: measured, 22px on the first September frame.
    // That scroll used to be swallowed by the page's global smooth scrolling;
    // with smooth scrolling now asked for only where it is wanted, it lands,
    // and the page came back from the picture 22px off where it had been. So
    // the position at pointer-down is what is restored.
    scrollLock = (pointer && preClick != null) ? preClick : window.scrollY;
    preClick = null;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollLock}px`;
    document.body.style.width = '100%';

    closeBtn.focus();
  };

  // `detail` is the click count: 1+ for a real mouse or finger, 0 for a click
  // the browser synthesised from Enter or Space. Same test as the presenter
  // panel's releaseAfterPointer.
  frames.forEach((frame) => frame.addEventListener('click', (e) => open(frame, e.detail > 0)));
  // See "Hold the page still" in open().
  document.addEventListener('pointerdown', (e) => {
    if (e.target.closest?.('.shot-frame, .shot[role="button"]')) preClick = window.scrollY;
  }, true);

  // ── Months built before the frame ──
  // The figure is not a button, so it needs a role, a tab stop, a label, and
  // Enter/Space wired up by hand. This is exactly the work the <button> in the
  // new pattern does for free.
  legacy.forEach((fig) => {
    if (!fig.hasAttribute('tabindex')) fig.setAttribute('tabindex', '0');
    if (!fig.hasAttribute('role')) fig.setAttribute('role', 'button');
    if (!fig.hasAttribute('aria-label')) {
      const c = fig.querySelector('figcaption')?.textContent?.replace(/\s*·\s*Click to enlarge\s*$/i, '').trim();
      fig.setAttribute('aria-label', `Enlarge picture${c ? ': ' + c : ''}`);
    }
    fig.addEventListener('click', (e) => open(fig, e.detail > 0));
    fig.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
      e.preventDefault();        // stop Space from also scrolling the page
      open(fig);
    });
  });

  const close = () => {
    if (!box.classList.contains('is-open')) return;
    box.classList.remove('is-open');

    // Scroll anchoring off for the moment the page is put back. Unfixing the
    // body and restoring the offset is one layout change the browser's own
    // anchoring can "correct" by hundreds of pixels (measured: 2973 came back
    // as 3253). The position is exact; nothing needs correcting.
    const root = document.documentElement;
    root.style.overflowAnchor = 'none';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    // Instant, not smooth: putting somebody back is not a journey.
    window.scrollTo({ top: scrollLock, left: 0, behavior: 'instant' });
    requestAnimationFrame(() => requestAnimationFrame(() => { root.style.overflowAnchor = ''; }));

    closeBtn.blur();
    setTimeout(() => { if (!box.classList.contains('is-open')) box.hidden = true; }, 220);

    // FOCUS ALWAYS GOES BACK TO THE FRAME (WCAG 2.4.3) — and that used to
    // cost the presenter his Space bar: the frame is a button, so the next
    // Space, meant to page down, re-opened the picture. Measured, it did so
    // even after the frame had been scrolled right off the screen.
    // So focus returns, and the frame is marked "quiet" if it was opened with
    // a pointer: until focus leaves it, Space and Enter on it are not taken as
    // "open me" — see the keydown guard below. Someone who clicked never
    // expected the keyboard to be pointed at the picture.
    if (lastFocus?.focus) {
      lastFocus.focus({ preventScroll: true });
      const back = lastFocus;
      if (byPointer && back !== document.body && back.dataset) {
        back.dataset.quiet = '1';
        back.addEventListener('blur', () => { delete back.dataset.quiet; }, { once: true });
      }
    }
  };

  // SPACE ON A FRAME THAT IS NOT REALLY BEING POINTED AT PAGES THE DOCUMENT.
  // Two cases, and only these two: the frame is "quiet" (focus came back to it
  // after a pointer user closed the picture), or the frame is mostly off the
  // screen (a keyboard user scrolled away with the arrows and is now pressing
  // Space to read on). Either way the key is not an activation: it is handed
  // to the presenter navigation (present.js) as "next", or, if that is not on
  // the page, it scrolls by a screen as the browser would have. Enter in the
  // same cases does nothing. A frame that is focused deliberately and on
  // screen — the ordinary keyboard case — opens on Space and Enter as before.
  // Capture phase, so this runs before the legacy figure's own keydown.
  document.addEventListener('keydown', (e) => {
    if (box.classList.contains('is-open')) return;
    if (e.key !== ' ' && e.key !== 'Spacebar' && e.key !== 'Enter') return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const f = e.target;
    if (!f?.matches?.('.shot-frame, .shot[role="button"]')) return;
    const r = f.getBoundingClientRect();
    const shown = Math.max(0, Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0));
    const offScreen = shown < Math.min(r.height, window.innerHeight) * 0.5;
    if (f.dataset.quiet !== '1' && !offScreen) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (e.key === 'Enter') return;
    const dir = e.shiftKey ? -1 : 1;
    const ev = new CustomEvent('present:step', { detail: { dir }, cancelable: true });
    document.dispatchEvent(ev);
    if (!ev.defaultPrevented) {
      window.scrollBy({ top: dir * window.innerHeight * 0.85, behavior: 'smooth' });
    }
  }, true);
  closeBtn.addEventListener('click', (e) => { e.stopPropagation(); close(); });
  // Clicking the dark surround closes; clicking the picture itself does not.
  box.addEventListener('click', (e) => { if (e.target !== img) close(); });

  document.addEventListener('keydown', (e) => {
    if (!box.classList.contains('is-open')) return;
    // preventDefault marks the key as spent: present.js opens the section
    // overview on Escape, and must not do it with the same press that closed
    // this picture.
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    // Keep Tab inside the overlay. Without this, tabbing while an image is
    // enlarged walks focus onto the page hidden behind it, and a keyboard user
    // ends up operating controls they cannot see.
    if (e.key === 'Tab') { e.preventDefault(); closeBtn.focus(); }
  });
}

/* ── Auto calm on a struggling machine ────────────────── */
/**
 * Two stages, not one.
 *
 * This used to jump straight to full calm mode after two slow seconds, which
 * switches off the glow AND the particles AND every transition on the page.
 * The owner's report was "the animated background is gone" — the watchdog had
 * fired on a page that was only briefly busy, and taken the whole backdrop
 * with it.
 *
 * Now the cheapest thing goes first. The particle canvas is the only part that
 * repaints every frame, so dropping it alone recovers most of the cost while
 * the glow, the parallax and the reveals all keep running. Only if the page is
 * STILL struggling well after that does it fall back to full calm.
 *
 * Thresholds are deliberately slack. A page is allowed to be busy while it
 * loads fonts, decodes three background photographs and runs its opening
 * animation; that is not a struggling computer.
 */
function watchFrameRate(state) {
  let frames = 0, t0 = performance.now(), slowSince = null;
  let droppedParticles = false;
  // Ignore the first few seconds outright — that is load, not steady state.
  const settledAt = t0 + 4000;

  const tick = (now) => {
    frames++;
    if (now - t0 >= 1000) {
      const fps = frames * 1000 / (now - t0);
      frames = 0; t0 = now;

      if (now < settledAt || state.calm) { slowSince = null; requestAnimationFrame(tick); return; }

      if (fps < 24) {
        slowSince = slowSince ?? now;
        const slowFor = now - slowSince;

        if (!droppedParticles && slowFor > 3000) {
          // Stage one: the particles only. Everything else keeps moving.
          droppedParticles = true;
          stopParticles(state);
          const canvas = document.querySelector('canvas.layer-particles');
          if (canvas) canvas.remove();
          slowSince = now;
        } else if (droppedParticles && slowFor > 6000) {
          // Stage two: it is genuinely struggling. Flatten everything.
          state.calm = true;
          document.documentElement.classList.add('calm');
          document.querySelectorAll('[data-count]').forEach(settleCount);
          document.querySelectorAll('[data-fill]').forEach(settleFill);
          // Announced, so the presenter panel's Calm mode button agrees with
          // what the page is actually doing. Deliberately NOT written to
          // localStorage: this is a judgement about one machine on one day,
          // not a preference the reader expressed.
          document.dispatchEvent(new CustomEvent('calm:change', { detail: { calm: true } }));
          toast('Effects reduced automatically — this computer was struggling. Turn them back on from the presenter controls, or press C.');
          return;
        }
      } else {
        slowSince = null;
      }
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* ── Small on-screen message ──────────────────────────── */
/* The look lives in report.css under .deck-toast. It used to be set here with
   Object.assign, at 0.9rem/14.4px in system-ui — the only confirmation that a
   control had done anything, below the 16px floor, and in a typeface the
   report does not otherwise use. Inline styles also beat the stylesheet, so
   there was no way to correct it from CSS. */
export function toast(msg) {
  let el = document.querySelector('.deck-toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'deck-toast';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity = '1';
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.style.opacity = '0'; }, 3200);
}
