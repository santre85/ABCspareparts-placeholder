'use strict';

const fs = require('fs');
const path = require('path');
const { slugify } = require('./brand-slug.js');

const ROOT = __dirname;
const BASE = 'https://abcspareparts.eu';
const MAX_DESC_LEN = 120;
const TODAY = new Date().toISOString().slice(0, 10);

/** ERP brand label → canonical brand name in brand-slugs.json */
const BRAND_ALIASES = {
  'ATLAS COPCO SCA': 'Atlas Copco',
  'HERBORNER PUMPEN': 'HERBORNER',
  'Hi force': 'Hi-Force Hydraulics',
  'Hübner': 'Hübner Elektromaschinen AG',
  'Hubner': 'Hübner Elektromaschinen AG'
};

/** Ordini without brand → site brand */
const ORPHAN_BRAND_MAP = {
  'Senza marca': 'Radio Energie'
};

/** Ordini part number corrections */
const ORPHAN_PART_FIXES = {
  TTN0507: {
    part_number: 'TTN0507RE.0',
    description: 'RE.O110 1CB 0.007 CA'
  }
};

function normalizeKey(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

function normalizePart(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
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

  if (!desc || desc === pn) return pn;
  if (desc.startsWith(pn)) {
    desc = desc.slice(pn.length).replace(/^[\s|,–—-]+/, '').trim();
  }
  if (!desc || desc === pn) return pn;
  return truncateDescription(desc);
}

function parseCatalogSectionA(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const brands = new Map();

  for (const section of text.split(/^--- MARCA: /m).slice(1)) {
    const headerEnd = section.indexOf(' ---');
    if (headerEnd < 0) continue;
    const brandName = section.slice(0, headerEnd).replace(/\s*\(\d+ codici.*/, '').trim();
    const body = section.slice(headerEnd);
    const lineRe = /^  (.+?) \| (.+?)  →  (?:ordini|preventivi): .+$/gm;
    let match;
    while ((match = lineRe.exec(body)) !== null) {
      if (!brands.has(brandName)) brands.set(brandName, []);
      brands.get(brandName).push({
        part_number: match[1].trim(),
        description: match[2].trim()
      });
    }
  }

  return brands;
}

function loadBrandSlugs() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'brand-slugs.json'), 'utf8'));
}

function loadCaseSlugMap() {
  const map = new Map();
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(ROOT, 'supply-cases.json'), 'utf8'));
    const rows = Array.isArray(raw) ? raw : (raw.cases || []);
    for (const row of rows) {
      if (!row.slug || !row.brand) continue;
      const partField = String(row.part_number || '');
      for (const part of partField.split(/\s*·\s*|\s*,\s*/)) {
        const token = part.trim();
        if (!token) continue;
        map.set(`${normalizeKey(row.brand)}|${normalizePart(token)}`, row.slug);
      }
    }
  } catch (error) {
    console.warn('supply-cases.json:', error.message);
  }
  return map;
}

function resolveBrand(erpBrand, brandSlugs) {
  let brandName = ORPHAN_BRAND_MAP[erpBrand] || BRAND_ALIASES[erpBrand] || erpBrand;
  if (brandSlugs[brandName]) {
    return { brand: brandName, brand_slug: brandSlugs[brandName] };
  }

  for (const [name, slug] of Object.entries(brandSlugs)) {
    if (normalizeKey(name) === normalizeKey(brandName)) {
      return { brand: name, brand_slug: slug };
    }
  }

  const fallbackSlug = slugify(brandName);
  console.warn('Brand not found in brand-slugs.json, using slugify:', erpBrand, '→', brandName, '→', fallbackSlug);
  return { brand: brandName, brand_slug: fallbackSlug };
}

function attachCaseSlug(part, brandName, caseMap) {
  const keys = [
    `${normalizeKey(brandName)}|${normalizePart(part.part_number)}`,
    `${normalizeKey(BRAND_ALIASES[brandName] || '')}|${normalizePart(part.part_number)}`
  ];
  for (const key of keys) {
    if (caseMap.has(key)) {
      return { ...part, case_slug: caseMap.get(key) };
    }
  }
  return part;
}

function mergePartLists(parts) {
  const byPart = new Map();
  for (const raw of parts) {
    const partNumber = String(raw.part_number || '').trim();
    if (!partNumber) continue;

    const next = {
      part_number: partNumber,
      description: cleanDescription(partNumber, raw.description)
    };
    if (raw.case_slug) next.case_slug = raw.case_slug;

    const key = normalizePart(partNumber);
    const prev = byPart.get(key);
    if (!prev) {
      byPart.set(key, next);
      continue;
    }

    if (next.description.length > prev.description.length && next.description !== partNumber) {
      prev.description = next.description;
    }
    if (next.case_slug && !prev.case_slug) prev.case_slug = next.case_slug;
  }

  return [...byPart.values()].sort((a, b) => a.part_number.localeCompare(b.part_number, undefined, { sensitivity: 'base' }));
}

function supplementFromCases(rowsBySlug, brandSlugs, caseMap) {
  const raw = JSON.parse(fs.readFileSync(path.join(ROOT, 'supply-cases.json'), 'utf8'));
  const cases = Array.isArray(raw) ? raw : (raw.cases || []);

  for (const row of cases) {
    if (!row.slug || !row.brand) continue;
    const { brand, brand_slug } = resolveBrand(row.brand, brandSlugs);
    const partField = String(row.part_number || '');
    for (const token of partField.split(/\s*·\s*|\s*,\s*/)) {
      const partNumber = token.trim();
      if (!partNumber) continue;

      const part = {
        part_number: partNumber,
        description: cleanDescription(partNumber, row.part_number === partNumber ? row.title || partNumber : partNumber),
        case_slug: row.slug
      };

      if (!rowsBySlug.has(brand_slug)) {
        rowsBySlug.set(brand_slug, { brand, brand_slug, parts: [] });
      }
      const brandRow = rowsBySlug.get(brand_slug);
      brandRow.parts = mergePartLists([...brandRow.parts, part]);
    }
  }
}

