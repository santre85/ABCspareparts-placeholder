#!/usr/bin/env node
'use strict';

/**
 * Generate /parts/{brand}/{part}.html pages for ALL codes in search-index.json.
 * Uses the same template as generate-parts-pages.js for consistent styling.
 * 
 * Template matches existing pages: /parts/pronomic/220390.html
 * - Full SEO meta (title, description, robots, canonical, hreflang, og/twitter)
 * - JSON-LD @graph (Organization, WebPage, BreadcrumbList, Product with NO offers/price)
 * - Breadcrumb navigation
 * - Part metadata block (Hersteller / Teilenummer / Beschreibung)
 * - Neutral description (no claims about "real inquiries" unless verified)
 * - Primary CTA links to home contact with ?code= prefilled
 * - Complete footer with all links
 * 
 * Skips existing pages to preserve curated content.
 * Excludes Keysight and unbranded items.
 */

const fs = require('fs');
const path = require('path');
const { BASE, hreflangLinks, canonicalUrl, ICON_LINKS } = require('./seo-config.js');
const { FOOTER_CSS, buildFooterHtml } = require('./site-footer.js');

const ROOT = __dirname;
const TODAY = new Date().toISOString().slice(0, 10);
const SEARCH_INDEX_PATH = path.join(ROOT, 'search-index.json');
const ERP_ITEMS_PATH = path.join(ROOT, 'erp-items.json');
const PARTS_DIR = path.join(ROOT, 'parts');
const SITEMAP_PATH = path.join(ROOT, 'sitemap-search-index-parts.xml');

const EXCLUDED_BRANDS = new Set(['Keysight']);

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

function slugifyPartCode(code) {
  // Match verify-search-index-pages.js slugification exactly
  return String(code || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/\+/g, ' plus ')
    .replace(/[^a-zA-Z0-9]+/g, '-')  // Replace ANY non-alphanumeric with dash
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')
    .toLowerCase();
}

function loadSearchIndex() {
  if (!fs.existsSync(SEARCH_INDEX_PATH)) {
    throw new Error('search-index.json not found - run generate-search-index.js first');
  }
  const data = JSON.parse(fs.readFileSync(SEARCH_INDEX_PATH, 'utf8'));
  return data.parts || [];
}

function loadErpItems() {
  if (!fs.existsSync(ERP_ITEMS_PATH)) {
    return {};
  }
  const data = JSON.parse(fs.readFileSync(ERP_ITEMS_PATH, 'utf8'));
  const map = {};
  for (const item of data.items || []) {
    const key = `${item.brand}::${item.code}`.toLowerCase();
    map[key] = item;
  }
  return map;
}

