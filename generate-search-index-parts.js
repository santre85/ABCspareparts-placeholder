#!/usr/bin/env node
'use strict';

/**
 * Generate /parts/{brand}/{code}.html pages for ALL codes in search-index.json
 * 
 * Auto-generates lean static pages for every indexed code so search results
 * link to real pages (not 404s). Excludes Keysight and unbranded items.
 * 
 * Features:
 * - Code, brand (link to brand page)
 * - Description only if published on brand page
 * - NO prices, supplier names, manufacturer links
 * - Prominent "request this item" button with code prefilled
 * - Canonical + proper title/JSON-LD
 * - Added to sitemap
 */

const fs = require('fs');
const path = require('path');
const { BASE, canonicalUrl, ICON_LINKS } = require('./seo-config.js');
const { buildFooterHtml } = require('./site-footer.js');

const ROOT = __dirname;
const TODAY = new Date().toISOString().slice(0, 10);
const SEARCH_INDEX_PATH = path.join(ROOT, 'search-index.json');
const PARTS_DIR = path.join(ROOT, 'parts');
const SITEMAP_PATH = path.join(ROOT, 'sitemap-search-index-parts.xml');
const BRAND_CONTENT_PATH = path.join(ROOT, 'brand-content.json');

const EXCLUDED_BRANDS = ['keysight', 'keysight technologies'];

function normalizeForComparison(str) {
  return (str || '').toLowerCase().replace(/[\s\-\/\.]/g, '');
}

function isExcludedBrand(brandName) {
  const normalized = normalizeForComparison(brandName || '');
  return EXCLUDED_BRANDS.some(excluded => 
    normalizeForComparison(excluded) === normalized
  );
}

function slugifyCode(code) {
  return String(code || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/\+/g, ' plus ')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')
    .toLowerCase();
}

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

function loadSearchIndex() {
  if (!fs.existsSync(SEARCH_INDEX_PATH)) {
    throw new Error('search-index.json not found - run generate-search-index.js first');
  }
  const data = JSON.parse(fs.readFileSync(SEARCH_INDEX_PATH, 'utf8'));
  return data.parts || [];
}

function loadBrandDescriptions() {
  const descriptions = new Map();
  if (!fs.existsSync(BRAND_CONTENT_PATH)) {
    return descriptions;
  }
  
  try {
    const data = JSON.parse(fs.readFileSync(BRAND_CONTENT_PATH, 'utf8'));
    for (const brand of data.brands || []) {
      descriptions.set(brand.slug, {
        name: brand.brand_name,
        description: brand.short_description || brand.description || ''
      });
    }
  } catch(e) {
    console.warn('Warning: Could not load brand-content.json:', e.message);
  }
  
  return descriptions;
}

function buildPageHtml(part, brandDescriptions) {
  const codeSlug = slugifyCode(part.c);
  const pagePath = `parts/${part.s}/${codeSlug}.html`;
  const pageUrl = canonicalUrl(pagePath);
  const brandUrl = canonicalUrl(`marche/${part.s}.html`);
  
  const title = `${part.c} ${part.b} - ABCspareparts`;
  const brandInfo = brandDescriptions.get(part.s) || {};
  const metaDesc = `${part.b} Teilenummer ${part.c}. Unverbindliche Anfrage bei ABCspareparts – Verfügbarkeit und Konditionen nach Prüfung.`;
  
  // JSON-LD without price/offers
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        name: title,
        description: metaDesc,
        inLanguage: 'de',
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE}/` },
            { '@type': 'ListItem', position: 2, name: 'Marken', item: `${BASE}/marche.html` },
            { '@type': 'ListItem', position: 3, name: part.b, item: brandUrl },
            { '@type': 'ListItem', position: 4, name: part.c, item: pageUrl }
          ]
        }
      },
      {
        '@type': 'Product',
        name: `${part.b} ${part.c}`,
        sku: part.c,
        mpn: part.c,
        description: metaDesc,
        brand: { '@type': 'Brand', name: part.b },
        url: pageUrl
      }
    ]
  };

  const footer = buildFooterHtml();

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeAttr(metaDesc)}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${escapeAttr(pageUrl)}">
  ${ICON_LINKS}
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 820px; margin: 0 auto; padding: 0 1.5rem; }
    .header { background: #1e3a5f; color: #fff; padding: 1rem 0; }
    .header .container { display: flex; align-items: center; justify-content: space-between; }
    .header .logo { font-size: 1.5rem; font-weight: 700; color: #fff; text-decoration: none; }
    .header nav { display: flex; gap: 1rem; }
    .header nav a { color: rgba(255,255,255,0.9); text-decoration: none; font-size: 0.9rem; }
    .header nav a:hover { color: #fff; }
    .hero { background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); color: #fff; padding: 2rem 0; }
    .breadcrumb { font-size: 0.9rem; opacity: 0.95; margin-bottom: 1rem; }
    .breadcrumb a { color: #e67e22; text-decoration: none; font-weight: 600; }
    .hero h1 { font-size: 1.75rem; margin-bottom: 0.5rem; }
    .hero .lead { opacity: 0.95; font-size: 1.05rem; }
    .content { padding: 2rem 0; }
    .part-meta { background: #f0f6fb; border: 1px solid #dce8f4; border-radius: 10px; padding: 1.2rem; margin-bottom: 1.5rem; }
    .part-meta dt { font-weight: 600; color: #1e3a5f; margin-top: 0.8rem; }
    .part-meta dt:first-child { margin-top: 0; }
    .part-meta dd { margin: 0.3rem 0 0; font-family: ui-monospace, monospace; color: #1e3a5f; }
    .part-meta dd.plain { font-family: inherit; }
    .cta-row { display: flex; flex-wrap: wrap; gap: 0.75rem; margin: 1.5rem 0; }
    .cta-primary, .cta-secondary { display: inline-block; padding: 0.85rem 1.5rem; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 0.95rem; }
    .cta-primary { background: #e67e22; color: #fff !important; }
    .cta-primary:hover { background: #d35400; }
    .cta-secondary { background: #1e3a5f; color: #fff !important; }
    .cta-secondary:hover { background: #2d5a87; }
    .footer { background: #1e3a5f; color: #fff; padding: 2rem 1.5rem; text-align: center; margin-top: 3rem; }
    .footer a { color: #fff; text-decoration: none; }
    .footer a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <header class="header">
    <div class="container">
      <a href="/" class="logo">ABCspareparts</a>
      <nav>
        <a href="/">Home</a>
        <a href="../../marche.html">Marken</a>
        <a href="/#contact">Kontakt</a>
      </nav>
    </div>
  </header>

  <div class="hero">
    <div class="container">
      <nav class="breadcrumb">
        <a href="../../">Home</a> · <a href="../../marche.html">Marken</a> · <a href="../../marche/${escapeAttr(part.s)}.html">${escapeHtml(part.b)}</a> · ${escapeHtml(part.c)}
      </nav>
      <h1>${escapeHtml(part.b)} ${escapeHtml(part.c)}</h1>
      <p class="lead">Industrieersatzteil – unverbindliche Anfrage</p>
    </div>
  </div>

  <main class="content">
    <div class="container">
      <dl class="part-meta">
        <dt>Hersteller</dt>
        <dd class="plain"><a href="../../marche/${escapeAttr(part.s)}.html">${escapeHtml(part.b)}</a></dd>
        <dt>Teilenummer</dt>
        <dd>${escapeHtml(part.c)}</dd>
      </dl>

      <p>Diese Teilenummer ist in unserem Index erfasst. Senden Sie eine unverbindliche Anfrage mit Menge und Anwendung – wir prüfen Verfügbarkeit, Lieferzeit und Konditionen.</p>

      <div class="cta-row">
        <a class="cta-primary" href="../../marche/${escapeAttr(part.s)}.html#quote=${encodeURIComponent(part.c)}">🔍 Jetzt Angebot anfragen</a>
        <a class="cta-secondary" href="../../marche/${escapeAttr(part.s)}.html">Zur Markenseite ${escapeHtml(part.b)}</a>
      </div>
    </div>
  </main>

  ${footer}
</body>
</html>`;
}

