#!/usr/bin/env node
'use strict';

/**
 * Merge ALL ERPNext items into brand-order-parts.json
 * (applies to all matched brands from erp-items.json)
 */

const fs = require('fs');
const path = require('path');
const { mergeBrandData, mergePartLists } = require('./merge-erp-brand-parts.js');
const {
  writeSitemapBrandParts,
  writeSitemapPartCodes,
  writeSitemapListinoShards,
  writeSitemapIndex,
  updateRobotsTxt,
  updateLlmsTxt
} = require('./build-brand-parts.js');

const ROOT = __dirname;

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

function main() {
  console.log('🔧 Merge ALL ERPNext items into brand parts\n');
  console.log('='.repeat(70) + '\n');
  
  // Load data
  console.log('Loading data...');
  const orderData = loadBrandOrderParts();
  const erpData = loadErpItems();
  
  console.log(`  brand-order-parts.json: ${orderData.brands.length} brands`);
  console.log(`  erp-items.json: ${erpData.brands.length} matched brands\n`);
  
  // Merge all brands
  console.log('Merging all ERP brands...\n');
  const stats = {
    brandsUpdated: 0,
    codesAdded: 0,
    totalCodes: 0
  };
  
  for (const erpBrand of erpData.brands) {
    const slug = erpBrand.brand_slug;
    const beforeCount = orderData.brands.find(b => b.brand_slug === slug)?.parts?.length || 0;
    
    try {
      const result = mergeBrandData(slug, orderData, erpData);
      stats.brandsUpdated++;
      stats.codesAdded += result.added;
      stats.totalCodes += result.total;
      
      if (result.added > 0) {
        console.log(`  ✓ ${erpBrand.brand} (${slug}): +${result.added} codes → ${result.total} total`);
      } else {
        console.log(`  • ${erpBrand.brand} (${slug}): ${result.total} codes (no new codes)`);
      }
    } catch (err) {
      console.error(`  ✗ ${erpBrand.brand} (${slug}): ${err.message}`);
    }
  }
  
  // Update source info
  orderData.source = `${orderData.source} + erp-items.json (all matched brands)`;
  orderData.generated = new Date().toISOString().slice(0, 10);
  
  // Sort brands
  orderData.brands.sort((a, b) => 
    a.brand.localeCompare(b.brand, undefined, { sensitivity: 'base' })
  );
  
  // Write updated data
  const outPath = path.join(ROOT, 'brand-order-parts.json');
  fs.writeFileSync(outPath, `${JSON.stringify(orderData, null, 2)}\n`, 'utf8');
  
  console.log('');
  console.log('Updating sitemaps and llms.txt...');
  writeSitemapBrandParts(orderData.brands);
  writeSitemapPartCodes();
  writeSitemapListinoShards();
  writeSitemapIndex();
  updateRobotsTxt();
  updateLlmsTxt(orderData.brands);
  
  console.log('');
  console.log('='.repeat(70));
  console.log(`✅ Merged ERP items for ${stats.brandsUpdated} brands`);
  console.log(`   New codes added: ${stats.codesAdded}`);
  console.log(`   Total codes across all ERP brands: ${stats.totalCodes}`);
  console.log('');
  console.log('Next step: node generate-brand-pages.js');
  console.log('');
}

if (require.main === module) {
  main();
}

module.exports = { main };
