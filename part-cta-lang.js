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

  function codeFromAnchor(a) {
    var raw = a.getAttribute('data-part-code');
    if (raw) return raw;
    var href = a.getAttribute('href') || '';
    var m = href.match(/[?&#](?:code|quote)=([^&#]+)/);
    if (!m) return '';
    try {
      return decodeURIComponent(m[1]);
    } catch (e) {
      return m[1];
    }
  }

  function apply() {
    var lang = visitorLang();
    var prefix = homePrefix(lang);
    var links = document.querySelectorAll('a.cta-primary');
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      var code = codeFromAnchor(a);
      if (!code) continue;
      a.setAttribute('href', prefix + '?code=' + encodeURIComponent(code) + '#contact');
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
