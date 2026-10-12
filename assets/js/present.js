/**
 * Presenting a scrolling report: section keys, the section overview,
 * fullscreen, and the presenter window.
 *
 * THE PAGE STAYS A WEBSITE. The mouse wheel, the trackpad, the scrollbar, Home,
 * End, the Down and Up arrows and find-in-page all keep doing exactly what the
 * browser does. What this adds is what a presenter with a clicker needs:
 *
 *   Right arrow, PageDown, Space   next STOP — a band's top, or any element in
 *                                  it marked data-stop (see "STOPS" below); a
 *                                  stop taller than the screen is read a screen
 *                                  at a time first, so nothing is skipped
 *   Left arrow, PageUp, Shift+Space  back — to the top of this section, then the
 *                                  previous one
 *   F                              fullscreen on / off
 *   Esc                            the section overview (a list of every
 *                                  section; Enter or a click jumps there)
 *   P                              the presenter window (notes, next section,
 *                                  clock) on the laptop's own screen
 *
 * Clickers send PageDown/PageUp or Right/Left, which is why those move by
 * section here — but never by more than a screen, so nothing in a long section
 * is ever skipped.
 *
 * WHEN THESE KEYS ARE LEFT ALONE: when focus is in a text field or anything
 * editable; while the enlarged picture, a document panel, the presenter panel
 * or the overview is open (Esc closes those first — each one marks the key as
 * spent with preventDefault, and this module respects that); when Ctrl, Alt or
 * Cmd is held; and Space/Enter whenever focus is on a link or a button, where
 * they mean "activate". F and P are single-character shortcuts, so they obey
 * the presenter panel's "Single-key shortcuts" off switch (WCAG 2.1.4); the
 * arrows, PageUp/PageDown and Esc are not character keys and always work.
 *
 * Motion: a smooth scroll, or an instant jump with calm mode or reduced motion.
 */
import { toast } from './effects.js';

const KEYS_KEY = 'bugemco-keys';

export function initPresent() {
  const bands = Array.from(document.querySelectorAll('.site .band, main .band'))
    .filter((b, i, all) => all.indexOf(b) === i);
  if (bands.length === 0) return;

  let keysOn = readKeys();
  document.addEventListener('keys:change', (e) => { keysOn = !!e.detail?.keys; });

  const nav = makeNavigator(bands);
  const overview = makeOverview(bands, nav);
  const presenter = makePresenterWindow(bands, nav);

  // A Space that landed on a screenshot frame nobody was pointing at (see
  // effects.js) is handed here as a "step".
  document.addEventListener('present:step', (e) => {
    e.preventDefault();
    nav.step(e.detail?.dir === -1 ? -1 : 1);
  });
  document.addEventListener('presenter:open', () => presenter.open());

  document.addEventListener('keydown', (e) => {
    if (e.defaultPrevented) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target;
    if (isTyping(t)) return;

    // Esc: the overview, unless something else is open and already took it.
    if (e.key === 'Escape') {
      if (overview.isOpen()) { e.preventDefault(); overview.close(); return; }
      if (anotherLayerOpen()) return;
      // Leaving fullscreen is the browser's own use of Esc; it does not reach
      // here while fullscreen is on, so there is no conflict to resolve.
      e.preventDefault();
      overview.open();
      return;
    }
    if (overview.isOpen()) return;
    // Something is open over the page (the presenter panel, a picture, a
    // document): the page behind it must not scroll away underneath it. Space
    // still presses whichever control in that layer has focus.
    if (anotherLayerOpen()) {
      const pageKey = ['PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', 'Home', 'End', ' ', 'Spacebar'].includes(e.key);
      if (pageKey && !isInteractive(t) && !usesArrows(t)) e.preventDefault();
      return;
    }

    const k = e.key;
    let dir = 0;
    if (k === 'ArrowRight' || k === 'PageDown') dir = 1;
    else if (k === 'ArrowLeft' || k === 'PageUp') dir = -1;
    else if (k === ' ' || k === 'Spacebar') {
      // Space on a control means "press this control".
      if (isInteractive(t)) return;
      dir = e.shiftKey ? -1 : 1;
    }
    if (dir) {
      // Arrows inside a control that uses them (a slider, a radio group, a
      // listbox) belong to that control.
      if ((k === 'ArrowRight' || k === 'ArrowLeft') && usesArrows(t)) return;
      e.preventDefault();
      nav.step(dir);
      return;
    }

    if (!keysOn) return;
    if (k === 'f' || k === 'F') { e.preventDefault(); toggleFullscreen(); }
  });

  window.addEventListener('pagehide', () => presenter.detach());
}

