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
    toast(on ? 'Speaker notes shown — only on your screen' : 'Speaker notes hidden');
    document.dispatchEvent(new CustomEvent('notes:change', { detail: { shown: on } }));
  };
  const setKeys = (on) => {
    state.keys = on;
    localStorage.setItem(KEYS_KEY, on ? '1' : '0');
    toast(on
      ? 'Single-key shortcuts ON — C for calm mode, P for speaker notes'
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

    if (e.key === 'c' || e.key === 'C') {
      setCalm(!state.calm);
    } else if (e.key === 'p' || e.key === 'P') {
      setNotes(!document.body.classList.contains('show-notes'));
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
 * — and the observer only counts a block as on screen once 12% of it is inside
 * the viewport (and not in the bottom 8%). A block that is genuinely visible
 * but under that threshold has already been told it is NOT intersecting, and
 * the observer will not say another word about it until it crosses the
 * threshold. So the block drops to opacity 0 and stays blank until the reader
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
      '<button class="pkeys-opt" type="button" data-act="calm" aria-pressed="false">' +
        'Calm mode<span class="pkeys-state">Off</span></button>' +
      '<button class="pkeys-opt" type="button" data-act="notes" aria-pressed="false">' +
        'Speaker notes<span class="pkeys-state">Hidden</span></button>' +
      '<button class="pkeys-opt" type="button" data-act="keys" aria-pressed="true">' +
        'Single-key shortcuts<span class="pkeys-state">On</span></button>' +
      '<p class="pkeys-hint">While single-key shortcuts are on, <kbd>C</kbd> turns calm ' +
        'mode on and off and <kbd>P</kbd> shows or hides the speaker notes. Everything ' +
        'here works without them.</p>' +
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
      else settleCount(el);   // land on the exact figure, never an eased one
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

function fitCharts(force) {
  document.querySelectorAll('svg.ch-line, .gauge svg').forEach((svg) => {
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

  // `origin` is the frame button on new months and the <figure> itself on old
  // ones. Everything below works off the picture and the caption, which both
  // patterns have.
  const open = (origin) => {
    const source = origin.querySelector('img');
    if (!source) return;
    lastFocus = document.activeElement;

    img.src = origin.dataset.shot || source.currentSrc || source.src;
    // Whitespace in the markup's alt text is real to a screen reader.
    img.alt = source.alt.replace(/\s+/g, ' ').trim();

    // The caption belongs to the <figure>, not the button, so it survives the
    // enlargement. An enlarged picture that explains less than the small one
    // did is a step backwards.
    const figure = origin.closest('.shot');
    // Old months ended every caption with "· Click to enlarge". Repeating that
    // instruction to someone who has already enlarged it is noise.
    const text = (figure?.querySelector('figcaption')?.textContent || '')
      .replace(/\s+/g, ' ').replace(/\s*·\s*Click to enlarge\s*$/i, '').trim();
    cap.textContent = text;
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

    // Hold the page still behind the overlay.
    scrollLock = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollLock}px`;
    document.body.style.width = '100%';

    closeBtn.focus();
  };

  frames.forEach((frame) => frame.addEventListener('click', () => open(frame)));

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
    fig.addEventListener('click', () => open(fig));
    fig.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
      e.preventDefault();        // stop Space from also scrolling the page
      open(fig);
    });
  });

  const close = () => {
    if (!box.classList.contains('is-open')) return;
    box.classList.remove('is-open');

    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    // Instant, not smooth. The page sets scroll-behavior: smooth globally, so
    // a plain scrollTo animates the reader back to where they already were and
    // the page appears to fly on its own. Putting somebody back is not a journey.
    window.scrollTo({ top: scrollLock, left: 0, behavior: 'instant' });

    closeBtn.blur();
    setTimeout(() => { if (!box.classList.contains('is-open')) box.hidden = true; }, 220);
    lastFocus?.focus?.();
  };
  closeBtn.addEventListener('click', (e) => { e.stopPropagation(); close(); });
  // Clicking the dark surround closes; clicking the picture itself does not.
  box.addEventListener('click', (e) => { if (e.target !== img) close(); });

  document.addEventListener('keydown', (e) => {
    if (!box.classList.contains('is-open')) return;
    if (e.key === 'Escape') { close(); return; }
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
function toast(msg) {
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
