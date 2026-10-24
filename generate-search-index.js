#!/usr/bin/env node
'use strict';

/**
 * Generate compact search index for part codes and brands
 * 
 * This script:
 * 1. Reads erp-items.json and brand-order-parts.json
 * 2. Extracts all part codes with their brand info
 * 3. Excludes unbranded items and EXCLUDED_BRANDS
 * 4. Generates a compact JSON index: /search-index.json
 * 
 * Output format:
 * {
 *   "generated": "2026-10-23",
 *   "parts": [
 *     { "c": "1SDA038324R0001", "b": "ABB", "s": "abb" },
 *     ...
 *   ]
 * }
 * 
 * Keys are short to minimize file size:
 * - c: part code
 * - b: brand name
 * - s: brand slug
 */

const fs = require('fs');
const path = require('path');

const EXCLUDED_BRANDS = [
  'keysight',
  'keysight technologies'
];

const ROOT = __dirname;
const OUTPUT_PATH = path.join(ROOT, 'search-index.json');

function normalizeForComparison(str) {
  return str.toLowerCase().replace(/[\s\-\/\.]/g, '');
}

function isExcludedBrand(brandName) {
  const normalized = normalizeForComparison(brandName || '');
  return EXCLUDED_BRANDS.some(excluded => 
    normalizeForComparison(excluded) === normalized
  );
}

function loadErpItems() {
  const erpPath = path.join(ROOT, 'erp-items.json');
  if (!fs.existsSync(erpPath)) {
    console.warn('⚠️  erp-items.json not found');
    return [];
  }
  
  try {
    const data = JSON.parse(fs.readFileSync(erpPath, 'utf8'));
    return data.brands || [];
  } catch (e) {
    console.error('Error reading erp-items.json:', e.message);
    return [];
  }
}

function loadBrandOrderParts() {
  const bopPath = path.join(ROOT, 'brand-order-parts.json');
  if (!fs.existsSync(bopPath)) {
    console.warn('⚠️  brand-order-parts.json not found');
    return [];
  }
  
  try {
    const data = JSON.parse(fs.readFileSync(bopPath, 'utf8'));
    return data.brands || [];
  } catch (e) {
    console.error('Error reading brand-order-parts.json:', e.message);
    return [];
  }
}

function generateSearchIndex() {
  console.log('🔍 Generating search index...\n');
  
  const erpBrands = loadErpItems();
  const bopBrands = loadBrandOrderParts();
  
  // Merge brands from both sources
  const brandMap = new Map();
  
  for (const brandData of [...erpBrands, ...bopBrands]) {
    const brandName = brandData.brand;
    const brandSlug = brandData.brand_slug;
    const parts = brandData.parts || [];
    
    // Skip if no brand name or excluded
    if (!brandName || !brandSlug) continue;
    if (isExcludedBrand(brandName)) {
      console.log(`  ⊗ Excluding brand: ${brandName}`);
      continue;
    }
    
    if (!brandMap.has(brandSlug)) {
      brandMap.set(brandSlug, {
        name: brandName,
        slug: brandSlug,
        partCodes: new Set()
      });
    }
    
    const brand = brandMap.get(brandSlug);
    
    // Add part codes
    for (const part of parts) {
      const partNumber = part.part_number || part.code;
      if (partNumber && typeof partNumber === 'string' && partNumber.trim()) {
        brand.partCodes.add(partNumber.trim());
      }
    }
  }
  
  console.log(`  ✓ Processed ${brandMap.size} brands\n`);
  
  // Build compact index
  const partsIndex = [];
  let totalParts = 0;
  
  for (const brand of brandMap.values()) {
    for (const code of brand.partCodes) {
      partsIndex.push({
        c: code,
        b: brand.name,
        s: brand.slug
      });
      totalParts++;
    }
  }
  
  // Sort by part code for consistent output
  partsIndex.sort((a, b) => a.c.localeCompare(b.c));
  
  const index = {
    generated: new Date().toISOString().slice(0, 10),
    count: totalParts,
    parts: partsIndex
  };
  
  // Write to file
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(index, null, 0), 'utf8');
  
  const stats = fs.statSync(OUTPUT_PATH);
  const sizeKB = (stats.size / 1024).toFixed(1);
  
  console.log(`  ✓ Generated search-index.json`);
  console.log(`  ✓ ${totalParts} part codes from ${brandMap.size} brands`);
  console.log(`  ✓ File size: ${sizeKB} KB\n`);
  
  return { totalParts, totalBrands: brandMap.size, sizeKB };
}

if (require.main === module) {
  try {
    generateSearchIndex();
    console.log('✅ Search index generated successfully\n');
  } catch (e) {
    console.error('❌ Error generating search index:', e.message);
    console.error(e.stack);
    process.exit(1);
  }
}

module.exports = { generateSearchIndex };