function getDescription(part, erpMap) {
  const key = `${part.b}::${part.c}`.toLowerCase();
  const erpItem = erpMap[key];
  
  if (erpItem && erpItem.description) {
    let desc = String(erpItem.description)
      .replace(/\*+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Skip generic placeholder descriptions
    const genericPatterns = [
      new RegExp(`^${part.b}\\s+${part.c}$`, 'i'),
      new RegExp(`^${part.b}\\s+${part.c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
      /^[A-Z0-9\-\s]+$/
    ];
    
    const isGeneric = genericPatterns.some(pattern => pattern.test(desc)) || desc.length < 3;
    
    if (!isGeneric && desc.toLowerCase() !== part.c.toLowerCase()) {
      return desc;
    }
  }
  
  return null;
}

function uniqueTitle(part, description) {
  const brand = part.b;
  const code = part.c;
  
  if (description) {
    let shortDesc = String(description)
      .replace(new RegExp(`^${brand}\\s+`, 'i'), '')
      .replace(new RegExp(String(code).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'ig'), ' ')
      .replace(/\s+/g, ' ')
      .trim();
    shortDesc = shortDesc.slice(0, 48).trim();
    if (shortDesc && shortDesc.toLowerCase() !== code.toLowerCase()) {
      return `${brand} ${code} – ${shortDesc} | ABCspareparts`;
    }
  }
  
  return `${brand} ${code} | ABCspareparts`;
}

function uniqueDescription(part, description) {
  const brand = part.b;
  const code = part.c;
  
  if (description) {
    return `${brand} Teilenummer ${code}: ${description}. Unverbindliche Anfrage bei ABCspareparts – keine Preise auf der Seite.`.slice(0, 158);
  }
  
  return `${brand} Teilenummer ${code}: unverbindliche Anfrage bei ABCspareparts. Verfügbarkeit und Konditionen nach Prüfung.`.slice(0, 158);
}

function uniqueH1(part, description) {
  const brand = part.b;
  const code = part.c;
  
  if (description) {
    let desc = String(description)
      .replace(new RegExp(`^${brand}\\s+`, 'i'), '')
      .replace(new RegExp(String(code).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'ig'), ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (desc && desc.toLowerCase() !== code.toLowerCase()) {
      const short = desc.length > 70 ? `${desc.slice(0, 67).trim()}…` : desc;
      return `${brand} ${code} – ${short}`;
    }
  }
  
  return `${brand} ${code}`;
}

function buildPageHtml(part, description) {
  const brandSlug = part.s;
  const partSlug = slugifyPartCode(part.c);
  const pageUrl = canonicalUrl(`parts/${brandSlug}/${partSlug}.html`);
  const brandUrl = canonicalUrl(`marche/${brandSlug}.html`);
  const title = uniqueTitle(part, description);
  const metaDesc = uniqueDescription(part, description);
  const h1 = uniqueH1(part, description);
  
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
      about: { '@type': 'Brand', name: part.b },
      publisher: { '@id': `${BASE}/#organization` },
      primaryImageOfPage: { '@type': 'ImageObject', url: `${BASE}/logo.png` },
      dateModified: TODAY,
      breadcrumb: { '@id': `${pageUrl}#breadcrumb` },
      mainEntity: { '@id': `${pageUrl}#product` }
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${pageUrl}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE}/` },
        { '@type': 'ListItem', position: 2, name: 'Marken', item: `${BASE}/marche.html` },
        { '@type': 'ListItem', position: 3, name: part.b, item: brandUrl },
        { '@type': 'ListItem', position: 4, name: part.c, item: pageUrl }
      ]
    },
    {
      '@type': 'Product',
      '@id': `${pageUrl}#product`,
      name: h1,
      sku: part.c,
      mpn: part.c,
      description: metaDesc,
      brand: { '@type': 'Brand', name: part.b },
      url: pageUrl
    }
  ];
  
  const descriptionBlock = description 
    ? `        <dt>Beschreibung</dt>
        <dd class="plain">${escapeHtml(description)}</dd>`
    : '';
  
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
        <a href="../../">Home</a> · <a href="../../marche.html">Marken</a> · <a href="../../marche/${escapeAttr(brandSlug)}.html">${escapeHtml(part.b)}</a> · ${escapeHtml(part.c)}
      </nav>
      <h1>${escapeHtml(h1)}</h1>
      <p class="lead">Unverbindliche Anfrage für diese Teilenummer. Keine Preise und keine Lagerstände auf der Seite — Konditionen nach Prüfung.</p>
    </div>
  </header>
  <main class="part-body">
    <div class="container">
      <dl class="part-meta">
        <dt>Hersteller</dt>
        <dd class="plain"><a href="../../marche/${escapeAttr(brandSlug)}.html">${escapeHtml(part.b)}</a></dd>
        <dt>Teilenummer</dt>
        <dd>${escapeHtml(part.c)}</dd>
${descriptionBlock}
      </dl>
      <p>ABCspareparts prüft die Referenz <strong>${escapeHtml(part.c)}</strong> auf Beschaffbarkeit und Lieferoptionen in Europa. Verfügbarkeit und Konditionen werden nach Ihrer Anfrage ermittelt.</p>
      
      <div class="cta-row">
        <a class="cta-primary" href="../../?code=${encodeURIComponent(part.c)}#contact">Angebot anfragen</a>
        <a class="cta-secondary" href="../../marche/${escapeAttr(brandSlug)}.html">Zur Markenseite ${escapeHtml(part.b)}</a>
      </div>
    </div>
  </main>
${buildFooterHtml('../../')}
</body>
</html>
`;
}

function writeSitemap(parts) {
  let body = '';
  for (const part of parts) {
    const brandSlug = part.s;
    const partSlug = slugifyPartCode(part.c);
    const url = canonicalUrl(`parts/${brandSlug}/${partSlug}.html`);
    body += '  <url>\n';
    body += `    <loc>${url}</loc>\n`;
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
  
  fs.writeFileSync(SITEMAP_PATH, xml, 'utf8');
}

function main() {
  console.log('Generating part pages for search index codes...\n');
  
  const allParts = loadSearchIndex();
  const erpMap = loadErpItems();
  
  const validParts = allParts.filter(p => {
    if (!p.b || !p.c || !p.s) return false;
    if (EXCLUDED_BRANDS.has(p.b)) return false;
    return true;
  });
  
  let generated = 0;
  let skipped = 0;
  
  for (const part of validParts) {
    const brandDir = path.join(PARTS_DIR, part.s);
    fs.mkdirSync(brandDir, { recursive: true });
    
    const partSlug = slugifyPartCode(part.c);
    const targetPath = path.join(brandDir, `${partSlug}.html`);
    
    // Skip existing pages to preserve curated content
    if (fs.existsSync(targetPath)) {
      skipped++;
      continue;
    }
    
    const description = getDescription(part, erpMap);
    const html = buildPageHtml(part, description);
    
    fs.writeFileSync(targetPath, html, 'utf8');
    generated++;
  }
  
  writeSitemap(validParts);
  
  console.log(`  ✅ Generated ${generated} new part pages`);
  console.log(`  ⊙ Skipped ${skipped} existing pages`);
  console.log(`  ✅ Updated ${SITEMAP_PATH}\n`);
  console.log('✅ Part page generation complete!\n');
  
  console.log(`   Total indexed codes: ${validParts.length}`);
  console.log(`   New pages generated: ${generated}`);
  console.log(`   Existing pages kept: ${skipped}\n`);
}

if (require.main === module) {
  main();
}

module.exports = { buildPageHtml, loadSearchIndex, getDescription };
