'use strict';

const fs = require('fs');
const path = require('path');
const { FOOTER_I18N, howItWorksHref } = require('./site-footer.js');

const ROOT = __dirname;

function insertAfterBrandsLink(html, href, label) {
  if (html.includes('data-i18n="footer_how"')) return html;
  const re =
    /(<a href="[^"]*" data-i18n="footer_brands">[^<]*<\/a>\s*<span class="separator">\|<\/span>)/;
  if (!re.test(html)) return null;
  return html.replace(
    re,
    `$1\n        <a href="${href}" data-i18n="footer_how">${label}</a>\n        <span class="separator">|</span>`
  );
}

function insertNavAfterBrands(html, href, label) {
  if (/legal-nav[\s\S]*data-i18n="footer_how"/.test(html) || /nav-links[\s\S]{0,400}data-i18n="footer_how"/.test(html)) {
    return html;
  }
  const re = /(<nav class="(?:legal-nav|nav-links)">[\s\S]*?<a href="[^"]*" data-i18n="footer_brands">[^<]*<\/a>)/;
  if (!re.test(html)) return html;
  return html.replace(re, `$1\n        <a href="${href}" data-i18n="footer_how">${label}</a>`);
}

function insertI18nKey(html) {
  let out = html;
  for (const lang of ['de', 'en', 'it', 'es', 'fr']) {
    const brands = FOOTER_I18N[lang].footer_brands;
    const how = FOOTER_I18N[lang].footer_how;
    const needle = `footer_brands: "${brands}",`;
    const insert = `footer_brands: "${brands}",\n      footer_how: "${how}",`;
    if (out.includes(`footer_how: "${how}"`)) continue;
    if (out.includes(needle)) out = out.split(needle).join(insert);
  }
  return out;
}

const jobs = [
  { file: 'index.html', lang: 'de' },
  { file: 'en/index.html', lang: 'en' },
  { file: 'it/index.html', lang: 'it' },
  { file: 'es/index.html', lang: 'es' },
  { file: 'fr/index.html', lang: 'fr' },
  { file: 'marche.html', lang: 'de' },
  { file: 'en/marche.html', lang: 'en' },
  { file: 'it/marche.html', lang: 'it' },
  { file: 'es/marche.html', lang: 'es' },
  { file: 'fr/marche.html', lang: 'fr' },
  { file: 'casi.html', lang: 'de' },
  { file: 'impressum.html', lang: 'de' },
  { file: 'datenschutz.html', lang: 'de' },
  { file: 'agb.html', lang: 'de' },
  { file: 'versand.html', lang: 'de' },
  { file: 'cookies.html', lang: 'de' }
];

for (const lang of ['en', 'it', 'es', 'fr']) {
  for (const page of ['impressum.html', 'datenschutz.html', 'agb.html', 'versand.html', 'cookies.html']) {
    jobs.push({ file: `${lang}/${page}`, lang });
  }
}

let changed = 0;
for (const job of jobs) {
  const p = path.join(ROOT, job.file);
  if (!fs.existsSync(p)) {
    console.warn('skip missing', job.file);
    continue;
  }
  let html = fs.readFileSync(p, 'utf8');
  const href = howItWorksHref(job.lang);
  const label = FOOTER_I18N[job.lang].footer_how;
  const before = html;
  const inserted = insertAfterBrandsLink(html, href, label);
  if (inserted == null) {
    console.warn('no footer_brands match', job.file);
  } else {
    html = inserted;
  }
  html = insertNavAfterBrands(html, href, label);
  html = insertI18nKey(html);
  if (html !== before) {
    fs.writeFileSync(p, html, 'utf8');
    changed++;
    console.log('✓ patched', job.file);
  } else {
    console.log('· unchanged', job.file);
  }
}
console.log('Patched', changed, 'files');
