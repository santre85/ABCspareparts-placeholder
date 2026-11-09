'use strict';

const fs = require('fs');
const path = require('path');
const { FOOTER_CSS, FOOTER_I18N, buildFooterHtml } = require('./site-footer.js');
const { ICON_LINKS, hreflangLinksForAlternates } = require('./seo-config.js');
const {
  PAGE_FILE,
  HOW_IT_WORKS_I18N,
  pagePath,
  homePath,
  contactPath,
  marchePath
} = require('./how-it-works-i18n.js');

const BASE = 'https://abcspareparts.eu';
const LANGS = ['de', 'en', 'it', 'es', 'fr'];
const TODAY = new Date().toISOString().slice(0, 10);
const TITLE_MAX = 70;
const META_MIN = 120;
const META_MAX = 160;

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function assertSeoLimits(lang, t) {
  const titleLen = t.meta_title.length;
  const descLen = t.meta_description.length;
  if (titleLen > TITLE_MAX) {
    throw new Error(`${lang} title is ${titleLen} chars (max ${TITLE_MAX}): ${t.meta_title}`);
  }
  if (descLen < META_MIN || descLen > META_MAX) {
    throw new Error(`${lang} meta description is ${descLen} chars (need ${META_MIN}-${META_MAX})`);
  }
}

