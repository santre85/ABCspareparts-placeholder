#!/usr/bin/env node
'use strict';

/**
 * Merge ERPNext items into brand-order-parts.json for specific brand(s).
 * 
 * Usage: node merge-erp-brand-parts.js <brand-slug>
 * Example: node merge-erp-brand-parts.js hydac
 * 
 * Designed to be re-runnable nightly from a fetched ERPNext export.
 */

const fs = require('fs');
const path = require('path');
const {
  writeSitemapBrandParts,
  writeSitemapPartCodes,
  writeSitemapListinoShards,
  writeSitemapIndex,
  updateRobotsTxt,
  updateLlmsTxt
} = require('./build-brand-parts.js');

const ROOT = __dirname;

/**
 * Brands permanently excluded from ERP merge.
 * These brands will never be merged, even if they appear in erp-items.json.
 * Match is case-insensitive against brand slug.
 */
const EXCLUDED_BRANDS = [
  'keysight',
  'keysight-technologies',
  'keysight technologies',
  'markem',
  'markem-imaje',
  'markem imaje'
];

function normalizeExcludedKey(str) {
  return String(str || '').toLowerCase().replace(/[\s\-\/\.]/g, '');
}

function isExcludedBrand(brandSlug) {
  const normalized = normalizeExcludedKey(brandSlug);
  return EXCLUDED_BRANDS.some((ex) => normalizeExcludedKey(ex) === normalized);
}

function normalizePart(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
}

function mergePartLists(existingParts, newParts) {
  const byKey = new Map();
  
  // Add existing parts first
  for (const part of existingParts) {
    const key = normalizePart(part.part_number);
    if (!byKey.has(key)) {
      byKey.set(key, { ...part });
    }
  }
  
  // Merge new parts
  for (const part of newParts) {
    const key = normalizePart(part.part_number);
    
    if (!byKey.has(key)) {
      // New part, add it
      byKey.set(key, { ...part });
    } else {
      // Existing part, prefer longer description if not same as part number
      const existing = byKey.get(key);
      if (part.description !== part.part_number && 
          part.description.length > existing.description.length) {
        existing.description = part.description;
      }
      // Keep case_slug if it exists
      if (part.case_slug && !existing.case_slug) {
        existing.case_slug = part.case_slug;
      }
    }
  }
  
  return [...byKey.values()].sort((a, b) => 
    a.part_number.localeCompare(b.part_number, undefined, { sensitivity: 'base' })
  );
}

function loadBrandOrderParts() {
  const path_file = path.join(ROOT, 'brand-order-parts.json');
  if (!fs.existsSync(path_file)) {
    return {
      source: 'manual',
      generated: new Date().toISOString().slice(0, 10),
      listini_files: 0,
      brands: []
    };
  }
  return JSON.parse(fs.readFileSync(path_file, 'utf8'));
}

function loadErpItems() {
  const path_file = path.join(ROOT, 'erp-items.json');
  if (!fs.existsSync(path_file)) {
    throw new Error('erp-items.json not found. Run: node import-erp-items.js <tsv-path>');
  }
  return JSON.parse(fs.readFileSync(path_file, 'utf8'));
}

function mergeBrandData(targetSlug, orderData, erpData) {
  // Find existing brand data
  let brandIndex = orderData.brands.findIndex(b => b.brand_slug === targetSlug);
  let brandData;
  
  if (brandIndex < 0) {
    // Brand not in brand-order-parts, need to find from erp-items
    const erpBrand = erpData.brands.find(b => b.brand_slug === targetSlug);
    if (!erpBrand) {
      throw new Error(`Brand ${targetSlug} not found in erp-items.json`);
    }
    
    // Create new brand entry
    brandData = {
      brand: erpBrand.brand,
      brand_slug: targetSlug,
      parts: []
    };
    orderData.brands.push(brandData);
    brandIndex = orderData.brands.length - 1;
  } else {
    brandData = orderData.brands[brandIndex];
  }
  
  // Find ERP parts for this brand
  const erpBrand = erpData.brands.find(b => b.brand_slug === targetSlug);
  const erpParts = erpBrand ? erpBrand.parts : [];
  
  // Merge parts
  const existingParts = brandData.parts || [];
  brandData.parts = mergePartLists(existingParts, erpParts);
  
  return {
    added: brandData.parts.length - existingParts.length,
    total: brandData.parts.length
  };
}

function main(targetSlug) {
  console.log('🔧 Merge ERPNext items into brand parts\n');
  console.log('='.repeat(70) + '\n');
  
  if (!targetSlug) {
    console.error('Usage: node merge-erp-brand-parts.js <brand-slug>');
    console.error('Example: node merge-erp-brand-parts.js hydac');
    process.exit(1);
  }
  
  // Check if target brand is excluded (exact slug/name match after normalization).
  if (isExcludedBrand(targetSlug)) {
    console.error(`Error: Brand "${targetSlug}" is permanently excluded and cannot be merged.`);
    process.exit(1);
  }
  
  console.log(`Target brand: ${targetSlug}\n`);
  
  // Load data
  console.log('Loading data...');
  const orderData = loadBrandOrderParts();
  const erpData = loadErpItems();
  
  console.log(`  brand-order-parts.json: ${orderData.brands.length} brands`);
  console.log(`  erp-items.json: ${erpData.brands.length} brands\n`);
  
  // Check if brand exists in ERP data
  const erpBrand = erpData.brands.find(b => b.brand_slug === targetSlug);
  if (!erpBrand) {
    console.error(`❌ Brand '${targetSlug}' not found in erp-items.json`);
    console.log('\nAvailable brands in erp-items.json:');
    for (const b of erpData.brands) {
      console.log(`   ${b.brand_slug} (${b.brand}): ${b.parts.length} codes`);
    }
    process.exit(1);
  }
  
  // Merge
  console.log('Merging parts...');
  const stats = mergeBrandData(targetSlug, orderData, erpData);
  
  // Update source info
  orderData.source = `${orderData.source} + erp-items.json (${targetSlug})`;
  orderData.generated = new Date().toISOString().slice(0, 10);
  
  // Sort brands
  orderData.brands.sort((a, b) => 
    a.brand.localeCompare(b.brand, undefined, { sensitivity: 'base' })
  );
  
  // Write updated data
  const outPath = path.join(ROOT, 'brand-order-parts.json');
  fs.writeFileSync(outPath, `${JSON.stringify(orderData, null, 2)}\n`, 'utf8');
  
  console.log(`  Added: ${stats.added} new codes`);
  console.log(`  Total: ${stats.total} codes for ${targetSlug}\n`);
  
  // Update sitemaps and llms.txt
  console.log('Updating sitemaps and llms.txt...');
  writeSitemapBrandParts(orderData.brands);
  writeSitemapPartCodes();
  writeSitemapListinoShards();
  writeSitemapIndex();
  updateRobotsTxt();
  updateLlmsTxt(orderData.brands);
  
  console.log('');
  console.log('='.repeat(70));
  console.log(`✅ Merged ${stats.added} ERP codes into ${targetSlug}`);
  console.log(`   Total: ${stats.total} codes`);
  console.log('');
  console.log('Next step: node generate-brand-pages.js');
  console.log('');
}

if (require.main === module) {
  const targetSlug = process.argv[2];
  main(targetSlug);
}

module.exports = { mergeBrandData, mergePartLists };
