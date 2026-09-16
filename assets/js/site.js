/**
 * Page controller. Owns where you are on the page, and the chrome that says so.
 *
 * Dispatches on document:
 *   band:enter       { detail: { el, index, id, total } }
 *   reveal           { detail: { el } }                    once per element
 *   scroll:progress  { detail: { fraction } }              throttled to frames
 *
 * Never imports effects.js. Motion is somebody else's job.
 *
 * There is no scroll hijacking here and there must never be. The old deck
 * swallowed the wheel, the spacebar and the arrow keys to move between slides.
 * This is a website: the browser's own scrolling is the interaction, and every
 * habit a reader already has - flick, spacebar, PageDown, Home, End, find-in-
 * page, trackpad momentum - has to keep working untouched.
 */

/**
 * Put a block back to its opening state so its reveal can play again.
 *
 * The motion layer stamps each counter and bar with a "done" flag the first
 * time it animates, so it never runs twice by accident. Clearing that flag is
 * what allows a second run. Without this, a section returned to would fade in
 * with its numbers already landed and its bars already full, which looks
 * broken rather than finished.
 *
 * THE FLAGS ARE ALL THAT IS CLEARED. It used to write "0" into every counter
 * and 0% into every bar on the way out, which meant the DOCUMENT said zero for
 * everything not currently on screen. A screen reader in browse mode, find-in-
 * page and Print all read the document rather than the viewport, so with the
 * page sitting at the last band, all thirteen of August's figures read "0" —
 * "0 SYSTEM PRESENTATIONS HELD", "0 APPROVAL GRANTED". The report was telling
 * three of its four audiences the opposite of what happened.
 * Writing them back was never needed for the replay either: the motion layer
 * paints the empty state itself, on screen, at the moment it starts the
 * animation. Resting state is therefore always the TRUE figure and the TRUE
 * bar width, and only a running animation ever shows anything else.
 */
export function rearm(el) {
  el.querySelectorAll('[data-count]').forEach((n) => { delete n.dataset.counted; });
  el.querySelectorAll('[data-fill]').forEach((b) => { delete b.dataset.filled; });
}

export class Site {
  constructor(root) {
    this.root = root;
    this.bands = Array.from(root.querySelectorAll('.band'));
    if (this.bands.length === 0) throw new Error('Page has no .band sections');

    this.backdrop = document.querySelector('.backdrop');
    this.current = -1;
    this.ticking = false;
    // Set the moment the reader clicks or taps anything. See bindFirstTab.
    this.pointerUsed = false;
    // Ratio of how much of each band is on screen, kept live by the observer.
    // Picking the dominant band from this beats reacting to whichever entry
    // fired last, which flickers when two bands cross the viewport together.
    this.ratios = new Map();
  }

  start() {
    this.buildChrome();
    this.buildNav();
    this.buildToTop();
    this.observeBands();
    this.observeReveals();
    this.bindScroll();
    this.bindFirstTab();

    // Settle on a starting band before the first scroll event, so the header
    // and backdrop are never blank for the first frame.
    this.setCurrent(0, { silent: false });
    this.onScroll();
    this.applyDeepLink();
  }

  /* ── Edge chrome ────────────────────────────────────── */
  /* There is no header bar by design. A progress hairline runs along the top
     edge of the screen and the section rail down the right edge; both sit
     outside the content rather than stealing a strip of it. */
  buildChrome() {
    this.progressBar = document.querySelector('.site-progress-fill');
    // Optional: a page may show the current section's name somewhere.
    this.sectionLabel = document.querySelector('.site-section-label');
  }

  /* ── Section navigation ─────────────────────────────── */
  buildNav() {
    const nav = document.querySelector('.site-nav');
    if (!nav) return;
    const list = document.createElement('ul');
    list.className = 'site-nav-list';

    this.navLinks = this.bands.map((band, i) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.className = 'site-nav-link';
      a.href = `#${band.id}`;
      const label = band.dataset.bandName || band.id;
      // The mark is a dot; the name is revealed on hover or focus from this
      // attribute, and kept in the text as well so it is read out properly.
      a.dataset.label = label;
      a.textContent = label;
      a.setAttribute('title', label);
      a.addEventListener('click', (e) => {
        // Let the browser do the scrolling, but keep it smooth and keep the
        // hash out of the history stack - see updateHash below for why.
        e.preventDefault();
        this.scrollToBand(i);
      });
      li.appendChild(a);
      list.appendChild(li);
      return a;
    });