/* ── Where "next" is ─────────────────────────────────── */
function makeNavigator(bands) {
  // While a smooth scroll is still travelling, scrollY is somewhere in the
  // middle of it. A clicker pressed twice quickly has to measure the second
  // press from where the first one is GOING, or it lands short.
  let pending = null, pendingTimer = 0;
  const settle = () => { pending = null; clearTimeout(pendingTimer); };
  window.addEventListener('scrollend', settle);
  window.addEventListener('wheel', settle, { passive: true });
  window.addEventListener('touchstart', settle, { passive: true });

  const topOf = (b) => Math.round(b.getBoundingClientRect().top + window.scrollY);
  const maxY = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const motionOk = () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    && !document.documentElement.classList.contains('calm');

  // The band the top of the screen is in. 4px of slack, so a band scrolled to
  // exactly its top counts as "this one", not as the one before it.
  const indexAt = (y) => {
    let idx = 0;
    bands.forEach((b, i) => { if (topOf(b) <= y + 4) idx = i; });
    return idx;
  };

  const go = (y) => {
    const top = Math.min(maxY(), Math.max(0, Math.round(y)));
    const smooth = motionOk();
    pending = smooth ? top : null;
    clearTimeout(pendingTimer);
    if (smooth) pendingTimer = setTimeout(settle, 1200);
    window.scrollTo({ top, left: 0, behavior: smooth ? 'smooth' : 'instant' });
    document.dispatchEvent(new CustomEvent('present:moved', { detail: { top } }));
  };

  // Where the section's CONTENT ends, as opposed to its box. The box carries
  // ~100px of bottom padding, and the first version of this treated the last
  // fifth of a screen of any band as that padding — which it is not: measured,
  // it skipped 122px of Software Development at 1920×1200 (the last item of a
  // card cut off), 86px of Event System and 93px of Queuing. Now the decision
  // is made on the real bottom of the last visible block in the band; only the
  // padding under it is ever skipped. Hidden speaker notes measure zero and are
  // ignored.
  const contentBottom = (band) => {
    let bottom = 0;
    for (const el of band.children) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      bottom = Math.max(bottom, r.bottom);
    }
    return bottom ? Math.round(bottom + window.scrollY) : topOf(band) + band.offsetHeight;
  };

  // The top of the highest block that straddles `edge` (the bottom of the
  // screen), in page coordinates — or null if no block is cut there.
  // Whole cards and panels count too, but only one that FITS on a screen is
  // worth aligning to: then the next stop shows it entire. (The Annual Targets
  // card, 457–499px, was cut at every stop because only its rows were
  // considered.) A block taller than the screen can only be paged through, so
  // for those the smallest cut block inside them is used instead.
  const BLOCKS = 'p, li, h2, h3, h4, figure, figcaption, table, tr, svg, img, .metric, .tbar, .badge, .ch-wrap, ' +
                 '.card, .summary-strip, .blockers, .not-recorded, .unknown, .wait-board';
  const firstCutBlock = (band, edge, minTop, fitH, limit = Infinity) => {
    let best = null;
    for (const el of band.querySelectorAll(BLOCKS)) {
      if (el.closest('.notes')) continue;
      const r = el.getBoundingClientRect();
      if (!r.height || r.height > fitH) continue;
      const top = r.top + window.scrollY, bottom = r.bottom + window.scrollY;
      if (top < limit && top > minTop && top < edge - 1 && bottom > edge + 1) best = best == null ? top : Math.min(best, top);
    }
    return best == null ? null : Math.round(best);
  };

  // True when everything of `band` below `edge` belongs to blocks that are
  // already at least three-quarters on screen, and no block starts below it.
  const onlyTails = (band, edge, limit = Infinity) => {
    for (const el of band.querySelectorAll(BLOCKS)) {
      if (el.closest('.notes')) continue;
      const r = el.getBoundingClientRect();
      if (!r.height) continue;
      const top = r.top + window.scrollY, bottom = r.bottom + window.scrollY;
      if (bottom <= edge + 1 || top >= limit) continue;
      if (top >= edge - 1) return false;                       // starts below the fold
      // A line of text is never skipped: text blocks may only lose padding.
      if (el.matches('p, li, h2, h3, h4, tr, figcaption, img, svg, .metric, .tbar')) { if (bottom - edge > 6) return false; continue; }
      if ((edge - top) / (bottom - top) < 0.75) return false;   // too much still unseen
    }
    return true;
  };

  /* ── STOPS ─────────────────────────────────────────────
     A stop is where "next" lands: every band's own top, plus every element
     inside a band marked data-stop, in document order. A band with no
     data-stop is one stop, exactly as before (July and August).
     An inner stop lands STOP_GAP above its element, so the element's heading
     has air over it; a band's own top already has the band's padding. */
  const STOP_GAP = 32;
  const stops = () => {
    const list = [];
    bands.forEach((band, bi) => {
      const els = [band, ...Array.from(band.querySelectorAll('[data-stop]')).filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 || r.height > 0;
      })];
      els.forEach((el, k) => list.push({ el, band, bandIndex: bi, part: k, parts: els.length }));
    });
    return list;
  };
  const stopTop = (s) => (s.part === 0 ? topOf(s.band) : topOf(s.el) - STOP_GAP);
  // The stop the top of the screen is in.
  const stopIndexAt = (list, y) => {
    let idx = 0;
    list.forEach((s, i) => { if (stopTop(s) <= y + 8) idx = i; });
    return idx;
  };

  const step = (dir) => {
    const vh = window.innerHeight;
    const y = pending ?? window.scrollY;
    const list = stops();
    const si = stopIndexAt(list, y);
    const cur = list[si];
    const nxt = list[si + 1];
    const band = cur.band;
    const page = vh * 0.85;
    const sameBand = nxt && nxt.band === band;
    // Where this stop's content ends: the next stop's element inside the same
    // band, or the end of the band's content.
    const regionEnd = sameBand ? topOf(nxt.el) : contentBottom(band);
    const nextTop = nxt ? stopTop(nxt) : maxY();

    if (dir > 0) {
      // Any of THIS stop's content still below the fold? Read on by up to a
      // screen, and when the remainder is short, by just enough to show it
      // with a little air under it — never past content the room has not seen.
      const below = regionEnd - (y + vh);
      // A sliver is not worth a stop: when under 200px is left and all of it
      // is the tail of blocks already mostly on screen (never a line of text),
      // go on to the next stop instead of nudging 60–150px.
      if (below > 2 && below < 200 && onlyTails(band, y + vh, regionEnd)) return go(nextTop);
      if (below > 2) {
        const rest = below + 32;          // what is left, with a little air under it
        // The rest fits on this move (keeping 48px of the current screen as
        // overlap): finish in one move — unless a whole card or picture that
        // fits on a screen is cut, in which case start just above it.
        if (rest <= vh - 48) {
          const cutEnd = firstCutBlock(band, y + vh, y + 8, vh - 64, regionEnd);
          if (cutEnd != null && cutEnd - 24 >= y + 200 && cutEnd - 24 < y + rest) return go(cutEnd - 24);
          return go(Math.min(y + rest, nextTop));
        }
        let target = y + page;
        // Don't page through the middle of a card, a picture, a chart or a
        // paragraph if it can be avoided: when a block that fits on a screen is
        // cut by the bottom edge, the next screen starts just above it.
        const cut = firstCutBlock(band, y + vh, y + 8, vh - 64, regionEnd);
        if (cut != null && cut - 24 >= y + 200 && cut - 24 <= y + vh - 40) return go(cut - 24);
        // Never leave a sliver for the next press: if what would remain is
        // under 200px, take the rest in two even moves instead.
        if (rest - (target - y) < 200) target = y + Math.ceil(rest / 2);
        return go(Math.min(target, nextTop));
      }
      return go(nextTop);
    }
    // Back: up through this stop a screen at a time to its top, then to the
    // top of the stop before it.
    const top = stopTop(cur);
    const above = y - top;
    if (above > page) return go(y - page);
    if (above > 4) return go(top);
    if (si > 0) return go(stopTop(list[si - 1]));
    return go(0);
  };

  // A jump to a section also moves keyboard focus there, as the rail does, so
  // the next Tab carries on inside the section that was chosen rather than
  // starting again at the top of the page.
  const jump = (i, focus = false) => {
    if (!bands[i]) return;
    go(topOf(bands[i]));
    if (focus) {
      bands[i].setAttribute('tabindex', '-1');
      bands[i].focus({ preventScroll: true });
    }
  };

  // "Which section is current" has ONE answer on this page: the page
  // controller's (site.js), which the rail, the hash and the presenter window
  // already follow via band:enter. The overview used to work it out for
  // itself from the top of the screen, so on the last screen it said
  // "October" while the rail and the presenter window said "Thank you".
  let entered = Number.isInteger(window.site?.current) && window.site.current >= 0 ? window.site.current : indexAt(window.scrollY);
  document.addEventListener('band:enter', (e) => {
    if (Number.isInteger(e.detail?.index)) entered = e.detail.index;
  });
  const current = () => entered;
  return { step, jump, current, stops, stopIndexAt };
}

