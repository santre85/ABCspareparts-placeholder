/* Item-page language: selector, saved choice, browser languages, quote CTA prefill. */
(function () {
  var LANGS = { de: true, en: true, it: true, es: true, fr: true };
  var LANG_LIST = ['de', 'en', 'it', 'es', 'fr'];

  var UI = {
    de: {
      nav_home: 'Home',
      footer_brands: 'Marken',
      footer_cases: 'Erfolgsgeschichten',
      footer_contact: 'Kontakt',
      footer_imprint: 'Impressum',
      footer_privacy: 'Datenschutz',
      footer_terms: 'AGB',
      footer_shipping: 'Versand',
      footer_cookies: 'Cookies',
      footer_linkedin: 'LinkedIn',
      footer_rights: 'Alle Rechte vorbehalten.',
      brand_label: 'Hersteller',
      part_label: 'Teilenummer',
      desc_label: 'Beschreibung',
      lead: 'Unverbindliche Anfrage für diese Teilenummer. Keine Preise und keine Lagerstände auf der Seite — Konditionen nach Prüfung.',
      cta: 'Angebot anfragen',
      brand_cta_prefix: 'Zur Markenseite ',
      lang_label: 'Sprache',
      breadcrumb_aria: 'Brotkrumen'
    },
    en: {
      nav_home: 'Home',
      footer_brands: 'Brands',
      footer_cases: 'Success stories',
      footer_contact: 'Contact',
      footer_imprint: 'Imprint',
      footer_privacy: 'Privacy',
      footer_terms: 'Terms',
      footer_shipping: 'Shipping',
      footer_cookies: 'Cookies',
      footer_linkedin: 'LinkedIn',
      footer_rights: 'All rights reserved.',
      brand_label: 'Manufacturer',
      part_label: 'Part number',
      desc_label: 'Description',
      lead: 'Non-binding enquiry for this part number. No prices and no stock levels on this page — terms after review.',
      cta: 'Request quote',
      brand_cta_prefix: 'Brand page ',
      lang_label: 'Language',
      breadcrumb_aria: 'Breadcrumb'
    },
    it: {
      nav_home: 'Home',
      footer_brands: 'Marche',
      footer_cases: 'Casi di successo',
      footer_contact: 'Contatti',
      footer_imprint: 'Impressum',
      footer_privacy: 'Privacy',
      footer_terms: 'Condizioni',
      footer_shipping: 'Spedizione',
      footer_cookies: 'Cookie',
      footer_linkedin: 'LinkedIn',
      footer_rights: 'Tutti i diritti riservati.',
      brand_label: 'Produttore',
      part_label: 'Codice articolo',
      desc_label: 'Descrizione',
      lead: 'Richiesta senza impegno per questo codice. Nessun prezzo e nessuna scorta in pagina — condizioni dopo verifica.',
      cta: 'Richiedi preventivo',
      brand_cta_prefix: 'Pagina marca ',
      lang_label: 'Lingua',
      breadcrumb_aria: 'Percorso'
    },
    es: {
      nav_home: 'Home',
      footer_brands: 'Marcas',
      footer_cases: 'Casos de éxito',
      footer_contact: 'Contacto',
      footer_imprint: 'Aviso legal',
      footer_privacy: 'Privacidad',
      footer_terms: 'Términos',
      footer_shipping: 'Envío',
      footer_cookies: 'Cookies',
      footer_linkedin: 'LinkedIn',
      footer_rights: 'Todos los derechos reservados.',
      brand_label: 'Fabricante',
      part_label: 'Referencia',
      desc_label: 'Descripción',
      lead: 'Solicitud sin compromiso para esta referencia. Sin precios ni existencias en la página — condiciones tras revisión.',
      cta: 'Solicitar presupuesto',
      brand_cta_prefix: 'Página de marca ',
      lang_label: 'Idioma',
      breadcrumb_aria: 'Migas de pan'
    },
    fr: {
      nav_home: 'Home',
      footer_brands: 'Marques',
      footer_cases: 'Histoires de réussite',
      footer_contact: 'Contact',
      footer_imprint: 'Mentions légales',
      footer_privacy: 'Confidentialité',
      footer_terms: 'CGV',
      footer_shipping: 'Livraison',
      footer_cookies: 'Cookies',
      footer_linkedin: 'LinkedIn',
      footer_rights: 'Tous droits réservés.',
      brand_label: 'Fabricant',
      part_label: 'Référence',
      desc_label: 'Description',
      lead: 'Demande sans engagement pour cette référence. Aucun prix ni stock sur la page — conditions après examen.',
      cta: 'Demander un devis',
      brand_cta_prefix: 'Page marque ',
      lang_label: 'Langue',
      breadcrumb_aria: 'Fil d’Ariane'
    }
  };

  var BODY = {
    de: ['ABCspareparts prüft die Referenz ', ' auf Beschaffbarkeit und Lieferoptionen in Europa. Verfügbarkeit und Konditionen werden nach Ihrer Anfrage ermittelt.'],
    en: ['ABCspareparts checks reference ', ' for sourcing and delivery options in Europe. Availability and terms are determined after your enquiry.'],
    it: ['ABCspareparts verifica il codice ', ' per approvvigionamento e opzioni di consegna in Europa. Disponibilità e condizioni dopo la richiesta.'],
    es: ['ABCspareparts comprueba la referencia ', ' para suministro y opciones de entrega en Europa. Disponibilidad y condiciones tras su solicitud.'],
    fr: ['ABCspareparts vérifie la référence ', ' pour l’approvisionnement et les options de livraison en Europe. Disponibilité et conditions après votre demande.']
  };

  function visitorLang() {
    try {
      var stored = localStorage.getItem('lang');
      if (stored && LANGS[stored]) return stored;
    } catch (e) {}
    var list = [];
    try {
      if (navigator.languages && navigator.languages.length) {
        for (var i = 0; i < navigator.languages.length; i++) list.push(navigator.languages[i]);
      }
    } catch (e2) {}
    if (!list.length && (navigator.language || navigator.userLanguage)) {
      list.push(navigator.language || navigator.userLanguage);
    }
    for (var j = 0; j < list.length; j++) {
      var code = String(list[j] || '').split('-')[0].toLowerCase();
      if (LANGS[code]) return code;
    }
    return 'de';
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

  function persist(lang) {
    try {
      localStorage.setItem('lang', lang);
    } catch (e) {}
  }

  function applyCta(lang) {
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

  function injectSelector() {
    if (document.getElementById('languageSelect')) return;
    if (window.ABC_SIEMENS_PART_I18N) return;
    if (!document.querySelector('.page-hero') && !document.querySelector('.part-body')) return;

    if (!document.getElementById('abc-part-lang-css')) {
      var css = document.createElement('style');
      css.id = 'abc-part-lang-css';
      css.textContent =
        '.legal-header{background:#1e3a5f;color:#fff;padding:1rem 0;position:sticky;top:0;z-index:100}' +
        '.legal-header .container{display:flex;align-items:center;gap:1rem;position:relative;padding-right:9.5rem;max-width:820px;margin:0 auto;padding-left:1.5rem}' +
        '.legal-header .logo{font-size:1.5rem;font-weight:700;color:#fff;text-decoration:none}' +
        '.legal-nav{display:flex;gap:0.85rem;flex-wrap:wrap;align-items:center}' +
        '.legal-nav a{color:rgba(255,255,255,0.9);text-decoration:none;font-size:0.9rem}' +
        '.language-selector{position:absolute;right:1.5rem;top:50%;transform:translateY(-50%)}' +
        '.language-selector select{padding:0.5rem 2rem 0.5rem 0.75rem;font-size:0.9rem;border:1px solid #ddd;border-radius:6px;background:#fff;cursor:pointer}' +
        '.visually-hidden{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}' +
        '@media (max-width:640px){.legal-header .container{padding-right:1.5rem;padding-top:0.25rem}.language-selector{position:static;transform:none;margin-left:auto}}';
      document.head.appendChild(css);
    }

    var header = document.createElement('header');
    header.className = 'legal-header';
    header.setAttribute('data-abc-injected-lang', '1');
    header.innerHTML =
      '<div class="container">' +
      '<a href="../../" class="logo">ABCspareparts</a>' +
      '<nav class="legal-nav">' +
      '<a href="../../" data-i18n="nav_home">Home</a>' +
      '<a href="../../marche.html" data-i18n="footer_brands">Marken</a>' +
      '<a href="../../casi.html" data-i18n="footer_cases">Erfolgsgeschichten</a>' +
      '<a href="../../#contact" data-i18n="footer_contact">Kontakt</a>' +
      '</nav>' +
      '<div class="language-selector">' +
      '<label class="visually-hidden" for="languageSelect" data-i18n="lang_label">Sprache</label>' +
      '<select id="languageSelect" aria-label="Language">' +
      '<option value="de">Deutsch</option>' +
      '<option value="en">English</option>' +
      '<option value="it">Italiano</option>' +
      '<option value="es">Español</option>' +
      '<option value="fr">Français</option>' +
      '</select></div></div>';
    document.body.insertBefore(header, document.body.firstChild);
  }

  function applyChrome(lang) {
    var t = UI[lang] || UI.de;
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      if (t[k]) el.textContent = t[k];
    });
    var home = homePrefix(lang);
    var injected = document.querySelector('header[data-abc-injected-lang]');
    if (injected) {
      var logo = injected.querySelector('.logo');
      if (logo) logo.setAttribute('href', home);
      injected.querySelectorAll('.legal-nav a').forEach(function (a) {
        var k = a.getAttribute('data-i18n');
        if (k === 'nav_home') a.setAttribute('href', home);
        if (k === 'footer_contact') a.setAttribute('href', home + '#contact');
      });
    }
    var lead = document.querySelector('.page-hero .lead');
    if (lead) lead.textContent = t.lead;
    var bc = document.querySelector('.breadcrumb');
    if (bc) {
      bc.setAttribute('aria-label', t.breadcrumb_aria);
      bc.querySelectorAll('a').forEach(function (a) {
        var h = (a.getAttribute('href') || '').split('?')[0];
        if (/marche\/[^/]+\.html$/i.test(h)) return;
        if (/marche\.html$/i.test(h)) a.textContent = t.footer_brands;
      });
    }
    var dts = document.querySelectorAll('.part-meta dt');
    if (dts[0] && !dts[0].getAttribute('data-i18n')) dts[0].textContent = t.brand_label;
    if (dts[1] && !dts[1].getAttribute('data-i18n')) dts[1].textContent = t.part_label;
    if (dts[2] && !dts[2].getAttribute('data-i18n')) dts[2].textContent = t.desc_label;
    var cta = document.querySelector('a.cta-primary');
    if (cta) cta.textContent = t.cta;
    var brandCta = document.querySelector('a.cta-secondary');
    var brand = brandFromAnchor(cta || { getAttribute: function () { return ''; } });
    if (brandCta && brand) brandCta.textContent = t.brand_cta_prefix + brand;
    var bodyP = document.querySelector('.part-body .container > p');
    if (bodyP && bodyP.querySelector('strong') && !bodyP.hasAttribute('data-i18n-html')) {
      var code = bodyP.querySelector('strong').textContent;
      var pair = BODY[lang] || BODY.de;
      bodyP.innerHTML = pair[0] + '<strong>' + code.replace(/</g, '&lt;') + '</strong>' + pair[1];
    }
    var sel = document.getElementById('languageSelect');
    if (sel && sel.value !== lang) sel.value = lang;
  }

  function apply(lang) {
    lang = lang && LANGS[lang] ? lang : visitorLang();
    persist(lang);
    applyChrome(lang);
    applyCta(lang);
  }

  function boot() {
    if (window.ABC_SIEMENS_PART_I18N) {
      applyCta(visitorLang());
      return;
    }
    injectSelector();
    var lang = visitorLang();
    apply(lang);
    var sel = document.getElementById('languageSelect');
    if (sel) {
      sel.addEventListener('change', function () {
        apply(sel.value);
      });
    }
  }

  window.ABC_PART_CTA_LANG = { apply: apply, visitorLang: visitorLang, boot: boot };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
