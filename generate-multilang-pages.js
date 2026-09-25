'use strict';

const fs = require('fs');
const path = require('path');

const { HOME_I18N } = require('./home-i18n.js');
const { FOOTER_I18N, FOOTER_CSS, buildFooterHtml } = require('./site-footer.js');
const { LEGAL_PAGES, LEGAL_COMMON } = require('./legal-i18n.js');

const BASE_URL = 'https://abcspareparts.eu';
const LANGUAGES = ['en', 'it', 'es', 'fr'];  // de is default at root
const TODAY = new Date().toISOString().slice(0, 10);

// Helper: Build hreflang links for a page
function buildHreflangLinks(dePath, enPath, itPath, esPath, frPath) {
  const links = [];
  
  // x-default points to German (main language)
  links.push(`  <link rel="alternate" hreflang="x-default" href="${BASE_URL}${dePath}">`);
  links.push(`  <link rel="alternate" hreflang="de" href="${BASE_URL}${dePath}">`);
  
  if (enPath) links.push(`  <link rel="alternate" hreflang="en" href="${BASE_URL}${enPath}">`);
  if (itPath) links.push(`  <link rel="alternate" hreflang="it" href="${BASE_URL}${itPath}">`);
  if (esPath) links.push(`  <link rel="alternate" hreflang="es" href="${BASE_URL}${esPath}">`);
  if (frPath) links.push(`  <link rel="alternate" hreflang="fr" href="${BASE_URL}${frPath}">`);
  
  return links.join('\n');
}

