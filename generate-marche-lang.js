'use strict';

const fs = require('fs');
const path = require('path');
const { MARCHE_I18N } = require('./marche-i18n.js');
const { FOOTER_I18N } = require('./site-footer.js');

function generateMarcheForLang(lang) {
  console.log(`Generating marche.html for ${lang}...`);
  const deHtml = fs.readFileSync('marche.html', 'utf8');
  const t = MARCHE_I18N[lang];
  const ft = FOOTER_I18N[lang];
  
  let html = deHtml;
  
  // Update lang attribute
  html = html.replace(/<html lang="de">/, `<html lang="${lang}">`);
  
  // Update canonical
  html = html.replace(
    /<link rel="canonical" href="https:\/\/abcspareparts\.eu\/marche\.html">/,
    `<link rel="canonical" href="https://abcspareparts.eu/${lang}/marche.html">`
  );
  
  // Update content
  html = html.replace(/<title>.*?<\/title>/, `<title>${t.page_title}</title>`);
  html = html.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${t.page_description}">`);
  html = html.replace(/<h1 data-i18n="marche_h1">.*?<\/h1>/, `<h1 data-i18n="marche_h1">${t.marche_h1}</h1>`);
  html = html.replace(/<p data-i18n="marche_subtitle">.*?<\/p>/, `<p data-i18n="marche_subtitle">${t.marche_subtitle}</p>`);
  html = html.replace(/<h2 data-i18n="marche_list_title">.*?<\/h2>/, `<h2 data-i18n="marche_list_title">${t.marche_list_title}</h2>`);
  html = html.replace(/<p class="letters-title letters-title-inline" data-i18n="marche_letters_title">.*?<\/p>/, `<p class="letters-title letters-title-inline" data-i18n="marche_letters_title">${t.marche_letters_title}</p>`);
  html = html.replace(/<label for="brandSearchInput" data-i18n="marche_search_label">.*?<\/label>/, `<label for="brandSearchInput" data-i18n="marche_search_label">${t.marche_search_label}</label>`);
  html = html.replace(/<button type="submit" data-i18n="marche_search_button">.*?<\/button>/, `<button type="submit" data-i18n="marche_search_button">${t.marche_search_button}</button>`);
  
  // Update footer links to root-absolute paths
  html = html.replace(/<a href="marche\.html" data-i18n="footer_brands">.*?<\/a>/, `<a href="/marche.html" data-i18n="footer_brands">${ft.footer_brands}</a>`);
  html = html.replace(/<a href="casi\.html" data-i18n="footer_cases">.*?<\/a>/, `<a href="/casi.html" data-i18n="footer_cases">${ft.footer_cases}</a>`);
  html = html.replace(/<a href="\/#contact" data-i18n="footer_contact">.*?<\/a>/, `<a href="/#contact" data-i18n="footer_contact">${ft.footer_contact}</a>`);
  html = html.replace(/<a href="impressum\.html"([^>]*)data-i18n="footer_imprint">.*?<\/a>/, `<a href="/impressum.html"$1data-i18n="footer_imprint">${ft.footer_imprint}</a>`);
  html = html.replace(/<a href="datenschutz\.html"([^>]*)data-i18n="footer_privacy">.*?<\/a>/, `<a href="/datenschutz.html"$1data-i18n="footer_privacy">${ft.footer_privacy}</a>`);
  html = html.replace(/<a href="agb\.html"([^>]*)data-i18n="footer_terms">.*?<\/a>/, `<a href="/agb.html"$1data-i18n="footer_terms">${ft.footer_terms}</a>`);
  html = html.replace(/<a href="versand\.html"([^>]*)data-i18n="footer_shipping">.*?<\/a>/, `<a href="/versand.html"$1data-i18n="footer_shipping">${ft.footer_shipping}</a>`);
  html = html.replace(/<a href="cookies\.html"([^>]*)data-i18n="footer_cookies">.*?<\/a>/, `<a href="/cookies.html"$1data-i18n="footer_cookies">${ft.footer_cookies}</a>`);
  
  // Write file
  const outputPath = path.join(__dirname, lang, 'marche.html');
  fs.writeFileSync(outputPath, html, 'utf8');
  console.log(`✓ Generated ${outputPath}`);
}

// Generate for EN and IT (main languages)
generateMarcheForLang('en');
generateMarcheForLang('it');
console.log('\n✅ Marche pages generated!');
