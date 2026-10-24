'use strict';

/**
 * Resolve /parts/{brand}/{file}.html for a search-index code.
 *
 * Existing live URLs (including filenames that keep dots) must never be
 * renamed. Consult the on-disk parts tree, sitemap-parts.xml, and
 * parts-mvp.json, matching both dashed and dotted slug variants.
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PARTS_DIR = path.join(ROOT, 'parts');
const MVP_PATH = path.join(ROOT, 'parts-mvp.json');
const SITEMAP_PARTS = path.join(ROOT, 'sitemap-parts.xml');

function slugifyPartCode(code) {
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

function slugifyKeepDots(code) {
  return String(code || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/\+/g, ' plus ')
    .replace(/[^a-zA-Z0-9.]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')
    .toLowerCase();
}

function normalizeKey(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function filenameStem(name) {
  return String(name || '').replace(/\.html$/i, '');
}

let catalog = null;

function addToCatalog(brandSlug, filename) {
  if (!brandSlug || !filename) return;
  const file = filename.endsWith('.html') ? filename : `${filename}.html`;
  catalog.exact.add(`${brandSlug}/${file}`);
  const key = `${brandSlug}::${normalizeKey(filenameStem(file))}`;
  if (!catalog.byNorm.has(key)) catalog.byNorm.set(key, file);
}

function loadCatalog() {
  if (catalog) return catalog;
  catalog = { exact: new Set(), byNorm: new Map() };

  if (fs.existsSync(PARTS_DIR)) {
    for (const brand of fs.readdirSync(PARTS_DIR)) {
      const dir = path.join(PARTS_DIR, brand);
      let st;
      try {
        st = fs.statSync(dir);
      } catch {
        continue;
      }
      if (!st.isDirectory()) continue;
      let names;
      try {
        names = fs.readdirSync(dir);
      } catch {
        continue;
      }
      for (const name of names) {
        if (name.endsWith('.html')) addToCatalog(brand, name);
      }
    }
  }

  if (fs.existsSync(SITEMAP_PARTS)) {
    const xml = fs.readFileSync(SITEMAP_PARTS, 'utf8');
    const re = /https:\/\/abcspareparts\.eu\/parts\/([^/<]+?)\/([^<]+?\.html)/g;
    let m;
    while ((m = re.exec(xml))) addToCatalog(m[1], m[2]);
  }

  if (fs.existsSync(MVP_PATH)) {
    try {
      const mvp = JSON.parse(fs.readFileSync(MVP_PATH, 'utf8'));
      for (const part of mvp.parts || []) {
        if (part.brand_slug && part.part_slug) {
          addToCatalog(part.brand_slug, `${part.part_slug}.html`);
        }
        if (part.path && /^parts\/[^/]+\/[^/]+\.html$/.test(part.path)) {
          const bits = part.path.split('/');
          addToCatalog(bits[1], bits[2]);
        }
      }
    } catch {
      /* ignore */
    }
  }

  return catalog;
}

function findExistingPartPage(brandSlug, code) {
  const cat = loadCatalog();
  const dashed = `${slugifyPartCode(code)}.html`;
  const dotted = `${slugifyKeepDots(code)}.html`;

  if (cat.exact.has(`${brandSlug}/${dashed}`)) return dashed;
  if (dotted !== dashed && cat.exact.has(`${brandSlug}/${dotted}`)) return dotted;

  const mapped = cat.byNorm.get(`${brandSlug}::${normalizeKey(code)}`);
  if (mapped) return mapped;

  return null;
}

function resolvePartPageFilename(brandSlug, code) {
  return findExistingPartPage(brandSlug, code) || `${slugifyPartCode(code)}.html`;
}

function searchIndexPageField(brandSlug, code) {
  const existing = findExistingPartPage(brandSlug, code);
  if (!existing) return null;
  const stem = filenameStem(existing);
  if (stem === slugifyPartCode(code)) return null;
  return stem;
}

function resetCatalog() {
  catalog = null;
}

module.exports = {
  slugifyPartCode,
  slugifyKeepDots,
  normalizeKey,
  filenameStem,
  loadCatalog,
  findExistingPartPage,
  resolvePartPageFilename,
  searchIndexPageField,
  resetCatalog
};
