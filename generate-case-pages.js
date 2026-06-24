'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const CASES_SUBDIR = 'casi';
const HUB_FILE = 'casi.html';
const LEGACY_HUB_FILE = 'casi-di-successo.html';
const LEGACY_CASES_SUBDIR = 'casi-di-successo';
const CASI_DIR = path.join(ROOT, CASES_SUBDIR);
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

function buildCaseJsonLd(caseRow, de, canonical) {
  const productName = `${caseRow.brand} ${caseRow.part_number}`;
  return {
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
        '@type': 'WebPage',
        '@id': `${canonical}#webpage`,
        url: canonical,
        name: de.title,
        description: de.meta_description,
        isPartOf: { '@id': `${BASE}/#website` },
        inLanguage: LANGS,
        breadcrumb: { '@id': `${canonical}#breadcrumb` }
      },
      {
        '@type': 'Article',
        '@id': `${canonical}#article`,
        headline: de.title,
        description: de.meta_description,
        articleSection: 'Success stories',
        datePublished: caseRow.request_date || undefined,
        dateModified: caseRow.ship_date || caseRow.request_date || undefined,
        author: { '@id': `${BASE}/#organization` },
        publisher: { '@id': `${BASE}/#organization` },
        isPartOf: { '@id': `${canonical}#webpage` },
        about: [
          { '@type': 'Brand', name: caseRow.brand },
          { '@id': `${canonical}#product` }
        ],
        inLanguage: 'de',
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonical }
      },
      {
        '@type': 'Product',
        '@id': `${canonical}#product`,
        name: productName,
        sku: caseRow.part_number,
        brand: { '@type': 'Brand', name: caseRow.brand },
        description: de.meta_description,
        category: de.fact_component_val
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonical}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE}/` },
          { '@type': 'ListItem', position: 2, name: 'Success stories', item: `${BASE}/${HUB_FILE}` },
          { '@type': 'ListItem', position: 3, name: caseRow.brand, item: canonical }
        ]
      }
    ]
  };
}

function buildHubJsonLd(cases, hubI18n) {
  return {
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
        '@type': 'CollectionPage',
        '@id': `${BASE}/${HUB_FILE}#webpage`,
        url: `${BASE}/${HUB_FILE}`,
        name: hubI18n.de.hub_h1,
        description: hubI18n.de.meta_description,
        isPartOf: { '@id': `${BASE}/#website` },
        inLanguage: LANGS,
        breadcrumb: { '@id': `${BASE}/${HUB_FILE}#breadcrumb` },
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: cases.length,
          itemListElement: cases.map((c, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: pickLang(c, 'de').title,
            url: `${BASE}/${CASES_SUBDIR}/${c.slug}.html`
          }))
        }
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${BASE}/${HUB_FILE}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE}/` },
          { '@type': 'ListItem', position: 2, name: 'Success stories', item: `${BASE}/${HUB_FILE}` }
        ]
      }
    ]
  };
}

function buildCasePage(caseRow) {
  const slug = caseRow.slug;
  const de = pickLang(caseRow, 'de');
  const canonical = `${BASE}/${CASES_SUBDIR}/${slug}.html`;
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
  <link rel="alternate" type="text/plain" href="${BASE}/llms.txt" title="Site summary for AI assistants">
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
  <script type="application/ld+json">${JSON.stringify(buildCaseJsonLd(caseRow, de, canonical))}</script>
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
      <nav class="breadcrumb" data-i18n="case_breadcrumb" aria-label="Breadcrumb"><a href="../index.html">Home</a> · <a href="../${HUB_FILE}">Casi</a> · ${escapeHtml(caseRow.brand)}</nav>
      <h1 data-i18n="title">${escapeHtml(de.title)}</h1>
      <p class="subtitle" data-i18n="subtitle">${escapeHtml(de.subtitle)}</p>
    </div>
  </header>
  <main class="case-body">
    <div class="container">
      <dl class="facts-box">
        <dt data-i18n="fact_sector">${escapeHtml(de.fact_sector)}</dt><dd data-i18n="fact_sector_val">${de.fact_sector_val}</dd>
        <dt data-i18n="fact_brand">${escapeHtml(de.fact_brand)}</dt><dd>${escapeHtml(caseRow.brand)}</dd>
        <dt data-i18n="fact_part">${escapeHtml(de.fact_part)}</dt><dd data-i18n="fact_part_val">${de.fact_part_val || '<strong>' + escapeHtml(caseRow.part_number) + '</strong>'}</dd>
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
      <a href="../${HUB_FILE}" data-i18n="footer_cases">Erfolgsgeschichten</a> ·
      <a href="../marche.html" data-i18n="footer_brands">Marche</a>
    </div>
  </footer>
  <script>
  (function () {
    var BRAND_SLUG = ${JSON.stringify(caseRow.brand_slug)};
    var translations = ${JSON.stringify(translationsPayload)};
    var hubLabels = {
      de: { case_breadcrumb: '<a href="../index.html">Home</a> · <a href="../${HUB_FILE}">Erfolgsgeschichten</a> · ${escapeHtml(caseRow.brand)}', footer_home: 'ABCspareparts', footer_cases: 'Erfolgsgeschichten', footer_brands: 'Marken' },
      en: { case_breadcrumb: '<a href="../index.html">Home</a> · <a href="../${HUB_FILE}">Success stories</a> · ${escapeHtml(caseRow.brand)}', footer_home: 'ABCspareparts', footer_cases: 'Success stories', footer_brands: 'Brands' },
      it: { case_breadcrumb: '<a href="../index.html">Home</a> · <a href="../${HUB_FILE}">Casi di successo</a> · ${escapeHtml(caseRow.brand)}', footer_home: 'ABCspareparts', footer_cases: 'Casi di successo', footer_brands: 'Marche' },
      es: { case_breadcrumb: '<a href="../index.html">Home</a> · <a href="../${HUB_FILE}">Casos de éxito</a> · ${escapeHtml(caseRow.brand)}', footer_home: 'ABCspareparts', footer_cases: 'Casos de éxito', footer_brands: 'Marcas' },
      fr: { case_breadcrumb: '<a href="../index.html">Accueil</a> · <a href="../${HUB_FILE}">Histoires de réussite</a> · ${escapeHtml(caseRow.brand)}', footer_home: 'ABCspareparts', footer_cases: 'Histoires de réussite', footer_brands: 'Marques' }
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
        <h2><a href="${CASES_SUBDIR}/${escapeHtml(c.slug)}.html" data-i18n-card="${escapeHtml(c.slug)}">${escapeHtml(de.title)}</a></h2>
        <p class="case-teaser" data-i18n-teaser="${escapeHtml(c.slug)}">${de.card_teaser}</p>
        <a class="case-read" href="${CASES_SUBDIR}/${escapeHtml(c.slug)}.html" data-i18n="hub_read_more">Weiterlesen</a>
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
      meta_title: 'Erfolgsgeschichten — Industrieersatzteile in Europa | ABCspareparts',
      meta_description: 'Echte Erfolgsfälle: Marke, Teilenummer, Branche und Lieferzeit — von der Anfrage bis zum Versand in Europa. Kunden anonymisiert.',
      hub_h1: 'Erfolgsgeschichten',
      hub_subtitle: 'Echte Lieferungen — Marke, Teilenummer und Ablauf, ohne Kundennamen.',
      hub_intro: 'Hier zeigen wir ausgewählte Erfolgsfälle: welches Ersatzteil, welche Marke, welche Branche und wie schnell von der Anfrage bis zum Versand. Kundennamen nennen wir aus Vertraulichkeitsgründen nicht.',
      hub_read_more: 'Weiterlesen',
      footer_home: 'ABCspareparts',
      footer_cases: 'Erfolgsgeschichten',
      footer_brands: 'Marken'
    },
    en: {
      meta_title: 'Success stories — industrial spare parts in Europe | ABCspareparts',
      meta_description: 'Real success stories: brand, part number, sector and lead time — from enquiry to dispatch across Europe. Customers kept anonymous.',
      hub_h1: 'Success stories',
      hub_subtitle: 'Real deliveries — brand, part number and timeline, without naming customers.',
      hub_intro: 'Selected success stories: which spare part, which brand, which industry, and how fast from request to shipment. We do not publish customer names for confidentiality.',
      hub_read_more: 'Read more',
      footer_home: 'ABCspareparts',
      footer_cases: 'Success stories',
      footer_brands: 'Brands'
    },
    it: {
      meta_title: 'Casi di successo — ricambi industriali in Europa | ABCspareparts',
      meta_description: 'Casi di successo reali: marca, codice articolo, settore e tempi dalla richiesta alla spedizione in Europa. Clienti non nominati.',
      hub_h1: 'Casi di successo',
      hub_subtitle: 'Forniture reali — marca, codice e tempi, senza nominare i clienti.',
      hub_intro: 'Documentiamo casi di successo selezionati: quale ricambio, quale marca, quale settore e quanto tempo dalla richiesta alla spedizione. I nomi dei clienti non vengono pubblicati per riservatezza.',
      hub_read_more: 'Leggi tutto',
      footer_home: 'ABCspareparts',
      footer_cases: 'Casi di successo',
      footer_brands: 'Marche'
    },
    es: {
      meta_title: 'Casos de éxito — recambios industriales en Europa | ABCspareparts',
      meta_description: 'Casos de éxito reales: marca, referencia, sector y plazos desde la consulta hasta el envío en Europa. Clientes anónimos.',
      hub_h1: 'Casos de éxito',
      hub_subtitle: 'Entregas reales — marca, referencia y plazos, sin nombrar clientes.',
      hub_intro: 'Casos de éxito seleccionados: qué recambio, qué marca, qué sector y cuánto tiempo hasta el envío. No publicamos nombres de clientes por confidencialidad.',
      hub_read_more: 'Leer más',
      footer_home: 'ABCspareparts',
      footer_cases: 'Casos de éxito',
      footer_brands: 'Marcas'
    },
    fr: {
      meta_title: 'Histoires de réussite — pièces industrielles en Europe | ABCspareparts',
      meta_description: 'Vraies histoires de réussite : marque, référence, secteur et délais de la demande à l’expédition en Europe. Clients anonymisés.',
      hub_h1: 'Histoires de réussite',
      hub_subtitle: 'Livraisons réelles — marque, référence et délais, sans nommer les clients.',
      hub_intro: 'Histoires de réussite sélectionnées : quelle pièce, quelle marque, quel secteur et délai jusqu’à l’expédition. Les noms des clients ne sont pas publiés pour confidentialité.',
      hub_read_more: 'Lire la suite',
      footer_home: 'ABCspareparts',
      footer_cases: 'Histoires de réussite',
      footer_brands: 'Marques'
    }
  };

  const hreflang = LANGS.map(
    (l) => `  <link rel="alternate" hreflang="${l}" href="${BASE}/${HUB_FILE}?lang=${l}">`
  ).join('\n');

  const hubJsonLd = buildHubJsonLd(cases, hubI18n);

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title id="pageTitle">${escapeHtml(hubI18n.de.meta_title)}</title>
  <meta id="pageDescription" name="description" content="${escapeAttr(hubI18n.de.meta_description)}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <link rel="canonical" href="${BASE}/${HUB_FILE}">
  <link rel="alternate" hreflang="x-default" href="${BASE}/${HUB_FILE}">
  <link rel="alternate" type="text/plain" href="${BASE}/llms.txt" title="Site summary for AI crawlers">
${hreflang}
  <meta property="og:type" content="website">
  <meta property="og:url" content="${BASE}/${HUB_FILE}">
  <meta property="og:title" content="${escapeAttr(hubI18n.de.meta_title)}">
  <meta property="og:description" content="${escapeAttr(hubI18n.de.meta_description)}">
  <meta property="og:image" content="${BASE}/logo.png">
  <meta property="og:site_name" content="ABCspareparts">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeAttr(hubI18n.de.meta_title)}">
  <meta name="twitter:description" content="${escapeAttr(hubI18n.de.meta_description)}">
  <meta name="twitter:image" content="${BASE}/logo.png">
  <script type="application/ld+json">${JSON.stringify(hubJsonLd)}</script>
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
      <nav class="case-list" aria-label="Success stories">
${cardsHtml}
      </nav>
    </div>
  </main>
  <footer class="footer">
    <div class="container">
      <a href="index.html" data-i18n="footer_home">ABCspareparts</a> ·
      <a href="${HUB_FILE}" data-i18n="footer_cases">Erfolgsgeschichten</a> ·
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
  const hubLoc = `${BASE}/${HUB_FILE}`;
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
    const loc = `${BASE}/${CASES_SUBDIR}/${c.slug}.html`;
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

function updateSitemapIndex() {
  const p = path.join(ROOT, 'sitemap-index.xml');
  let xml = fs.readFileSync(p, 'utf8');
  xml = xml.replace(
    /(<loc>https:\/\/abcspareparts\.eu\/sitemap-cases\.xml<\/loc>\s*<lastmod>)[^<]+(<\/lastmod>)/,
    `$1${TODAY}$2`
  );
  fs.writeFileSync(p, xml, 'utf8');
}

function updateLlmsTxt(cases) {
  const llmsPath = path.join(ROOT, 'llms.txt');
  let content = fs.readFileSync(llmsPath, 'utf8');
  const hubLine = `- [Success stories hub (casi di successo)](${BASE}/casi.html): Index of real spare-part supply success stories — brand, part number, sector and timeline; customers not named; pages in DE/EN/IT/ES/FR (?lang=).`;
  content = content.replace(/- \[Success stories[^\n]+\n/, hubLine + '\n');

  const caseLines = cases.map((c) => {
    const en = pickLang(c, 'en');
    return `- [${en.title}](${BASE}/casi/${c.slug}.html): ${en.meta_description}`;
  });
  const caseSection = `## Success story pages\n\n${caseLines.join('\n')}\n`;

  if (/## Success story pages/.test(content)) {
    content = content.replace(/## Success story pages[\s\S]*?(?=\n## )/, caseSection.trimEnd());
  } else {
    content = content.replace(/\n## Optional/, `\n${caseSection}\n## Optional`);
  }
  fs.writeFileSync(llmsPath, content, 'utf8');
}

function buildRedirectPage(targetPath) {
  const safeTarget = targetPath.replace(/'/g, "\\'");
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, follow">
  <title>Redirect…</title>
  <script>location.replace('${safeTarget}' + location.search + location.hash);</script>
</head>
<body>
  <p><a href="${targetPath}">Continue</a></p>
</body>
</html>
`;
}

function writeLegacyRedirects(cases) {
  fs.writeFileSync(path.join(ROOT, LEGACY_HUB_FILE), buildRedirectPage(HUB_FILE), 'utf8');
  console.log('Wrote', LEGACY_HUB_FILE, 'redirect →', HUB_FILE);

  const legacyCaseSlugs = new Set();
  for (const c of cases) {
    for (const oldSlug of c.legacy_slugs || []) legacyCaseSlugs.add(oldSlug);
  }

  const legacyCasesDir = path.join(ROOT, LEGACY_CASES_SUBDIR);
  if (!fs.existsSync(legacyCasesDir)) fs.mkdirSync(legacyCasesDir);
  const expectedLegacyCaseFiles = new Set();
  for (const c of cases) {
    const target = `../casi/${c.slug}.html`;
    const legacyFile = `${c.slug}.html`;
    expectedLegacyCaseFiles.add(legacyFile);
    fs.writeFileSync(path.join(legacyCasesDir, legacyFile), buildRedirectPage(target), 'utf8');
  }
  for (const f of fs.readdirSync(legacyCasesDir)) {
    if (f.endsWith('.html') && !expectedLegacyCaseFiles.has(f)) {
      fs.unlinkSync(path.join(legacyCasesDir, f));
      console.log('Removed stale', LEGACY_CASES_SUBDIR + '/' + f);
    }
  }
  console.log('Wrote', cases.length, 'redirect(s) in', LEGACY_CASES_SUBDIR + '/');

  for (const c of cases) {
    for (const oldSlug of c.legacy_slugs || []) {
      if (oldSlug === c.slug) continue;
      const target = `${c.slug}.html`;
      fs.writeFileSync(path.join(CASI_DIR, `${oldSlug}.html`), buildRedirectPage(target), 'utf8');
      console.log('Wrote casi/' + oldSlug + '.html redirect →', target);
    }
  }
}

function updateBrandCaseLinks(cases) {
  const byBrand = new Map();
  for (const c of cases) {
    if (c.brand_slug) byBrand.set(c.brand_slug, c);
  }
  const marker = 'class="brand-success-story"';
  for (const [brandSlug, caseRow] of byBrand) {
    const brandPath = path.join(ROOT, 'marche', `${brandSlug}.html`);
    if (!fs.existsSync(brandPath)) continue;
    let html = fs.readFileSync(brandPath, 'utf8');
    const caseUrl = `../casi/${caseRow.slug}.html`;
    const en = pickLang(caseRow, 'en');
    const block = `      <section ${marker} aria-label="Success story">
        <h2>Success story</h2>
        <p>Real supply case for ${escapeHtml(caseRow.brand)}: <a href="${caseUrl}">${escapeHtml(en.title)}</a> — <a href="../casi.html">all success stories</a>.</p>
      </section>
`;
    if (html.includes(marker)) {
      html = html.replace(
        new RegExp(`\\s*<section ${marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^]*?</section>\\n`),
        '\n' + block
      );
    } else {
      html = html.replace(
        '      <section class="related-brands"',
        block + '      <section class="related-brands"'
      );
    }
    fs.writeFileSync(brandPath, html, 'utf8');
    console.log('Updated brand page link:', brandSlug);
  }
}

function main() {
  const cases = loadCases();
  if (!cases.length) throw new Error('No published cases in supply-cases.json');

  const legacyCaseSlugs = new Set();
  for (const c of cases) {
    for (const oldSlug of c.legacy_slugs || []) legacyCaseSlugs.add(oldSlug);
  }

  if (!fs.existsSync(CASI_DIR)) fs.mkdirSync(CASI_DIR);

  const slugs = new Set(cases.map((c) => c.slug));
  for (const f of fs.readdirSync(CASI_DIR)) {
    if (!f.endsWith('.html')) continue;
    const slug = f.replace(/\.html$/, '');
    if (!slugs.has(slug) && !legacyCaseSlugs.has(slug)) {
      fs.unlinkSync(path.join(CASI_DIR, f));
      console.log('Removed stale', f);
    }
  }

  for (const c of cases) {
    const out = path.join(CASI_DIR, `${c.slug}.html`);
    fs.writeFileSync(out, buildCasePage(c), 'utf8');
    console.log('Wrote', out);
  }

  fs.writeFileSync(path.join(ROOT, HUB_FILE), buildHubPage(cases), 'utf8');
  console.log('Wrote', HUB_FILE);

  writeLegacyRedirects(cases);

  writeSitemapCases(cases);
  console.log('Wrote sitemap-cases.xml');

  updateSitemapIndex();
  console.log('Updated sitemap-index.xml lastmod for cases');

  updateLlmsTxt(cases);
  console.log('Updated llms.txt success story pages');

  updateBrandCaseLinks(cases);

  console.log('Done —', cases.length, 'case page(s)');
}

main();
