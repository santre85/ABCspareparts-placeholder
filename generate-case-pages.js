'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const CASI_DIR = path.join(ROOT, 'casi');
const BASE = 'https://abcspareparts.eu';
const LANGS = ['de', 'en', 'it', 'es', 'fr'];
const TODAY = new Date().toISOString().slice(0, 10);

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(s) {
  return escapeHtml(s).replace(/'/g, '&#39;');
}

function loadCases() {
  const raw = JSON.parse(fs.readFileSync(path.join(ROOT, 'supply-cases.json'), 'utf8'));
  return (raw.cases || []).filter((c) => c.published !== false);
}

function pickLang(caseRow, lang) {
  return caseRow[lang] || caseRow.de;
}

function buildCasePage(caseRow) {
  const slug = caseRow.slug;
  const de = pickLang(caseRow, 'de');
  const canonical = `${BASE}/casi/${slug}.html`;
  const brandUrl = `../marche/${caseRow.brand_slug}.html`;
  const translationsPayload = {};
  for (const L of LANGS) {
    const t = pickLang(caseRow, L);
    translationsPayload[L] = t;
  }

  const hreflang = LANGS.map(
    (l) => `  <link rel="alternate" hreflang="${l}" href="${canonical}?lang=${l}">`
  ).join('\n');

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title id="pageTitle">${escapeHtml(de.meta_title)}</title>
  <meta id="pageDescription" name="description" content="${escapeAttr(de.meta_description)}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <link rel="canonical" href="${canonical}">
  <link rel="alternate" hreflang="x-default" href="${canonical}">
${hreflang}
  <meta property="og:type" content="article">
  <meta property="og:url" content="${canonical}">
  <meta property="og:title" content="${escapeAttr(de.meta_title)}">
  <meta property="og:description" content="${escapeAttr(de.meta_description)}">
  <meta property="og:image" content="${BASE}/logo.png">
  <meta property="og:site_name" content="ABCspareparts">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeAttr(de.meta_title)}">
  <meta name="twitter:description" content="${escapeAttr(de.meta_description)}">
  <meta name="twitter:image" content="${BASE}/logo.png">
  <script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@id': `${BASE}/#organization`,
        '@type': 'Organization',
        name: 'ABCspareparts',
        url: `${BASE}/`,
        logo: { '@type': 'ImageObject', url: `${BASE}/logo.png` }
      },
      {
        '@type': 'Article',
        '@id': `${canonical}#article`,
        headline: de.title,
        description: de.meta_description,
        datePublished: caseRow.request_date,
        dateModified: caseRow.ship_date,
        author: { '@id': `${BASE}/#organization` },
        publisher: { '@id': `${BASE}/#organization` },
        about: { '@type': 'Brand', name: caseRow.brand },
        inLanguage: 'de',
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonical }
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE}/` },
          { '@type': 'ListItem', position: 2, name: 'Supply cases', item: `${BASE}/casi.html` },
          { '@type': 'ListItem', position: 3, name: caseRow.brand, item: canonical }
        ]
      }
    ]
  })}</script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #fff; }
    .container { max-width: 820px; margin: 0 auto; padding: 0 1.5rem; }
    .language-selector { position: fixed; top: 1rem; right: 1rem; z-index: 1000; }
    .language-selector select { padding: 0.5rem 2rem 0.5rem 0.75rem; font-size: 0.9rem; border: 1px solid #ddd; border-radius: 6px; background: #fff; cursor: pointer; }
    .page-hero { background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); color: #fff; padding: 2.5rem 1.5rem 2rem; }
    .breadcrumb { font-size: 0.9rem; opacity: 0.95; margin-bottom: 1rem; }
    .breadcrumb a { color: #e67e22; text-decoration: none; font-weight: 600; }
    .breadcrumb a:hover { text-decoration: underline; }
    .page-hero h1 { font-size: clamp(1.3rem, 4vw, 1.85rem); line-height: 1.35; margin-bottom: 0.6rem; }
    .page-hero .subtitle { font-size: 1rem; opacity: 0.92; }
    .case-body { padding: 2rem 1.5rem 3rem; }
    .facts-box { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.65rem 1.25rem; background: #f6f9fc; border: 1px solid #e3eaf1; border-radius: 10px; padding: 1.15rem 1.2rem; margin-bottom: 1.75rem; font-size: 0.92rem; }
    .facts-box dt { font-weight: 600; color: #1e3a5f; }
    .facts-box dd { margin: 0 0 0.5rem; color: #444; }
    .case-body p { margin-bottom: 1rem; color: #444; }
    .case-body a { color: #1e3a5f; font-weight: 600; }
    .case-body a:hover { color: #e67e22; }
    .timeline { background: #fff; border: 1px solid #e3eaf1; border-radius: 10px; padding: 1.15rem 1.2rem; margin: 1.5rem 0; }
    .timeline h2 { font-size: 1.1rem; color: #1e3a5f; margin-bottom: 0.75rem; }
    .timeline ul { margin: 0 0 0.75rem 1.1rem; }
    .timeline li { margin-bottom: 0.45rem; color: #444; }
    .timeline .note { font-size: 0.92rem; color: #555; margin: 0; }
    .cta-row { display: flex; flex-wrap: wrap; gap: 0.75rem; margin: 2rem 0 1rem; }
    .cta-primary, .cta-secondary { display: inline-block; padding: 0.75rem 1.35rem; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 0.95rem; }
    .cta-primary { background: #e67e22; color: #fff !important; }
    .cta-primary:hover { background: #d35400; }
    .cta-secondary { background: #1e3a5f; color: #fff !important; }
    .cta-secondary:hover { background: #2d5a87; }
    .disclaimer { font-size: 0.85rem; color: #666; margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #eee; }
    .footer { background: #1e3a5f; color: #fff; padding: 1.75rem 1.5rem; text-align: center; }
    .footer a { color: #fff; text-decoration: none; margin: 0 0.35rem; }
    .footer a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="language-selector">
    <select id="languageSelect" aria-label="Language">
      <option value="de">🇩🇪 Deutsch</option>
      <option value="en">🇬🇧 English</option>
      <option value="it">🇮🇹 Italiano</option>
      <option value="es">🇪🇸 Español</option>
      <option value="fr">🇫🇷 Français</option>
    </select>
  </div>
  <header class="page-hero">
    <div class="container">
      <nav class="breadcrumb" data-i18n="case_breadcrumb" aria-label="Breadcrumb"><a href="../index.html">Home</a> · <a href="../casi.html">Casi</a> · ${escapeHtml(caseRow.brand)}</nav>
      <h1 data-i18n="title">${escapeHtml(de.title)}</h1>
      <p class="subtitle" data-i18n="subtitle">${escapeHtml(de.subtitle)}</p>
    </div>
  </header>
  <main class="case-body">
    <div class="container">
      <dl class="facts-box">
        <dt data-i18n="fact_customer">${escapeHtml(de.fact_customer)}</dt><dd>${escapeHtml(caseRow.customer_name)}</dd>
        <dt data-i18n="fact_sector">${escapeHtml(de.fact_sector)}</dt><dd data-i18n="fact_sector_val">${de.fact_sector_val}</dd>
        <dt data-i18n="fact_brand">${escapeHtml(de.fact_brand)}</dt><dd>${escapeHtml(caseRow.brand)}</dd>
        <dt data-i18n="fact_part">${escapeHtml(de.fact_part)}</dt><dd><strong>${escapeHtml(caseRow.part_number)}</strong></dd>
        <dt data-i18n="fact_component">${escapeHtml(de.fact_component)}</dt><dd data-i18n="fact_component_val">${de.fact_component_val}</dd>
        <dt data-i18n="fact_destination">${escapeHtml(de.fact_destination)}</dt><dd data-i18n="fact_destination_val">${de.fact_destination_val}</dd>
      </dl>
      <p data-i18n="intro">${de.intro}</p>
      <p data-i18n="body_p1">${de.body_p1}</p>
      <p data-i18n="body_p2">${de.body_p2}</p>
      <section class="timeline">
        <h2 data-i18n="timeline_title">${escapeHtml(de.timeline_title)}</h2>
        <ul>
          <li data-i18n="timeline_li1">${de.timeline_li1}</li>
          <li data-i18n="timeline_li2">${de.timeline_li2}</li>
        </ul>
        <p class="note" data-i18n="timeline_note">${de.timeline_note}</p>
      </section>
      <p data-i18n="outro">${de.outro}</p>
      <div class="cta-row">
        <a class="cta-primary" href="${brandUrl}" data-i18n="cta_brand">${escapeHtml(de.cta_brand)}</a>
        <a class="cta-secondary" href="../index.html#contact" data-i18n="cta_contact">${escapeHtml(de.cta_contact)}</a>
      </div>
      <p class="disclaimer" data-i18n="disclaimer">${de.disclaimer}</p>
    </div>
  </main>
  <footer class="footer">
    <div class="container">
      <a href="../index.html" data-i18n="footer_home">ABCspareparts</a> ·
      <a href="../casi.html" data-i18n="footer_cases">Casi</a> ·
      <a href="../marche.html" data-i18n="footer_brands">Marche</a>
    </div>
  </footer>
  <script>
  (function () {
    var BRAND_SLUG = ${JSON.stringify(caseRow.brand_slug)};
    var translations = ${JSON.stringify(translationsPayload)};
    var hubLabels = {
      de: { case_breadcrumb: '<a href="../index.html">Home</a> · <a href="../casi.html">Lieferreferenzen</a> · ${escapeHtml(caseRow.brand)}', footer_home: 'ABCspareparts', footer_cases: 'Lieferreferenzen', footer_brands: 'Marken' },
      en: { case_breadcrumb: '<a href="../index.html">Home</a> · <a href="../casi.html">Supply cases</a> · ${escapeHtml(caseRow.brand)}', footer_home: 'ABCspareparts', footer_cases: 'Supply cases', footer_brands: 'Brands' },
      it: { case_breadcrumb: '<a href="../index.html">Home</a> · <a href="../casi.html">Casi di fornitura</a> · ${escapeHtml(caseRow.brand)}', footer_home: 'ABCspareparts', footer_cases: 'Casi di fornitura', footer_brands: 'Marche' },
      es: { case_breadcrumb: '<a href="../index.html">Home</a> · <a href="../casi.html">Casos de suministro</a> · ${escapeHtml(caseRow.brand)}', footer_home: 'ABCspareparts', footer_cases: 'Casos de suministro', footer_brands: 'Marcas' },
      fr: { case_breadcrumb: '<a href="../index.html">Accueil</a> · <a href="../casi.html">Références livraison</a> · ${escapeHtml(caseRow.brand)}', footer_home: 'ABCspareparts', footer_cases: 'Références livraison', footer_brands: 'Marques' }
    };
    var pages = ['index.html', 'marche.html', 'casi.html', 'impressum.html', 'datenschutz.html', 'agb.html', 'versand.html', 'cookies.html'];
    function isLangInternalPage(base) {
      if (pages.indexOf(base) !== -1) return true;
      if (/^marche\\/[^/]+\\.html$/i.test(base)) return true;
      if (/^casi\\/[^/]+\\.html$/i.test(base)) return true;
      return false;
    }
    function getLangFromUrl() {
      var p = new URLSearchParams(window.location.search);
      var l = p.get('lang');
      return l && ['de', 'en', 'it', 'es', 'fr'].indexOf(l) !== -1 ? l : null;
    }
    function getCurrentLang() {
      return getLangFromUrl() || (typeof localStorage !== 'undefined' && localStorage.getItem('lang')) || (navigator.language && navigator.language.split('-')[0]) || 'de';
    }
    function updateLinksWithLang(lang) {
      document.querySelectorAll('a[href]').forEach(function (a) {
        var h = a.getAttribute('href') || '';
        if (h.indexOf('#') === 0 || h.indexOf('mailto:') === 0 || h.indexOf('tel:') === 0 || h.indexOf('https://wa.me') === 0) return;
        if (h.indexOf('http://') === 0 || h.indexOf('https://') === 0) return;
        var parts = h.split('#');
        var pathNoQuery = parts[0].split('?')[0];
        var relPrefix = '';
        var base = pathNoQuery;
        if (pathNoQuery.indexOf('../') === 0) {
          var strip = 0;
          while (pathNoQuery.slice(strip, strip + 3) === '../') strip += 3;
          relPrefix = pathNoQuery.slice(0, strip);
          base = pathNoQuery.slice(strip);
        }
        if (isLangInternalPage(base)) {
          a.href = relPrefix + base + '?lang=' + lang + (parts[1] ? '#' + parts[1] : '');
        }
      });
    }
    function changeLanguage(lang) {
      var t = translations[lang] || translations.de;
      var hub = hubLabels[lang] || hubLabels.de;
      var merged = {};
      for (var k in t) merged[k] = t[k];
      for (var k2 in hub) merged[k2] = hub[k2];
      var pt = document.getElementById('pageTitle');
      var pd = document.getElementById('pageDescription');
      if (t.meta_title && pt) pt.textContent = t.meta_title;
      if (t.meta_description && pd) pd.setAttribute('content', t.meta_description);
      document.querySelectorAll('[data-i18n]').forEach(function (el) {
        var key = el.getAttribute('data-i18n');
        if (merged[key]) el.innerHTML = merged[key];
      });
      document.documentElement.lang = lang;
      try { localStorage.setItem('lang', lang); } catch (e) {}
      updateLinksWithLang(lang);
    }
    document.addEventListener('DOMContentLoaded', function () {
      var raw = getCurrentLang();
      var lang = ['de', 'en', 'it', 'es', 'fr'].indexOf(raw) !== -1 ? raw : 'de';
      var sel = document.getElementById('languageSelect');
      if (sel) sel.value = lang;
      changeLanguage(lang);
      if (sel) sel.addEventListener('change', function () { changeLanguage(this.value); });
    });
  })();
  </script>
</body>
</html>
`;
}

