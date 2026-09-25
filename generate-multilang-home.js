'use strict';

const fs = require('fs');
const path = require('path');
const { HOME_I18N } = require('./home-i18n.js');
const { FOOTER_I18N } = require('./site-footer.js');
const { buildHreflangLinks } = require('./generate-multilang-pages.js');

const BASE_URL = 'https://abcspareparts.eu';
const LANGUAGES = ['en', 'it', 'es', 'fr'];

// Merge footer translations into home translations
const FULL_I18N = {};
for (const lang of ['de', ...LANGUAGES]) {
  FULL_I18N[lang] = { ...HOME_I18N[lang], ...FOOTER_I18N[lang] };
}

function generateHomePageForLang(lang) {
  console.log(`\nGenerating homepage for ${lang}...`);
  
  // Read the German homepage
  const deHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  
  const t = FULL_I18N[lang];
  
  // Build hreflang links
  const hreflang = buildHreflangLinks('/', '/en/', '/it/', '/es/', '/fr/');
  
  // Build canonical URL
  const canonicalUrl = lang === 'de' ? `${BASE_URL}/` : `${BASE_URL}/${lang}/`;
  
  // Start with the German HTML
  let html = deHtml;
  
  // Update lang attribute
  html = html.replace(/<html lang="de">/, `<html lang="${lang}">`);
  
  // Update title and meta description
  html = html.replace(
    /<title[^>]*>.*?<\/title>/i,
    `<title id="pageTitle">${t.seo_title}</title>`
  );
  html = html.replace(
    /<meta id="pageDescription" name="description" content="[^"]*">/i,
    `<meta id="pageDescription" name="description" content="${t.seo_description}">`
  );
  
  // Update canonical
  html = html.replace(
    /<link rel="canonical" href="[^"]*">/,
    `<link rel="canonical" href="${canonicalUrl}">`
  );
  
  // Replace hreflang section
  const hreflangRegex = /<!-- hreflang:.*?-->\s*<link rel="alternate" hreflang="x-default"[^>]*>[\s\S]*?(<link rel="alternate"[^>]*>[\s\S]*?(?=\n  <!--|\n  <meta property="og:type"))/;
  html = html.replace(
    hreflangRegex,
    `<!-- hreflang: primary language (de) + language alternates -->\n${hreflang}`
  );
  
  // Update Open Graph locale
  html = html.replace(
    /<meta property="og:locale" id="ogLocale" content="[^"]*">/,
    `<meta property="og:locale" id="ogLocale" content="${t.og_locale}">`
  );
  
  // Update og:url
  html = html.replace(
    /<meta property="og:url" content="https:\/\/abcspareparts\.eu\/">/,
    `<meta property="og:url" content="${canonicalUrl}">`
  );
  
  // Update og:title
  html = html.replace(
    /<meta property="og:title" id="ogTitle" content="[^"]*">/,
    `<meta property="og:title" id="ogTitle" content="${t.seo_title}">`
  );
  
  // Update og:description
  html = html.replace(
    /<meta property="og:description" id="ogDescription" content="[^"]*">/,
    `<meta property="og:description" id="ogDescription" content="${t.seo_description}">`
  );
  
  // Replace all data-i18n text content
  // This regex finds elements with data-i18n and replaces their content
  html = html.replace(
    /<([a-z0-9]+)([^>]*data-i18n="([^"]+)"[^>]*)>([^<]*)<\/\1>/gi,
    (match, tag, attrs, key, oldContent) => {
      const newContent = t[key] || oldContent;
      return `<${tag}${attrs}>${newContent}</${tag}>`;
    }
  );
  
  // Handle data-i18n-placeholder for inputs
  html = html.replace(
    /<input([^>]*data-i18n-placeholder="([^"]+)"[^>]*)>/gi,
    (match, attrs, key) => {
      const placeholder = t[key] || '';
      // Remove old placeholder and add new one
      let newAttrs = attrs.replace(/placeholder="[^"]*"/, '');
      newAttrs = newAttrs.replace(new RegExp(`data-i18n-placeholder="${key}"`), `placeholder="${placeholder}" data-i18n-placeholder="${key}"`);
      return `<input${newAttrs}>`;
    }
  );
  
  // Fix ALL relative paths to root-absolute for language subdirectories
  if (lang !== 'de') {
    // Fix logo image path and alt text
    const logoAltTexts = {
      en: 'ABCspareparts – Industrial spare parts and MRO',
      it: 'ABCspareparts – Ricambi industriali e MRO',
      es: 'ABCspareparts – Repuestos industriales y MRO',
      fr: 'ABCspareparts – Pièces détachées industrielles et MRO'
    };
    html = html.replace(
      /<img src="ABC_logo4\.svg" alt="[^"]*">/g,
      `<img src="/ABC_logo4.svg" alt="${logoAltTexts[lang]}">`
    );
    
    // Fix all relative hrefs to root-absolute
    html = html.replace(/href="marche\.html"/g, 'href="/marche.html"');
    html = html.replace(/href="casi\.html"/g, 'href="/casi.html"');
    html = html.replace(/href="impressum\.html"/g, 'href="/impressum.html"');
    html = html.replace(/href="datenschutz\.html"/g, 'href="/datenschutz.html"');
    html = html.replace(/href="agb\.html"/g, 'href="/agb.html"');
    html = html.replace(/href="versand\.html"/g, 'href="/versand.html"');
    html = html.replace(/href="cookies\.html"/g, 'href="/cookies.html"');
    html = html.replace(/href="llms\.txt"/g, 'href="/llms.txt"');
    
    // Fix brand links in navigation and JS - make them root-absolute
    html = html.replace(/href="marche\//g, 'href="/marche/');
    
    // Fix JS that builds brand URLs relatively
    html = html.replace(
      /'marche\/' \+ r\.slug \+ '\.html'/g,
      "'/marche/' + r.slug + '.html'"
    );
    
    // Keep anchor links working - these stay relative
    // (already correct: href="/#contact" -> href="/#contact")
  }
  
  // Update the language selector script to use static URLs instead of localStorage
  // Find the language selector related JavaScript and update it
  const langSelectorScript = `
  // Language selector (static URLs)
  document.addEventListener('DOMContentLoaded', function() {
    const langLinks = {
      de: '/',
      en: '/en/',
      it: '/it/',
      es: '/es/',
      fr: '/fr/'
    };
    
    // Disable the client-side translation
    window.disableI18n = true;
    
    // Set language links for language selector
    const langBtns = document.querySelectorAll('[data-lang]');
    langBtns.forEach(btn => {
      const targetLang = btn.getAttribute('data-lang');
      if (langLinks[targetLang]) {
        btn.href = langLinks[targetLang];
      }
    });
  });`;
  
  // Insert the language selector script before the closing body tag
  html = html.replace(
    /<\/body>/,
    `<script>${langSelectorScript}</script>\n</body>`
  );
  
  // Write the file
  const outputPath = lang === 'de' 
    ? path.join(__dirname, 'index.html')
    : path.join(__dirname, lang, 'index.html');
  
  fs.writeFileSync(outputPath, html, 'utf8');
  console.log(`✓ Generated ${outputPath}`);
  
  return true;
}

function main() {
  console.log('🏠 Generating multi-language homepage versions...\n');
  
  // Ensure language directories exist
  for (const lang of LANGUAGES) {
    const dir = path.join(__dirname, lang);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
  
  // Generate homepage for each language (except de which is already at root)
  for (const lang of LANGUAGES) {
    generateHomePageForLang(lang);
  }
  
  console.log('\n✅ Multi-language homepages generated successfully!');
}

if (require.main === module) {
  main();
}

module.exports = {
  generateHomePageForLang
};
