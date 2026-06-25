/* ============================================================
   interactions.js — progreso de scroll, reveal, FAQ, smooth scroll
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Barra de progreso de scroll ---------- */
  var progress = document.querySelector('.scroll-progress');
  function updateProgress() {
    var h = document.documentElement;
    var scrolled = h.scrollTop;
    var height = h.scrollHeight - h.clientHeight;
    var pct = height > 0 ? (scrolled / height) * 100 : 0;
    if (progress) progress.style.width = pct + '%';
  }
  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  /* ---------- Scroll reveal con IntersectionObserver ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Acordeón FAQ (una abierta a la vez, accesible) ---------- */
  var faqButtons = document.querySelectorAll('.faq__q');
  faqButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.faq__item');
      var panel = item.querySelector('.faq__a');
      var isOpen = item.getAttribute('aria-expanded') === 'true';

      faqButtons.forEach(function (other) {
        var otherItem = other.closest('.faq__item');
        otherItem.setAttribute('aria-expanded', 'false');
        other.setAttribute('aria-expanded', 'false');
        otherItem.querySelector('.faq__a').style.maxHeight = null;
      });

      if (!isOpen) {
        item.setAttribute('aria-expanded', 'true');
        btn.setAttribute('aria-expanded', 'true');
        panel.style.maxHeight = panel.scrollHeight + 'px';
      }
    });
  });

  /* ---------- Smooth scroll en enlaces internos ---------- */
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href');
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.pageYOffset - 70;
      window.scrollTo({ top: top, behavior: prefersReduced ? 'auto' : 'smooth' });
    });
  });
})();
