'use strict';

/**
 * Smoke-check for full Siemens listino /parts/ publication.
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const BASE = 'https://abcspareparts.eu';
const errors = [];

function fail(msg) {
  errors.push(msg);
}

const manifestPath = path.join(ROOT, 'parts-siemens-listino-manifest.json');
if (!fs.existsSync(manifestPath)) fail('parts-siemens-listino-manifest.json missing');
const man = fs.existsSync(manifestPath)
  ? JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  : {};

if ((man.pages_written || 0) < 50000) {
  fail(`expected >=50000 listino pages written, got ${man.pages_written}`);
}

const katalog = path.join(ROOT, 'parts/siemens/katalog.html');
if (!fs.existsSync(katalog)) fail('parts/siemens/katalog.html missing');

// Prefer listino-only pages (MVP overlaps keep the richer non-listino template).
const sampleSlugs = ['1fe1041-6wu10-4bw2', '1fe1041-6wu30-8bw2', '1fe1042-6wn10-4bw2'];
for (const slug of sampleSlugs) {
  const f = path.join(ROOT, 'parts/siemens', `${slug}.html`);
  if (!fs.existsSync(f)) {
    fail(`sample page missing: ${slug}.html`);
    continue;
  }
  const html = fs.readFileSync(f, 'utf8');
  if (!html.includes('rel="canonical"')) fail(`${slug}: missing canonical`);
  if (!/index,\s*follow/i.test(html)) fail(`${slug}: missing index,follow`);
  if (/\?part=/.test(html)) fail(`${slug}: contains ?part=`);
  if (!html.includes('"@type":"Product"')) fail(`${slug}: missing Product JSON-LD`);
  if (!html.includes('id="languageSelect"') && !html.includes('data-set-lang=')) {
    fail(`${slug}: missing language switcher`);
  }
  if (!html.includes('part-i18n.js')) fail(`${slug}: missing shared i18n script`);
  if (!html.includes('class="legal-header"')) fail(`${slug}: missing site legal-header`);
  if (!html.includes('class="footer"')) fail(`${slug}: missing site footer`);
  if (!html.includes('ABCspareparts') || !html.includes('class="logo"')) {
    fail(`${slug}: missing logo header`);
  }
  if (!/data-i18n="lead"|data-i18n="h1"/.test(html)) fail(`${slug}: missing i18n content hooks`);
  if (!html.includes('Serie') && !html.includes('series_label')) fail(`${slug}: missing series context`);
}
if (!fs.existsSync(path.join(ROOT, 'parts/siemens/part-i18n.js'))) {
  fail('parts/siemens/part-i18n.js missing');
}

const descStorePath = path.join(ROOT, 'siemens-part-descriptions.json');
if (!fs.existsSync(descStorePath)) {
  fail('siemens-part-descriptions.json missing');
} else {
  const store = JSON.parse(fs.readFileSync(descStorePath, 'utf8'));
  const n = Object.keys(store.parts || {}).length;
  if (n < 20) fail(`siemens-part-descriptions.json too small (${n})`);
  // Listino-only pages (not MVP overlap) should embed partDesc from online research.
  const candidates = [
    '3su1000-0aa20-0aa0',
    '3su1000-0aa30-0aa0',
    '3rt2015-1ad01',
    '3rt2015-1ad02',
    '6es7131-6bf01-2aa0',
    '1fk7032-2af21-1bg1',
    '6sl3000-0be21-6aa0',
    '8mf1000-2ab01'
  ];
  let foundEnriched = 0;
  for (const slug of candidates) {
    const f = path.join(ROOT, 'parts/siemens', `${slug}.html`);
    if (!fs.existsSync(f)) continue;
    const html = fs.readFileSync(f, 'utf8');
    if (/partDesc/.test(html) && /Produktbeschreibung|Product description/i.test(html)) {
      foundEnriched += 1;
    }
  }
  if (foundEnriched < 2) {
    fail(`expected >=2 listino pages with online partDesc payload, got ${foundEnriched}`);
  }
  if (n < 300) fail(`siemens-part-descriptions.json expected >=300 after batch4, got ${n}`);
}

const brand = fs.readFileSync(path.join(ROOT, 'marche/siemens.html'), 'utf8');
if (!brand.includes('siemensCatalogIndex') && !brand.includes('parts/siemens/katalog.html')) {
  fail('marche/siemens.html missing catalog hub link');
}

const indexXml = fs.readFileSync(path.join(ROOT, 'sitemap-index.xml'), 'utf8');
const shards = man.sitemap_files || [];
if (!shards.length) fail('manifest sitemap_files empty');
for (const f of shards) {
  if (!indexXml.includes(`/${f}`)) fail(`sitemap-index missing ${f}`);
  if (!fs.existsSync(path.join(ROOT, f))) fail(`missing shard file ${f}`);
  const xml = fs.readFileSync(path.join(ROOT, f), 'utf8');
  if (/\?part=/.test(xml)) fail(`${f} contains ?part=`);
  const locs = (xml.match(/<loc>/g) || []).length;
  if (locs < 1 || locs > 45000) fail(`${f} loc count ${locs} out of range`);
}

const pageCount = fs
  .readdirSync(path.join(ROOT, 'parts/siemens'))
  .filter((n) => n.endsWith('.html') && n !== 'katalog.html').length;
if (pageCount + 5 < (man.pages_written || 0)) {
  fail(`parts/siemens html count ${pageCount} << pages_written ${man.pages_written}`);
}

if (errors.length) {
  console.error('verify-siemens-listino: FAILED');
  for (const e of errors) console.error(' -', e);
  process.exit(1);
}

console.log(
  `verify-siemens-listino: OK — ${man.pages_written} pages, ${shards.length} sitemaps, catalog hub live`
);