/* ── The section overview (Esc) ───────────────────────── */
function makeOverview(bands, nav) {
  let box = null, list = null, lastFocus = null;

  const build = () => {
    box = document.createElement('div');
    box.className = 'povw';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-labelledby', 'povw-title');
    box.hidden = true;
    box.innerHTML =
      '<div class="povw-panel">' +
        '<div class="povw-head">' +
          '<h2 class="povw-title" id="povw-title">Sections</h2>' +
          '<p class="povw-hint">Choose a section to jump to it. <kbd>Esc</kbd> closes this.</p>' +
        '</div>' +
        '<ol class="povw-list"></ol>' +
      '</div>';
    list = box.querySelector('.povw-list');
    bands.forEach((b, i) => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'povw-item';
      btn.dataset.index = String(i);
      const name = b.dataset.bandName || b.id || `Section ${i + 1}`;
      const title = bindText(squash(b.querySelector('.band-title')?.textContent || ''));
      btn.innerHTML = '<span class="povw-num"></span><span class="povw-name"></span><span class="povw-sub"></span>';
      btn.querySelector('.povw-num').textContent = String(i + 1).padStart(2, '0');
      btn.querySelector('.povw-name').textContent = name;
      btn.querySelector('.povw-sub').textContent = title && title.toLowerCase() !== name.toLowerCase() ? title : '';
      btn.addEventListener('click', () => { close(false); nav.jump(i, true); });
      li.appendChild(btn);
      list.appendChild(li);
    });
    // A click on the dark surround closes it.
    box.addEventListener('click', (e) => { if (e.target === box) close(); });
    // Keys stay inside the overview while it is open. Tab cycles through the
    // items; the arrows, Home and End move between them; PageUp/PageDown and
    // Space-on-nothing are swallowed, so nothing scrolls the page behind it.
    box.addEventListener('keydown', (e) => {
      const items = Array.from(list.querySelectorAll('.povw-item'));
      const at = items.indexOf(document.activeElement);
      const first = items[0], last = items[items.length - 1];
      const move = (i) => { e.preventDefault(); items[Math.max(0, Math.min(items.length - 1, i))]?.focus(); };
      switch (e.key) {
        case 'Tab':
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
          else if (at === -1) { e.preventDefault(); first.focus(); }
          return;
        case 'ArrowDown': case 'ArrowRight': return move(at + 1);
        case 'ArrowUp': case 'ArrowLeft': return move(at - 1);
        case 'Home': return move(0);
        case 'End': return move(items.length - 1);
        case 'PageDown': case 'PageUp': e.preventDefault(); return;
        case ' ': case 'Spacebar': if (at === -1) e.preventDefault(); return;
        default: return;
      }
    });
    document.body.appendChild(box);
  };

  const open = () => {
    if (!box) build();
    lastFocus = document.activeElement;
    const cur = nav.current();
    list.querySelectorAll('.povw-item').forEach((b, i) => {
      if (i === cur) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
    });
    box.hidden = false;
    void box.offsetHeight;
    box.classList.add('is-open');
    list.querySelectorAll('.povw-item')[cur]?.focus({ preventScroll: true });
    list.querySelectorAll('.povw-item')[cur]?.scrollIntoView({ block: 'nearest' });
  };

  // `restore` is false when the overview closes because a section was chosen:
  // focus is then released rather than sent back up the page to whatever had
  // it before, which would drag the reader back there.
  const close = (restore = true) => {
    if (!box || !box.classList.contains('is-open')) return;
    box.classList.remove('is-open');
    box.hidden = true;
    if (restore && lastFocus?.focus && lastFocus !== document.body) lastFocus.focus({ preventScroll: true });
    else document.activeElement?.blur?.();
  };

  return { open, close, isOpen: () => !!box && box.classList.contains('is-open') };
}

