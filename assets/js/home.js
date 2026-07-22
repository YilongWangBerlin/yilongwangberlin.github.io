/* =========================================================================
   Content page interactions. Nothing here runs on its own clock: the rail
   reports scroll position through --read, sections reveal once when they
   enter the viewport, and the rest is click handlers (lightbox, BibTeX
   copy, photo grid).
   ========================================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  var nav = document.querySelector('.nav');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- the scroll loop ---------- */

  var pending = false;

  function frame() {
    pending = false;

    var y = window.scrollY || window.pageYOffset || 0;
    var doc = document.documentElement;
    var span = doc.scrollHeight - window.innerHeight;
    var read = span > 0 ? Math.min(1, Math.max(0, y / span)) : 0;

    root.style.setProperty('--read', read.toFixed(4));
    if (nav) nav.classList.toggle('is-stuck', y > 24);
  }

  function request() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(frame);
  }

  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request, { passive: true });

  /* ---------- lightbox ---------- */

  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightboxImg');
  var lightboxCap = document.getElementById('lightboxCap');
  var lastFocus = null;

  function openLightbox(src, alt, caption) {
    if (!lightbox) return;
    lastFocus = document.activeElement;
    lightboxImg.src = src;
    lightboxImg.alt = alt || '';
    lightboxCap.textContent = caption || '';
    lightboxCap.hidden = !caption;
    lightbox.setAttribute('open', '');
    var close = lightbox.querySelector('.lightbox-close');
    if (close) close.focus();
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.removeAttribute('open');
    if (lastFocus) lastFocus.focus();
  }

  if (lightbox) {
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightboxImg) return;
      closeLightbox();
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeLightbox();
  });

  /* ---------- figures ---------- */

  function wireFigures() {
    var thumbs = document.querySelectorAll('.paper-thumb');
    Array.prototype.forEach.call(thumbs, function (btn) {
      btn.addEventListener('click', function () {
        var img = btn.querySelector('img');
        openLightbox(
          btn.getAttribute('data-full') || (img && img.src),
          img ? img.alt : '',
          btn.getAttribute('data-cap') || ''
        );
      });
    });
  }

  /* ---------- list cascade ----------
     CSS animates each row off --n. Numbering them here keeps the stylesheet
     from having to know how long any of these lists are. */

  function numberRows() {
    var rows = document.querySelectorAll('.themes > li, .news > li');
    var seen = null, n = 0;
    Array.prototype.forEach.call(rows, function (li) {
      if (li.parentNode !== seen) { seen = li.parentNode; n = 0; }
      li.style.setProperty('--n', n++);
    });
  }

  /* ---------- bibtex ---------- */

  function wireBibtex() {
    var buttons = document.querySelectorAll('.chip[data-bibtex]');
    Array.prototype.forEach.call(buttons, function (btn) {
      var original = btn.textContent;
      var timer = null;

      btn.addEventListener('click', function () {
        var text = btn.getAttribute('data-bibtex');
        if (!text || !navigator.clipboard) return;

        navigator.clipboard.writeText(text).then(function () {
          btn.textContent = 'Copied';
          btn.classList.add('copied');
          clearTimeout(timer);
          timer = setTimeout(function () {
            btn.textContent = original;
            btn.classList.remove('copied');
          }, 1600);
        });
      });
    });
  }

  /* ---------- photographs ---------- */

  function buildPhotos() {
    var section = document.getElementById('photographs');
    var grid = document.getElementById('photoGrid');
    var list = window.PHOTOS;
    if (!section || !grid || !list || !list.length) return;

    list.forEach(function (photo) {
      if (!photo || !photo.src) return;

      var label = [photo.caption, photo.year].filter(Boolean).join(' · ');

      var fig = document.createElement('figure');
      fig.className = 'photo';
      fig.setAttribute('role', 'button');
      fig.setAttribute('tabindex', '0');
      fig.setAttribute('aria-label', label ? 'Enlarge: ' + label : 'Enlarge photograph');

      var img = document.createElement('img');
      img.src = photo.src;
      img.alt = photo.alt || photo.caption || '';
      img.loading = 'lazy';
      img.decoding = 'async';
      fig.appendChild(img);

      if (label) {
        var cap = document.createElement('figcaption');
        cap.textContent = label;
        fig.appendChild(cap);
      }

      function show() { openLightbox(photo.src, img.alt, label); }
      fig.addEventListener('click', show);
      fig.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(); }
      });

      grid.appendChild(fig);
    });

    section.hidden = false;
  }

  /* ---------- scroll spy ----------
     Marks the nav link whose section is currently under the nav bar, and
     hands that link the section's own band colour through --sc. */

  function watchNav() {
    var links = document.querySelectorAll('.nav-list a[href^="#"]');
    if (!links.length) return;

    var targets = [];
    Array.prototype.forEach.call(links, function (a) {
      var el = document.getElementById(a.getAttribute('href').slice(1));
      if (el) targets.push({ link: a, section: el });
    });
    if (!targets.length) return;

    function mark() {
      var line = (window.scrollY || 0) + 90;
      var here = null;

      targets.forEach(function (t) {
        if (t.section.offsetTop <= line) here = t;
      });

      targets.forEach(function (t) {
        var on = t === here;
        t.link.classList.toggle('is-here', on);
        if (on) t.link.style.setProperty('--sc', getComputedStyle(t.section).getPropertyValue('--sc'));
      });
    }

    window.addEventListener('scroll', mark, { passive: true });
    window.addEventListener('resize', mark, { passive: true });
    mark();
  }

  /* ---------- scroll reveal ---------- */

  function watchRisers() {
    var risers = document.querySelectorAll('main .rise');

    if (!('IntersectionObserver' in window) || reduced) {
      Array.prototype.forEach.call(risers, function (el) { el.classList.add('shown'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('shown'); io.unobserve(en.target); }
      });
    }, { threshold: 0.06, rootMargin: '0px 0px -5% 0px' });
    Array.prototype.forEach.call(risers, function (el) { io.observe(el); });
  }

  /* ---------- boot ---------- */

  function boot() {
    buildPhotos();
    numberRows();
    watchRisers();
    watchNav();
    wireBibtex();
    wireFigures();
    request();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
