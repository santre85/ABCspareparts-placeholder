'use strict';

/**
 * Generate MVP /parts/{brand}/{part}.html pages from parts-mvp.json.
 * Quote-only: no prices, availability, or Offer schema.
 * Product JSON-LD only when part has specific verifiable name/description/SKU.
 */

const fs = require('fs');
const path = require('path');
const { BASE, hreflangLinks, canonicalUrl, ICON_LINKS } = require('./seo-config.js');
const { writeSitemapIndex, touchMainSitemap } = require('./build-brand-parts.js');
const { FOOTER_CSS, buildFooterHtml } = require('./site-footer.js');

const ROOT = __dirname;
const TODAY = new Date().toISOString().slice(0, 10);
const MVP_PATH = path.join(ROOT, 'parts-mvp.json');
const PARTS_DIR = path.join(ROOT, 'parts');
const SITEMAP_PARTS = path.join(ROOT, 'sitemap-parts.xml');

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(s) {
  return escapeHtml(s).replace(/'/g, '&#39;');
}

function loadMvp() {
  if (!fs.existsSync(MVP_PATH)) {
    throw new Error('parts-mvp.json missing — curate MVP list first');
  }
  const data = JSON.parse(fs.readFileSync(MVP_PATH, 'utf8'));
  const parts = data.parts || [];
  if (parts.length < 50 || parts.length > 100) {
    throw new Error(`MVP part count ${parts.length} outside 50–100 policy window`);
  }
  return data;
}

function uniqueTitle(part) {
  const brand = part.brand;
  const code = part.part_number;
  let shortDesc = String(part.description || '')
    .replace(/\*+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  // Drop redundant brand/code prefixes already in the title.
  shortDesc = shortDesc
    .replace(new RegExp(`^${brand}\\s+`, 'i'), '')
    .replace(new RegExp(String(code).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'ig'), ' ')
    .replace(/\s+/g, ' ')
    .trim();
  shortDesc = shortDesc.slice(0, 48).trim();
  if (shortDesc && shortDesc.toLowerCase() !== String(code).toLowerCase()) {
    return `${brand} ${code} – ${shortDesc} | ABCspareparts`;
  }
  return `${brand} ${code} Ersatzteil anfragen | ABCspareparts`;
}

function uniqueDescription(part) {
  const brand = part.brand;
  const code = part.part_number;
  const desc = String(part.description || '').replace(/\*+/g, ' ').replace(/\s+/g, ' ').trim();
  const base = desc
    ? `${brand} Teilenummer ${code}: ${desc}. Unverbindliche Anfrage bei ABCspareparts – keine Preise auf der Seite.`
    : `${brand} Teilenummer ${code}: unverbindliche Anfrage bei ABCspareparts. Verfügbarkeit und Konditionen nach Prüfung.`;
  return base.slice(0, 158);
}

function uniqueH1(part) {
  const brand = part.brand;
  const code = part.part_number;
  let desc = String(part.description || '').replace(/\*+/g, ' ').replace(/\s+/g, ' ').trim();
  desc = desc
    .replace(new RegExp(`^${brand}\\s+`, 'i'), '')
    .replace(new RegExp(String(code).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'ig'), ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (desc && desc.toLowerCase() !== String(code).toLowerCase()) {
    const short = desc.length > 70 ? `${desc.slice(0, 67).trim()}…` : desc;
    return `${brand} ${code} – ${short}`;
  }
  return `${brand} ${code} – Industrieersatzteil`;
}

function buildProductJsonLd(part, pageUrl) {
  if (part.product_schema === false) return null;
  const name = uniqueH1(part);
  const description = uniqueDescription(part);
  const product = {
    '@type': 'Product',
    '@id': `${pageUrl}#product`,
    name,
    sku: part.part_number,
    mpn: part.part_number,
    description,
    brand: { '@type': 'Brand', name: part.brand },
    url: pageUrl
  };
  if (part.component_type) {
    product.category = part.component_type;
  }
  // Intentionally no offers / price / availability
  return product;
}

function buildPageHtml(part) {
  const pageUrl = canonicalUrl(part.path);
  const brandUrl = canonicalUrl(`marche/${part.brand_slug}.html`);
  const title = uniqueTitle(part);
  const metaDesc = uniqueDescription(part);
  const h1 = uniqueH1(part);
  const descPlain = String(part.description || '').replace(/\*+/g, ' ').replace(/\s+/g, ' ').trim();
  const product = buildProductJsonLd(part, pageUrl);

  const graph = [
    {
      '@id': `${BASE}/#organization`,
      '@type': 'Organization',
      name: 'ABCspareparts',
      url: `${BASE}/`,
      logo: { '@type': 'ImageObject', url: `${BASE}/logo.png` }
    },
    {
      '@type': 'WebPage',
      '@id': `${pageUrl}#webpage`,
      url: pageUrl,
      name: h1,
      description: metaDesc,
      inLanguage: 'de',
      isPartOf: { '@id': `${BASE}/#website` },
      about: { '@type': 'Brand', name: part.brand },
      publisher: { '@id': `${BASE}/#organization` },
      primaryImageOfPage: { '@type': 'ImageObject', url: `${BASE}/logo.png` },
      dateModified: TODAY,
      breadcrumb: { '@id': `${pageUrl}#breadcrumb` }
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${pageUrl}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE}/` },
        { '@type': 'ListItem', position: 2, name: 'Marken', item: `${BASE}/marche.html` },
        { '@type': 'ListItem', position: 3, name: part.brand, item: brandUrl },
        { '@type': 'ListItem', position: 4, name: part.part_number, item: pageUrl }
      ]
    }
  ];
  if (product) {
    graph[1].mainEntity = { '@id': `${pageUrl}#product` };
    graph.push(product);
  }

  const caseBlock = part.case_slug
    ? `<p class="part-case">Verwandte Erfolgsgeschichte: <a href="../../casi/${escapeAttr(part.case_slug)}.html">${escapeHtml(part.case_slug)}</a></p>`
    : '';

  const reasons = (part.selection_reasons || []).join(', ');

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeAttr(metaDesc)}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <link rel="canonical" href="${pageUrl}">
  ${ICON_LINKS}
  <link rel="alternate" type="text/plain" href="${BASE}/llms.txt" title="Site summary for AI assistants">
  ${hreflangLinks(pageUrl)}
  <meta property="og:type" content="website">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:title" content="${escapeAttr(title)}">
  <meta property="og:description" content="${escapeAttr(metaDesc)}">
  <meta property="og:image" content="${BASE}/logo.png">
  <meta property="og:site_name" content="ABCspareparts">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeAttr(title)}">
  <meta name="twitter:description" content="${escapeAttr(metaDesc)}">
  <meta name="twitter:image" content="${BASE}/logo.png">
  <script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })}</script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 820px; margin: 0 auto; padding: 0 1.5rem; }
    .page-hero { background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); color: #fff; padding: 2.5rem 1.5rem 2rem; }
    .breadcrumb { font-size: 0.9rem; opacity: 0.95; margin-bottom: 1rem; }
    .breadcrumb a { color: #e67e22; text-decoration: none; font-weight: 600; }
    .breadcrumb a:hover { text-decoration: underline; }
    .page-hero h1 { font-size: clamp(1.25rem, 3.6vw, 1.85rem); line-height: 1.35; margin-bottom: 0.75rem; word-wrap: break-word; }
    .page-hero .lead { max-width: 720px; font-size: 1.02rem; opacity: 0.95; }
    .part-body { padding: 2rem 1.5rem 2.5rem; }
    .part-body p { margin-bottom: 1rem; color: #444; }
    .part-meta { background: #f0f6fb; border: 1px solid #dce8f4; border-radius: 10px; padding: 1.1rem 1.15rem; margin-bottom: 1.5rem; }
    .part-meta dt { font-weight: 600; color: #1e3a5f; }
    .part-meta dd { margin: 0 0 0.65rem; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; color: #1e3a5f; }
    .part-meta dd.plain { font-family: inherit; color: #444; }
    .cta-row { display: flex; flex-wrap: wrap; gap: 0.75rem; margin: 1.5rem 0 0.5rem; }
    .cta-primary, .cta-secondary { display: inline-block; padding: 0.75rem 1.35rem; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 0.95rem; }
    .cta-primary { background: #e67e22; color: #fff !important; }
    .cta-primary:hover { background: #d35400; }
    .cta-secondary { background: #1e3a5f; color: #fff !important; }
    .cta-secondary:hover { background: #2d5a87; }
    .note { font-size: 0.9rem; color: #555; }
    .part-case a { color: #1e3a5f; font-weight: 600; }
${FOOTER_CSS}
  </style>
</head>
<body>
  <header class="page-hero">
    <div class="container">
      <nav class="breadcrumb" aria-label="Brotkrumen">
        <a href="../../">Home</a> · <a href="../../marche.html">Marken</a> · <a href="../../marche/${escapeAttr(part.brand_slug)}.html">${escapeHtml(part.brand)}</a> · ${escapeHtml(part.part_number)}
      </nav>
      <h1>${escapeHtml(h1)}</h1>
      <p class="lead">Unverbindliche Anfrage für diese Teilenummer. Keine Preise und keine Lagerstände auf der Seite — Konditionen nach Prüfung.</p>
    </div>
  </header>
  <main class="part-body">
    <div class="container">
      <dl class="part-meta">
        <dt>Hersteller</dt>
        <dd class="plain"><a href="../../marche/${escapeAttr(part.brand_slug)}.html">${escapeHtml(part.brand)}</a></dd>
        <dt>Teilenummer</dt>
        <dd>${escapeHtml(part.part_number)}</dd>
        <dt>Beschreibung</dt>
        <dd class="plain">${escapeHtml(descPlain)}</dd>
      </dl>
      <p>ABCspareparts prüft für <strong>${escapeHtml(part.brand)}</strong> die Referenz <strong>${escapeHtml(part.part_number)}</strong> auf Beschaffbarkeit und Lieferoptionen in Europa. Diese Seite enthält nur verifizierte Stammdaten aus realen Anfragen/Lieferungen — keine erfundenen Preise oder Verfügbarkeiten.</p>
      ${caseBlock}
      <div class="cta-row">
        <a class="cta-primary" href="../../marche/${escapeAttr(part.brand_slug)}.html#quote=${encodeURIComponent(part.part_number)}">Angebot anfragen</a>
        <a class="cta-secondary" href="../../marche/${escapeAttr(part.brand_slug)}.html">Zur Markenseite ${escapeHtml(part.brand)}</a>
      </div>
    </div>
  </main>
${buildFooterHtml('../../')}
</body>
</html>
`;
}

function writeSitemapParts(parts) {
  let body = '';
  for (const part of parts) {
    body += '  <url>\n';
    body += `    <loc>${canonicalUrl(part.path)}</loc>\n`;
    body += `    <lastmod>${TODAY}</lastmod>\n`;
    body += '    <changefreq>monthly</changefreq>\n';
    body += '    <priority>0.7</priority>\n';
    body += '  </url>\n';
  }
  const xml = `---
layout: none
---
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}</urlset>
`;
  fs.writeFileSync(SITEMAP_PARTS, xml, 'utf8');
}

function cleanStaleParts(keepPaths) {
  if (!fs.existsSync(PARTS_DIR)) return;
  const keep = new Set(keepPaths.map((p) => path.join(ROOT, p)));
  function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      const st = fs.statSync(full);
      if (st.isDirectory()) {
        walk(full);
        if (!fs.readdirSync(full).length) fs.rmdirSync(full);
      } else if (name.endsWith('.html') && !keep.has(full)) {
        fs.unlinkSync(full);
      }
    }
  }
  walk(PARTS_DIR);
}

function main() {
  const mvp = loadMvp();
  const parts = mvp.parts;
  const publishSitemap = process.argv.includes('--publish-sitemap');

  for (const part of parts) {
    const dir = path.join(PARTS_DIR, part.brand_slug);
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `${part.part_slug}.html`);
    fs.writeFileSync(file, buildPageHtml(part), 'utf8');
  }
  cleanStaleParts(parts.map((p) => p.path));

  writeSitemapParts(parts);
  touchMainSitemap();

  if (publishSitemap) {
    writeSitemapIndex({ includePartsSitemap: true });
    console.log('sitemap-parts.xml included in sitemap-index.xml');
  } else {
    // Keep draft sitemap on disk for review; do not advertise until MVP launch approval.
    writeSitemapIndex({ includePartsSitemap: false });
    console.log('sitemap-parts.xml written (DRAFT) — not yet in sitemap-index.xml (awaiting approval)');
  }

  console.log(`Generated ${parts.length} MVP part pages under parts/`);
  console.log(`Example: ${parts[0].canonical}`);
}

if (require.main === module) {
  main();
}

module.exports = {
  loadMvp,
  buildPageHtml,
  writeSitemapParts,
  uniqueTitle,
  uniqueDescription,
  uniqueH1,
  buildProductJsonLd
};
