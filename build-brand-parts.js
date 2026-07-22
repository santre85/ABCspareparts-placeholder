'use strict';

const fs = require('fs');
const path = require('path');
const { slugify } = require('./brand-slug.js');
const {
  loadListiniParts,
  loadPublishedListiniData,
  writeListinoDataFile,
  INLINE_LISTINO_MAX
} = require('./import-listino.js');

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

function supplementFromListini(rowsBySlug, brandSlugs, caseMap, listiniBySlug) {
  if (!listiniBySlug || !listiniBySlug.size) return;

  const slugToBrand = new Map();
  for (const [name, slug] of Object.entries(brandSlugs)) {
    slugToBrand.set(slug, name);
  }

  for (const [slug, listParts] of listiniBySlug) {
    const brand = slugToBrand.get(slug) || resolveBrand(slug, brandSlugs).brand;
    const brand_slug = slugToBrand.has(slug) ? slug : resolveBrand(brand, brandSlugs).brand_slug;
    const parts = mergePartLists(
      listParts.map((part) => attachCaseSlug(part, brand, caseMap))
    );

    if (!rowsBySlug.has(brand_slug)) {
      rowsBySlug.set(brand_slug, { brand, brand_slug, parts: [] });
    }
    const row = rowsBySlug.get(brand_slug);
    row.brand = brand;

    if (parts.length > INLINE_LISTINO_MAX) {
      const meta = writeListinoDataFile(brand_slug, brand, parts);
      row.listino = {
        file: meta.file,
        count: meta.count,
        preview: meta.preview,
        examples: meta.examples || []
      };
      // Keep existing ERP/case parts inline; do not dump 100k+ codes into HTML.
      console.log(`listino ${brand_slug}: ${meta.count} codes → ${meta.file} (search UI, no prices)`);
    } else {
      row.parts = mergePartLists([...row.parts, ...parts]);
    }
  }
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
  // Prefer fresh files in listini/; fall back to published listini-data/*.json
  // so rebuilds keep large catalogs when the XLSX is not in the repo.
  const listiniBySlug = loadListiniParts();
  const published = loadPublishedListiniData();
  for (const [slug, parts] of published) {
    if (!listiniBySlug.has(slug)) listiniBySlug.set(slug, parts);
  }
  supplementFromListini(rowsBySlug, brandSlugs, caseMap, listiniBySlug);

  const brands = [...rowsBySlug.values()].sort((a, b) => a.brand.localeCompare(b.brand, undefined, { sensitivity: 'base' }));
  const listiniCount = [...listiniBySlug.values()].reduce((n, parts) => n + parts.length, 0);
  return {
    source: 'ORDINI_ARTICOLI_MARCHE.txt + OFFERTE_ARTICOLI_MARCHE.txt + listini/',
    generated: new Date().toISOString().slice(0, 10),
    listini_files: listiniCount,
    brands
  };
}

