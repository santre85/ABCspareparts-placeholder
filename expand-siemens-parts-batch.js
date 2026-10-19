'use strict';

/**
 * Curated Siemens /parts/ expansion (batch 1).
 * - All ERP/quotable Siemens codes with descriptions
 * - Listino HTML preview samples
 * - A few seeds per top listino series (3SU1, 1FK7, 3RT2, 6ES7, 6SL3, 3VA6)
 *
 * Does NOT mass-publish the full 91k listino.
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const MVP_PATH = path.join(ROOT, 'parts-mvp.json');
const ERP_PATH = path.join(ROOT, 'erp-items.json');
const LISTINO_PATH = path.join(ROOT, 'listini-data/siemens.json');
const BASE = 'https://abcspareparts.eu';

const SERIES_META = {
  '3SU1': {
    description: 'SIRIUS ACT Befehls- und Meldegerät (Serie 3SU1)',
    component_type: 'command_signaling'
  },
  '1FK7': {
    description: 'SIMOTICS S-1FK7 Servomotor (Serie 1FK7)',
    component_type: 'servo_motor'
  },
  '3RT2': {
    description: 'SIRIUS Schütz (Serie 3RT2)',
    component_type: 'contactor'
  },
  '6ES7': {
    description: 'SIMATIC S7 Baugruppe/Komponente (Serie 6ES7)',
    component_type: 'plc_module'
  },
  '6SL3': {
    description: 'SINAMICS Antriebskomponente (Serie 6SL3)',
    component_type: 'drive'
  },
  '3VA6': {
    description: '3VA Kompaktleistungsschalter (Serie 3VA6)',
    component_type: 'circuit_breaker'
  }
};

const SERIES_SEEDS_PER_PREFIX = 5;

function partSlug(partNumber) {
  let s = String(partNumber)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f\u00ad]/g, '')
    .replace(/\(NEW,\s*ORIGINAL PACKAGE\)/gi, 'new-original-package')
    .replace(/\(NEW\)/gi, 'new')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')
    .toLowerCase();
  if (!s) s = 'part';
  if (s.length > 96) s = s.slice(0, 96).replace(/-+$/g, '');
  return s;
}

function normalizeKey(partNumber) {
  return String(partNumber)
    .normalize('NFKD')
    .replace(/[\u00ad]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanDescription(desc, partNumber) {
  let d = String(desc || '')
    .replace(/\*+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!d || d === partNumber) return '';
  // Drop redundant brand+code-only descriptions
  const onlyCode = new RegExp(`^Siemens\\s+${String(partNumber).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
  if (onlyCode.test(d)) return '';
  if (d.length > 160) d = `${d.slice(0, 157).trim()}…`;
  return d;
}

function guessSeriesMeta(partNumber) {
  const compact = String(partNumber).replace(/[\s\u00ad]/g, '').toUpperCase();
  for (const prefix of Object.keys(SERIES_META)) {
    if (compact.startsWith(prefix)) return { prefix, ...SERIES_META[prefix] };
  }
  return null;
}

function makeEntry({ partNumber, description, reasons, caseSlug, componentType, productSchema }) {
  const slug = partSlug(partNumber);
  const pathRel = `parts/siemens/${slug}.html`;
  return {
    brand: 'Siemens',
    brand_slug: 'siemens',
    part_number: partNumber,
    part_slug: slug,
    description: description || '',
    case_slug: caseSlug || null,
    component_type: componentType || null,
    selection_reasons: reasons,
    product_schema: productSchema !== false,
    path: pathRel,
    canonical: `${BASE}/${pathRel}`
  };
}

function main() {
  const mvp = JSON.parse(fs.readFileSync(MVP_PATH, 'utf8'));
  const existing = mvp.parts || [];
  const byKey = new Map();
  for (const p of existing) {
    byKey.set(`${p.brand_slug}|${normalizeKey(p.part_number)}`, p);
  }

  const usedSlugs = new Set(existing.map((p) => `${p.brand_slug}|${p.part_slug}`));
  const added = [];

  function upsert(entry) {
    const key = `siemens|${normalizeKey(entry.part_number)}`;
    let slug = entry.part_slug;
    let n = 2;
    while (usedSlugs.has(`siemens|${slug}`) && (!byKey.has(key) || byKey.get(key).part_slug !== slug)) {
      slug = `${entry.part_slug}-${n}`;
      n += 1;
    }
    entry.part_slug = slug;
    entry.path = `parts/siemens/${slug}.html`;
    entry.canonical = `${BASE}/${entry.path}`;

    if (byKey.has(key)) {
      const prev = byKey.get(key);
      // Keep success-case / richer existing MVP rows; merge reasons.
      const reasons = Array.from(new Set([...(prev.selection_reasons || []), ...entry.selection_reasons]));
      const merged = {
        ...prev,
        description: prev.description || entry.description,
        case_slug: prev.case_slug || entry.case_slug,
        component_type: prev.component_type || entry.component_type,
        selection_reasons: reasons,
        product_schema: prev.product_schema !== false
      };
      byKey.set(key, merged);
      return;
    }
    usedSlugs.add(`siemens|${slug}`);
    byKey.set(key, entry);
    added.push(entry.part_number);
  }

  // 1) ERP / quotable Siemens codes
  const erp = JSON.parse(fs.readFileSync(ERP_PATH, 'utf8'));
  const siemensErp = (erp.brands || []).find((b) => b.brand_slug === 'siemens');
  if (!siemensErp) throw new Error('Siemens brand missing in erp-items.json');

  for (const part of siemensErp.parts || []) {
    const pn = String(part.part_number || '').trim();
    if (!pn) continue;
    const series = guessSeriesMeta(pn);
    let desc = cleanDescription(part.description, pn);
    if (!desc && series) desc = series.description;
    if (!desc) desc = 'Industrieersatzteil Siemens – Anfrage ohne Preisangabe';
    upsert(
      makeEntry({
        partNumber: pn,
        description: desc,
        reasons: ['rfq_order_history', 'unique_description'],
        componentType: series?.component_type || null
      })
    );
  }

  const listino = JSON.parse(fs.readFileSync(LISTINO_PATH, 'utf8'));
  const listinoSet = new Set((listino.codes || []).map((c) => normalizeKey(c)));

  // 2) Listino preview samples (already in brand-page HTML)
  for (const code of listino.preview || []) {
    const pn = String(code || '').trim();
    if (!pn || !listinoSet.has(normalizeKey(pn))) continue;
    const series = guessSeriesMeta(pn);
    upsert(
      makeEntry({
        partNumber: pn,
        description: series ? series.description : 'Siemens Katalogreferenz (Listino-Beispiel)',
        reasons: ['listino_preview_sample', 'unique_description'],
        componentType: series?.component_type || null
      })
    );
  }

  // 3) Series seeds from top prefixes
  for (const [prefix, meta] of Object.entries(SERIES_META)) {
    const matches = (listino.codes || []).filter((c) =>
      String(c).replace(/[\s\u00ad]/g, '').toUpperCase().startsWith(prefix)
    );
    let taken = 0;
    for (const code of matches) {
      if (taken >= SERIES_SEEDS_PER_PREFIX) break;
      const key = `siemens|${normalizeKey(code)}`;
      if (byKey.has(key)) continue;
      upsert(
        makeEntry({
          partNumber: code,
          description: meta.description,
          reasons: ['listino_series_seed', 'unique_description'],
          componentType: meta.component_type
        })
      );
      taken += 1;
    }
  }

  const nextParts = Array.from(byKey.values()).sort((a, b) => {
    const brandCmp = String(a.brand_slug).localeCompare(String(b.brand_slug));
    if (brandCmp) return brandCmp;
    return String(a.part_number).localeCompare(String(b.part_number), undefined, { sensitivity: 'base' });
  });

  const siemensCount = nextParts.filter((p) => p.brand_slug === 'siemens').length;
  mvp.version = Number(mvp.version || 1) + 1;
  mvp.generated = new Date().toISOString().slice(0, 10);
  mvp.policy =
    'Curated /parts/ pages only: RFQ/order history, success cases, and limited listino preview/series seeds with unique copy. No full-listino mass expansion. No invented price/availability/Offer.';
  mvp.count = nextParts.length;
  mvp.parts = nextParts;
  mvp.batches = mvp.batches || {};
  mvp.batches.siemens_batch_1 = {
    added_part_numbers: added,
    siemens_total: siemensCount,
    note: 'ERP quotable + listino preview + 5 seeds per series 3SU1/1FK7/3RT2/6ES7/6SL3/3VA6'
  };

  fs.writeFileSync(MVP_PATH, `${JSON.stringify(mvp, null, 2)}\n`, 'utf8');
  console.log(`parts-mvp.json: ${existing.length} → ${nextParts.length} (Siemens pages: ${siemensCount}, newly added: ${added.length})`);
}

main();
