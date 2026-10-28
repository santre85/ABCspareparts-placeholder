#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const {
  slugifyPartCode,
  findExistingPartPage,
  resetCatalog,
  sanitizePartCode
} = require('./part-page-paths.js');

const ROOT = __dirname;
const SEARCH_INDEX_PATH = path.join(ROOT, 'search-index.json');
const PARTS_DIR = path.join(ROOT, 'parts');

const EXCLUDED_BRANDS = [
  'keysight',
  'keysight technologies',
  'keysight-technologies',
  'markem',
  'markem imaje',
  'markem-imaje'
];

function normalizeForComparison(str) {
  return (str || '').toLowerCase().replace(/[\s\-\/\.]/g, '');
}

function isExcludedBrand(brandName) {
  const normalized = normalizeForComparison(brandName || '');
  return EXCLUDED_BRANDS.some(excluded =>
    normalizeForComparison(excluded) === normalized
  );
}

function loadMainPartsSet() {
  try {
    const out = execFileSync('git', ['ls-tree', '-r', '--name-only', 'origin/main', '--', 'parts'], {
      cwd: ROOT,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024
    });
    return new Set(out.split('\n').filter(Boolean));
  } catch {
    return new Set();
  }
}

function graphTypes(html) {
  const types = new Set();
  let hasOffers = false;
  const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(html))) {
    try {
      const json = JSON.parse(m[1]);
      const nodes = json['@graph'] || (Array.isArray(json) ? json : [json]);
      for (const node of nodes) {
        if (!node || !node['@type']) continue;
        const t = node['@type'];
        if (Array.isArray(t)) t.forEach((x) => types.add(x));
        else types.add(t);
        if (node.offers) hasOffers = true;
      }
    } catch {
      /* ignore */
    }
  }
  return { types, hasOffers };
}

const META_CLOSING = 'Unverbindliche Anfrage bei ABCspareparts – keine Preise auf der Seite.';
const META_CLOSING_NODESC = 'unverbindliche Anfrage bei ABCspareparts. Verfügbarkeit und Konditionen nach Prüfung.';

function extractMetaDescriptions(html) {
  const out = {};
  const name = html.match(/<meta name="description" content="([^"]*)"/);
  const og = html.match(/<meta property="og:description" content="([^"]*)"/);
  const tw = html.match(/<meta name="twitter:description" content="([^"]*)"/);
  if (name) out.meta = name[1];
  if (og) out.og = og[1];
  if (tw) out.twitter = tw[1];
  return out;
}