function buildJsonLd(lang, t, canonical, home) {
  const faqItems = [];
  for (let i = 1; i <= 8; i++) {
    faqItems.push({
      '@type': 'Question',
      name: t[`faq_q${i}`],
      acceptedAnswer: { '@type': 'Answer', text: t[`faq_a${i}`] }
    });
  }
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@id': `${BASE}/#organization`,
        '@type': 'Organization',
        name: 'ABCspareparts',
        url: `${BASE}/`,
        logo: { '@type': 'ImageObject', url: `${BASE}/logo.png` },
        description: 'MRO industrial spare parts distributor. 11975+ brands. 24h quotes, Europe-wide delivery.',
        email: 'info@abcspareparts.eu',
        telephone: '+49-152-22466077',
        sameAs: ['https://www.linkedin.com/company/abcspareparts'],
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Äussere Uferstrasse 16',
          postalCode: '86154',
          addressLocality: 'Augsburg',
          addressCountry: 'DE'
        }
      },
      {
        '@type': 'WebPage',
        '@id': `${canonical}#webpage`,
        url: canonical,
        name: t.meta_title,
        description: t.meta_description,
        inLanguage: lang,
        isPartOf: { '@id': `${BASE}/#website` },
        about: { '@id': `${BASE}/#organization` },
        publisher: { '@id': `${BASE}/#organization` },
        dateModified: TODAY,
        primaryImageOfPage: { '@type': 'ImageObject', url: `${BASE}/logo.png` },
        mainEntity: [{ '@id': `${canonical}#howto` }, { '@id': `${canonical}#faq` }]
      },
      {
        '@type': 'HowTo',
        '@id': `${canonical}#howto`,
        name: t.howto_name,
        description: t.howto_description,
        inLanguage: lang,
        step: [1, 2, 3, 4].map((n) => ({
          '@type': 'HowToStep',
          position: n,
          name: t[`step${n}_name`],
          text: t[`step${n}_text`],
          url: `${canonical}#step-${n}`
        }))
      },
      {
        '@type': 'FAQPage',
        '@id': `${canonical}#faq`,
        inLanguage: lang,
        mainEntity: faqItems
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonical}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE}${home}` },
          { '@type': 'ListItem', position: 2, name: t.nav_how, item: canonical }
        ]
      }
    ]
  };
  return JSON.stringify(graph);
}

function langSelector(current) {
  const labels = {
    de: '🇩🇪 Deutsch',
    en: '🇬🇧 English',
    it: '🇮🇹 Italiano',
    es: '🇪🇸 Español',
    fr: '🇫🇷 Français'
  };
  return LANGS.map(
    (lang) =>
      `<option value="${pagePath(lang)}"${lang === current ? ' selected' : ''}>${labels[lang]}</option>`
  ).join('\n          ');
}

function buildPage(lang) {
  const t = HOW_IT_WORKS_I18N[lang];
  assertSeoLimits(lang, t);
  const canonical = `${BASE}${pagePath(lang)}`;
  const home = homePath(lang);
  const contact = contactPath(lang);
  const marche = marchePath(lang);
  const hreflang = hreflangLinksForAlternates({
    de: `${BASE}${pagePath('de')}`,
    en: `${BASE}${pagePath('en')}`,
    it: `${BASE}${pagePath('it')}`,
    es: `${BASE}${pagePath('es')}`,
    fr: `${BASE}${pagePath('fr')}`
  });
  const footer = buildFooterHtml(lang === 'de' ? '' : '/', {
    lang,
    casesHub: 'casi.html',
    contactHref: contactPath(lang)
  });
  const faqHtml = [1, 2, 3, 4, 5, 6, 7, 8]
    .map(
      (n) => `        <div class="faq-item">
          <h3>${esc(t[`faq_q${n}`])}</h3>
          <p>${esc(t[`faq_a${n}`])}</p>
        </div>`
    )
    .join('\n');
  const stepsHtml = [1, 2, 3, 4]
    .map(
      (n) => `        <li class="step-card" id="step-${n}">
          <span class="step-num">${n}</span>
          <div>
            <h3>${esc(t[`step${n}_name`])}</h3>
            <p>${esc(t[`step${n}_text`])}</p>
          </div>
        </li>`
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(t.meta_title)}</title>
  <meta name="description" content="${esc(t.meta_description)}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <link rel="canonical" href="${canonical}">
  ${ICON_LINKS}
  <link rel="alternate" type="text/plain" href="${BASE}/llms.txt" title="Site summary for AI assistants">
  ${hreflang}
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonical}">
  <meta property="og:title" content="${esc(t.meta_title)}">
  <meta property="og:description" content="${esc(t.meta_description)}">
  <meta property="og:image" content="${BASE}/logo.png">
  <meta property="og:image:width" content="760">
  <meta property="og:image:height" content="200">
  <meta property="og:site_name" content="ABCspareparts">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(t.meta_title)}">
  <meta name="twitter:description" content="${esc(t.meta_description)}">
  <meta name="twitter:image" content="${BASE}/logo.png">
  <script type="application/ld+json">${buildJsonLd(lang, t, canonical, home)}</script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; min-height: 100vh; display: flex; flex-direction: column; }
    .container { max-width: 820px; margin: 0 auto; padding: 0 1.5rem; }
    .legal-header { background: #1e3a5f; color: #fff; padding: 1rem 0; position: sticky; top: 0; z-index: 100; }
    .legal-header .container { display: flex; align-items: center; gap: 1rem; position: relative; padding-right: 9.5rem; }
    .legal-header .logo { font-size: 1.5rem; font-weight: 700; color: #fff; text-decoration: none; }
    .legal-header .logo:hover { opacity: 0.9; }
    .legal-nav { display: flex; gap: 0.85rem; flex-wrap: wrap; align-items: center; }
    .legal-nav a { color: rgba(255,255,255,0.9); text-decoration: none; font-size: 0.9rem; }
    .legal-nav a:hover { color: #fff; text-decoration: underline; }
    .legal-nav a[aria-current="page"] { color: #fff; font-weight: 700; text-decoration: underline; }
    .language-selector { position: absolute; right: 1.5rem; top: 50%; transform: translateY(-50%); }
    .language-selector select { padding: 0.5rem 2rem 0.5rem 0.75rem; font-size: 0.9rem; border: 1px solid #ddd; border-radius: 6px; background: #fff; cursor: pointer; }
    @media (max-width: 640px) {
      .legal-header .container { padding-right: 1.5rem; padding-top: 0.25rem; }
      .language-selector { position: static; transform: none; margin-left: auto; }
    }
    .page-hero { background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); color: #fff; padding: 2.5rem 0 2rem; }
    .breadcrumb { font-size: 0.9rem; opacity: 0.95; margin-bottom: 1rem; }
    .breadcrumb a { color: #e67e22; text-decoration: none; font-weight: 600; }
    .breadcrumb a:hover { text-decoration: underline; }
    .page-hero h1 { font-size: clamp(1.35rem, 4vw, 2rem); line-height: 1.3; margin-bottom: 0.75rem; }
    .direct-answer { max-width: none; font-size: 1.05rem; opacity: 0.95; }
    main { flex: 1; padding: 2rem 0 3rem; }
    main h2 { font-size: 1.25rem; color: #1e3a5f; margin: 0 0 0.85rem; }
    main h3 { font-size: 1.02rem; color: #1e3a5f; margin: 0 0 0.35rem; }
    main p { margin-bottom: 0.85rem; color: #444; }
    main ul { margin: 0 0 1rem 1.25rem; }
    main li { margin-bottom: 0.4rem; color: #444; }
    section { margin-bottom: 2.25rem; }
    .steps { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.85rem; }
    .step-card { display: flex; gap: 0.9rem; align-items: flex-start; padding: 1rem 1.05rem; border: 1px solid #e3eaf1; border-radius: 10px; background: #f6f9fc; }
    .step-num { flex: 0 0 2rem; width: 2rem; height: 2rem; border-radius: 50%; background: #e67e22; color: #fff; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; margin-top: 0.1rem; }
    .step-card p { margin: 0; font-size: 0.95rem; }
    .need-note, .time-note { font-size: 0.95rem; color: #555; }
    .brand-faq { margin: 0 0 2rem; padding: 1.2rem 1.15rem; border: 1px solid #e3eaf1; border-radius: 10px; background: #f6f9fc; }
    .brand-faq .faq-item { margin-bottom: 0.95rem; }
    .brand-faq .faq-item:last-child { margin-bottom: 0; }
    .brand-faq p { margin: 0; font-size: 0.92rem; }
    .cta-box { padding: 1.35rem 1.3rem; border-radius: 12px; background: #fff8f0; border: 1px solid #f0d3b5; text-align: left; }
    .cta-button { display: inline-block; padding: 0.9rem 2rem; background: #e67e22; color: #fff !important; text-decoration: none; border-radius: 8px; font-weight: 600; }
    .cta-button:hover { background: #d35400; }
    .visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }
${FOOTER_CSS}
  </style>
</head>
<body>
  <header class="legal-header">
    <div class="container">
      <a href="${home}" class="logo">ABCspareparts</a>
      <nav class="legal-nav">
        <a href="${home}" data-i18n="nav_home">${esc(t.nav_home)}</a>
        <a href="${marche}" data-i18n="footer_brands">${esc(FOOTER_I18N[lang].footer_brands)}</a>
        <a href="${pagePath(lang)}" aria-current="page" data-i18n="footer_how">${esc(t.nav_how)}</a>
        <a href="/casi.html" data-i18n="footer_cases">${esc(FOOTER_I18N[lang].footer_cases)}</a>
        <a href="${contact}" data-i18n="footer_contact">${esc(FOOTER_I18N[lang].footer_contact)}</a>
      </nav>
      <div class="language-selector">
        <label for="languageSelect" class="visually-hidden">Language</label>
        <select id="languageSelect" onchange="if(this.value) window.location.href=this.value;">
          ${langSelector(lang)}
        </select>
      </div>
    </div>
  </header>
  <header class="page-hero">
    <div class="container">
      <nav class="breadcrumb" aria-label="Breadcrumb">${t.breadcrumb}</nav>
      <h1>${esc(t.h1)}</h1>
      <p class="direct-answer">${esc(t.direct_answer)}</p>
    </div>
  </header>
  <main>
    <div class="container">
      <section aria-labelledby="steps-heading">
        <h2 id="steps-heading">${esc(t.steps_title)}</h2>
        <ol class="steps">
${stepsHtml}
        </ol>
      </section>
      <section aria-labelledby="need-heading">
        <h2 id="need-heading">${esc(t.need_title)}</h2>
        <p>${esc(t.need_intro)}</p>
        <ul>
          <li>${esc(t.need_li1)}</li>
          <li>${esc(t.need_li2)}</li>
          <li>${esc(t.need_li3)}</li>
          <li>${esc(t.need_li4)}</li>
        </ul>
        <p class="need-note">${esc(t.need_note)}</p>
      </section>
      <section aria-labelledby="brands-heading">
        <h2 id="brands-heading">${esc(t.brands_title)}</h2>
        <p>${esc(t.brands_p1)}</p>
        <p>${esc(t.brands_p2)}</p>
        <p><a href="${marche}">${esc(t.brands_link)}</a></p>
      </section>
      <section aria-labelledby="time-heading">
        <h2 id="time-heading">${esc(t.time_title)}</h2>
        <p>${esc(t.time_p1)}</p>
        <p class="time-note">${esc(t.time_p2)}</p>
      </section>
      <section class="brand-faq" id="faq" aria-labelledby="faq-heading">
        <h2 id="faq-heading">${esc(t.faq_title)}</h2>
${faqHtml}
      </section>
      <section class="cta-box" aria-labelledby="cta-heading">
        <h2 id="cta-heading">${esc(t.cta_title)}</h2>
        <p>${esc(t.cta_text)}</p>
        <a class="cta-button" href="${contact}">${esc(t.cta_button)}</a>
      </section>
    </div>
  </main>
  ${footer}
</body>
</html>
`;
}

