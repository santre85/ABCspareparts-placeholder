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

const siPath = path.join(__dirname, 'sitemap-index.xml');
if (!fs.existsSync(siPath)) throw new Error('sitemap-index.xml missing');
const si = fs.readFileSync(siPath, 'utf8');
if (!si.includes('<sitemapindex')) throw new Error('sitemap-index.xml missing sitemapindex root');
if (!si.includes('/sitemap.xml')) throw new Error('sitemap-index.xml missing sitemap.xml reference');
if (!si.includes('/sitemap-brands.xml')) throw new Error('sitemap-index.xml missing sitemap-brands.xml reference');
if (!si.includes('/sitemap-cases.xml')) throw new Error('sitemap-index.xml missing sitemap-cases.xml reference');

const casesPath = path.join(__dirname, 'supply-cases.json');
if (!fs.existsSync(casesPath)) throw new Error('supply-cases.json missing');
const casesData = JSON.parse(fs.readFileSync(casesPath, 'utf8'));
const publishedCases = (casesData.cases || []).filter((c) => c.published !== false);
const scPath = path.join(__dirname, 'sitemap-cases.xml');
if (!fs.existsSync(scPath)) throw new Error('sitemap-cases.xml missing — run npm run build:casi');
const sc = fs.readFileSync(scPath, 'utf8');
const caseUrlCount = (sc.match(/<loc>/g) || []).length;
if (caseUrlCount !== publishedCases.length + 1) {
  throw new Error(`sitemap-cases.xml <loc> count ${caseUrlCount} !== hub + ${publishedCases.length} cases`);
}
for (const c of publishedCases) {
  const caseFile = path.join(__dirname, 'casi', `${c.slug}.html`);
  if (!fs.existsSync(caseFile)) throw new Error(`Missing generated case page: casi/${c.slug}.html`);
}
if (!fs.existsSync(path.join(__dirname, 'casi.html'))) throw new Error('casi.html missing — run npm run build:casi');

const casiHtml = fs.readFileSync(path.join(__dirname, 'casi.html'), 'utf8');
if (!casiHtml.includes('rel="canonical" href="https://abcspareparts.eu/casi.html"')) {
  throw new Error('casi.html canonical URL is missing or incorrect');
}
if (!casiHtml.includes('name="robots" content="index, follow')) {
  throw new Error('casi.html is missing indexable robots meta');
}
if (!casiHtml.includes('application/ld+json')) {
  throw new Error('casi.html is missing JSON-LD');
}
if (!casiHtml.includes('"@type":"CollectionPage"') || !casiHtml.includes('"@type":"ItemList"')) {
  throw new Error('casi.html is missing CollectionPage/ItemList JSON-LD');
}
if (!casiHtml.includes('rel="alternate" type="text/plain" href="https://abcspareparts.eu/llms.txt"')) {
  throw new Error('casi.html is missing llms.txt discovery link');
}

for (const c of publishedCases) {
  const html = fs.readFileSync(path.join(__dirname, 'casi', `${c.slug}.html`), 'utf8');
  if (!html.includes('name="robots" content="index, follow')) {
    throw new Error(`Case page ${c.slug}.html is missing indexable robots meta`);
  }
  if (!html.includes('application/ld+json')) {
    throw new Error(`Case page ${c.slug}.html is missing JSON-LD`);
  }
  if (!html.includes('"@type":"Article"') || !html.includes('"@type":"Product"')) {
    throw new Error(`Case page ${c.slug}.html is missing Article/Product JSON-LD`);
  }
  if (!html.includes('rel="canonical"')) {
    throw new Error(`Case page ${c.slug}.html is missing canonical URL`);
  }
  if (!html.includes('rel="alternate" type="text/plain" href="https://abcspareparts.eu/llms.txt"')) {
    throw new Error(`Case page ${c.slug}.html is missing llms.txt discovery link`);
  }
}

const llmsTxt = fs.readFileSync(path.join(__dirname, 'llms.txt'), 'utf8');
if (!llmsTxt.includes('casi.html')) {
  throw new Error('llms.txt does not mention casi.html');
}
if (!llmsTxt.includes('## Success story pages')) {
  throw new Error('llms.txt is missing Success story pages section');
}
for (const c of publishedCases) {
  if (!llmsTxt.includes(`casi/${c.slug}.html`)) {
    throw new Error(`llms.txt does not mention case page casi/${c.slug}.html`);
  }
}

const robotsTxt = fs.readFileSync(path.join(__dirname, 'robots.txt'), 'utf8');
if (!robotsTxt.includes('Sitemap: https://abcspareparts.eu/sitemap-cases.xml')) {
  throw new Error('robots.txt is missing sitemap-cases.xml reference');
}

const indexHead = indexHtml;
if (!indexHtml.includes('rel="alternate" type="text/plain" href="llms.txt"')) {
  throw new Error('index.html is missing llms.txt discovery link');
}
if (!indexHtml.includes('"@type": "CollectionPage"') && !indexHtml.includes('"@type":"CollectionPage"')) {
  throw new Error('index.html is missing CollectionPage JSON-LD for success stories');
}
if (/2600\+/.test(indexHead)) {
  throw new Error('index.html still contains outdated 2600+ SEO text');
}
if (!indexHead.includes('11960+')) {
  throw new Error('index.html missing updated 11960+ SEO marker');
}

for (const f of toCheck) {
  if (!htmlFiles.includes(f)) continue;
  const content = fs.readFileSync(path.join(marcheDir, f), 'utf8');
  if (!content.includes('<link rel="canonical" href="https://abcspareparts.eu/marche/')) {
    throw new Error(`Missing canonical in marche/${f}`);
  }
  if (!content.includes('hreflang="x-default"')) {
    throw new Error(`Missing x-default hreflang in marche/${f}`);
  }
  if (!content.includes('data-i18n="related_title"')) {
    throw new Error(`Missing related brands SEO block in marche/${f}`);
  }
}

console.log('verify-build: OK —', brands.length, 'brands,', htmlFiles.length, 'HTML pages,', urlCount, 'sitemap URLs + SEO checks');