function formatPartPreview(row, limit = 4) {
  if (row.listino?.count) {
    const preview = (row.listino.preview || []).slice(0, limit).join(', ');
    return `${preview} (+${row.listino.count} listino codes, search on page)`;
  }
  const parts = row.parts || [];
  const shown = parts.slice(0, limit).map((p) => p.part_number);
  const extra = parts.length > limit ? ` (+${parts.length - limit} more)` : '';
  return `${shown.join(', ')}${extra}`;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function partPageUrl(brandSlug, partNumber) {
  return `${BASE}/marche/${brandSlug}.html?part=${encodeURIComponent(partNumber)}`;
}

function writeSitemapBrandParts(brands) {
  const langs = ['it', 'de', 'en', 'es', 'fr'];
  let body = '';
  for (const row of brands) {
    if (!row.brand_slug) continue;
    if (!row.parts?.length && !row.listino?.count) continue;
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

/** Max URLs per sitemap file (Google limit is 50 000). */
const SITEMAP_URL_LIMIT = 45000;

function writeSitemapPartCodes(brands) {
  const langs = ['it', 'de', 'en', 'es', 'fr'];
  let body = '';
  let urlCount = 0;
  for (const row of brands) {
    if (!row.brand_slug) continue;
    const partNums = [];
    for (const part of row.parts || []) {
      if (part.part_number) partNums.push(part.part_number);
    }
    // High-priority samples with hreflang (full listini go into shard files).
    for (const code of row.listino?.preview || []) {
      if (code) partNums.push(code);
    }
    const seen = new Set();
    for (const partNumber of partNums) {
      const key = String(partNumber).toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const loc = partPageUrl(row.brand_slug, partNumber);
      body += '  <url>\n';
      body += `    <loc>${escapeXml(loc)}</loc>\n`;
      for (const lang of langs) {
        body += `    <xhtml:link rel="alternate" hreflang="${lang}" href="${escapeXml(`${loc}&lang=${lang}`)}"/>\n`;
      }
      body += `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(loc)}"/>\n`;
      body += `    <lastmod>${TODAY}</lastmod>\n`;
      body += '    <changefreq>weekly</changefreq>\n';
      body += '    <priority>0.75</priority>\n';
      body += '  </url>\n';
      urlCount++;
    }
  }
  const xml = `---
layout: none
---
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${body}</urlset>
`;
  fs.writeFileSync(path.join(ROOT, 'sitemap-part-codes.xml'), xml, 'utf8');
  return urlCount;
}

/**
 * Write compact sitemap shards covering every listino code (no hreflang),
 * so search engines / AI crawlers can discover deep-links beyond the sample set.
 * @returns {{ files: string[], urlCount: number }}
 */
function writeSitemapListinoShards(brands) {
  // Remove previous shards so renames/count changes do not leave orphans.
  for (const name of fs.readdirSync(ROOT)) {
    if (/^sitemap-parts-[a-z0-9-]+(?:-\d+)?\.xml$/i.test(name)) {
      fs.unlinkSync(path.join(ROOT, name));
    }
  }

  const files = [];
  let urlCount = 0;

  for (const row of brands) {
    if (!row.brand_slug || !row.listino?.file || !row.listino?.count) continue;
    const dataPath = path.join(ROOT, row.listino.file);
    if (!fs.existsSync(dataPath)) {
      console.warn('Missing listino data for sitemap:', row.listino.file);
      continue;
    }
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const codes = Array.isArray(data.codes) ? data.codes : [];
    if (!codes.length) continue;

    const shardCount = Math.ceil(codes.length / SITEMAP_URL_LIMIT);
    for (let shard = 0; shard < shardCount; shard++) {
      const chunk = codes.slice(shard * SITEMAP_URL_LIMIT, (shard + 1) * SITEMAP_URL_LIMIT);
      let body = '';
      for (const code of chunk) {
        if (!code) continue;
        const loc = partPageUrl(row.brand_slug, code);
        body += '  <url>\n';
        body += `    <loc>${escapeXml(loc)}</loc>\n`;
        body += `    <lastmod>${TODAY}</lastmod>\n`;
        body += '    <changefreq>monthly</changefreq>\n';
        body += '    <priority>0.65</priority>\n';
        body += '  </url>\n';
        urlCount++;
      }
      const fileName =
        shardCount === 1
          ? `sitemap-parts-${row.brand_slug}.xml`
          : `sitemap-parts-${row.brand_slug}-${shard + 1}.xml`;
      const xml = `---
layout: none
---
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}</urlset>
`;
      fs.writeFileSync(path.join(ROOT, fileName), xml, 'utf8');
      files.push(fileName);
      console.log(`${fileName}: ${chunk.length} URLs (${row.brand})`);
    }
  }

  return { files, urlCount };
}

function writeSitemapIndex(listinoSitemapFiles = []) {
  const entries = [
    'sitemap.xml',
    'sitemap-brands.xml',
    'sitemap-brand-parts.xml',
    'sitemap-part-codes.xml',
    ...listinoSitemapFiles,
    'sitemap-cases.xml'
  ];
  let body = '';
  for (const file of entries) {
    body += '  <sitemap>\n';
    body += `    <loc>${BASE}/${file}</loc>\n`;
    body += `    <lastmod>${TODAY}</lastmod>\n`;
    body += '  </sitemap>\n';
  }
  const xml = `---
layout: none
---
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}</sitemapindex>
`;
  fs.writeFileSync(path.join(ROOT, 'sitemap-index.xml'), xml, 'utf8');
}

function updateRobotsTxt(listinoSitemapFiles = []) {
  const robotsPath = path.join(ROOT, 'robots.txt');
  let content = fs.readFileSync(robotsPath, 'utf8');
  const sitemapBlock = [
    'Sitemap: https://abcspareparts.eu/sitemap-index.xml',
    'Sitemap: https://abcspareparts.eu/sitemap.xml',
    'Sitemap: https://abcspareparts.eu/sitemap-brands.xml',
    'Sitemap: https://abcspareparts.eu/sitemap-brand-parts.xml',
    'Sitemap: https://abcspareparts.eu/sitemap-part-codes.xml',
    ...listinoSitemapFiles.map((f) => `Sitemap: https://abcspareparts.eu/${f}`),
    'Sitemap: https://abcspareparts.eu/sitemap-cases.xml'
  ].join('\n');

  if (/^Sitemap:/m.test(content)) {
    content = content.replace(/(?:^Sitemap:[^\n]*\n?)+/m, `${sitemapBlock}\n`);
  } else {
    content = `${content.trimEnd()}\n\n${sitemapBlock}\n`;
  }
  fs.writeFileSync(robotsPath, content.endsWith('\n') ? content : `${content}\n`, 'utf8');
}

function updateLlmsTxt(brands, listinoSitemapFiles = []) {
  const llmsPath = path.join(ROOT, 'llms.txt');
  let content = fs.readFileSync(llmsPath, 'utf8');
  const partCount = brands.reduce((sum, row) => sum + (row.parts?.length || 0) + (row.listino?.count || 0), 0);
  const intro = `## Brand pages with quotable part numbers\n\n${brands.length} manufacturer pages list specific part numbers from quotations, orders, or price lists — each code is clickable for a no-obligation enquiry (DE/EN/IT/ES/FR via \`?lang=\`). No list prices are published. Total: ${partCount} part references.\n`;
  const lines = brands.map((row) => {
    const url = `${BASE}/marche/${row.brand_slug}.html`;
    const preview = formatPartPreview(row);
    return `- [${row.brand}](${url}): ${preview}`;
  });
  const section = `${intro}\n${lines.join('\n')}\n`;

  if (/## Brand pages with quotable part numbers/.test(content)) {
    content = content.replace(/## Brand pages with quotable part numbers[\s\S]*?(?=\n## )/, section.trimEnd());
  } else {
    content = content.replace(/\n## Success story pages/, `\n${section}\n## Success story pages`);
  }

  const catalogLines = [];
  for (const row of brands) {
    if (!row.brand_slug) continue;
    if (row.listino?.count) {
      const examples = (row.listino.examples || []).slice(0, 6).join(', ');
      const exNote = examples ? `; try searching prefixes like ${examples}` : '';
      catalogLines.push(
        `- [${row.brand} listino](${BASE}/marche/${row.brand_slug}.html) — ${row.listino.count} codes searchable on page (no prices)${exNote}; data: ${BASE}/${row.listino.file}`
      );
      for (const code of row.listino.preview || []) {
        const url = partPageUrl(row.brand_slug, code);
        catalogLines.push(`- [${row.brand} ${code}](${url}) — sample code from manufacturer list (request quote, no price shown)`);
      }
    }
    for (const part of row.parts || []) {
      const url = partPageUrl(row.brand_slug, part.part_number);
      const desc = part.description && part.description !== part.part_number
        ? ` — ${part.description}`
        : '';
      catalogLines.push(`- [${row.brand} ${part.part_number}](${url})${desc}`);
    }
  }
  const catalogSection = `## Full part number catalog\n\nQuotable part references with direct enquiry links (\`?part=\` on brand pages). Large manufacturer listini publish a crawlable sample list on the brand page plus on-page search for the full catalog (codes only, no prices). Every listino code is also listed in XML sitemaps for search engines and AI crawlers:\n\n${catalogLines.join('\n')}\n`;

  if (/## Full part number catalog/.test(content)) {
    content = content.replace(/## Full part number catalog[\s\S]*?(?=\n## )/, catalogSection.trimEnd());
  } else {
    content = content.replace(/\n## Success story pages/, `\n${catalogSection}\n## Success story pages`);
  }

  const brandPartsCount = brands.filter((r) => (r.parts?.length || 0) + (r.listino?.count || 0) > 0).length;
  const listinoSitemapLines = listinoSitemapFiles.length
    ? listinoSitemapFiles
        .map((f) => {
          const label = f
            .replace(/^sitemap-parts-/, '')
            .replace(/\.xml$/, '')
            .replace(/-\d+$/, '');
          return `- [${label} listino sitemap](${BASE}/${f})`;
        })
        .join('\n') + '\n'
    : '';
  const sitemapSection = `## XML sitemaps (search engines)\n\n- [Sitemap index](${BASE}/sitemap-index.xml)\n- [Brand pages with parts](${BASE}/sitemap-brand-parts.xml) — ${brandPartsCount} high-priority brand URLs\n- [Individual part codes (samples + ERP)](${BASE}/sitemap-part-codes.xml) — ERP/case parts plus listino sample codes\n${listinoSitemapLines}- [All brand pages](${BASE}/sitemap-brands.xml)\n- [Success stories](${BASE}/sitemap-cases.xml)\n`;

  if (/## XML sitemaps \(search engines\)/.test(content)) {
    content = content.replace(/## XML sitemaps \(search engines\)[\s\S]*?(?=\n## |$)/, sitemapSection.trimEnd());
  } else {
    content = content.replace(/\n## Optional/, `\n${sitemapSection}\n## Optional`);
  }

  fs.writeFileSync(llmsPath, content, 'utf8');
}

function main() {
  const output = buildBrandRows();
  // Drop empty brands (no inline parts and no listino)
  output.brands = output.brands.filter((r) => (r.parts && r.parts.length) || r.listino?.count);
  const outPath = path.join(ROOT, 'brand-order-parts.json');
  fs.writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  writeSitemapBrandParts(output.brands);
  const partUrlCount = writeSitemapPartCodes(output.brands);
  const listinoSitemaps = writeSitemapListinoShards(output.brands);
  writeSitemapIndex(listinoSitemaps.files);
  updateRobotsTxt(listinoSitemaps.files);
  updateLlmsTxt(output.brands, listinoSitemaps.files);

  const partCount = output.brands.reduce((sum, row) => sum + (row.parts?.length || 0) + (row.listino?.count || 0), 0);
  console.log('brand-order-parts.json:', output.brands.length, 'brands,', partCount, 'parts');
  console.log('sitemap-brand-parts.xml:', output.brands.length, 'URLs');
  console.log('sitemap-part-codes.xml:', partUrlCount, 'URLs');
  console.log('listino sitemap shards:', listinoSitemaps.files.length, 'files,', listinoSitemaps.urlCount, 'URLs');
  console.log('sitemap-index.xml + robots.txt + llms.txt updated');
  for (const row of output.brands) {
    const extra = row.listino?.count ? ` + listino ${row.listino.count}` : '';
    console.log(`  ${row.brand} (${row.brand_slug}): ${(row.parts || []).length}${extra}`);
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
  writeSitemapPartCodes,
  writeSitemapListinoShards,
  writeSitemapIndex,
  updateRobotsTxt,
  updateLlmsTxt,
  partPageUrl,
  SITEMAP_URL_LIMIT
};
