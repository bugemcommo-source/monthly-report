/**
 * Full-screen document panels.
 *
 * A button opens a panel that fills the screen and scrolls on its own, the way
 * a document does. Used for the proposal summary and for reading the proposal
 * itself, so neither has to sit in the middle of the report and push the rest
 * of the month down the page.
 *
 * Markup contract:
 *   <button data-doc-open="proposal-summary">…</button>
 *   <div class="doc-overlay" id="proposal-summary" hidden> … </div>
 *
 * Keyboard: Escape closes, Tab is kept inside the panel, and focus returns to
 * the button that opened it. A panel a keyboard user can fall out of is worse
 * than no panel.
 */

const OPEN_CLASS = 'is-open';
const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

let openPanel = null;
let opener = null;
let scrollLock = 0;

function focusables(panel) {
  return Array.from(panel.querySelectorAll(FOCUSABLE)).filter((el) => el.offsetParent !== null);
}

function open(panel, button) {
  if (openPanel) close();
  openPanel = panel;
  opener = button || null;

  panel.hidden = false;
  // Force a frame between "not hidden" and "open" so the transition has a
  // rendered starting state to move away from. Without it the panel appears.
  void panel.offsetHeight;
  panel.classList.add(OPEN_CLASS);

  // Hold the page still behind the panel. Recording the offset and putting it
  // back on close keeps the reader where they were.
  scrollLock = window.scrollY;
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollLock}px`;
  document.body.style.width = '100%';

  const body = panel.querySelector('.doc-body');
  if (body) body.scrollTop = 0;

  const first = panel.querySelector('.doc-close') || focusables(panel)[0];
  if (first) first.focus();
}

function close() {
  if (!openPanel) return;
  const panel = openPanel;
  panel.classList.remove(OPEN_CLASS);

  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  // Instant, not smooth. The page sets `scroll-behavior: smooth` globally, so a
  // plain scrollTo animates the reader back to where they already were — the
  // page appears to fly on its own after the panel closes. Putting somebody
  // back is not a journey.
  window.scrollTo({ top: scrollLock, left: 0, behavior: 'instant' });

  const wasOpener = opener;
  openPanel = null;
  opener = null;

  // Let the fade finish before taking it out of the accessibility tree.
  setTimeout(() => { if (!panel.classList.contains(OPEN_CLASS)) panel.hidden = true; }, 240);
  if (wasOpener) wasOpener.focus();
}

export function initDocViewer(root = document) {
  const buttons = root.querySelectorAll('[data-doc-open]');
  if (buttons.length === 0) return;

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const panel = document.getElementById(button.dataset.docOpen);
      if (panel) open(panel, button);
    });
  });

  root.querySelectorAll('.doc-overlay').forEach((panel) => {
    panel.querySelectorAll('[data-doc-close]').forEach((el) => {
      el.addEventListener('click', close);
    });
    // Clicking the dimmed area closes; clicking the document itself does not.
    panel.addEventListener('mousedown', (e) => { if (e.target === panel) close(); });
  });

  document.addEventListener('keydown', (e) => {
    if (!openPanel) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key !== 'Tab') return;

    const items = focusables(openPanel);
    if (items.length === 0) { e.preventDefault(); return; }
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
}