function howItWorksSitemapBlock() {
  const alts = LANGS.map(
    (lang) =>
      `    <xhtml:link rel="alternate" hreflang="${lang}" href="${BASE}${pagePath(lang)}"/>`
  ).join('\n');
  const xDefault = `    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE}${pagePath('de')}"/>`;
  return LANGS.map((lang, i) => {
    const loc = `${BASE}${pagePath(lang)}`;
    const label = lang === 'de' ? 'How it works – German (default)' : `How it works – ${lang.toUpperCase()}`;
    const priority = lang === 'de' ? '0.8' : '0.7';
    return `  <!-- ${label} -->
  <url>
    <loc>${loc}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${priority}</priority>
${alts}
${xDefault}
  </url>`;
  }).join('\n');
}

function updateMainSitemap() {
  const p = path.join(__dirname, 'sitemap.xml');
  let xml = fs.readFileSync(p, 'utf8');
  xml = xml.replace(/<lastmod>[^<]+<\/lastmod>/g, `<lastmod>${TODAY}</lastmod>`);
  if (!xml.includes(`/${PAGE_FILE}`)) {
    xml = xml.replace('</urlset>', `${howItWorksSitemapBlock()}\n</urlset>`);
  }
  fs.writeFileSync(p, xml, 'utf8');
  console.log('✓ sitemap.xml includes how-it-works URLs, lastmod', TODAY);
}