function buildBrandRows() {
  const brandSlugs = loadBrandSlugs();
  const caseMap = loadCaseSlugMap();
  const ordiniBrands = parseCatalogSectionA(path.join(ROOT, 'ORDINI_ARTICOLI_MARCHE.txt'));
  const offerteBrands = parseCatalogSectionA(path.join(ROOT, 'OFFERTE_ARTICOLI_MARCHE.txt'));
  const erpBrands = new Set([...ordiniBrands.keys(), ...offerteBrands.keys()]);
  const rowsBySlug = new Map();

  for (const erpBrand of erpBrands) {
    const { brand, brand_slug } = resolveBrand(erpBrand, brandSlugs);
    const rawParts = [
      ...(ordiniBrands.get(erpBrand) || []),
      ...(offerteBrands.get(erpBrand) || [])
    ].map((part) => {
      const fix = ORPHAN_PART_FIXES[normalizePart(part.part_number)];
      if (fix) {
        return attachCaseSlug({
          part_number: fix.part_number,
          description: fix.description
        }, brand, caseMap);
      }
      return attachCaseSlug(part, brand, caseMap);
    });

    if (!rawParts.length) continue;

    const parts = mergePartLists(rawParts).map((part) => attachCaseSlug(part, brand, caseMap));
    if (!rowsBySlug.has(brand_slug)) {
      rowsBySlug.set(brand_slug, { brand, brand_slug, parts: [] });
    }
    const row = rowsBySlug.get(brand_slug);
    row.parts = mergePartLists([...row.parts, ...parts]);
  }

  supplementFromCases(rowsBySlug, brandSlugs, caseMap);

  const brands = [...rowsBySlug.values()].sort((a, b) => a.brand.localeCompare(b.brand, undefined, { sensitivity: 'base' }));
  return {
    source: 'ORDINI_ARTICOLI_MARCHE.txt + OFFERTE_ARTICOLI_MARCHE.txt',
    generated: new Date().toISOString().slice(0, 10),
    brands
  };
}

function formatPartPreview(parts, limit = 4) {
  const shown = parts.slice(0, limit).map((p) => p.part_number);
  const extra = parts.length > limit ? ` (+${parts.length - limit} more)` : '';
  return `${shown.join(', ')}${extra}`;
}

function writeSitemapBrandParts(brands) {
  const langs = ['it', 'de', 'en', 'es', 'fr'];
  let body = '';
  for (const row of brands) {
    if (!row.brand_slug || !row.parts?.length) continue;
    const loc = `${BASE}/marche/${row.brand_slug}.html`;
    body += '  <url>\n';
    body += `    <loc>${loc}</loc>\n`;
    for (const lang of langs) {
      body += `    <xhtml:link rel="alternate" hreflang="${lang}" href="${loc}?lang=${lang}"/>\n`;
    }
    body += `    <xhtml:link rel="alternate" hreflang="x-default" href="${loc}"/>\n`;
    body += `    <lastmod>${TODAY}</lastmod>\n`;
    body += '    <changefreq>weekly</changefreq>\n';
    body += '    <priority>0.85</priority>\n';
    body += '  </url>\n';
  }
  const xml = `---
layout: none
---
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${body}</urlset>
`;
  fs.writeFileSync(path.join(ROOT, 'sitemap-brand-parts.xml'), xml, 'utf8');
}

function updateLlmsTxt(brands) {
  const llmsPath = path.join(ROOT, 'llms.txt');
  let content = fs.readFileSync(llmsPath, 'utf8');
  const partCount = brands.reduce((sum, row) => sum + row.parts.length, 0);
  const intro = `## Brand pages with quotable part numbers\n\n${brands.length} manufacturer pages list specific part numbers that ABCspareparts has quoted or supplied — each code is clickable for a no-obligation enquiry (DE/EN/IT/ES/FR via \`?lang=\`). Total: ${partCount} part references.\n`;
  const lines = brands.map((row) => {
    const url = `${BASE}/marche/${row.brand_slug}.html`;
    const preview = formatPartPreview(row.parts);
    return `- [${row.brand}](${url}): ${preview}`;
  });
  const section = `${intro}\n${lines.join('\n')}\n`;

  if (/## Brand pages with quotable part numbers/.test(content)) {
    content = content.replace(/## Brand pages with quotable part numbers[\s\S]*?(?=\n## )/, section.trimEnd());
  } else {
    content = content.replace(/\n## Success story pages/, `\n${section}\n## Success story pages`);
  }
  fs.writeFileSync(llmsPath, content, 'utf8');
}

function main() {
  const output = buildBrandRows();
  const outPath = path.join(ROOT, 'brand-order-parts.json');
  fs.writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  writeSitemapBrandParts(output.brands);
  updateLlmsTxt(output.brands);

  const partCount = output.brands.reduce((sum, row) => sum + row.parts.length, 0);
  console.log('brand-order-parts.json:', output.brands.length, 'brands,', partCount, 'parts');
  console.log('sitemap-brand-parts.xml:', output.brands.length, 'URLs');
  console.log('llms.txt: brand parts section updated');
  for (const row of output.brands) {
    console.log(`  ${row.brand} (${row.brand_slug}): ${row.parts.length}`);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  buildBrandRows,
  parseCatalogSectionA,
  cleanDescription,
  writeSitemapBrandParts,
  updateLlmsTxt
};
