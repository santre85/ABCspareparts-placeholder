'use strict';

const fs = require('fs');
const path = require('path');
const { assignUniqueSlugs } = require('./brand-slug.js');

const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const match = indexHtml.match(/const brands = (\[[\s\S]*?\];\s*\n)/);
if (!match) throw new Error('brands array not found in index.html');
const brands = eval(match[1].replace(/\];\s*\n?$/, ']'));
const rows = assignUniqueSlugs(brands);
const marcheDir = path.join(__dirname, 'marche');
const htmlFiles = fs.readdirSync(marcheDir).filter((f) => f.endsWith('.html'));

if (htmlFiles.length !== brands.length) {
  throw new Error(`marche/*.html count ${htmlFiles.length} !== brands ${brands.length}`);
}

const slugSet = new Set(rows.map((r) => r.slug + '.html'));
for (const f of htmlFiles) {
  if (!slugSet.has(f)) throw new Error(`Unexpected file in marche/: ${f}`);
}

// Brand pages must not use site-root-relative href without ../ (would 404 from marche/)
const wrong = /href="(index|marche|impressum|datenschutz|agb|versand|cookies)\.html"/;
const toCheck = [...new Set(['abb.html', 'siemens.html', '3m.html', ...htmlFiles.slice(0, 3), ...htmlFiles.slice(-3)])];
for (const f of toCheck) {
  if (!htmlFiles.includes(f)) continue;
  const content = fs.readFileSync(path.join(marcheDir, f), 'utf8');
  if (wrong.test(content)) {
    throw new Error(`Wrong href (missing ../) in marche/${f}`);
  }
  if (!content.includes('href="../index.html"')) {
    throw new Error(`Missing ../index.html link in marche/${f}`);
  }
}

const sb = fs.readFileSync(path.join(__dirname, 'sitemap-brands.xml'), 'utf8');
const urlCount = (sb.match(/<loc>/g) || []).length;
if (urlCount !== brands.length) {
  throw new Error(`sitemap-brands.xml <loc> count ${urlCount} !== brands ${brands.length}`);
}
if (!sb.includes('<?xml version="1.0"')) throw new Error('sitemap-brands.xml missing xml header');
if (!sb.includes('</urlset>')) throw new Error('sitemap-brands.xml missing urlset close');

console.log('verify-build: OK —', brands.length, 'brands,', htmlFiles.length, 'HTML pages,', urlCount, 'sitemap URLs');