// Generate legal page in a specific language
function generateLegalPage(pageName, lang, outputPath) {
  const translations = LEGAL_PAGES[pageName];
  if (!translations || !translations[lang]) {
    console.warn(`No translations for ${pageName} in ${lang}`);
    return false;
  }
  
  const t = translations[lang];
  const common = LEGAL_COMMON[lang];
  
  // Build hreflang links
  const dePath = `/${pageName}.html`;
  const enPath = `/en/${pageName}.html`;
  const itPath = `/it/${pageName}.html`;
  const esPath = `/es/${pageName}.html`;
  const frPath = `/fr/${pageName}.html`;
  
  const hreflang = buildHreflangLinks(dePath, enPath, itPath, esPath, frPath);
  
  // Build canonical URL
  const canonicalUrl = lang === 'de' ? `${BASE_URL}${dePath}` : `${BASE_URL}/${lang}${dePath}`;
  
  // Build language selector dropdown
  const langSelectorOptions = [
    `<option value="../${pageName}.html" ${lang === 'de' ? 'selected' : ''}>Deutsch</option>`,
    `<option value="/en/${pageName}.html" ${lang === 'en' ? 'selected' : ''}>English</option>`,
    `<option value="/it/${pageName}.html" ${lang === 'en' ? 'selected' : ''}>Italiano</option>`,
    `<option value="/es/${pageName}.html" ${lang === 'es' ? 'selected' : ''}>Español</option>`,
    `<option value="/fr/${pageName}.html" ${lang === 'fr' ? 'selected' : ''}>Français</option>`
  ].join('\n        ');
  
  // Build page-specific content
  let sections = '';
  
  if (pageName === 'impressum') {
    sections = `
    <section>
      <h2 data-i18n="s1_title">${t.s1_title}</h2>
      <p data-i18n="s1_content">${t.s1_content}</p>
    </section>
    <section>
      <h2 data-i18n="s2_title">${t.s2_title}</h2>
      <ul data-i18n="s2_list">${t.s2_list}</ul>
    </section>
    <section>
      <h2 data-i18n="s3_title">${t.s3_title}</h2>
      <ul data-i18n="s3_list">${t.s3_list}</ul>
    </section>
    <section>
      <h2 data-i18n="s4_title">${t.s4_title}</h2>
      <p data-i18n="s4_content">${t.s4_content}</p>
      <p data-i18n="s4_note">${t.s4_note}</p>
    </section>
    <section>
      <h2 data-i18n="s5_title">${t.s5_title}</h2>
      <p data-i18n="s5_content">${t.s5_content}</p>
    </section>
    <section>
      <h2 data-i18n="s6_title">${t.s6_title}</h2>
      <p data-i18n="s6_intro">${t.s6_intro}</p>
      <p data-i18n="s6_content">${t.s6_content}</p>
    </section>
    <section>
      <h2 data-i18n="s7_title">${t.s7_title}</h2>
      <h3 data-i18n="s7a_title">${t.s7a_title}</h3>
      <p data-i18n="s7a_content">${t.s7a_content}</p>
      <h3 data-i18n="s7b_title">${t.s7b_title}</h3>
      <p data-i18n="s7b_content">${t.s7b_content}</p>
      <h3 data-i18n="s7c_title">${t.s7c_title}</h3>
      <p data-i18n="s7c_content">${t.s7c_content}</p>
      <h3 data-i18n="s7d_title">${t.s7d_title}</h3>
      <p data-i18n="s7d_content">${t.s7d_content}</p>
    </section>
    <section>
      <h2 data-i18n="s8_title">${t.s8_title}</h2>
      <p data-i18n="s8_intro">${t.s8_intro}</p>
      <p><strong data-i18n="s8_label">${t.s8_label}</strong></p>
      <p data-i18n="s8_content">${t.s8_content}</p>
    </section>`;
  } else if (pageName === 'datenschutz') {
    sections = `
    <section>
      <h2 data-i18n="s1_title">${t.s1_title}</h2>
      <p data-i18n="s1_content">${t.s1_content}</p>
      <p data-i18n="s1_contact">${t.s1_contact}</p>
      <ul data-i18n="s1_list">${t.s1_list}</ul>
    </section>
    <section>
      <h2 data-i18n="s2_title">${t.s2_title}</h2>
      <h3 data-i18n="s2a_title">${t.s2a_title}</h3>
      <p data-i18n="s2a_intro">${t.s2a_intro}</p>
      <ul data-i18n="s2a_list">${t.s2a_list}</ul>
      <p data-i18n="s2a_basis">${t.s2a_basis}</p>
      <h3 data-i18n="s2b_title">${t.s2b_title}</h3>
      <p data-i18n="s2b_content">${t.s2b_content}</p>
    </section>
    <section>
      <h2 data-i18n="s3_title">${t.s3_title}</h2>
      <h3 data-i18n="s3a_title">${t.s3a_title}</h3>
      <p data-i18n="s3a_content">${t.s3a_content}</p>
    </section>
    <section>
      <h2 data-i18n="s4_title">${t.s4_title}</h2>
      <ul data-i18n="s4_list">${t.s4_list}</ul>
      <h3 data-i18n="s4a_title">${t.s4a_title}</h3>
      <p data-i18n="s4a_content">${t.s4a_content}</p>
    </section>`;
  } else if (pageName === 'agb') {
    sections = `
    <section>
      <h2 data-i18n="s1_title">${t.s1_title}</h2>
      <p data-i18n="s1_content">${t.s1_content}</p>
      <p data-i18n="s1_seller">${t.s1_seller}</p>
    </section>
    <section>
      <h2 data-i18n="s2_title">${t.s2_title}</h2>
      <p data-i18n="s2_content">${t.s2_content}</p>
    </section>
    <section>
      <h2 data-i18n="s3_title">${t.s3_title}</h2>
      <p data-i18n="s3_content">${t.s3_content}</p>
      <p data-i18n="s3_content2">${t.s3_content2}</p>
    </section>
    <section>
      <h2 data-i18n="s4_title">${t.s4_title}</h2>
      <p data-i18n="s4_content">${t.s4_content}</p>
      <p data-i18n="s4_contact">${t.s4_contact}</p>
      <h3 data-i18n="s4_form_title">${t.s4_form_title}</h3>
      <p data-i18n="s4_form1">${t.s4_form1}</p>
      <p data-i18n="s4_form2">${t.s4_form2}</p>
      <p data-i18n="s4_form3">${t.s4_form3}</p>
      <p data-i18n="s4_form4">${t.s4_form4}</p>
      <p data-i18n="s4_form5">${t.s4_form5}</p>
    </section>
    <section>
      <h2 data-i18n="s5_title">${t.s5_title}</h2>
      <p data-i18n="s5_content">${t.s5_content}</p>
    </section>
    <section>
      <h2 data-i18n="s6_title">${t.s6_title}</h2>
      <p data-i18n="s6_content">${t.s6_content}</p>
    </section>
    <p class="updated" data-i18n="updated">${t.updated}</p>`;
  } else if (pageName === 'versand') {
    sections = `
    <section>
      <h2 data-i18n="s1_title">${t.s1_title}</h2>
      <p data-i18n="s1_content">${t.s1_content}</p>
    </section>
    <section>
      <h2 data-i18n="s2_title">${t.s2_title}</h2>
      <p data-i18n="s2_content">${t.s2_content}</p>
    </section>
    <section>
      <h2 data-i18n="s3_title">${t.s3_title}</h2>
      <p data-i18n="s3_content">${t.s3_content}</p>
    </section>
    <section>
      <h2 data-i18n="s4_title">${t.s4_title}</h2>
      <p data-i18n="s4_content">${t.s4_content}</p>
    </section>`;
  } else if (pageName === 'cookies') {
    sections = `
    <section>
      <h2 data-i18n="s1_title">${t.s1_title}</h2>
      <p data-i18n="s1_content">${t.s1_content}</p>
    </section>
    <section>
      <h2 data-i18n="s2_title">${t.s2_title}</h2>
      <p data-i18n="s2_intro">${t.s2_intro}</p>
      <ul>
        <li data-i18n="s2_li1">${t.s2_li1}</li>
        <li data-i18n="s2_li2">${t.s2_li2}</li>
      </ul>
    </section>
    <section>
      <h2 data-i18n="s3_title">${t.s3_title}</h2>
      <p data-i18n="s3_content">${t.s3_content}</p>
    </section>
    <section>
      <h2 data-i18n="s4_title">${t.s4_title}</h2>
      <p data-i18n="s4_content">${t.s4_content}</p>
    </section>
    <section>
      <h2 data-i18n="s5_title">${t.s5_title}</h2>
      <p data-i18n="s5_content">${t.s5_content}</p>
    </section>`;
  }
  
  const navPrefix = lang === 'de' ? '' : '../';
  const homeLink = lang === 'de' ? '/' : `/${lang}/`;
  
  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.h1} – ABCspareparts</title>
  <meta name="description" content="${(t.subtitle || t.h1).replace(/<[^>]+>/g, '')}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${canonicalUrl}">
  <link rel="icon" type="image/svg+xml" href="${BASE_URL}/ABC_logo4.svg">
  <link rel="apple-touch-icon" href="${BASE_URL}/logo.png">
