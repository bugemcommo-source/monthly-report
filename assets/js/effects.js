/**
 * Motion layer. Listens to the page controller's events; never decides where
 * you are on the page and never scrolls anything.
 *
 * Calm mode (the C key) sets html.calm, which flattens every animation in CSS
 * and stops the particle loop. It removes decoration only — every figure, bar
 * width and chart keeps its true value. If calm mode ever hides information,
 * that is a bug.
 */

const CALM_KEY = 'bugemco-calm';

export function initEffects(root) {
  const state = { calm: localStorage.getItem(CALM_KEY) === '1', particles: null, resize: null };

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) state.calm = true;
  applyCalm(state.calm);

  document.addEventListener('keydown', (e) => {
    // Ctrl+C is copy, Ctrl+P is print. Without this guard, copying a figure
    // off the page silently turned calm mode on and remembered it for every
    // future visit.
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target?.matches?.('input, textarea')) return;

    if (e.key === 'c' || e.key === 'C') {
      state.calm = !state.calm;
      localStorage.setItem(CALM_KEY, state.calm ? '1' : '0');
      applyCalm(state.calm);
      toast(state.calm ? 'Calm mode ON — heavy effects off' : 'Calm mode OFF — full effects');
    } else if (e.key === 'p' || e.key === 'P') {
      document.body.classList.toggle('show-notes');
      toast(document.body.classList.contains('show-notes')
        ? 'Speaker notes shown — only on your screen'
        : 'Speaker notes hidden');
    }
  });

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
  watchFrameRate(state);

  // The hero is on screen before any scrolling happens, so it never receives a
  // reveal event. Start it directly.
  requestAnimationFrame(() => {
    const hero = document.querySelector('.band--hero');
    if (hero) { countUp(hero); fillBars(hero); revealTitle(hero); }
  });

  function applyCalm(on) {
    document.documentElement.classList.toggle('calm', on);
    if (on) {
      stopParticles(state);
      // Snap anything mid-flight to its true value rather than leaving it
      // frozen part-way.
      document.querySelectorAll('[data-count]').forEach(settleCount);
      document.querySelectorAll('[data-fill]').forEach(settleFill);
    } else {
      startParticles(state);
    }
    document.dispatchEvent(new CustomEvent('calm:change', { detail: { calm: on } }));
  }
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
    const count = Math.round((w * h) / 7000);
    dots = Array.from({ length: count }, (_, i) => ({
      x: ((i * 97) % 100) / 100 * canvas.width,
      y: ((i * 61) % 100) / 100 * canvas.height,
      r: (2.2 + (i % 5) * 1.5) * dpr,
      vx: ((i % 5) - 2) * 0.16 * dpr,
      vy: -(0.30 + (i % 4) * 0.16) * dpr,
      a: 0.26 + (i % 6) * 0.07,
      green: i % 3 !== 0
    }));
  };
  resize();

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const d of dots) {
      d.x += d.vx; d.y += d.vy;
      if (d.y < -10) d.y = canvas.height + 10;
      if (d.x < -10) d.x = canvas.width + 10;
      if (d.x > canvas.width + 10) d.x = -10;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = d.green ? `rgba(0,102,51,${d.a})` : `rgba(250,250,0,${d.a})`;
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
          toast('Effects reduced automatically — this computer was struggling. Press C to force them back on.');
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
function toast(msg) {
  let el = document.querySelector('.deck-toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'deck-toast';
    el.setAttribute('role', 'status');
    Object.assign(el.style, {
      position: 'fixed', left: '50%', bottom: '2rem', transform: 'translateX(-50%)',
      zIndex: 70, background: 'rgba(10,25,18,0.94)', color: '#EAF3EE',
      padding: '0.7rem 1.3rem', borderRadius: '999px', font: '600 0.9rem system-ui',
      maxWidth: '80vw', textAlign: 'center', transition: 'opacity 300ms', pointerEvents: 'none'
    });
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity = '1';
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.style.opacity = '0'; }, 3200);
}
