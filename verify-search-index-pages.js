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

const EXCLUDED_BRANDS = ['keysight', 'keysight technologies'];

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
      encoding: 'utf8'
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
    }
  }

  if (missing.length > 0 || slugMismatch.length > 0 || dirtyCodes.length > 0 || schemaFail.length > 0) {
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
    console.error('\nRun: node generate-search-index-parts.js\n');
    process.exit(1);
  }

  console.log(`  All ${validParts.length} search links resolve to existing files!`);
  console.log('  All new pages have Organization, WebPage, BreadcrumbList, Product (no offers).\n');
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
