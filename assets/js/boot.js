/** The only module a report page loads. Wires the pieces together. */
import { Site } from './site.js';
import { initEffects } from './effects.js';
import { initDocViewer } from './docviewer.js';

const root = document.querySelector('.site') || document.body;

// Effects first, so nothing is mid-animation when the first band is announced.
initEffects(root);

// Document panels sit outside .site, so this is given the whole document.
initDocViewer(document);

const main = document.querySelector('.site');
if (main && main.querySelector('.band')) {
  const site = new Site(main);
  site.start();
  window.site = site;   // handy when checking something in the browser console
}
