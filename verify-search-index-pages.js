#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

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

function slugifyCode(code) {
  return String(code || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/\+/g, ' plus ')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')
    .toLowerCase();
}

function verifyPages() {
  console.log('Verifying all search index codes have pages...\n');
  
  if (!fs.existsSync(SEARCH_INDEX_PATH)) {
    throw new Error('search-index.json not found');
  }
  
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
  
  for (const part of validParts) {
    const codeSlug = slugifyCode(part.c);
    const filePath = path.join(PARTS_DIR, part.s, `${codeSlug}.html`);
    
    if (!fs.existsSync(filePath)) {
      missing.push({
        code: part.c,
        brand: part.b,
        slug: part.s,
        expectedPath: `parts/${part.s}/${codeSlug}.html`
      });
    }
  }
  
  if (missing.length > 0) {
    console.error(`\nFAILED: ${missing.length} indexed codes missing pages!\n`);
    for (const item of missing.slice(0, 10)) {
      console.error(`  - ${item.brand} ${item.code} -> ${item.expectedPath}`);
    }
    if (missing.length > 10) {
      console.error(`  ... and ${missing.length - 10} more\n`);
    }
    console.error('\nRun: node generate-search-index-parts.js\n');
    process.exit(1);
  }
  
  console.log(`  All ${validParts.length} indexed codes have pages!\n`);
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
