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

const sampleSlugs = ['3su1000-0aa10-0aa0', '1fk7032-2af21-1ba0', '6es7131-4bd01-0aa0'];
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
