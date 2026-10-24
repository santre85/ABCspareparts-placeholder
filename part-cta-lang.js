/* Rewrite item-page "Angebot anfragen" to the visitor's language home. */
(function () {
  var LANGS = { de: true, en: true, it: true, es: true, fr: true };

  function visitorLang() {
    try {
      var stored = localStorage.getItem('lang');
      if (stored && LANGS[stored]) return stored;
    } catch (e) {}
    var nav = String((navigator.language || navigator.userLanguage || 'de').split('-')[0] || 'de').toLowerCase();
    return LANGS[nav] ? nav : 'de';
  }

  function homePrefix(lang) {
    return lang === 'de' ? '../../' : '../../' + lang + '/';
  }

  function decodeParam(raw) {
    try {
      return decodeURIComponent(raw);
    } catch (e) {
      return raw;
    }
  }

  function codeFromAnchor(a) {
    var raw = a.getAttribute('data-part-code');
    if (raw) return raw;
    var href = a.getAttribute('href') || '';
    var m = href.match(/[?&#](?:code|quote)=([^&#]+)/);
    return m ? decodeParam(m[1]) : '';
  }

  function brandFromAnchor(a) {
    var raw = a.getAttribute('data-part-brand');
    if (raw) return raw;
    var href = a.getAttribute('href') || '';
    var m = href.match(/[?&]brand=([^&#]+)/);
    if (m) return decodeParam(m[1]);
    var dd = document.querySelector('.part-meta dd.plain a');
    return dd && dd.textContent ? dd.textContent.trim() : '';
  }

  function apply() {
    var lang = visitorLang();
    var prefix = homePrefix(lang);
    var links = document.querySelectorAll('a.cta-primary');
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      var code = codeFromAnchor(a);
      if (!code) continue;
      var href = prefix + '?code=' + encodeURIComponent(code);
      var brand = brandFromAnchor(a);
      if (brand) href += '&brand=' + encodeURIComponent(brand);
      a.setAttribute('href', href + '#contact');
    }
  }

  window.ABC_PART_CTA_LANG = { apply: apply, visitorLang: visitorLang };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply);
  } else {
    apply();
  }

  document.addEventListener('DOMContentLoaded', function () {
    var sel = document.getElementById('languageSelect');
    if (!sel) return;
    sel.addEventListener('change', function () {
      try {
        localStorage.setItem('lang', sel.value);
      } catch (e) {}
      apply();
    });
  });
})();
