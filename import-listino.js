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
const LISTINI_DATA_DIR = path.join(ROOT, 'listini-data');
/** Above this count, codes go to listini-data/{slug}.json instead of inline HTML. */
const INLINE_LISTINO_MAX = 200;

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
  'rabatt', 'discount', 'mwst', 'vat', 'iva', 'sales_price', 'verkaufspreis'
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
    const bucket = bySlug.get(slug);
    for (let i = 0; i < parts.length; i++) bucket.push(parts[i]);
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
    bySlug.set(slug, Array.from(map.values()));
  }

  return bySlug;
}

/** How many sample codes to embed in HTML / schema / llms for crawlability. */
const LISTINO_PREVIEW_COUNT = 24;
/** Prefix chips shown under the search box so visitors know how to search. */
const LISTINO_EXAMPLE_PREFIX_COUNT = 6;

/**
 * Pick a diverse sample of codes (not just the first alphabetical ones)
 * so the brand page shows recognizable product families.
 */
function pickDiversePreview(codes, limit = LISTINO_PREVIEW_COUNT) {
  if (!codes.length) return [];
  if (codes.length <= limit) return codes.slice();

  const byPrefix = new Map();
  for (const code of codes) {
    const prefix = String(code).slice(0, 4).toUpperCase();
    if (!byPrefix.has(prefix)) byPrefix.set(prefix, []);
    byPrefix.get(prefix).push(code);
  }
  const ranked = [...byPrefix.entries()].sort((a, b) => b[1].length - a[1].length);
  const picked = [];
  const used = new Set();

  // Round-robin across top prefixes for variety
  const top = ranked.slice(0, Math.min(16, ranked.length));
  let round = 0;
  while (picked.length < limit && round < 8) {
    let added = false;
    for (const [, group] of top) {
      if (picked.length >= limit) break;
      const candidate = group[Math.min(round, group.length - 1)];
      if (candidate && !used.has(candidate)) {
        used.add(candidate);
        picked.push(candidate);
        added = true;
      }
    }
    if (!added) break;
    round += 1;
  }

  // Fill remaining from start of catalog
  for (const code of codes) {
    if (picked.length >= limit) break;
    if (!used.has(code)) {
      used.add(code);
      picked.push(code);
    }
  }
  return picked;
}

/** Popular code prefixes used as clickable search examples. */
function pickSearchExamples(codes, limit = LISTINO_EXAMPLE_PREFIX_COUNT) {
  const counts = new Map();
  for (const code of codes) {
    const prefix = String(code).slice(0, 4).toUpperCase();
    if (prefix.length < 3) continue;
    counts.set(prefix, (counts.get(prefix) || 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, n]) => n >= 20)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([prefix]) => prefix);
}

/**
 * Write compact JSON catalog for large listini (codes only, no prices).
 * Preview + example prefixes are embedded for SEO/AI and the brand-page UI.
 * @returns {{ file: string, count: number, preview: string[], examples: string[] }}
 */
function writeListinoDataFile(brandSlug, brandName, parts) {
  if (!fs.existsSync(LISTINI_DATA_DIR)) fs.mkdirSync(LISTINI_DATA_DIR, { recursive: true });
  const codes = parts
    .map((p) => String(p.part_number || '').trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  const preview = pickDiversePreview(codes);
  const examples = pickSearchExamples(codes);
  const rel = `listini-data/${brandSlug}.json`;
  const payload = {
    brand: brandName,
    brand_slug: brandSlug,
    count: codes.length,
    generated: new Date().toISOString().slice(0, 10),
    note: 'Part codes only — no prices. Click a code on the brand page to request a quote.',
    preview,
    examples,
    codes
  };
  fs.writeFileSync(path.join(ROOT, rel), `${JSON.stringify(payload)}\n`, 'utf8');
  return {
    file: rel,
    count: codes.length,
    preview,
    examples
  };
}

/**
 * Recompute preview/examples on an existing listini-data/{slug}.json (no XLSX needed).
 * @returns {{ file: string, count: number, preview: string[], examples: string[] } | null}
 */
function refreshListinoMeta(brandSlug) {
  const rel = `listini-data/${brandSlug}.json`;
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) return null;
  const data = JSON.parse(fs.readFileSync(full, 'utf8'));
  const codes = Array.isArray(data.codes) ? data.codes.map(String) : [];
  if (!codes.length) return null;
  const preview = pickDiversePreview(codes);
  const examples = pickSearchExamples(codes);
  data.count = codes.length;
  data.preview = preview;
  data.examples = examples;
  data.generated = new Date().toISOString().slice(0, 10);
  data.note = data.note || 'Part codes only — no prices. Click a code on the brand page to request a quote.';
  fs.writeFileSync(full, `${JSON.stringify(data)}\n`, 'utf8');
  return { file: rel, count: codes.length, preview, examples };
}

/**
 * When listini/{slug}.xlsx is absent, keep published catalogs from listini-data/*.json
 * so rebuilds do not drop large listini already on the site.
 */
function loadPublishedListiniData() {
  const bySlug = new Map();
  if (!fs.existsSync(LISTINI_DATA_DIR)) return bySlug;
  for (const file of fs.readdirSync(LISTINI_DATA_DIR)) {
    if (!file.endsWith('.json')) continue;
    const slug = file.replace(/\.json$/i, '').toLowerCase();
    try {
      const data = JSON.parse(fs.readFileSync(path.join(LISTINI_DATA_DIR, file), 'utf8'));
      const codes = Array.isArray(data.codes) ? data.codes : [];
      if (!codes.length) continue;
      bySlug.set(
        slug,
        codes.map((code) => ({
          part_number: String(code),
          description: String(code)
        }))
      );
    } catch (e) {
      console.warn(`listini-data/${file}:`, e.message);
    }
  }
  return bySlug;
}

module.exports = {
  loadListiniParts,
  loadPublishedListiniData,
  writeListinoDataFile,
  refreshListinoMeta,
  pickDiversePreview,
  pickSearchExamples,
  parseTxt,
  parseCsv,
  parseXlsx,
  isLikelyPartCode,
  LISTINI_DIR,
  LISTINI_DATA_DIR,
  INLINE_LISTINO_MAX,
  LISTINO_PREVIEW_COUNT,
  LISTINO_EXAMPLE_PREFIX_COUNT
};