    nav.appendChild(list);
    this.nav = nav;
  }

  scrollToBand(i) {
    const band = this.bands[i];
    if (!band) return;
    band.scrollIntoView({ behavior: this.motionOk() ? 'smooth' : 'auto', block: 'start' });
    // Move keyboard focus with the eye. Without this, tabbing after clicking a
    // section link resumes from the nav, not from the section you asked for.
    band.setAttribute('tabindex', '-1');
    band.focus({ preventScroll: true });
  }

  motionOk() {
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
        && !document.documentElement.classList.contains('calm');
  }

  /* ── Back to top ────────────────────────────────────── */
  buildToTop() {
    const btn = document.querySelector('.to-top');
    if (!btn) return;
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: this.motionOk() ? 'smooth' : 'auto' });
      this.bands[0]?.focus?.({ preventScroll: true });
    });
    this.toTop = btn;
  }

  /* ── Which band am I looking at ─────────────────────── */
  observeBands() {
    // A band of ordinary height rarely fills the viewport, so a single
    // threshold would leave gaps where nothing is "current". Sampling a ladder
    // of thresholds keeps a live ratio for every band instead.
    const thresholds = Array.from({ length: 21 }, (_, i) => i / 20);
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        this.ratios.set(entry.target, entry.isIntersecting ? entry.intersectionRatio : 0);
      }
      this.pickDominant();
    }, { threshold: thresholds, rootMargin: '-10% 0px -35% 0px' });

    this.bands.forEach((b) => io.observe(b));
    this.bandObserver = io;
  }

  pickDominant() {
    let best = null, bestRatio = 0;
    for (const [el, ratio] of this.ratios) {
      if (ratio > bestRatio) { bestRatio = ratio; best = el; }
    }
    if (!best) return;
    const index = this.bands.indexOf(best);
    if (index !== -1 && index !== this.current) this.setCurrent(index);
  }

  setCurrent(index) {
    const el = this.bands[index];
    if (!el) return;
    this.current = index;

    if (this.sectionLabel) this.sectionLabel.textContent = el.dataset.bandName || '';
    this.navLinks?.forEach((a, i) => {
      const on = i === index;
      a.classList.toggle('is-current', on);
      // aria-current is what a screen reader announces; the class is only paint.
      if (on) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });

    if (this.backdrop && el.dataset.backdrop) {
      this.backdrop.dataset.backdrop = el.dataset.backdrop;
    }

    this.updateHash(el.id);

    document.dispatchEvent(new CustomEvent('band:enter', {
      detail: { el, index, id: el.id, total: this.bands.length }
    }));
  }

  /**
   * replaceState, never a hash assignment.
   *
   * Setting location.hash pushes a history entry, so a reader who scrolled
   * through eight sections then pressed Back would crawl back up the page
   * eight times before leaving it. Replacing keeps the address bar honest and
   * shareable while leaving Back meaning "the page I came from".
   */
  updateHash(id) {
    if (!id || location.hash === `#${id}`) return;
    history.replaceState(null, '', `#${id}`);
    // See bindFirstTab. Writing a fragment here has one side effect that has
    // nothing to do with the address bar, and it is not obvious from this line.
  }

  /**
   * Make the first Tab reach the section rail.
   *
   * Writing a fragment into the URL — which updateHash does on every band, by
   * design, so the address bar stays shareable — also sets the document's
   * SEQUENTIAL FOCUS NAVIGATION STARTING POINT. So the first Tab no longer
   * started at the top of the document; it resumed from whichever band the
   * reader happened to be looking at, and the rail, which is first in the DOM
   * and is the whole navigation of the page, was only reachable after tabbing
   * through everything else and wrapping round. Measured: the first Tab at
   * scrollY 0 landed 8,680px down the page. Blocking replaceState fixed it and
   * cost the shareable address, which is not a trade worth making.
   *
   * So the starting point is left alone and the FIRST Tab is put back instead.
   * It fires only when nothing at all is focused — which is exactly the case
   * the fragment broke — and never once the reader has used a pointer, so
   * "click in the middle of the page, then Tab" keeps the browser's own
   * behaviour of carrying on from where you clicked. Every later Tab is
   * untouched: this moves focus to the first rail link and then gets out of
   * the way.
   */
  bindFirstTab() {
    document.addEventListener('pointerdown', () => { this.pointerUsed = true; }, true);

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab' || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return;
      if (this.pointerUsed) return;
      const active = document.activeElement;
      // Anything focused at all means the reader is already somewhere in the
      // tab order and the browser knows better than this does.
      if (active && active !== document.body && active !== document.documentElement) return;
      const first = this.navLinks?.[0];
      if (!first) return;
      e.preventDefault();
      first.focus();
    });
  }

  /* ── Reveal on scroll ───────────────────────────────── */

  /* Put a revealed block back so its reveal can play again. The motion layer
     marks each counter and bar done with a data attribute, and clearing that
     is all it takes — the figures and bar widths themselves are left true.
     See rearm at the top of this file for why that matters. */

  observeReveals() {
    const targets = this.root.querySelectorAll('[data-reveal-on-scroll]');
    if (targets.length === 0) return;

    // THE STANDARD: every reveal replays each time it comes back on screen.
    //
    // This is deliberate and it is the house rule for this report. A section
    // scrolled past and returned to animates again exactly as it did when the
    // page was opened, so nothing ever appears already-finished. The element is
    // never unobserved.
    //
    // Leaving the screen re-arms it — the class comes off and the done-flags on
    // any counter or bar inside it are cleared, so the second pass plays from
    // the beginning instead of showing the numbers already landed. What is NOT
    // cleared is the figures themselves: an off-screen block still says what it
    // means, because print, find-in-page and a screen reader in browse mode all
    // read the document rather than the viewport.
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          document.dispatchEvent(new CustomEvent('reveal', { detail: { el: entry.target } }));
        } else {
          entry.target.classList.remove('is-revealed');
          rearm(entry.target);
        }
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    targets.forEach((t) => io.observe(t));
    this.revealObserver = io;
  }


  /* ── Scroll position, progress and parallax ─────────── */
  bindScroll() {
    const onScroll = () => {
      if (this.ticking) return;
      this.ticking = true;
      requestAnimationFrame(() => { this.onScroll(); this.ticking = false; });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
  }

  onScroll() {
    const y = window.scrollY || window.pageYOffset || 0;
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const fraction = Math.min(1, Math.max(0, y / max));

    if (this.progressBar) this.progressBar.style.setProperty('--progress', fraction);
    if (this.toTop) this.toTop.classList.toggle('is-shown', y > window.innerHeight * 0.9);

    // The parallax itself. CSS reads these two off .backdrop; nothing here
    // knows how far the artwork should move, which keeps the amount a design
    // decision rather than a JavaScript constant.
    if (this.backdrop) {
      this.backdrop.style.setProperty('--scroll-y', `${y}px`);
      this.backdrop.style.setProperty('--scroll-fraction', fraction.toFixed(4));
    }

    document.dispatchEvent(new CustomEvent('scroll:progress', { detail: { fraction } }));
  }

  /* ── Deep links ─────────────────────────────────────── */
  applyDeepLink() {
    const id = location.hash.replace(/^#/, '');
    if (!id) return;
    const index = this.bands.findIndex((b) => b.id === id);
    if (index === -1) return;
    // Jump, don't glide: the reader asked for this section by address, and a
    // long smooth scroll on load reads as the page being slow.
    this.bands[index].scrollIntoView({ behavior: 'auto', block: 'start' });
  }
}