function buildHubPage(cases) {
  const cardsHtml = cases
    .map((c) => {
      const de = pickLang(c, 'de');
      return `      <article class="case-card">
        <p class="case-meta"><span class="case-brand">${escapeHtml(c.brand)}</span> · ${escapeHtml(c.part_number)} · ${escapeHtml(c.country_code)}</p>
        <h2><a href="casi/${escapeHtml(c.slug)}.html" data-i18n-card="${escapeHtml(c.slug)}">${escapeHtml(de.title)}</a></h2>
        <p class="case-teaser" data-i18n-teaser="${escapeHtml(c.slug)}">${de.card_teaser}</p>
        <a class="case-read" href="casi/${escapeHtml(c.slug)}.html" data-i18n="hub_read_more">Weiterlesen</a>
      </article>`;
    })
    .join('\n');

  const cardTranslations = {};
  for (const c of cases) {
    cardTranslations[c.slug] = {};
    for (const L of LANGS) {
      const t = pickLang(c, L);
      cardTranslations[c.slug][L] = { title: t.title, card_teaser: t.card_teaser };
    }
  }

  const hubI18n = {
    de: {
      meta_title: 'Lieferreferenzen & Ersatzteil-Fälle in Europa | ABCspareparts',
      meta_description: 'Echte Beschaffungsfälle: welche Ersatzteile, welche Marken, welche Lieferzeiten. Von der Anfrage bis zum Versand in Europa.',
      hub_h1: 'Lieferreferenzen',
      hub_subtitle: 'Echte Fälle aus der Beschaffung — Marke, Teilenummer und Ablauf ohne Marketing-Floskeln.',
      hub_intro: 'Hier dokumentieren wir ausgewählte Lieferungen: welcher Kunde (mit Zustimmung), welches Ersatzteil, welche Marke und wie schnell von der Anfrage bis zum Versand.',
      hub_read_more: 'Weiterlesen',
      footer_home: 'ABCspareparts',
      footer_cases: 'Lieferreferenzen',
      footer_brands: 'Marken'
    },
    en: {
      meta_title: 'Supply cases & spare part stories in Europe | ABCspareparts',
      meta_description: 'Real sourcing cases: which spare parts, which brands, which lead times — from enquiry to dispatch across Europe.',
      hub_h1: 'Supply cases',
      hub_subtitle: 'Real procurement stories — brand, part number and timeline.',
      hub_intro: 'Selected deliveries we document with the customer’s agreement: part reference, brand, and time from request to shipment.',
      hub_read_more: 'Read more',
      footer_home: 'ABCspareparts',
      footer_cases: 'Supply cases',
      footer_brands: 'Brands'
    },
    it: {
      meta_title: 'Casi di fornitura ricambi industriali in Europa | ABCspareparts',
      meta_description: 'Casi reali: quale ricambio, quale marca, quali tempi dalla richiesta alla spedizione in Europa.',
      hub_h1: 'Casi di fornitura',
      hub_subtitle: 'Storie reali di approvvigionamento — marca, codice e tempi.',
      hub_intro: 'Documentiamo forniture selezionate con il consenso del cliente: referenza, marca e tempo dalla richiesta alla spedizione.',
      hub_read_more: 'Leggi tutto',
      footer_home: 'ABCspareparts',
      footer_cases: 'Casi di fornitura',
      footer_brands: 'Marche'
    },
    es: {
      meta_title: 'Casos de suministro de recambios en Europa | ABCspareparts',
      meta_description: 'Casos reales: qué recambio, qué marca y plazos desde la consulta hasta el envío en Europa.',
      hub_h1: 'Casos de suministro',
      hub_subtitle: 'Historias reales de compra — marca, referencia y plazos.',
      hub_intro: 'Documentamos entregas seleccionadas con acuerdo del cliente: referencia, marca y tiempo hasta el envío.',
      hub_read_more: 'Leer más',
      footer_home: 'ABCspareparts',
      footer_cases: 'Casos de suministro',
      footer_brands: 'Marcas'
    },
    fr: {
      meta_title: 'Références de livraison pièces industrielles | ABCspareparts',
      meta_description: 'Cas réels : quelle pièce, quelle marque, délais de la demande à l’expédition en Europe.',
      hub_h1: 'Références livraison',
      hub_subtitle: 'Cas réels d’approvisionnement — marque, référence et délais.',
      hub_intro: 'Livraisons documentées avec l’accord du client : référence, marque et délai jusqu’à l’expédition.',
      hub_read_more: 'Lire la suite',
      footer_home: 'ABCspareparts',
      footer_cases: 'Références livraison',
      footer_brands: 'Marques'
    }
  };

  const hreflang = LANGS.map(
    (l) => `  <link rel="alternate" hreflang="${l}" href="${BASE}/casi.html?lang=${l}">`
  ).join('\n');

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title id="pageTitle">${escapeHtml(hubI18n.de.meta_title)}</title>
  <meta id="pageDescription" name="description" content="${escapeAttr(hubI18n.de.meta_description)}">
  <link rel="canonical" href="${BASE}/casi.html">
  <link rel="alternate" hreflang="x-default" href="${BASE}/casi.html">
${hreflang}
  <meta property="og:type" content="website">
  <meta property="og:url" content="${BASE}/casi.html">
  <meta property="og:title" content="${escapeAttr(hubI18n.de.meta_title)}">
  <meta property="og:description" content="${escapeAttr(hubI18n.de.meta_description)}">
  <meta property="og:image" content="${BASE}/logo.png">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.55; color: #333; }
    .container { max-width: 900px; margin: 0 auto; padding: 0 1.5rem; }
    .language-selector { position: fixed; top: 1rem; right: 1rem; z-index: 1000; }
    .language-selector select { padding: 0.5rem 2rem 0.5rem 0.75rem; font-size: 0.9rem; border: 1px solid #ddd; border-radius: 6px; background: #fff; cursor: pointer; }
    .page-header { background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); color: #fff; padding: 2.5rem 1.5rem; text-align: center; }
    .page-header h1 { font-size: 1.85rem; margin-bottom: 0.5rem; }
    .page-header p { opacity: 0.95; max-width: 640px; margin: 0 auto; }
    main { padding: 2rem 1.5rem 3rem; }
    .hub-intro { margin-bottom: 2rem; color: #444; font-size: 1rem; }
    .case-list { display: grid; gap: 1.25rem; }
    .case-card { border: 1px solid #e3eaf1; border-radius: 10px; padding: 1.25rem 1.3rem; background: #f9fbfe; }
    .case-meta { font-size: 0.82rem; color: #667; margin-bottom: 0.4rem; }
    .case-brand { font-weight: 700; color: #1e3a5f; }
    .case-card h2 { font-size: 1.12rem; margin-bottom: 0.5rem; line-height: 1.35; }
    .case-card h2 a { color: #1e3a5f; text-decoration: none; }
    .case-card h2 a:hover { color: #e67e22; }
    .case-teaser { font-size: 0.94rem; color: #444; margin-bottom: 0.75rem; }
    .case-read { font-weight: 600; color: #e67e22; text-decoration: none; font-size: 0.92rem; }
    .case-read:hover { text-decoration: underline; }
    .footer { background: #1e3a5f; color: #fff; padding: 1.75rem 1.5rem; text-align: center; }
    .footer a { color: #fff; text-decoration: none; margin: 0 0.35rem; }
  </style>
</head>
<body>
  <div class="language-selector">
    <select id="languageSelect">
      <option value="de">🇩🇪 Deutsch</option>
      <option value="en">🇬🇧 English</option>
      <option value="it">🇮🇹 Italiano</option>
      <option value="es">🇪🇸 Español</option>
      <option value="fr">🇫🇷 Français</option>
    </select>
  </div>
  <header class="page-header">
    <div class="container">
      <h1 data-i18n="hub_h1">${escapeHtml(hubI18n.de.hub_h1)}</h1>
      <p data-i18n="hub_subtitle">${escapeHtml(hubI18n.de.hub_subtitle)}</p>
    </div>
  </header>
  <main>
    <div class="container">
      <p class="hub-intro" data-i18n="hub_intro">${escapeHtml(hubI18n.de.hub_intro)}</p>
      <div class="case-list">
${cardsHtml}
      </div>
    </div>
  </main>
  <footer class="footer">
    <div class="container">
      <a href="index.html" data-i18n="footer_home">ABCspareparts</a> ·
      <a href="casi.html" data-i18n="footer_cases">Lieferreferenzen</a> ·
      <a href="marche.html" data-i18n="footer_brands">Marken</a>
    </div>
  </footer>
  <script>
  (function(){
    var translations = ${JSON.stringify(hubI18n)};
    var cardTranslations = ${JSON.stringify(cardTranslations)};
    var pages = ['index.html','marche.html','casi.html','impressum.html','datenschutz.html','agb.html','versand.html','cookies.html'];
    function isLangInternalPage(base){
      if(pages.indexOf(base)!==-1) return true;
      if(/^marche\\/[^/]+\\.html$/i.test(base)) return true;
      if(/^casi\\/[^/]+\\.html$/i.test(base)) return true;
      return false;
    }
    function getLangFromUrl(){ var p=new URLSearchParams(window.location.search); var l=p.get('lang'); return l&&['de','en','it','es','fr'].indexOf(l)!==-1?l:null; }
    function getCurrentLang(){ return getLangFromUrl()||(typeof localStorage!=='undefined'&&localStorage.getItem('lang'))||(navigator.language&&navigator.language.split('-')[0])||'de'; }
    function updateLinksWithLang(lang){
      document.querySelectorAll('a[href]').forEach(function(a){
        var h=a.getAttribute('href')||'';
        if(h.indexOf('#')===0||h.indexOf('mailto:')===0||h.indexOf('tel:')===0||h.indexOf('https://wa.me')===0||h.indexOf('http://')===0||h.indexOf('https://')===0) return;
        var parts=h.split('#'); var base=parts[0].split('?')[0];
        if(isLangInternalPage(base)) a.href=base+'?lang='+lang+(parts[1]?'#'+parts[1]:'');
      });
    }
    function changeLanguage(lang){
      var t=translations[lang]||translations.de;
      var pt=document.getElementById('pageTitle'); var pd=document.getElementById('pageDescription');
      if(t.meta_title&&pt) pt.textContent=t.meta_title;
      if(t.meta_description&&pd) pd.setAttribute('content',t.meta_description);
      document.querySelectorAll('[data-i18n]').forEach(function(el){ var k=el.getAttribute('data-i18n'); if(t[k]) el.innerHTML=t[k]; });
      document.querySelectorAll('[data-i18n-card]').forEach(function(el){
        var slug=el.getAttribute('data-i18n-card'); var row=cardTranslations[slug]; if(row&&row[lang]) el.textContent=row[lang].title;
      });
      document.querySelectorAll('[data-i18n-teaser]').forEach(function(el){
        var slug=el.getAttribute('data-i18n-teaser'); var row=cardTranslations[slug]; if(row&&row[lang]) el.textContent=row[lang].card_teaser;
      });
      document.documentElement.lang=lang;
      try{localStorage.setItem('lang',lang);}catch(e){}
      updateLinksWithLang(lang);
    }
    document.addEventListener('DOMContentLoaded',function(){
      var raw=getCurrentLang(); var lang=['de','en','it','es','fr'].indexOf(raw)!==-1?raw:'de';
      var sel=document.getElementById('languageSelect'); if(sel) sel.value=lang;
      changeLanguage(lang);
      if(sel) sel.addEventListener('change',function(){ changeLanguage(this.value); });
    });
  })();
  </script>
</body>
</html>`;
}

function writeSitemapCases(cases) {
  let body = '';
  const hubLoc = `${BASE}/casi.html`;
  body += '  <url>\n';
  body += `    <loc>${hubLoc}</loc>\n`;
  for (const l of LANGS) {
    body += `    <xhtml:link rel="alternate" hreflang="${l}" href="${hubLoc}?lang=${l}"/>\n`;
  }
  body += `    <xhtml:link rel="alternate" hreflang="x-default" href="${hubLoc}"/>\n`;
  body += `    <lastmod>${TODAY}</lastmod>\n`;
  body += '    <changefreq>weekly</changefreq>\n';
  body += '    <priority>0.75</priority>\n';
  body += '  </url>\n';

  for (const c of cases) {
    const loc = `${BASE}/casi/${c.slug}.html`;
    body += '  <url>\n';
    body += `    <loc>${loc}</loc>\n`;
    for (const l of LANGS) {
      body += `    <xhtml:link rel="alternate" hreflang="${l}" href="${loc}?lang=${l}"/>\n`;
    }
    body += `    <xhtml:link rel="alternate" hreflang="x-default" href="${loc}"/>\n`;
    body += `    <lastmod>${TODAY}</lastmod>\n`;
    body += '    <changefreq>monthly</changefreq>\n';
    body += '    <priority>0.7</priority>\n';
    body += '  </url>\n';
  }

  const xml = `---
layout: none
---
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${body}</urlset>
`;
  fs.writeFileSync(path.join(ROOT, 'sitemap-cases.xml'), xml, 'utf8');
}

function main() {
  const cases = loadCases();
  if (!cases.length) throw new Error('No published cases in supply-cases.json');

  if (!fs.existsSync(CASI_DIR)) fs.mkdirSync(CASI_DIR);

  const slugs = new Set(cases.map((c) => c.slug));
  for (const f of fs.readdirSync(CASI_DIR)) {
    if (!f.endsWith('.html')) continue;
    const slug = f.replace(/\.html$/, '');
    if (!slugs.has(slug)) {
      fs.unlinkSync(path.join(CASI_DIR, f));
      console.log('Removed stale', f);
    }
  }

  for (const c of cases) {
    const out = path.join(CASI_DIR, `${c.slug}.html`);
    fs.writeFileSync(out, buildCasePage(c), 'utf8');
    console.log('Wrote', out);
  }

  fs.writeFileSync(path.join(ROOT, 'casi.html'), buildHubPage(cases), 'utf8');
  console.log('Wrote casi.html');

  writeSitemapCases(cases);
  console.log('Wrote sitemap-cases.xml');
  console.log('Done —', cases.length, 'case page(s)');
}

main();