function generatePages() {
  console.log('📦 Generating part pages from search-index.json...\n');
  
  const indexParts = loadSearchIndex();
  const brandDescriptions = loadBrandDescriptions();
  
  console.log(`  Loaded ${indexParts.length} parts from search index`);
  
  // Filter out excluded brands and unbranded
  const validParts = indexParts.filter(part => {
    if (!part.b || !part.s || !part.c) return false;
    if (isExcludedBrand(part.b)) {
      console.log(`  ⊗ Excluding ${part.b}: ${part.c}`);
      return false;
    }
    return true;
  });
  
  console.log(`  ${validParts.length} valid parts after filtering\n`);
  
  // Get list of existing part pages to avoid overwriting
  const existingPages = new Set();
  if (fs.existsSync(PARTS_DIR)) {
    const brands = fs.readdirSync(PARTS_DIR);
    for (const brand of brands) {
      const brandDir = path.join(PARTS_DIR, brand);
      if (fs.statSync(brandDir).isDirectory()) {
        const files = fs.readdirSync(brandDir);
        for (const file of files) {
          if (file.endsWith('.html')) {
            existingPages.add(`${brand}/${file}`);
          }
        }
      }
    }
  }
  
  console.log(`  ${existingPages.size} existing part pages (will not overwrite)\n`);
  
  // Generate pages
  let generated = 0;
  let skipped = 0;
  const sitemapUrls = [];
  
  for (const part of validParts) {
    const codeSlug = slugifyCode(part.c);
    const brandDir = path.join(PARTS_DIR, part.s);
    const fileName = `${codeSlug}.html`;
    const filePath = path.join(brandDir, fileName);
    const relativePath = `${part.s}/${fileName}`;
    
    // Skip if page already exists
    if (existingPages.has(relativePath)) {
      skipped++;
      continue;
    }
    
    // Create brand directory if needed
    if (!fs.existsSync(brandDir)) {
      fs.mkdirSync(brandDir, { recursive: true });
    }
    
    // Generate and write page
    const html = buildPageHtml(part, brandDescriptions);
    fs.writeFileSync(filePath, html, 'utf8');
    generated++;
    
    // Add to sitemap
    const url = canonicalUrl(`parts/${part.s}/${codeSlug}.html`);
    sitemapUrls.push(`  <url>
    <loc>${url}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`);
  }
  
  // Write sitemap
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.join('\n')}
</urlset>`;
  
  fs.writeFileSync(SITEMAP_PATH, sitemap, 'utf8');
  
  console.log(`\n  ✅ Generated ${generated} new part pages`);
  console.log(`  ⊙ Skipped ${skipped} existing pages`);
  console.log(`  ✅ Updated ${SITEMAP_PATH}\n`);
  
  return { generated, skipped, total: validParts.length };
}

if (require.main === module) {
  try {
    const result = generatePages();
    console.log(`✅ Part page generation complete!\n`);
    console.log(`   Total indexed codes: ${result.total}`);
    console.log(`   New pages generated: ${result.generated}`);
    console.log(`   Existing pages kept: ${result.skipped}\n`);
  } catch (e) {
    console.error('❌ Error:', e.message);
    console.error(e.stack);
    process.exit(1);
  }
}

module.exports = { generatePages, slugifyCode };
