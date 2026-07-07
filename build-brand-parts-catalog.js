'use strict';

const fs = require('fs');
const path = require('path');
const {
  buildBrandSlugMap,
  resolveBrand,
  loadCaseSlugIndex,
  linkCaseSlug,
  parseCatalogSectionA,
  partDedupeKey,
  normalizePartKey
} = require('./brand-parts-lib.js');

const ROOT = __dirname;
const OUT_FILE = path.join(ROOT, 'brand-order-parts.json');
const ORDINI_FILE = path.join(ROOT, 'ORDINI_ARTICOLI_MARCHE.txt');
const OFFERTE_FILE = path.join(ROOT, 'OFFERTE_ARTICOLI_MARCHE.txt');
const TODAY = new Date().toISOString().slice(0, 10);

function readOptionalTxt(filePath) {
  if (!fs.existsSync(filePath)) return '';
  return fs.readFileSync(filePath, 'utf8');
}

function ingestRows(rows, supplyType, brandSlugMap, caseIndex, orderedKeys, catalog) {
  for (const row of rows) {
    const resolved = resolveBrand(row.brand, brandSlugMap);
    if (!resolved) continue;

    const key = partDedupeKey(resolved.brand, row.part_number);
    const part = {
      part_number: row.part_number,
      description: row.description || row.part_number,
      supply_type: supplyType
    };
    const caseSlug = linkCaseSlug(resolved.brand_slug, row.part_number, caseIndex);
    if (caseSlug) part.case_slug = caseSlug;

    if (supplyType === 'ordered') {
      orderedKeys.add(key);
      upsertPart(catalog, resolved, part, key);
      continue;
    }

    if (orderedKeys.has(key)) continue;
    upsertPart(catalog, resolved, part, key);
  }
}

function upsertPart(catalog, resolved, part, key) {
  if (!catalog.has(resolved.brand_slug)) {
    catalog.set(resolved.brand_slug, {
      brand: resolved.brand,
      brand_slug: resolved.brand_slug,
      parts: [],
      keys: new Set()
    });
  }
  const bucket = catalog.get(resolved.brand_slug);
  if (bucket.keys.has(key)) {
    const existing = bucket.parts.find((p) => partDedupeKey(resolved.brand, p.part_number) === key);
    if (existing && existing.supply_type === 'quoted' && part.supply_type === 'ordered') {
      existing.supply_type = 'ordered';
    }
    return;
  }
  bucket.keys.add(key);
  bucket.parts.push(part);
}

function sortParts(parts) {
  return parts.sort((a, b) => {
    if (a.supply_type !== b.supply_type) {
      return a.supply_type === 'ordered' ? -1 : 1;
    }
    return a.part_number.localeCompare(b.part_number, 'it', { sensitivity: 'base' });
  });
}

function preserveManualCaseSlugs(catalog) {
  if (!fs.existsSync(OUT_FILE)) return;
  try {
    const prev = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
    for (const row of prev.brands || []) {
      const bucket = catalog.get(row.brand_slug);
      if (!bucket) continue;
      for (const oldPart of row.parts || []) {
        if (!oldPart.case_slug) continue;
        const hit = bucket.parts.find(
          (p) => normalizePartKey(p.part_number) === normalizePartKey(oldPart.part_number)
        );
        if (hit && !hit.case_slug) hit.case_slug = oldPart.case_slug;
      }
    }
  } catch (e) {
    console.warn('Could not merge previous case_slug values:', e.message);
  }
}

function loadPreviousCatalog() {
  if (!fs.existsSync(OUT_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(OUT_FILE, 'utf8')).brands || [];
  } catch (e) {
    console.warn('Previous brand-order-parts.json:', e.message);
    return [];
  }
}

function mergePreviousCatalog(previousBrands, brandSlugMap, caseIndex, orderedKeys, catalog) {
  for (const row of previousBrands) {
    const resolved = resolveBrand(row.brand, brandSlugMap) || {
      brand: row.brand,
      brand_slug: row.brand_slug
    };
    for (const part of row.parts || []) {
      const supplyType = part.supply_type === 'quoted' ? 'quoted' : 'ordered';
      const key = partDedupeKey(resolved.brand, part.part_number);
      if (supplyType === 'quoted' && orderedKeys.has(key)) continue;
      const merged = {
        part_number: part.part_number,
        description: part.description || part.part_number,
        supply_type: supplyType
      };
      if (part.case_slug) merged.case_slug = part.case_slug;
      else {
        const linked = linkCaseSlug(resolved.brand_slug, part.part_number, caseIndex);
        if (linked) merged.case_slug = linked;
      }
      if (supplyType === 'ordered') orderedKeys.add(key);
      upsertPart(catalog, resolved, merged, key);
    }
  }
}

function buildCatalog() {
  const previousBrands = loadPreviousCatalog();
  const brandSlugMap = buildBrandSlugMap(ROOT);
  const caseIndex = loadCaseSlugIndex(ROOT);
  const catalog = new Map();
  const orderedKeys = new Set();
  const sources = [];

  const ordiniTxt = readOptionalTxt(ORDINI_FILE);
  if (ordiniTxt) {
    sources.push('ORDINI_ARTICOLI_MARCHE.txt');
    ingestRows(parseCatalogSectionA(ordiniTxt, 'ordini'), 'ordered', brandSlugMap, caseIndex, orderedKeys, catalog);
  }

  const offerteTxt = readOptionalTxt(OFFERTE_FILE);
  if (offerteTxt) {
    sources.push('OFFERTE_ARTICOLI_MARCHE.txt');
    ingestRows(parseCatalogSectionA(offerteTxt, 'preventivi'), 'quoted', brandSlugMap, caseIndex, orderedKeys, catalog);
  }

  mergePreviousCatalog(previousBrands, brandSlugMap, caseIndex, orderedKeys, catalog);

  preserveManualCaseSlugs(catalog);

  const brands = [...catalog.values()]
    .map((row) => ({
      brand: row.brand,
      brand_slug: row.brand_slug,
      parts: sortParts(row.parts)
    }))
    .sort((a, b) => a.brand.localeCompare(b.brand, 'it', { sensitivity: 'base' }));

  const payload = {
    sources,
    generated: TODAY,
    brands
  };

  fs.writeFileSync(OUT_FILE, JSON.stringify(payload, null, 2) + '\n', 'utf8');

  const orderedCount = brands.reduce((n, b) => n + b.parts.filter((p) => p.supply_type === 'ordered').length, 0);
  const quotedCount = brands.reduce((n, b) => n + b.parts.filter((p) => p.supply_type === 'quoted').length, 0);
  console.log('Wrote', OUT_FILE);
  console.log('Brands:', brands.length, '| ordered parts:', orderedCount, '| quoted-only parts:', quotedCount);
  return payload;
}

if (require.main === module) {
  buildCatalog();
}

module.exports = { buildCatalog };