function decodeAttr(s) {
  return String(s || '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function metaDescriptionIssue(text) {
  const t = decodeAttr(text).trim();
  if (!t) return 'empty';
  if (t.length > 160) return `too long (${t.length})`;
  if (/Unverbindliche Anfrage bei ABCspareparts/.test(t) && !t.includes(META_CLOSING)) {
    return 'closing sentence cut';
  }
  if (
    /unverbindliche Anfrage bei ABCspareparts/.test(t) &&
    !t.includes(META_CLOSING_NODESC) &&
    !t.includes(META_CLOSING)
  ) {
    return 'closing sentence cut';
  }
  if (/[A-Za-zÄÖÜäöüß]$/.test(t)) return 'ends mid-word';
  return null;
}

function searchLinkFilename(part) {
  if (part.p) {
    return String(part.p).endsWith('.html') ? part.p : `${part.p}.html`;
  }
  return `${slugifyPartCode(part.c)}.html`;
}

function verifyPages() {
  console.log('Verifying all search index codes have pages...\n');

  if (!fs.existsSync(SEARCH_INDEX_PATH)) {
    throw new Error('search-index.json not found');
  }

  resetCatalog();
  const searchIndex = JSON.parse(fs.readFileSync(SEARCH_INDEX_PATH, 'utf8'));
  const parts = searchIndex.parts || [];

  console.log(`  Total codes in index: ${parts.length}`);

  const validParts = parts.filter(part => {
    if (!part.b || !part.s || !part.c) return false;
    if (isExcludedBrand(part.b)) return false;
    return true;
  });

  console.log(`  Valid codes: ${validParts.length}\n`);

  const missing = [];
  const slugMismatch = [];
  const dirtyCodes = [];
  const schemaFail = [];
  const metaFail = [];
  const requiredTypes = ['Organization', 'WebPage', 'BreadcrumbList', 'Product'];
  const mainParts = loadMainPartsSet();

  for (const part of validParts) {
    if (part.c !== sanitizePartCode(part.c) || /[\u00AD\u200B\u200C\u200D\uFEFF]/.test(part.c)) {
      dirtyCodes.push(part.c);
    }
    const filename = searchLinkFilename(part);
    const filePath = path.join(PARTS_DIR, part.s, filename);
    const expectedPath = `parts/${part.s}/${filename}`;

    if (!fs.existsSync(filePath)) {
      const existing = findExistingPartPage(part.s, part.c);
      missing.push({
        code: part.c,
        brand: part.b,
        slug: part.s,
        expectedPath,
        existing: existing ? `parts/${part.s}/${existing}` : null
      });
      continue;
    }

    const existing = findExistingPartPage(part.s, part.c);
    if (existing && existing !== filename) {
      slugMismatch.push({
        code: part.c,
        brand: part.b,
        linked: expectedPath,
        actual: `parts/${part.s}/${existing}`
      });
    }

    if (!mainParts.has(expectedPath)) {
      const html = fs.readFileSync(filePath, 'utf8');
      const { types, hasOffers } = graphTypes(html);
      const absent = requiredTypes.filter((t) => !types.has(t));
      if (absent.length || hasOffers) {
        schemaFail.push({
          path: expectedPath,
          absent,
          hasOffers
        });
      }
      const metas = extractMetaDescriptions(html);
      for (const [kind, value] of Object.entries(metas)) {
        const issue = metaDescriptionIssue(value);
        if (issue) {
          metaFail.push({ path: expectedPath, kind, issue, value });
        }
      }
    }
  }

  if (missing.length > 0 || slugMismatch.length > 0 || dirtyCodes.length > 0 || schemaFail.length > 0 || metaFail.length > 0) {
    if (missing.length > 0) {
      console.error(`\nFAILED: ${missing.length} search links do not resolve to a file!\n`);
      for (const item of missing.slice(0, 10)) {
        const hint = item.existing ? ` (existing file: ${item.existing})` : '';
        console.error(`  - ${item.brand} ${item.code} -> ${item.expectedPath}${hint}`);
      }
      if (missing.length > 10) {
        console.error(`  ... and ${missing.length - 10} more\n`);
      }
    }
    if (slugMismatch.length > 0) {
      console.error(`\nFAILED: ${slugMismatch.length} search links point at the wrong slug!\n`);
      for (const item of slugMismatch.slice(0, 10)) {
        console.error(`  - ${item.brand} ${item.code}: link ${item.linked} but file is ${item.actual}`);
      }
    }
    if (dirtyCodes.length > 0) {
      console.error(`\nFAILED: ${dirtyCodes.length} search-index codes still contain invisible characters!\n`);
      for (const code of dirtyCodes.slice(0, 5)) {
        console.error(`  - ${JSON.stringify(code)}`);
      }
    }
    if (schemaFail.length > 0) {
      console.error(`\nFAILED: ${schemaFail.length} new pages missing JSON-LD types or have offers!\n`);
      for (const item of schemaFail.slice(0, 10)) {
        console.error(`  - ${item.path}: missing ${item.absent.join(', ') || '—'} offers=${item.hasOffers}`);
      }
    }
    if (metaFail.length > 0) {
      console.error(`\nFAILED: ${metaFail.length} new-page meta descriptions are too long or cut mid-word!\n`);
      for (const item of metaFail.slice(0, 10)) {
        console.error(`  - ${item.path} ${item.kind}: ${item.issue} — ${item.value.slice(-40)}`);
      }
    }
    console.error('\nRun: node generate-search-index-parts.js\n');
    process.exit(1);
  }

  console.log(`  All ${validParts.length} search links resolve to existing files!`);
  console.log('  All new pages have Organization, WebPage, BreadcrumbList, Product (no offers).');
  console.log('  All new-page meta/og/twitter descriptions are ≤160 chars and complete.\n');
  return { total: validParts.length, missing: 0 };
}

if (require.main === module) {
  try {
    verifyPages();
    console.log('Verification passed!\n');
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

module.exports = { verifyPages };
