/* GRATIA JC — consentimento (LGPD) + Meta Pixel + GA4 + UTM.
   Nada de rastreamento é carregado antes do "Aceitar". Clique no convite != entrada no grupo:
   por isso o evento enviado é WhatsAppClick (personalizado), nunca uma conversão de adesão. */
(function () {
  "use strict";
  var CFG = window.GRATIA || {};
  var T = CFG.tracking || {};
  var KEY = "gratia_consent_v1";
  var UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  var banner = document.querySelector("[data-consent]");

  function hostAllowed() {
    var h = location.hostname;
    return (T.allowedHosts || []).indexOf(h) !== -1;
  }
  function getConsent() { try { var v = JSON.parse(localStorage.getItem(KEY) || "null"); return v && v.v; } catch (e) { return null; } }
  function setConsent(v) { try { localStorage.setItem(KEY, JSON.stringify({ v: v, ts: Date.now() })); } catch (e) {} }

  /* UTM: guardados só na sessão do navegador, para anexar aos eventos */
  function captureUtms() {
    try {
      var p = new URLSearchParams(location.search), found = {};
      UTM_KEYS.forEach(function (k) { var v = p.get(k); if (v) found[k] = v.slice(0, 100); });
      if (Object.keys(found).length) sessionStorage.setItem("gratia_utm", JSON.stringify(found));
    } catch (e) {}
  }
  function getUtms() { try { return JSON.parse(sessionStorage.getItem("gratia_utm") || "{}"); } catch (e) { return {}; } }

  /* carregamento dos scripts de terceiros (só com consentimento + domínio permitido) */
  var loaded = false;
  function loadScript(src) { var s = document.createElement("script"); s.async = true; s.src = src; document.head.appendChild(s); return s; }
  function loadTrackers() {
    if (loaded || !hostAllowed()) return; loaded = true;
    if (T.metaPixelId) {
      (function (f, n) {
        if (f.fbq) return;
        n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
        if (!f._fbq) f._fbq = n; n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
      })(window);
      loadScript("https://connect.facebook.net/en_US/fbevents.js");
      window.fbq("init", T.metaPixelId);
      window.fbq("track", "PageView");
      window.fbq("track", "ViewContent", getUtms());
    }
    if (T.ga4Id) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag("js", new Date());
      window.gtag("config", T.ga4Id);
      loadScript("https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(T.ga4Id));
    }
  }

  function track(name, params) {
    var data = Object.assign({}, params, getUtms());
    if (!loaded) { if (/[?&]gratia_debug/.test(location.search)) console.info("[gratia] (sem consentimento/domínio)", name, data); return; }
    if (window.fbq) {
      window.fbq("trackCustom", name, data);
      if (T.metaClickStandardEvent && name === "WhatsAppClick") window.fbq("track", T.metaClickStandardEvent, data);
    }
    if (window.gtag) window.gtag("event", name === "WhatsAppClick" ? "whatsapp_invite_click" : name, data);
  }
  window.gratiaTrack = track;

  function clearCookies() {
    document.cookie.split(";").forEach(function (c) {
      var n = c.split("=")[0].trim();
      if (n === "_fbp" || n === "_fbc" || n === "_ga" || n.indexOf("_ga_") === 0) {
        document.cookie = n + "=; Max-Age=0; path=/";
        document.cookie = n + "=; Max-Age=0; path=/; domain=." + location.hostname.replace(/^www\./, "");
      }
    });
  }

  function showBanner(show) {
    if (!banner) return;
    banner.hidden = !show;
    document.body.classList.toggle("has-banner", show);
  }

  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[data-wa]");
    if (a) { track("WhatsAppClick", { button_location: a.getAttribute("data-location") || "desconhecido" }); return; }
    var ig = e.target.closest && e.target.closest("a[data-ig]");
    if (ig) { track("InstagramClick", {}); return; }
    if (e.target.closest("[data-consent-yes]")) { setConsent("yes"); showBanner(false); loadTrackers(); return; }
    if (e.target.closest("[data-consent-no]")) { var was = getConsent(); setConsent("no"); showBanner(false); if (was === "yes") { clearCookies(); location.reload(); } return; }
    if (e.target.closest("[data-open-cookies]")) { showBanner(true); }
  });

  captureUtms();
  var c = getConsent();
  if (c === "yes") loadTrackers();
  else if (c !== "no") showBanner(true);
})();
