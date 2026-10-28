#!/usr/bin/env node
'use strict';

/**
 * Import ERPNext items (supplier-priced) and map them to existing brand pages.
 * 
 * Input: TSV with item_code, brand, description (prices NOT included, never published)
 * Output: erp-items.json with brand_slug → parts mapping
 * 
 * Rules:
 * - Normalize brand names (case, accents) to match brand-slugs.json
 * - Unmatched brands are logged, NOT auto-created
 * - Descriptions kept short
 * - NO prices, NO supplier names ever
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const MAX_DESC_LEN = 120;

/**
 * Brands permanently excluded from ERP import.
 * These brands will never be imported, even if they appear in ERPNext data.
 * Match is case-insensitive against brand name.
 */
const EXCLUDED_BRANDS = [
  'keysight',
  'keysight technologies',
  'keysight-technologies',
  'markem',
  'markem imaje',
  'markem-imaje'
];

function normalizeExcludedKey(str) {
  return String(str || '').toLowerCase().replace(/[\s\-\/\.]/g, '');
}

function isExcludedBrand(brandName) {
  const normalized = normalizeExcludedKey(brandName);
  return EXCLUDED_BRANDS.some((ex) => normalizeExcludedKey(ex) === normalized);
}

/**
 * Manual overrides for brand name normalization
 */
const BRAND_OVERRIDES = {
  'PHOENIX CONTACT': 'Phoenix contact',
  'Phoenix Contact': 'Phoenix contact',
  'MULLER MARTINI': 'Müller Martini',
  'Muller Martini': 'Müller Martini',
  'Mueller Martini': 'Müller Martini',
  // Previously unmatched brands (PR #79)
  'HERBORNER PUMPEN': 'HERBORNER',
  'Hi force': 'Hi-Force Hydraulics',
  'ATLAS COPCO SCA': 'ATLAS COPCO',
  'AMPLIDAN - DNH': 'DNH',
  // New brand pages created for ERP integration
  'Scheuerle': 'Scheuerle',
  'BROVIND': 'BROVIND',
  'Gorter': 'Gorter',
  'SEPATRON': 'SEPATRON',
  'MADATEC': 'MADATEC',
  'Omec': 'Omec',
  'Steimel': 'Steimel',
  'AUO': 'AUO',
  'Römheld': 'Römheld',
  'Matrix Elektronik': 'Matrix Elektronik',
  'Walterscheid': 'Walterscheid',
  'NEWHAVEN': 'NEWHAVEN DISPLAY',
  'Intercable tools': 'Intercable tools',
  'KPM': 'KPM',
  'Wayne': 'Wayne',
  // New brand pages for October 2026 ERP update
  'MULAG': 'MULAG',
  'SIGLOCH': 'SIGLOCH',
  'Mtu': 'MTU',
  // New brand pages approved 2026-10-28 (previously unmatched in PR #103)
  'MEASUREX': 'MEASUREX',
  'Powasert': 'Powasert'
  // ABC - skipped as ambiguous (multiple ABC brands exist)
};

function normalizeKey(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

function normalizeBrandName(brand) {
  // Apply manual overrides first
  if (BRAND_OVERRIDES[brand]) {
    return BRAND_OVERRIDES[brand];
  }
  
  // Otherwise just trim
  return String(brand || '').trim();
}

function truncateDescription(text) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= MAX_DESC_LEN) return clean;
  return `${clean.slice(0, MAX_DESC_LEN - 1).trim()}…`;
}

function cleanDescription(partNumber, description) {
  let desc = String(description || '')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
  
  const pn = String(partNumber || '').trim();

  // If description is same as part number, just use part number
  if (!desc || desc === pn) return pn;
  
  // If description starts with part number, remove it
  if (desc.startsWith(pn)) {
    desc = desc.slice(pn.length).replace(/^[\s|,–—-]+/, '').trim();
  }
  
  if (!desc || desc === pn) return pn;
  return truncateDescription(desc);
}

function parseTsv(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  
  if (lines.length === 0) {
    throw new Error('Empty TSV file');
  }
  
  // Parse header
  const header = lines[0].split('\t');
  const itemCodeIdx = header.findIndex(h => h.toLowerCase().trim() === 'item_code');
  const brandIdx = header.findIndex(h => h.toLowerCase().trim() === 'brand');
  const descIdx = header.findIndex(h => h.toLowerCase().trim() === 'description');
  
  if (itemCodeIdx < 0 || brandIdx < 0) {
    throw new Error('TSV must have item_code and brand columns');
  }
  
  console.log(`Found columns: item_code=${itemCodeIdx}, brand=${brandIdx}, description=${descIdx >= 0 ? descIdx : 'none'}`);
  
  // Parse rows
  const items = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('\t');
    const item_code = (cols[itemCodeIdx] || '').trim();
    const brand = (cols[brandIdx] || '').trim();
    const description = descIdx >= 0 ? (cols[descIdx] || '').trim() : item_code;
    
    if (!item_code || !brand) continue;
    
    items.push({
      item_code,
      brand,
      description
    });
  }
  
  console.log(`Parsed ${items.length} items from ${lines.length - 1} data rows\n`);
  return items;
}

