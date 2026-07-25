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
  // One clean brand URL only — no ?lang= / ?part= (client-side UX, not indexable variants).
  let body = '';
  for (const row of brands) {
    if (!row.brand_slug) continue;
    if (!row.parts?.length && !row.listino?.count) continue;
    const loc = `${BASE}/marche/${row.brand_slug}.html`;
    body += '  <url>\n';
    body += `    <loc>${loc}</loc>\n`;
    body += `    <lastmod>${TODAY}</lastmod>\n`;
    body += '    <changefreq>weekly</changefreq>\n';
    body += '    <priority>0.85</priority>\n';
    body += '  </url>\n';
  }
  const xml = `---
layout: none
---
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}</urlset>
`;
  fs.writeFileSync(path.join(ROOT, 'sitemap-brand-parts.xml'), xml, 'utf8');
}

/** Max URLs per sitemap file (Google limit is 50 000). Kept for compatibility. */
const SITEMAP_URL_LIMIT = 45000;

/**
 * Do NOT submit ?part= deep-links to Google (thin duplicates of the brand page).
 * Removes any legacy sitemap-part-codes.xml from previous builds.
 */
function writeSitemapPartCodes() {
  const legacy = path.join(ROOT, 'sitemap-part-codes.xml');
  if (fs.existsSync(legacy)) fs.unlinkSync(legacy);
  return 0;
}

/**
 * Do NOT publish one sitemap URL per listino code (~300k thin ?part= pages).
 * Codes stay searchable on the brand page; Google should index the brand URL only.
 * Deletes any legacy sitemap-parts-*.xml shards.
 * @returns {{ files: string[], urlCount: number }}
 */
function writeSitemapListinoShards() {
  for (const name of fs.readdirSync(ROOT)) {
    if (/^sitemap-parts-[a-z0-9-]+(?:-\d+)?\.xml$/i.test(name)) {
      fs.unlinkSync(path.join(ROOT, name));
    }
  }
  return { files: [], urlCount: 0 };
}

/** Discover listino shard sitemap files currently on disk. */
function listListinoSitemapFiles() {
  return fs
    .readdirSync(ROOT)
    .filter((name) => /^sitemap-parts-[a-z0-9-]+(?:-\d+)?\.xml$/i.test(name))
    .sort();
}

/**
 * Refresh lastmod dates in the root sitemap.xml (core site URLs).
 * Keeps Google Search Console / crawlers aware the main sitemap changed.
 */
function touchMainSitemap() {
  const p = path.join(ROOT, 'sitemap.xml');
  if (!fs.existsSync(p)) return;
  let xml = fs.readFileSync(p, 'utf8');
  xml = xml.replace(/<lastmod>[^<]+<\/lastmod>/g, `<lastmod>${TODAY}</lastmod>`);
  fs.writeFileSync(p, xml, 'utf8');
}

/**
 * Always rewrite sitemap-index.xml with indexable sitemaps only (no ?part= shards).
 * Call this from brand-parts, brand-pages, and cases builds so the index never drifts.
 */
