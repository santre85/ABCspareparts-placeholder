'use strict';

const fs = require('fs');
const path = require('path');
const { assignUniqueSlugs, slugify } = require('./brand-slug.js');

function normalizeBrandKey(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .toUpperCase();
}

function normalizePartKey(partNumber) {
  return String(partNumber || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

function partDedupeKey(brandName, partNumber) {
  return `${normalizeBrandKey(brandName)}|${normalizePartKey(partNumber)}`;
}

function readBrandsFromIndex(root) {
  const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const match = indexHtml.match(/const brands = (\[[\s\S]*?\];\s*\n)/);
  if (!match) throw new Error('brands array not found in index.html');
  return eval(match[1].replace(/\];\s*\n?$/, ']'));
}

function buildBrandSlugMap(root) {
  const brands = readBrandsFromIndex(root);
  const rows = assignUniqueSlugs(brands);
  const byKey = new Map();
  for (const row of rows) {
    byKey.set(normalizeBrandKey(row.brand), row);
  }
  return { rows, byKey };
}

function resolveBrand(brandName, brandSlugMap) {
  const raw = String(brandName || '').trim();
  if (!raw || /^senza marca$/i.test(raw) || raw === '—' || raw === '-') {
    return null;
  }
  const hit = brandSlugMap.byKey.get(normalizeBrandKey(raw));
  if (hit) return { brand: hit.brand, brand_slug: hit.slug };
  return { brand: raw, brand_slug: slugify(raw) };
}

function loadCaseSlugIndex(root) {
  const map = new Map();
  try {
    const data = JSON.parse(fs.readFileSync(path.join(root, 'supply-cases.json'), 'utf8'));
    for (const c of data.cases || []) {
      if (c.published === false || !c.brand_slug) continue;
      const parts = [];
      if (Array.isArray(c.quotable_parts) && c.quotable_parts.length) {
        parts.push(...c.quotable_parts);
      } else if (c.part_number) {
        const pn = String(c.part_number);
        if (pn.includes('·')) parts.push(...pn.split('·').map((s) => s.trim()).filter(Boolean));
        else parts.push(pn);
      }
      for (const p of parts) {
        map.set(`${c.brand_slug}|${normalizePartKey(p)}`, c.slug);
      }
    }
  } catch (e) {
    console.warn('supply-cases.json:', e.message);
  }
  return map;
}

function linkCaseSlug(brandSlug, partNumber, caseIndex) {
  return caseIndex.get(`${brandSlug}|${normalizePartKey(partNumber)}`) || undefined;
}

/**
 * Parse SEZIONE A blocks from ORDINI/OFFERTE export text files.
 * @returns {{ brand: string, part_number: string, description: string, refs: string[] }[]}
 */
function parseCatalogSectionA(text, refLabel) {
  const lines = String(text).split(/\r?\n/);
  const out = [];
  let currentBrand = '';
  const refRe = new RegExp(`→\\s*${refLabel}:\\s*(.+)$`);
  const brandRe = /^--- MARCA:\s*(.+?)\s*\(/;

  for (const line of lines) {
    const brandMatch = line.match(brandRe);
    if (brandMatch) {
      currentBrand = brandMatch[1].trim();
      continue;
    }
    if (!currentBrand) continue;
    const partMatch = line.match(/^\s+(.+?)\s+\|\s+(.+?)\s+→/);
    if (!partMatch) continue;
    const part_number = partMatch[1].trim();
    const description = partMatch[2].trim();
    const refs = [];
    const refMatch = line.match(refRe);
    if (refMatch) {
      refs.push(...refMatch[1].split(',').map((s) => s.trim()).filter(Boolean));
    }
    out.push({ brand: currentBrand, part_number, description, refs });
  }
  return out;
}

function pickBrandField(row) {
  return (
    row.brand ||
    row.custom_brand ||
    row.custom_manufacturer ||
    row.manufacturer ||
    row.item_group ||
    ''
  );
}

function pickPartNumber(row) {
  const code = String(row.item_code || '').trim();
  const name = String(row.item_name || '').trim();
  const desc = String(row.description || '').trim();
  if (code && !/^ITEM-/i.test(code)) return code;
  if (name) return name;
  return desc;
}

module.exports = {
  normalizeBrandKey,
  normalizePartKey,
  partDedupeKey,
  readBrandsFromIndex,
  buildBrandSlugMap,
  resolveBrand,
  loadCaseSlugIndex,
  linkCaseSlug,
  parseCatalogSectionA,
  pickBrandField,
  pickPartNumber
};