function loadBrandSlugs() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'brand-slugs.json'), 'utf8'));
}

function resolveBrand(erpBrand, brandSlugs) {
  const normalized = normalizeBrandName(erpBrand);
  
  // Exact match
  if (brandSlugs[normalized]) {
    return { brand: normalized, brand_slug: brandSlugs[normalized] };
  }
  
  // Case-insensitive match
  const normalizedKey = normalizeKey(normalized);
  for (const [name, slug] of Object.entries(brandSlugs)) {
    if (normalizeKey(name) === normalizedKey) {
      return { brand: name, brand_slug: slug };
    }
  }
  
  return null;
}

function groupByBrand(items, brandSlugs) {
  const bySlug = new Map();
  const unmatched = new Map();
  
  for (const item of items) {
    // Check if brand is excluded (exact match after normalization; does not
    // drop AXIOMTEK / MARKEM-IMAJE when excluding Markem / Markem Imaje).
    if (isExcludedBrand(item.brand)) {
      continue;
    }
    
    const resolved = resolveBrand(item.brand, brandSlugs);
    
    if (!resolved) {
      const count = unmatched.get(item.brand) || 0;
      unmatched.set(item.brand, count + 1);
      continue;
    }
    
    if (!bySlug.has(resolved.brand_slug)) {
      bySlug.set(resolved.brand_slug, {
        brand: resolved.brand,
        brand_slug: resolved.brand_slug,
        parts: []
      });
    }
    
    const brandData = bySlug.get(resolved.brand_slug);
    brandData.parts.push({
      part_number: item.item_code,
      description: cleanDescription(item.item_code, item.description)
    });
  }
  
  // Deduplicate parts within each brand
  for (const [slug, data] of bySlug) {
    const seen = new Map();
    for (const part of data.parts) {
      const key = part.part_number.toUpperCase().replace(/\s+/g, '');
      if (!seen.has(key)) {
        seen.set(key, part);
      }
    }
    data.parts = [...seen.values()].sort((a, b) => 
      a.part_number.localeCompare(b.part_number, undefined, { sensitivity: 'base' })
    );
  }
  
  return { bySlug, unmatched };
}

function main(tsvPath) {
  console.log('🔧 ERPNext Items Import\n');
  console.log('='.repeat(70) + '\n');
  
  if (!tsvPath || !fs.existsSync(tsvPath)) {
    console.error('Usage: node import-erp-items.js <path-to-tsv>');
    console.error('Example: node import-erp-items.js uploads/erp-priced-items.tsv');
    process.exit(1);
  }
  
  console.log(`Reading: ${tsvPath}\n`);
  
  // Parse input
  const items = parseTsv(tsvPath);
  
  // Load brand mapping
  const brandSlugs = loadBrandSlugs();
  console.log(`Loaded ${Object.keys(brandSlugs).length} brand slugs\n`);
  
  // Group by brand
  const { bySlug, unmatched } = groupByBrand(items, brandSlugs);
  
  // Build output
  const brands = [...bySlug.values()].sort((a, b) => 
    a.brand.localeCompare(b.brand, undefined, { sensitivity: 'base' })
  );
  
  const output = {
    source: path.basename(tsvPath),
    imported: new Date().toISOString().slice(0, 10),
    note: 'ERPNext items with supplier pricing (prices NOT included here, never published)',
    brands
  };
  
  // Write output
  const outPath = path.join(ROOT, 'erp-items.json');
  fs.writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  
  // Report
  console.log('='.repeat(70) + '\n');
  console.log(`✅ Wrote: ${outPath}\n`);
  
  const totalMapped = items.length - [...unmatched.values()].reduce((a, b) => a + b, 0);
  console.log(`📊 Statistics:`);
  console.log(`   Total items: ${items.length}`);
  console.log(`   Matched brands: ${brands.length}`);
  console.log(`   Mapped items: ${totalMapped}`);
  console.log(`   Unmatched brands: ${unmatched.size}`);
  console.log('');
  
  // Show matched brands
  console.log('✓ Matched brands:');
  for (const { brand, brand_slug, parts } of brands) {
    console.log(`   ${brand} (${brand_slug}): ${parts.length} codes`);
  }
  console.log('');
  
  // Show unmatched brands
  if (unmatched.size > 0) {
    console.log('⚠️  Unmatched brands (not created, logged only):');
    const sortedUnmatched = [...unmatched.entries()].sort((a, b) => b[1] - a[1]);
    for (const [brand, count] of sortedUnmatched) {
      console.log(`   ${brand}: ${count} item(s)`);
    }
    console.log('');
  }
  
  console.log('Next steps:');
  console.log('1. Review erp-items.json');
  console.log('2. Run: node merge-erp-brand-parts.js hydac');
  console.log('3. Rebuild pages: node generate-brand-pages.js');
  console.log('');
}

if (require.main === module) {
  const tsvPath = process.argv[2] || path.join(ROOT, 'uploads', 'erp-priced-items.tsv');
  main(tsvPath);
}

module.exports = { parseTsv, resolveBrand, groupByBrand, cleanDescription };
