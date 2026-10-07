/* =========================================================================
   Page interactions: figure lightbox, BibTeX reveal and copy.
   ========================================================================= */
(function () {
  'use strict';

  /* ---------- lightbox ---------- */

  var box = document.getElementById('lightbox');
  var boxImg = document.getElementById('lightboxImg');
  var boxCap = document.getElementById('lightboxCap');
  var lastFocus = null;

  function open(src, alt, cap) {
    lastFocus = document.activeElement;
    boxImg.src = src;
    boxImg.alt = alt || '';
    boxCap.textContent = cap || '';
    box.setAttribute('open', '');
    box.querySelector('.lightbox-close').focus();
  }

  function close() {
    if (!box.hasAttribute('open')) return;
    box.removeAttribute('open');
    if (lastFocus) lastFocus.focus();
  }

  box.addEventListener('click', function (e) {
    if (e.target !== boxImg) close();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') close();
  });

  document.querySelectorAll('.thumb').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var img = btn.querySelector('img');
      open(img.currentSrc || img.src, img.alt, btn.getAttribute('data-cap'));
    });
  });

  /* ---------- bibtex ---------- */

  document.querySelectorAll('.bib-toggle').forEach(function (btn) {
    var bib = btn.closest('.pub').querySelector('.bib');
    btn.addEventListener('click', function () {
      var shown = bib.classList.toggle('open');
      btn.setAttribute('aria-expanded', shown ? 'true' : 'false');
    });
  });

  document.querySelectorAll('.bib .copy').forEach(function (btn) {
    var timer = null;
    btn.addEventListener('click', function () {
      var text = btn.parentNode.querySelector('pre').textContent;
      if (!navigator.clipboard) return;
      navigator.clipboard.writeText(text).then(function () {
        btn.textContent = 'Copied';
        clearTimeout(timer);
        timer = setTimeout(function () { btn.textContent = 'Copy'; }, 1600);
      });
    });
  });
})();
