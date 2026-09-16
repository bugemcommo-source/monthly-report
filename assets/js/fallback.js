/**
 * Blank-screen guard.
 *
 * The report is built from ES modules, and Chrome and Edge refuse to load
 * module scripts when a page is opened straight from a folder (a file://
 * address) — the browser blocks them as a cross-origin request. The page
 * would then show nothing at all, with the explanation buried in a developer
 * console the owner will never open.
 *
 * This file is a CLASSIC script, not a module, so it always runs. If the deck
 * has not started shortly after load, it replaces the blank page with a plain
 * explanation of what to do. Better a clear sentence than an empty screen in
 * front of management.
 */
(function () {
  var GRACE_MS = 1500;

  function stillBlank() {
    // Evidence the page controller actually ran. The section list is built by
    // site.js at startup, so if it is absent the modules never loaded.
    return !window.site && !document.querySelector('.site-nav-list');
  }

  function explain() {
    if (!stillBlank()) return;

    var openedFromFile = location.protocol === 'file:';
    var body = document.body;
    if (!body) return;

    body.setAttribute('style',
      'margin:0;background:#F4F7F5;color:#22282B;overflow:auto;' +
      "font-family:'Inter','Segoe UI',system-ui,sans-serif");

    body.innerHTML =
      '<div style="max-width:44rem;margin:12vh auto;padding:0 2rem;line-height:1.65">' +
        '<div style="height:8px;width:120px;border-radius:999px;' +
          'background:linear-gradient(90deg,#006633,#FAFA00);margin-bottom:2rem"></div>' +
        '<h1 style="font-size:1.75rem;font-weight:900;margin:0 0 1rem">' +
          'This report needs to be opened from its link' +
        '</h1>' +
        (openedFromFile
          ? '<p>You opened the file directly from a folder. Web browsers block ' +
            'presentations like this one from running that way. Nothing is broken ' +
            'and nothing is lost — it just has to be opened differently.</p>' +
            '<p><strong>Use the published web address</strong> — the link starting ' +
            'with <code>https://</code>. Everything works normally there.</p>' +
            '<p>If you have no internet where you are presenting, ask ICT to run it ' +
            'from a local server first. The report itself is fine.</p>'
          : '<p>The report did not finish loading. This usually means a file is ' +
            'missing or was moved. Try refreshing the page first.</p>' +
            '<p>If it keeps happening, open this folder in Claude Code and say what ' +
            'you see on screen.</p>') +
        '<p style="margin-top:2.5rem;font-size:0.85rem;color:#5A6468">' +
          'BUGEMCO · ICT Department · Software Development and Information Security' +
        '</p>' +
      '</div>';
  }

  if (document.readyState === 'complete') {
    setTimeout(explain, GRACE_MS);
  } else {
    window.addEventListener('load', function () { setTimeout(explain, GRACE_MS); });
  }
})();
