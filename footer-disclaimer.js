/**
 * Trademark / independent-reseller footer disclosure (DE/EN/IT/ES/FR).
 * Shared by item-page scripts and hub/legal pages. Idempotent if loaded twice.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (typeof root !== 'undefined') {
    root.ABC_FOOTER_DISCLAIMER = api;
    if (typeof document !== 'undefined') {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
          api.boot();
        });
      } else {
        api.boot();
      }
    }
  }
})(typeof window !== 'undefined' ? window : typeof globalThis !== 'undefined' ? globalThis : this, function () {
  var ID = 'abc-tm-disclaimer';
  var CSS_ID = 'abc-tm-disclaimer-css';
  var COPY = {
    de: 'Alle genannten Marken und Logos sind Eigentum ihrer jeweiligen Inhaber und dienen ausschließlich der Produktidentifikation. ABCspareparts ist ein unabhängiger Händler; ihre Verwendung bedeutet keine Verbindung, Autorisierung oder Billigung durch die Markeninhaber.',
    en: 'All trademarks and logos mentioned belong to their respective owners and are used solely to identify products. ABCspareparts is an independent reseller; their use does not imply affiliation, authorisation or endorsement by the trademark owners.',
    it: 'Tutti i marchi e i loghi citati appartengono ai rispettivi titolari e sono utilizzati esclusivamente per identificare i prodotti. ABCspareparts è un rivenditore indipendente; il loro utilizzo non implica affiliazione, autorizzazione o approvazione da parte dei titolari.',
    es: 'Todas las marcas y los logotipos mencionados pertenecen a sus respectivos titulares y se utilizan únicamente para identificar los productos. ABCspareparts es un distribuidor independiente; su uso no implica afiliación, autorización ni aprobación por parte de los titulares.',
    fr: 'Toutes les marques et tous les logos mentionnés appartiennent à leurs titulaires respectifs et sont utilisés uniquement pour identifier les produits. ABCspareparts est un revendeur indépendant ; leur utilisation n’implique aucune affiliation, autorisation ni approbation de la part des titulaires.'
  };
  var CSS =
    '.footer-trademark{font-size:0.75rem;line-height:1.45;opacity:0.85;max-width:42rem;margin:0.75rem auto 0;font-weight:400;}';

  function visitorLang() {
    try {
      var stored = localStorage.getItem('lang');
      if (stored && COPY[stored]) return stored;
    } catch (e) {}
    if (typeof document !== 'undefined') {
      var htmlLang = String((document.documentElement && document.documentElement.lang) || '')
        .split('-')[0]
        .toLowerCase();
      if (COPY[htmlLang]) return htmlLang;
      var sel = document.getElementById('languageSelect');
      if (sel && COPY[sel.value]) return sel.value;
    }
    var list = [];
    try {
      if (typeof navigator !== 'undefined' && navigator.languages && navigator.languages.length) {
        for (var i = 0; i < navigator.languages.length; i++) list.push(navigator.languages[i]);
      }
    } catch (e2) {}
    if (!list.length && typeof navigator !== 'undefined') {
      list.push(navigator.language || navigator.userLanguage || 'de');
    }
    for (var j = 0; j < list.length; j++) {
      var code = String(list[j] || '').split('-')[0].toLowerCase();
      if (COPY[code]) return code;
    }
    return 'de';
  }

  function ensureStyle() {
    if (typeof document === 'undefined' || document.getElementById(CSS_ID)) return;
    var s = document.createElement('style');
    s.id = CSS_ID;
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function ensureEl() {
    if (typeof document === 'undefined') return null;
    var el = document.getElementById(ID);
    if (el) return el;
    var footer = document.querySelector('footer.footer') || document.querySelector('footer');
    if (!footer) return null;
    ensureStyle();
    el = document.createElement('p');
    el.id = ID;
    el.className = 'footer-trademark';
    el.setAttribute('data-abc-tm-disclaimer', '1');
    el.setAttribute('data-i18n', 'footer_trademark');
    el.setAttribute('role', 'note');
    var info = footer.querySelector('.footer-info') || footer;
    info.appendChild(el);
    return el;
  }

  function apply(lang) {
    lang = COPY[lang] ? lang : visitorLang();
    var el = ensureEl();
    if (!el) return lang;
    el.textContent = COPY[lang];
    return lang;
  }

  function flushWaiters() {
    if (typeof window === 'undefined') return;
    var q = window.__abcTmDisclaimerWaiters || [];
    window.__abcTmDisclaimerWaiters = [];
    for (var i = 0; i < q.length; i++) q[i]();
  }

  function boot() {
    if (typeof window !== 'undefined' && window.__abcTmDisclaimerBooted) {
      apply(visitorLang());
      flushWaiters();
      return;
    }
    if (typeof window !== 'undefined') window.__abcTmDisclaimerBooted = true;
    apply(visitorLang());
    flushWaiters();
    if (typeof document === 'undefined') return;
    var sel = document.getElementById('languageSelect');
    if (sel && !sel.getAttribute('data-abc-tm-bound')) {
      sel.setAttribute('data-abc-tm-bound', '1');
      sel.addEventListener('change', function () {
        if (COPY[sel.value]) apply(sel.value);
      });
    }
  }

  return {
    COPY: COPY,
    CSS: CSS,
    apply: apply,
    boot: boot,
    ensureEl: ensureEl,
    visitorLang: visitorLang
  };
});