/* ── Fullscreen (F) ───────────────────────────────────── */
function toggleFullscreen() {
  const d = document;
  if (d.fullscreenElement) {
    d.exitFullscreen?.().catch(() => {});
    toast('Fullscreen off');
    return;
  }
  const req = d.documentElement.requestFullscreen?.({ navigationUI: 'hide' });
  if (!req) { toast('This browser cannot go fullscreen from the page — press F11 instead'); return; }
  req.then(() => toast('Fullscreen — press F or Esc to leave'))
     .catch(() => toast('Fullscreen was refused by the browser — press F11 instead'));
}

/* ── The presenter window (P) ─────────────────────────── */
/**
 * A second window for the laptop's own screen while the projector shows only
 * the report. It shows the current section's speaker notes (from that band's
 * <aside class="notes">), what comes next, the clock and the time elapsed, and
 * Previous / Next buttons — and the same keys as the report — that drive the
 * report window. The notes are never put into the report page by this: on a
 * mirrored display, the only screen with notes on it is this one.
 *
 * HOW THE TWO WINDOWS TALK. The window is opened as about:blank by this page,
 * so it shares this page's origin and this module simply builds it and keeps it
 * up to date directly — no messages, no channel, nothing to fall out of step.
 * That holds for an https:// page and equally for a page served from the
 * laptop. (A report double-clicked from a folder, a file:// address, never runs
 * its modules at all in Chrome or Edge — fallback.js explains that on screen —
 * so there is no file:// case to support here.) The window's own keys and
 * buttons call straight back into this page. If the report is reloaded or
 * closed, the window says so and pressing P in the report reconnects it.
 */
