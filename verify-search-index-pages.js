#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const {
  slugifyPartCode,
  findExistingPartPage,
  resetCatalog
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

  for (const part of validParts) {
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
  }

  if (missing.length > 0 || slugMismatch.length > 0) {
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
    console.error('\nRun: node generate-search-index-parts.js\n');
    process.exit(1);
  }

  console.log(`  All ${validParts.length} search links resolve to existing files!\n`);
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
