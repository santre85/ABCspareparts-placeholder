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

function sanitizePartCode(code) {
  return String(code || '')
    .replace(/\u00AD/g, '-')
    .replace(/[\u200B\u200C\u200D\uFEFF\u2060\u00A0]/g, '')
    .replace(/-+/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Drop ERP rows where part_number is clearly a product name, not a SKU. */
function isSearchablePartCode(code) {
  const s = sanitizePartCode(code);
  if (!s || s.length > 80) return false;
  const alphaWords = s
    .split(/[\s\u2013\u2014/,]+/)
    .map((w) => w.replace(/[.:]+$/g, ''))
    .filter((w) => /^[A-Za-z]{3,}$/.test(w));
  if (alphaWords.length >= 3) return false;
  return true;
}

function slugifyPartCode(code) {
  return sanitizePartCode(code)
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
  return sanitizePartCode(code)
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
  return sanitizePartCode(s).toLowerCase().replace(/[^a-z0-9]/g, '');
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

const PAGE_LANGS = ['de', 'en', 'it', 'es', 'fr'];

function homeLangPrefix(lang) {
  const l = PAGE_LANGS.includes(lang) ? lang : 'de';
  return l === 'de' ? '' : `${l}/`;
}

/** Static German home contact URL (no-JS fallback). Language rewrite is client-side. */
function homeContactCodeHref(code, lang, relativeRoot, brand) {
  const root = relativeRoot == null ? '../../' : relativeRoot;
  let href = `${root}${homeLangPrefix(lang)}?code=${encodeURIComponent(sanitizePartCode(code))}`;
  if (brand) href += `&brand=${encodeURIComponent(brand)}`;
  return `${href}#contact`;
}

function escapeAttr(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function partQuoteCtaHtml(code, relativeRoot, brand) {
  const root = relativeRoot == null ? '../../' : relativeRoot;
  const clean = sanitizePartCode(code);
  const brandAttr = brand ? ` data-part-brand="${escapeAttr(brand)}"` : '';
  return `<a class="cta-primary" id="partQuoteCta" data-part-code="${escapeAttr(clean)}"${brandAttr} href="${homeContactCodeHref(clean, 'de', root, brand)}">Angebot anfragen</a>`;
}

function partCtaLangScriptTag(relativeRoot) {
  const root = relativeRoot == null ? '../../' : relativeRoot;
  return `<script src="${root}part-cta-lang.js" defer></script>`;
}

module.exports = {
  sanitizePartCode,
  isSearchablePartCode,
  slugifyPartCode,
  slugifyKeepDots,
  normalizeKey,
  filenameStem,
  loadCatalog,
  findExistingPartPage,
  resolvePartPageFilename,
  searchIndexPageField,
  resetCatalog,
  PAGE_LANGS,
  homeLangPrefix,
  homeContactCodeHref,
  partQuoteCtaHtml,
  partCtaLangScriptTag
};
