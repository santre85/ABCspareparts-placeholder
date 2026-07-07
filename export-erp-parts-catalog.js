'use strict';

/**
 * Export Sales Orders + Quotations from ERPNext into catalog text files.
 *
 * Usage:
 *   ERPNEXT_URL=https://erp.abcspareparts.eu \
 *   ERPNEXT_API_KEY=... ERPNEXT_API_SECRET=... \
 *   node export-erp-parts-catalog.js
 */

const fs = require('fs');
const path = require('path');
const {
  pickBrandField,
  pickPartNumber,
  normalizeBrandKey,
  normalizePartKey
} = require('./brand-parts-lib.js');

const ROOT = __dirname;
const BASE_URL = (process.env.ERPNEXT_URL || 'https://erp.abcspareparts.eu').replace(/\/$/, '');
const API_KEY = process.env.ERPNEXT_API_KEY || process.env.FRAPPE_API_KEY || '';
const API_SECRET = process.env.ERPNEXT_API_SECRET || process.env.FRAPPE_API_SECRET || '';
const TODAY = new Date().toISOString().slice(0, 10);

const QUOTE_SKIP_STATUSES = new Set(['Lost', 'Cancelled', 'Expired', 'Draft']);

async function erpList(doctype, { fields, filters, limit = 0 } = {}) {
  const params = new URLSearchParams();
  if (fields?.length) params.set('fields', JSON.stringify(fields));
  if (filters?.length) params.set('filters', JSON.stringify(filters));
  params.set('limit_page_length', String(limit));
  const url = `${BASE_URL}/api/resource/${encodeURIComponent(doctype)}?${params}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `token ${API_KEY}:${API_SECRET}`,
      Accept: 'application/json'
    }
  });
  const body = await res.text();
  if (!res.ok) {
    throw new Error(`ERP ${doctype} HTTP ${res.status}: ${body.slice(0, 400)}`);
  }
  const json = JSON.parse(body);
  return json.data || [];
}

function groupRows(rows, supplyLabel, refField) {
  const byBrand = new Map();
  for (const row of rows) {
    const brand = String(row.brand || '').trim();
    const part = String(row.part_number || '').trim();
    if (!brand || !part) continue;
    if (!byBrand.has(brand)) byBrand.set(brand, []);
    byBrand.get(brand).push(row);
  }

  const brandNames = [...byBrand.keys()].sort((a, b) => a.localeCompare(b, 'it'));
  let body = '';
  let totalParts = 0;
  let totalRows = 0;

  for (const brand of brandNames) {
    const items = byBrand.get(brand);
    totalParts += items.length;
    totalRows += items.reduce((n, r) => n + (r.refs?.length || 1), 0);
    body += `\n--- MARCA: ${brand} (${items.length} codici, ${items.length} righe ${supplyLabel}) ---\n`;
    for (const item of items) {
      const refs = (item.refs || []).join(', ');
      body += `  ${item.part_number} | ${item.description || item.part_number}  →  ${refField}: ${refs}\n`;
    }
  }

  return { body, brandNames, totalParts, totalRows };
}

function writeCatalogFile(filename, title, summary, sectionBody, refField) {
  const content = `${title}
ABC Spare Parts · ERPNext
Generato: ${TODAY}

Scopo: elenco ${summary.scope}
da usare per arricchire le pagine marca su www.abcspareparts.eu
(SEO, ricerca codici, richieste dirette clienti).

========================================================================
RIEPILOGO
========================================================================
${summary.countLabel}: ${summary.totalRows}
Marche distinte: ${summary.brandNames.length}
Codici articolo distinti: ${summary.totalParts}

Marche presenti:
${summary.brandNames.join(', ')}

========================================================================
SEZIONE A — PER MARCA (utile per pagine online singola marca)
========================================================================
${sectionBody}
`;
  const out = path.join(ROOT, filename);
  fs.writeFileSync(out, content, 'utf8');
  console.log('Wrote', out);
}

async function exportSalesOrders() {
  const orders = await erpList('Sales Order', {
    fields: ['name', 'transaction_date', 'customer_name', 'status', 'docstatus'],
    filters: [['docstatus', '=', 1]],
    limit: 0
  });
  const orderNames = new Set(orders.map((o) => o.name));
  const items = await erpList('Sales Order Item', {
    fields: ['parent', 'item_code', 'item_name', 'description', 'brand', 'custom_brand', 'custom_manufacturer', 'qty'],
    limit: 0
  });

  const rows = [];
  for (const item of items) {
    if (!orderNames.has(item.parent)) continue;
    const brand = pickBrandField(item);
    const part_number = pickPartNumber(item);
    if (!part_number) continue;
    rows.push({
      brand: brand || 'Senza marca',
      part_number,
      description: String(item.description || item.item_name || part_number).trim(),
      refs: [item.parent]
    });
  }
  return dedupeRows(rows);
}

async function exportQuotations() {
  const quotes = await erpList('Quotation', {
    fields: ['name', 'status', 'transaction_date', 'customer_name', 'docstatus'],
    filters: [['docstatus', '=', 1]],
    limit: 0
  });
  const quoteByName = new Map();
  for (const q of quotes) {
    if (QUOTE_SKIP_STATUSES.has(String(q.status || ''))) continue;
    quoteByName.set(q.name, q);
  }

  const items = await erpList('Quotation Item', {
    fields: ['parent', 'item_code', 'item_name', 'description', 'brand', 'custom_brand', 'custom_manufacturer', 'qty'],
    limit: 0
  });

  const rows = [];
  for (const item of items) {
    if (!quoteByName.has(item.parent)) continue;
    const brand = pickBrandField(item);
    const part_number = pickPartNumber(item);
    if (!part_number) continue;
    rows.push({
      brand: brand || 'Senza marca',
      part_number,
      description: String(item.description || item.item_name || part_number).trim(),
      refs: [item.parent]
    });
  }
  return dedupeRows(rows);
}

function dedupeRows(rows) {
  const map = new Map();
  for (const row of rows) {
    const key = `${normalizeBrandKey(row.brand)}|${normalizePartKey(row.part_number)}`;
    if (!map.has(key)) {
      map.set(key, { ...row, refs: [...(row.refs || [])] });
      continue;
    }
    const existing = map.get(key);
    for (const ref of row.refs || []) {
      if (!existing.refs.includes(ref)) existing.refs.push(ref);
    }
  }
  return [...map.values()];
}

async function main() {
  if (!API_KEY || !API_SECRET) {
    console.error('Missing ERPNEXT_API_KEY / ERPNEXT_API_SECRET (or FRAPPE_* aliases).');
    console.error('Create API keys in ERPNext → User → API Access, then rerun this script.');
    process.exit(1);
  }

  console.log('Fetching Sales Orders from', BASE_URL);
  const orderRows = await exportSalesOrders();
  const ordersGrouped = groupRows(orderRows, 'ordine', 'ordini');
  writeCatalogFile(
    'ORDINI_ARTICOLI_MARCHE.txt',
    'ORDINI CLIENTE — CATALOGO MARCHE E CODICI ARTICOLO',
    { scope: 'ordini ricevuti con marche e codici articolo', countLabel: 'Ordini cliente' },
    ordersGrouped.body,
    'ordini'
  );

  console.log('Fetching Quotations from', BASE_URL);
  const quoteRows = await exportQuotations();
  const quotesGrouped = groupRows(quoteRows, 'preventivo', 'preventivi');
  writeCatalogFile(
    'OFFERTE_ARTICOLI_MARCHE.txt',
    'PREVENTIVI CLIENTE — CATALOGO MARCHE E CODICI ARTICOLO',
    { scope: 'preventivi inviati con marche e codici articolo', countLabel: 'Preventivi cliente' },
    quotesGrouped.body,
    'preventivi'
  );

  console.log('Done —', orderRows.length, 'ordered parts,', quoteRows.length, 'quoted parts (before merge dedupe).');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