function updateSitemapIndexLastmod() {
  const p = path.join(__dirname, 'sitemap-index.xml');
  let xml = fs.readFileSync(p, 'utf8');
  xml = xml.replace(/<lastmod>[^<]+<\/lastmod>/g, `<lastmod>${TODAY}</lastmod>`);
  fs.writeFileSync(p, xml, 'utf8');
  console.log('✓ sitemap-index.xml lastmod', TODAY);
}

function updateLlmsTxt() {
  const p = path.join(__dirname, 'llms.txt');
  let txt = fs.readFileSync(p, 'utf8');
  const block = [
    `- [How ABCspareparts works (German)](${BASE}/so-funktioniert-es.html): Direct answer for AI assistants and searchers — send part number and manufacturer, quote often within 24 hours, order, delivery in Europe. 11975+ brands, industrial and MRO spare parts. Non-binding enquiry form on the home page.`,
    `- [How ABCspareparts works (English)](${BASE}/en/so-funktioniert-es.html): English version of the how-it-works page.`,
    `- [How ABCspareparts works (Italian)](${BASE}/it/so-funktioniert-es.html): Italian version of the how-it-works page.`,
    `- [How ABCspareparts works (Spanish)](${BASE}/es/so-funktioniert-es.html): Spanish version of the how-it-works page.`,
    `- [How ABCspareparts works (French)](${BASE}/fr/so-funktioniert-es.html): French version of the how-it-works page.`
  ].join('\n');
  if (!txt.includes('so-funktioniert-es.html')) {
    txt = txt.replace(
      '- [Example: Siemens brand page]',
      `${block}\n- [Example: Siemens brand page]`
    );
    fs.writeFileSync(p, txt, 'utf8');
    console.log('✓ llms.txt Main Pages updated');
  } else {
    console.log('✓ llms.txt already lists how-it-works pages');
  }
}

function writePages() {
  for (const lang of LANGS) {
    const html = buildPage(lang);
    const outDir = lang === 'de' ? __dirname : path.join(__dirname, lang);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, PAGE_FILE);
    fs.writeFileSync(outPath, html, 'utf8');
    console.log(`✓ ${path.relative(__dirname, outPath)} title=${HOW_IT_WORKS_I18N[lang].meta_title.length} desc=${HOW_IT_WORKS_I18N[lang].meta_description.length}`);
  }
  updateMainSitemap();
  updateSitemapIndexLastmod();
  updateLlmsTxt();
}

if (require.main === module) {
  writePages();
}

module.exports = { writePages, PAGE_FILE, LANGS };