${hreflang}
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:title" content="${t.h1} – ABCspareparts">
  <meta property="og:image" content="${BASE_URL}/logo.png">
  <style>
    ${FOOTER_CSS}
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f5f5f5; }
    .container { max-width: 900px; margin: 0 auto; padding: 1rem; }
    header { background: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.1); padding: 1rem; margin-bottom: 2rem; }
    header .container { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; }
    .logo { font-size: 1.5rem; font-weight: bold; color: #1e3a5f; text-decoration: none; }
    .lang-selector { margin-left: auto; }
    .lang-selector select { padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; background: #fff; }
    main { background: #fff; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 2rem; }
    h1 { color: #1e3a5f; margin-top: 0; }
    h2 { color: #2c5282; margin-top: 2rem; }
    h3 { color: #2c5282; margin-top: 1.5rem; }
    section { margin-bottom: 2rem; }
    ul { padding-left: 1.5rem; }
    a { color: #2c5282; }
    a:hover { color: #1e3a5f; }
    .updated { font-size: 0.9rem; color: #666; font-style: italic; margin-top: 2rem; }
    .nav-links { display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 1rem; width: 100%; }
    .nav-links a { color: #2c5282; text-decoration: none; font-size: 0.9rem; }
    .nav-links a:hover { text-decoration: underline; }
    @media (max-width: 768px) {
      .container { padding: 0.5rem; }
      main { padding: 1rem; }
      header .container { justify-content: center; }
      .lang-selector { margin: 1rem 0 0 0; }
    }
  </style>
</head>
<body>
  <header>
    <div class="container">
      <a href="${homeLink}" class="logo">ABCspareparts</a>
      <div class="lang-selector">
        <label for="langSelect" class="visually-hidden">${common.nav_home}</label>
        <select id="langSelect" onchange="if(this.value) window.location.href=this.value;">
          ${langSelectorOptions}
        </select>
      </div>
      <nav class="nav-links">
        <a href="${homeLink}" data-i18n="nav_home">${common.nav_home}</a>
        <a href="${navPrefix}marche.html" data-i18n="footer_brands">${common.footer_brands}</a>
        <a href="${navPrefix}impressum.html" data-i18n="nav_impressum">${common.nav_impressum}</a>
        <a href="${navPrefix}datenschutz.html" data-i18n="nav_datenschutz">${common.nav_datenschutz}</a>
        <a href="${navPrefix}agb.html" data-i18n="nav_agb">${common.nav_agb}</a>
        <a href="${navPrefix}versand.html" data-i18n="nav_versand">${common.nav_versand}</a>
        <a href="${navPrefix}cookies.html" data-i18n="nav_cookies">${common.nav_cookies}</a>
      </nav>
    </div>
  </header>
  <main>
    <div class="container">
      <h1 data-i18n="h1">${t.h1}</h1>
      ${t.subtitle ? `<p class="subtitle" data-i18n="subtitle">${t.subtitle}</p>` : ''}
      ${sections}
    </div>
  </main>
  ${buildFooterHtml(navPrefix, { casesHub: 'casi.html' })}
</body>
</html>`;
  
  fs.writeFileSync(outputPath, html, 'utf8');
  console.log(`✓ Generated ${outputPath}`);
  return true;
}

// Main execution
function main() {
  console.log('🌐 Generating multi-language static pages...\n');
  
  // Create language directories
  for (const lang of LANGUAGES) {
    const dir = path.join(__dirname, lang);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${lang}/`);
    }
  }
  
  // Generate legal pages for each language
  const legalPages = ['impressum', 'datenschutz', 'agb', 'versand', 'cookies'];
  
  for (const pageName of legalPages) {
    console.log(`\nGenerating ${pageName} pages:`);
    for (const lang of LANGUAGES) {
      const outputPath = path.join(__dirname, lang, `${pageName}.html`);
      generateLegalPage(pageName, lang, outputPath);
    }
  }
  
  console.log('\n✅ Multi-language legal pages generated successfully!');
  console.log('\nNext steps:');
  console.log('- Run generate-multilang-home.js to create language versions of the homepage');
  console.log('- Run generate-multilang-marche.js to create marche.html language versions');
  console.log('- Update product and case page generators to include language versions');
}

if (require.main === module) {
  main();
}

module.exports = {
  buildHreflangLinks,
  generateLegalPage
};
