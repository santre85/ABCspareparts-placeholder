'use strict';

/**
 * Import manufacturer price lists from listini/ into a map of brand_slug → parts.
 *
 * IMPORTANT: only part codes (and optional descriptions) are published on the site.
 * Prices / list prices / discounts from the XLSX are NEVER imported or displayed.
 * Customers click a code to open a no-obligation enquiry form — not a priced catalog.
 *
 * Supported files (filename stem = brand slug, e.g. abb.xlsx → marche/abb.html):
 *   listini/abb.txt   — one part number per line
 *   listini/abb.csv   — column part_number (or first column); optional description
 *   listini/abb.xlsx  — first sheet; auto-detect code column
 *
 * Description is optional. Missing description → description = part number.
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const LISTINI_DIR = path.join(ROOT, 'listini');

const CODE_HEADERS = new Set([
  'part_number', 'partnumber', 'part', 'code', 'codice', 'codicearticolo',
  'articolo', 'artikel', 'artikelnummer', 'teilenummer', 'sku', 'item',
  'item_code', 'itemcode', 'reference', 'ref', 'pn', 'mpn'
]);

const DESC_HEADERS = new Set([
  'description', 'desc', 'descrizione', 'beschreibung', 'name', 'item_name',
  'designation', 'bezeichnung', 'title'
]);

/** Headers that must never be treated as description (or published). */
const PRICE_HEADERS = new Set([
  'price', 'preis', 'prezzo', 'list_price', 'listino', 'netto', 'net', 'brutto',
  'eur', 'usd', 'chf', 'gbp', 'amount', 'betrag', 'costo', 'cost', 'vk', 'ek',
  'rabatt', 'discount', 'mwst', 'vat', 'iva'
]);

function isPriceHeader(header) {
  const h = normalizeHeader(header);
  if (PRICE_HEADERS.has(h)) return true;
  return /(price|preis|prezzo|euro|eur|usd|netto|brutto|rabatt|discount)/.test(h);
}

function normalizeHeader(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, '_');
}

function normalizePartKey(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
}

function isLikelyPartCode(value) {
  const s = String(value || '').trim();
  if (!s || s.length < 2 || s.length > 80) return false;
  if (/^(part|code|codice|artikel|sku|item|description|desc)/i.test(s)) return false;
  // Must contain a digit or look like an industrial code
  if (!/[0-9]/.test(s) && !/[A-Z]{2,}[-./][A-Z0-9]/i.test(s)) return false;
  return true;
}

function parseTxt(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const parts = [];
  for (const line of text.split(/\r?\n/)) {
    const code = line.replace(/#.*/, '').trim();
    if (!code || !isLikelyPartCode(code)) continue;
    parts.push({ part_number: code, description: code });
  }
  return parts;
}

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === ',' && !inQuotes) {
      out.push(cur.trim());
      cur = '';
      continue;
    }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
}

function rowsToParts(rows) {
  if (!rows.length) return [];
  const first = rows[0].map(normalizeHeader);
  let codeIdx = first.findIndex((h) => CODE_HEADERS.has(h));
  let descIdx = first.findIndex((h) => DESC_HEADERS.has(h) && !isPriceHeader(h));
  let start = 0;

  if (codeIdx >= 0) {
    start = 1;
  } else {
    // No header — treat first non-price-looking column as code.
    // Never take a second column as description if the header row looks like prices.
    codeIdx = 0;
    descIdx = -1;
    start = 0;
    if (rows[0].length > 1 && !isLikelyPartCode(rows[0][0]) && isLikelyPartCode(rows[0][1])) {
      codeIdx = 1;
    }
  }

  // Safety: never use a price column as description
  if (descIdx >= 0 && first[descIdx] && isPriceHeader(first[descIdx])) {
    descIdx = -1;
  }

  const byKey = new Map();
  for (let i = start; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row.length) continue;
    const code = String(row[codeIdx] || '').trim();
    if (!isLikelyPartCode(code)) continue;
    // Only keep code (+ optional text description). Ignore all other columns (prices, qty, …).
    const descRaw = descIdx >= 0 ? String(row[descIdx] || '').trim() : '';
    const description = descRaw && !/^\d+([.,]\d+)?\s*(€|eur|usd|chf)?$/i.test(descRaw)
      ? descRaw
      : code;
    const key = normalizePartKey(code);
    if (!byKey.has(key)) {
      byKey.set(key, { part_number: code, description });
    }
  }
  return [...byKey.values()];
}

function parseCsv(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const rows = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseCsvLine);
  return rowsToParts(rows);
}

function parseXlsx(filePath) {
  let XLSX;
  try {
    XLSX = require('xlsx');
  } catch (e) {
    throw new Error(`Cannot read ${path.basename(filePath)}: install dependency with npm install xlsx`);
  }
  const workbook = XLSX.readFile(filePath, { cellDates: false });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
  const rows = matrix.map((row) => (Array.isArray(row) ? row.map((c) => String(c == null ? '' : c).trim()) : []));
  return rowsToParts(rows);
}

function brandSlugFromFilename(filename) {
  return path.basename(filename, path.extname(filename)).toLowerCase();
}

function loadListiniParts() {
  const bySlug = new Map();
  if (!fs.existsSync(LISTINI_DIR)) return bySlug;

  const files = fs.readdirSync(LISTINI_DIR).filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return ['.txt', '.csv', '.xlsx', '.xls'].includes(ext) && !f.startsWith('.') && !f.startsWith('_');
  });

  for (const file of files) {
    const full = path.join(LISTINI_DIR, file);
    const slug = brandSlugFromFilename(file);
    const ext = path.extname(file).toLowerCase();
    let parts = [];
    try {
      if (ext === '.txt') parts = parseTxt(full);
      else if (ext === '.csv') parts = parseCsv(full);
      else parts = parseXlsx(full);
    } catch (e) {
      console.warn(`listini/${file}:`, e.message);
      continue;
    }
    if (!parts.length) {
      console.warn(`listini/${file}: no part codes found`);
      continue;
    }
    if (!bySlug.has(slug)) bySlug.set(slug, []);
    bySlug.get(slug).push(...parts);
    console.log(`listini/${file}: ${parts.length} code(s) → ${slug}`);
  }

  // Dedupe within each slug
  for (const [slug, parts] of bySlug) {
    const map = new Map();
    for (const part of parts) {
      const key = normalizePartKey(part.part_number);
      if (!map.has(key)) map.set(key, part);
      else {
        const prev = map.get(key);
        if (part.description !== part.part_number && prev.description === prev.part_number) {
          map.set(key, part);
        }
      }
    }
    bySlug.set(slug, [...map.values()]);
  }

  return bySlug;
}

module.exports = {
  loadListiniParts,
  parseTxt,
  parseCsv,
  parseXlsx,
  isLikelyPartCode,
  LISTINI_DIR
};