function makePresenterWindow(bands, nav) {
  let win = null, timer = 0, startedAt = 0;

  // NOTES BELONG TO STOPS, NOT TO WHOLE SECTIONS. A notes panel inside a
  // data-stop element belongs to that stop; every other notes panel in the
  // band belongs to the band's first stop (its head). A band with no
  // data-stop is one stop, so it shows all its notes, exactly as before.
  const notesFor = (s) => {
    const all = Array.from(s.band.querySelectorAll('.notes'));
    return all.filter((n) => {
      const owner = n.closest('[data-stop]');
      const inBand = owner && s.band.contains(owner) ? owner : null;
      return s.part === 0 ? !inBand : inBand === s.el;
    });
  };
  const nameOf = (b) => b.dataset.bandName || b.id || '';
  const titleOf = (b) => bindText(squash(b.querySelector('.band-title')?.textContent || ''));
  // A stop's short name: its data-stop value, else its first heading, else
  // its part number.
  const stopLabel = (s) => {
    if (s.part === 0) return nameOf(s.band);
    const v = squash(s.el.getAttribute('data-stop') || '');
    if (v) return bindText(v);
    const hd = s.el.matches('h2, h3, h4, .band-title') ? s.el : s.el.querySelector('h2, h3, h4, .band-title');
    const t = hd ? bindText(squash(hd.textContent)) : '';
    return t || `Part ${s.part + 1}`;
  };
  const alive = () => { try { return !!win && !win.closed && !!win.document; } catch { return false; } };

  const pad = (n) => String(n).padStart(2, '0');
  const tick = () => {
    if (!alive()) { clearInterval(timer); timer = 0; return; }
    const d = win.document;
    const now = new Date();
    const clock = d.getElementById('pv-clock');
    if (clock) clock.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const s = Math.floor((Date.now() - startedAt) / 1000);
    const el = d.getElementById('pv-elapsed');
    if (el) el.textContent = `${Math.floor(s / 3600) ? Math.floor(s / 3600) + ':' : ''}${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
  };

  let shown = null;   // the stop currently rendered, so a scroll that stays inside it costs nothing
  const render = (force = false) => {
    if (!alive()) return;
    const list = nav.stops();
    const si = nav.stopIndexAt(list, window.scrollY);
    const s = list[si], next = list[si + 1];
    if (!s) return;
    if (!force && shown === s.el) return;
    shown = s.el;
    const d = win.document;
    const b = s.band;
    d.getElementById('pv-pos').textContent =
      `Section ${s.bandIndex + 1} of ${bands.length}` + (s.parts > 1 ? ` · Part ${s.part + 1} of ${s.parts}` : '');
    d.getElementById('pv-name').textContent = nameOf(b);
    const t = s.part === 0 ? titleOf(b) : stopLabel(s);
    d.getElementById('pv-title').textContent = t && t.toLowerCase() !== nameOf(b).toLowerCase() ? t : '';
    const notes = d.getElementById('pv-notes');
    notes.replaceChildren();
    const src = notesFor(s).filter((n) => n.textContent.trim());
    if (src.length) {
      src.forEach((n0) => Array.from(n0.childNodes).forEach((n) => notes.appendChild(d.importNode(n, true))));
      bindNotes(d, notes);
    } else {
      const p = d.createElement('p');
      p.className = 'pv-empty';
      p.textContent = s.parts > 1 ? 'No speaker notes for this part.' : 'No speaker notes for this section.';
      notes.appendChild(p);
    }
    notes.scrollTop = 0;
    let nextText = 'End of the report';
    if (next && next.band === b) nextText = `${stopLabel(next)} (part ${next.part + 1} of ${next.parts})`;
    else if (next) {
      const nt = titleOf(next.band), nn = nameOf(next.band);
      nextText = `${nn}${nt && nt.toLowerCase() !== nn.toLowerCase() ? ' — ' + nt : ''}`;
    }
    d.getElementById('pv-next').textContent = nextText;
    const st = d.getElementById('pv-status');
    if (!st.classList.contains('pv-ok')) st.textContent = '';
  };

  const build = () => {
    const d = win.document;
    const css = (p) => new URL(p, import.meta.url).href;
    d.documentElement.lang = document.documentElement.lang || 'en';
    d.head.innerHTML =
      '<meta charset="utf-8">' +
      `<link rel="stylesheet" href="${css('../css/fonts.css')}">` +
      `<link rel="stylesheet" href="${css('../css/tokens.css')}">` +
      `<style>${PRESENTER_CSS}</style>`;
    // After the head is written, not before: replacing the head's contents
    // also removes the <title> that setting document.title creates, and the
    // window was announced and listed in the taskbar with no name at all.
    d.title = `Presenter — ${document.title}`;
    d.body.innerHTML =
      '<header class="pv-bar">' +
        '<p class="pv-pos" id="pv-pos"></p>' +
        '<p class="pv-time"><span class="pv-lab">Time</span> <span id="pv-clock">--:--</span>' +
        '<span class="pv-lab">Elapsed</span> <span id="pv-elapsed">00:00</span>' +
        '<button type="button" class="pv-reset" id="pv-reset">Restart timer</button></p>' +
      '</header>' +
      '<main class="pv-main">' +
        '<h1 class="pv-name" id="pv-name"></h1>' +
        '<p class="pv-title" id="pv-title"></p>' +
        '<section class="pv-notes" id="pv-notes" aria-label="Speaker notes" tabindex="0"></section>' +
      '</main>' +
      '<footer class="pv-foot">' +
        '<p class="pv-nextwrap"><span class="pv-lab">Next</span> <span id="pv-next"></span></p>' +
        '<p class="pv-status" id="pv-status" role="status"></p>' +
        '<div class="pv-btns">' +
          '<button type="button" id="pv-prev"><span aria-hidden="true">&larr;</span><span>Back</span></button>' +
          '<button type="button" id="pv-fwd" class="pv-primary"><span>Next</span><span aria-hidden="true">&rarr;</span></button>' +
        '</div>' +
        '<p class="pv-keys">Right arrow, PageDown or Space: next &nbsp;·&nbsp; Left arrow or PageUp: back. ' +
        'This window shows only on the screen it is on.</p>' +
      '</footer>';

    d.getElementById('pv-prev').addEventListener('click', () => nav.step(-1));
    d.getElementById('pv-fwd').addEventListener('click', () => nav.step(1));
    d.getElementById('pv-reset').addEventListener('click', () => { startedAt = Date.now(); tick(); });
    win.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = e.target?.tagName;
      const onButton = tag === 'BUTTON';
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || (!onButton && (e.key === ' ' || e.key === 'Spacebar') && !e.shiftKey)) {
        e.preventDefault(); nav.step(1);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp' || (!onButton && (e.key === ' ' || e.key === 'Spacebar') && e.shiftKey)) {
        e.preventDefault(); nav.step(-1);
      }
    });
  };

  const open = () => {
    if (!alive()) {
      try {
        win = window.open('', 'bugemco-presenter', 'popup=yes,width=1100,height=780');
      } catch { win = null; }
      if (!win) {
        toast('The presenter window was blocked. Allow pop-ups for this page (the icon at the right-hand end of the address bar), then press P again.');
        return;
      }
      if (!startedAt) startedAt = Date.now();
    }
    try {
      build();
    } catch {
      toast('The presenter window could not be set up. Close it and press P again.');
      return;
    }
    render(true);
    tick();
    if (!timer) timer = setInterval(tick, 1000);
    try { win.focus(); } catch { /* the window manager decides */ }
    // The confirmation is shown IN the presenter window, not on the report:
    // a toast here sat on the projected picture for three seconds telling the
    // room about the presenter's notes.
    try {
      const st = win.document.getElementById('pv-status');
      st.classList.add('pv-ok');
      st.textContent = 'Presenter window ready. Drag it to the laptop screen; the projector shows only the report.';
      setTimeout(() => { try { if (st.classList.contains('pv-ok')) { st.textContent = ''; st.classList.remove('pv-ok'); } } catch { /* closed */ } }, 6000);
    } catch { /* closed already */ }
  };

  // Follow the reader, whatever moved them — the keys, the rail, the wheel,
  // End, a deep link: the current stop is re-read on every scroll (one
  // measurement per frame, and nothing is redrawn unless the stop changed).
  let queued = false;
  const follow = () => {
    if (queued || !alive()) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; render(); });
  };
  window.addEventListener('scroll', follow, { passive: true });
  window.addEventListener('resize', follow, { passive: true });
  document.addEventListener('band:enter', follow);
  document.addEventListener('notes:change', () => { if (alive()) render(true); });

  const detach = () => {
    if (!alive()) return;
    try {
      const st = win.document.getElementById('pv-status');
      st.classList.remove('pv-ok');
      st.textContent = 'The report window was closed or reloaded. Press P in the report to reconnect.';
    } catch { /* already gone */ }
  };

  return { open, detach };
}

/* ── Text copied off the page keeps its bindings ─────────
   The page binds words with U+00A0 ("6&nbsp;hours", "&nbsp;&mdash;"), and
   the old copy collapsed whitespace with /\s+/, which in JavaScript matches
   U+00A0 too — so the overview printed a line starting "— and 34,168…" and a
   line holding "3" on its own. squash() collapses ASCII whitespace only.
   bindText() adds the same bindings to copied text that the page's authors
   add by hand: a dash never starts a line, a figure stays with the word it
   counts, and a figure never ends a line alone. */
const squash = (s) => s.replace(/[ \t\n\r\f]+/g, ' ').trim();
const bindText = (s) => s
  .replace(/ ([—–])/g, ' $1')
  .replace(/(\d) (?=[\p{L}\p{N}₱%])/gu, '$1 ')
  .replace(/ (\d[\d,.]*%?)$/u, ' $1');

/* In the presenter window's copy of the notes: the same bindings, and a
   hyphenated name (CAC-IIS, one-time) is wrapped in a no-wrap span so it is
   never broken at its hyphen. A span rather than U+2011: the bold weights of
   the brand fonts have no non-breaking-hyphen glyph, and the browser drew a
   thin fallback hyphen in the middle of bold words. */
function bindNotes(d, root) {
  const walker = d.createTreeWalker(root, 4 /* NodeFilter.SHOW_TEXT */);
  const texts = [];
  for (let tn = walker.nextNode(); tn; tn = walker.nextNode()) texts.push(tn);
  const HY = /[\p{L}\p{N}]+(?:[-‑][\p{L}\p{N}]+)+/gu;
  texts.forEach((tn) => {
    const v = bindText(tn.nodeValue.replace(/‑/g, '-'));
    if (!HY.test(v)) { tn.nodeValue = v; return; }
    HY.lastIndex = 0;
    const frag = d.createDocumentFragment();
    let at = 0;
    for (const m of v.matchAll(HY)) {
      if (m.index > at) frag.appendChild(d.createTextNode(v.slice(at, m.index)));
      const span = d.createElement('span');
      span.className = 'nobr';
      span.textContent = m[0];
      frag.appendChild(span);
      at = m.index + m[0].length;
    }
    if (at < v.length) frag.appendChild(d.createTextNode(v.slice(at)));
    tn.replaceWith(frag);
  });
}

/* ── Small helpers ────────────────────────────────────── */
function readKeys() {
  try { return localStorage.getItem(KEYS_KEY) !== '0'; } catch { return true; }
}

function isTyping(t) {
  if (!t || t === document.body) return false;
  if (t.isContentEditable) return true;
  return !!t.matches?.('input, textarea, select, [contenteditable=""], [contenteditable="true"]');
}

function isInteractive(t) {
  if (!t || t === document.body || t === document.documentElement) return false;
  return !!t.closest?.('a[href], button, summary, [role="button"], [role="link"], [role="tab"], [role="menuitem"], label, input, select, textarea');
}

function usesArrows(t) {
  return !!t?.closest?.('input, select, textarea, [role="slider"], [role="radiogroup"], [role="radio"], [role="listbox"], [role="tablist"], [role="menu"], [role="grid"]');
}

// Anything modal already on screen. Its own keys are its business.
function anotherLayerOpen() {
  if (document.querySelector('.lightbox.is-open')) return true;
  if (document.querySelector('.doc-overlay.is-open')) return true;
  const panel = document.querySelector('.pkeys-panel');
  if (panel && !panel.hidden) return true;
  if (document.querySelector('[aria-modal="true"]:not([hidden]):not(.povw)')) return true;
  return false;
}

/* The presenter window's own look. Inline because the window is about:blank
   and has no stylesheet of its own; the brand fonts and tokens are linked in
   from assets/css. Dark, because it sits on a laptop in a darkened room. */
const PRESENTER_CSS = `
*,*::before,*::after{box-sizing:border-box}
html,body{height:100%}
body{margin:0;display:grid;grid-template-rows:auto 1fr auto;background:#0D1A13;color:#EAF3EE;
  font:400 1.25rem/1.6 var(--font-body,'Inter','Segoe UI',system-ui,sans-serif)}
.pv-bar,.pv-foot{padding:0.7rem 1.6rem;background:#08120D}
.nobr{white-space:nowrap}
.pv-bar{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:0.5rem 1.5rem;
  border-bottom:3px solid #F5C518}
.pv-pos{margin:0;font:800 1rem/1.3 var(--font-head,sans-serif);letter-spacing:0.12em;text-transform:uppercase;color:#FAFA00}
.pv-time{margin:0;display:flex;align-items:center;gap:0.6rem;font:800 1.5rem/1 var(--font-head,sans-serif);font-variant-numeric:tabular-nums}
.pv-lab{font:700 1rem/1 var(--font-body,sans-serif);letter-spacing:0.1em;text-transform:uppercase;color:#A9C4B4}
.pv-main{overflow:hidden;display:grid;grid-template-rows:auto auto 1fr;padding:0.8rem 1.6rem 0.8rem;min-height:0}
.pv-name{margin:0;font:900 1.75rem/1.15 var(--font-head,sans-serif)}
.pv-title{margin:0.2rem 0 0.6rem;font:700 1.125rem/1.3 var(--font-head,sans-serif);color:#B9D9C6}
.pv-title:not(:empty)+.pv-notes{margin-top:0}
.pv-title:empty{display:none}
.pv-name+.pv-title:empty+.pv-notes{margin-top:0.6rem}
/* The notes are the point of the window, so they get the height: 22px type at
   1.5, with the header, title and footer trimmed around them. */
.pv-notes{overflow:auto;min-height:0;padding:0.9rem 1.2rem;border-left:6px solid #F5C518;background:#13261C;border-radius:0 14px 14px 0;
  font-size:1.375rem;line-height:1.5;hyphens:none;-webkit-hyphens:none;overflow-wrap:normal}
.pv-notes p{margin:0 0 0.8em}.pv-notes ul,.pv-notes ol{margin:0 0 0.8em;padding-left:1.4em}
.pv-notes strong,.pv-notes b{color:#FAFA00}
.pv-notes:focus-visible{outline:3px solid #FAFA00;outline-offset:2px}
.pv-empty{color:#A9C4B4;font-style:italic}
/* One row: what comes next on the left, the two buttons on the right. */
.pv-foot{display:grid;grid-template-columns:1fr auto;align-items:center;gap:0.4rem 1.2rem;border-top:1px solid #23402F}
.pv-nextwrap{margin:0;font-size:1.125rem;line-height:1.4}
.pv-status,.pv-keys{grid-column:1 / -1}
.pv-status{margin:0;color:#FFB4A8;font-weight:700}.pv-status:empty{display:none}.pv-status.pv-ok{color:#B9F0CB}
.pv-btns{display:flex;gap:0.8rem}
.pv-btns button,.pv-reset{font:800 1.1rem/1 var(--font-head,sans-serif);padding:0.8rem 1.4rem;border-radius:999px;
  border:2px solid #A9C4B4;background:transparent;color:#EAF3EE;cursor:pointer;min-height:48px}
.pv-btns button{display:inline-flex;align-items:center;gap:0.55em}
.pv-reset{font-size:1rem;padding:0.5rem 0.9rem;min-height:40px}
.pv-btns .pv-primary{background:#FAFA00;border-color:#FAFA00;color:#0D1A13}
.pv-btns button:focus-visible,.pv-reset:focus-visible{outline:3px solid #FAFA00;outline-offset:3px}
.pv-keys{margin:0;font-size:1rem;color:#A9C4B4}
`;