function writeSitemapIndex() {
  // Drop legacy parameter sitemaps if still on disk.
  writeSitemapPartCodes();
  writeSitemapListinoShards();

  const entries = [
    'sitemap.xml',
    'sitemap-brands.xml',
    'sitemap-brand-parts.xml',
    'sitemap-cases.xml'
  ];

  let body = '';
  for (const file of entries) {
    if (file !== 'sitemap.xml' && !fs.existsSync(path.join(ROOT, file))) continue;
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
  touchMainSitemap();
  updateJekyllConfig([]);
}

/**
 * Keep _config.yml include + defaults in sync with listino sitemap shards
 * so GitHub Pages / Jekyll always publishes them.
 */
function updateJekyllConfig(listinoSitemapFiles) {
  const configPath = path.join(ROOT, '_config.yml');
  if (!fs.existsSync(configPath)) return;
  const shards = Array.isArray(listinoSitemapFiles) && listinoSitemapFiles.length
    ? [...listinoSitemapFiles].sort()
    : listListinoSitemapFiles();

  const includeBlock = [
    '  # BEGIN listino-sitemaps',
    ...shards.map((f) => `  - ${f}`),
    '  # END listino-sitemaps'
  ].join('\n');

  const defaultsBlock = [
    '  # BEGIN listino-sitemap-defaults',
    ...shards.map(
      (f) => `  - scope:
      path: "${f}"
    values:
      layout: none`
    ),
    '  # END listino-sitemap-defaults'
  ].join('\n');

  let content = fs.readFileSync(configPath, 'utf8');
  if (!/# BEGIN listino-sitemaps/.test(content) || !/# BEGIN listino-sitemap-defaults/.test(content)) {
    console.warn('_config.yml missing listino sitemap markers — skip auto-update');
    return;
  }
  content = content.replace(
    /  # BEGIN listino-sitemaps[\s\S]*?  # END listino-sitemaps/,
    includeBlock
  );
  content = content.replace(
    /  # BEGIN listino-sitemap-defaults[\s\S]*?  # END listino-sitemap-defaults/,
    defaultsBlock
  );
  fs.writeFileSync(configPath, content.endsWith('\n') ? content : `${content}\n`, 'utf8');
}

function updateRobotsTxt() {
  const robotsPath = path.join(ROOT, 'robots.txt');
  const content = `# robots.txt for abcspareparts.eu
# Index brand pages, hubs, and cases — not query-parameter deep links.

User-agent: *
Allow: /

# ?part= and ?lang= are client-side UX on the same HTML document.
# Canonical is always the clean /marche/{slug}.html URL — do not crawl variants.
Disallow: /*?part=
Disallow: /*?*part=
Disallow: /*?lang=
Disallow: /*?*lang=

# AI and search crawlers (common bots)
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: Bytespider
Allow: /

# Sitemaps (indexable URLs only)
Sitemap: https://abcspareparts.eu/sitemap-index.xml
Sitemap: https://abcspareparts.eu/sitemap.xml
Sitemap: https://abcspareparts.eu/sitemap-brands.xml
Sitemap: https://abcspareparts.eu/sitemap-brand-parts.xml
Sitemap: https://abcspareparts.eu/sitemap-cases.xml
`;
  fs.writeFileSync(robotsPath, content, 'utf8');
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
  const catalogSection = `## Full part number catalog\n\nQuotable part references. Large manufacturer listini publish a crawlable sample list on the brand page plus on-page search for the full catalog (codes only, no prices). Deep links with \`?part=\` open the enquiry form for humans/AI; Google Search Console sitemaps list only the clean brand page URL (canonical):\n\n${catalogLines.join('\n')}\n`;

  if (/## Full part number catalog/.test(content)) {
    content = content.replace(/## Full part number catalog[\s\S]*?(?=\n## )/, catalogSection.trimEnd());
  } else {
    content = content.replace(/\n## Success story pages/, `\n${catalogSection}\n## Success story pages`);
  }

  const brandPartsCount = brands.filter((r) => (r.parts?.length || 0) + (r.listino?.count || 0) > 0).length;
  const sitemapSection = `## XML sitemaps (search engines)\n\nIndexable URLs only (no \`?part=\` / \`?lang=\` variants — those are client-side UX):\n\n- [Sitemap index](${BASE}/sitemap-index.xml)\n- [Brand pages with parts](${BASE}/sitemap-brand-parts.xml) — ${brandPartsCount} high-priority brand URLs\n- [All brand pages](${BASE}/sitemap-brands.xml)\n- [Success stories](${BASE}/sitemap-cases.xml)\n- [Core pages](${BASE}/sitemap.xml)\n`;

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
  writeSitemapPartCodes();
  writeSitemapListinoShards();
  writeSitemapIndex();
  updateRobotsTxt();
  updateLlmsTxt(output.brands);

  const partCount = output.brands.reduce((sum, row) => sum + (row.parts?.length || 0) + (row.listino?.count || 0), 0);
  console.log('brand-order-parts.json:', output.brands.length, 'brands,', partCount, 'parts');
  console.log('sitemap-brand-parts.xml:', output.brands.length, 'URLs');
  console.log('Removed legacy ?part= sitemaps (listino shards + part-codes)');
  console.log('sitemap-index.xml + sitemap.xml + robots.txt + llms.txt updated');
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
  listListinoSitemapFiles,
  touchMainSitemap,
  updateJekyllConfig,
  writeSitemapIndex,
  updateRobotsTxt,
  updateLlmsTxt,
  partPageUrl,
  SITEMAP_URL_LIMIT
};
