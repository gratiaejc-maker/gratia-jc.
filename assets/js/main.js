/* GRATIA JC — interações: menu, cabeçalho, CTA fixo, revelar ao rolar, carrossel e ampliação. */
(function () {
  "use strict";
  var doc = document, root = doc.documentElement;
  root.classList.add("js");
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };

  /* cabeçalho */
  var header = $("[data-header]");
  function onScroll() { if (header) header.classList.toggle("is-scrolled", window.scrollY > 24); }
  onScroll(); window.addEventListener("scroll", onScroll, { passive: true });

  /* menu mobile */
  var btn = $("[data-menu-btn]"), nav = $("[data-nav]");
  function setMenu(open) {
    if (!btn || !nav) return;
    btn.setAttribute("aria-expanded", String(open));
    btn.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    nav.classList.toggle("is-open", open);
    doc.body.classList.toggle("menu-open", open);
  }
  if (btn) {
    btn.addEventListener("click", function () { setMenu(btn.getAttribute("aria-expanded") !== "true"); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    doc.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
    window.matchMedia("(min-width:768px)").addEventListener("change", function () { setMenu(false); });
  }

  /* CTA fixo: aparece fora do hero e da seção final, para não cobrir conteúdo */
  var sticky = $("[data-sticky]");
  if (sticky && "IntersectionObserver" in window) {
    var visible = new Set();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { en.isIntersecting ? visible.add(en.target) : visible.delete(en.target); });
      var show = visible.size === 0 && window.scrollY > 200;
      sticky.classList.toggle("is-visible", show);
      if (show) sticky.removeAttribute("inert"); else sticky.setAttribute("inert", "");
    }, { threshold: 0.15 });
    $$("[data-hide-sticky], .footer").forEach(function (el) { io.observe(el); });
    window.addEventListener("scroll", function () { io.takeRecords(); }, { passive: true });
  }

  /* revelar ao rolar */
  var reveals = $$(".reveal");
  if ("IntersectionObserver" in window) {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); ro.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    reveals.forEach(function (el) { ro.observe(el); });
  } else reveals.forEach(function (el) { el.classList.add("is-in"); });

  /* carrossel (mobile) */
  var track = $("[data-offers-track]"), prev = $("[data-offers-prev]"), next = $("[data-offers-next]");
  function updateNav() {
    if (!track) return;
    var overflow = track.scrollWidth > track.clientWidth + 4;
    prev.hidden = !overflow || track.scrollLeft < 8;
    next.hidden = !overflow || track.scrollLeft + track.clientWidth >= track.scrollWidth - 8;
  }
  if (track) {
    var step = function () { var it = $(".offers__item", track); return it ? it.getBoundingClientRect().width + 18 : 280; };
    prev.addEventListener("click", function () { track.scrollBy({ left: -step(), behavior: "smooth" }); });
    next.addEventListener("click", function () { track.scrollBy({ left: step(), behavior: "smooth" }); });
    track.addEventListener("scroll", updateNav, { passive: true });
    window.addEventListener("resize", updateNav);
    window.addEventListener("load", updateNav); updateNav();
  }

  /* ampliar imagem das ofertas */
  var lb = $("[data-lightbox]");
  var cards = $$("[data-offer]");
  if (lb && cards.length) {
    var img = $("[data-lb-img]", lb), cap = $("[data-lb-cap]", lb), cur = 0;
    var show = function (i) {
      cur = (i + cards.length) % cards.length;
      var src = $("img", cards[cur]);
      img.src = src.currentSrc || src.src; img.alt = src.alt; cap.textContent = src.getAttribute("data-caption") || "";
    };
    cards.forEach(function (c, i) {
      c.addEventListener("click", function () { show(i); if (lb.showModal) lb.showModal(); else lb.setAttribute("open", ""); });
    });
    $("[data-lb-close]", lb).addEventListener("click", function () { lb.close(); });
    $("[data-lb-prev]", lb).addEventListener("click", function () { show(cur - 1); });
    $("[data-lb-next]", lb).addEventListener("click", function () { show(cur + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });
    lb.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") show(cur - 1); else if (e.key === "ArrowRight") show(cur + 1);
    });
  }
})();
