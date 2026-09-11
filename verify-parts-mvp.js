'use strict';

/**
 * Pre-merge gate for MVP /parts/ pages.
 * Fails hard if any of the 77 URLs violates the publish checklist.
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const BASE = 'https://abcspareparts.eu';
const MVP_PATH = path.join(ROOT, 'parts-mvp.json');
const SITEMAP_PARTS = path.join(ROOT, 'sitemap-parts.xml');
const SITEMAP_INDEX = path.join(ROOT, 'sitemap-index.xml');

function fail(errors) {
  console.error('verify-parts-mvp: FAILED —', errors.length, 'error(s)');
  for (const e of errors) console.error(' -', e);
  process.exit(1);
}

function parseLdGraph(html) {
  const nodes = [];
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  for (const m of blocks) {
    let data;
    try {
      data = JSON.parse(m[1]);
    } catch {
      throw new Error('invalid JSON-LD JSON');
    }
    if (data['@graph']) nodes.push(...data['@graph']);
    else if (data['@type']) nodes.push(data);
  }
  return nodes;
}

function stripTags(html) {
  return decodeEntities(String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function decodeEntities(s) {
  return String(s || '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function normalizeKey(s) {
  return decodeEntities(s).toLowerCase().replace(/\s+/g, '');
}

function main() {
  const errors = [];
  const results = [];

  if (!fs.existsSync(MVP_PATH)) fail(['parts-mvp.json missing']);
  const mvp = JSON.parse(fs.readFileSync(MVP_PATH, 'utf8'));
  const parts = mvp.parts || [];
  if (parts.length !== 77) {
    errors.push(`MVP count must be exactly 77 (got ${parts.length}) — no auto batch expansion`);
  }

  // --- sitemap-index must declare sitemap-parts.xml ---
  if (!fs.existsSync(SITEMAP_INDEX)) fail(['sitemap-index.xml missing']);
  const indexXml = fs.readFileSync(SITEMAP_INDEX, 'utf8');
  if (!indexXml.includes(`${BASE}/sitemap-parts.xml`)) {
    errors.push('sitemap-index.xml missing sitemap-parts.xml (run npm run build:parts:publish)');
  }

  // --- validate sitemap-parts.xml ---
  if (!fs.existsSync(SITEMAP_PARTS)) fail(['sitemap-parts.xml missing']);
  const sitemapXml = fs.readFileSync(SITEMAP_PARTS, 'utf8');
  if (!sitemapXml.includes('<?xml version="1.0"')) {
    errors.push('sitemap-parts.xml missing XML declaration');
  }
  if (!sitemapXml.includes('<urlset') || !sitemapXml.includes('</urlset>')) {
    errors.push('sitemap-parts.xml missing urlset root');
  }
  if (/\?part=|\?lang=|\?q=/.test(sitemapXml)) {
    errors.push('sitemap-parts.xml contains query-string URLs');
  }
  if (/noindex|redirect/i.test(sitemapXml)) {
    errors.push('sitemap-parts.xml contains unexpected noindex/redirect markers');
  }

  const locs = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  if (locs.length !== parts.length) {
    errors.push(`sitemap-parts.xml has ${locs.length} <loc>, MVP has ${parts.length}`);
  }

  const locSet = new Set();
  for (const loc of locs) {
    if (locSet.has(loc)) errors.push(`Duplicate sitemap URL: ${loc}`);
    locSet.add(loc);
    if (!loc.startsWith(`${BASE}/parts/`)) {
      errors.push(`Non-/parts/ URL in sitemap-parts.xml: ${loc}`);
    }
    if (!loc.endsWith('.html')) {
      errors.push(`Sitemap URL missing .html: ${loc}`);
    }
  }

  const lastmods = [...sitemapXml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1]);
  const today = new Date().toISOString().slice(0, 10);
  for (const d of lastmods) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      errors.push(`Invalid lastmod format: ${d}`);
    }
    // lastmod must be a real calendar date not in the future
    if (d > today) errors.push(`Future lastmod not allowed: ${d}`);
  }

  const titles = new Map();
  const descriptions = new Map();
  const expectedCanonicals = new Set(parts.map((p) => p.canonical));

  for (const loc of locs) {
    if (!expectedCanonicals.has(loc)) {
      errors.push(`Sitemap URL not in MVP list: ${loc}`);
    }
  }

  for (const part of parts) {
    const id = part.path;
    const pageErrors = [];
    const file = path.join(ROOT, part.path);

    // HTTP 200 surrogate pre-deploy: file must exist and be non-empty HTML
    if (!fs.existsSync(file)) {
      pageErrors.push('missing file (would be 404)');
      results.push({ url: part.canonical, ok: false, errors: pageErrors });
      errors.push(...pageErrors.map((e) => `${id}: ${e}`));
      continue;
    }
    const html = fs.readFileSync(file, 'utf8');
    if (!html.includes('<!DOCTYPE html>') || html.length < 500) {
      pageErrors.push('invalid/empty HTML (not publishable as 200)');
    }

    // robots
    const robotsMatch = html.match(/<meta\s+name="robots"\s+content="([^"]+)"/i);
    if (!robotsMatch) pageErrors.push('missing robots meta');
    else {
      const robots = robotsMatch[1].toLowerCase().replace(/\s+/g, '');
      if (!robots.includes('index') || !robots.includes('follow')) {
        pageErrors.push(`robots must include index,follow (got "${robotsMatch[1]}")`);
      }
      if (robots.includes('noindex') || robots.includes('nofollow')) {
        pageErrors.push('robots contains noindex/nofollow');
      }
    }
    if (/noindex/i.test(html) && !/max-image-preview/.test(html)) {
      // soft check already covered; keep explicit
    }
    if (/\bnoindex\b/i.test(html)) {
      // Any noindex token is a hard fail for MVP pages
      pageErrors.push('page contains noindex');
    }

    // canonical self
    const canonMatch = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i);
    if (!canonMatch) pageErrors.push('missing canonical');
    else if (canonMatch[1] !== part.canonical) {
      pageErrors.push(`canonical not self-referencing (got ${canonMatch[1]})`);
    }

    // title
    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    const title = titleMatch ? decodeEntities(titleMatch[1].trim()) : '';
    if (!title) pageErrors.push('empty title');
    else {
      if (titles.has(title)) pageErrors.push(`duplicate title (also ${titles.get(title)})`);
      else titles.set(title, id);
      const normTitle = normalizeKey(title);
      const normCode = normalizeKey(part.part_number);
      if (!normTitle.includes(normCode)) pageErrors.push('title missing part number');
    }

    // meta description
    const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
    const metaDesc = descMatch ? decodeEntities(descMatch[1].trim()) : '';
    if (!metaDesc) pageErrors.push('empty meta description');
    else {
      if (descriptions.has(metaDesc)) {
        pageErrors.push(`duplicate meta description (also ${descriptions.get(metaDesc)})`);
      } else descriptions.set(metaDesc, id);
    }

    // single H1 with brand + part number
    const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => stripTags(m[1]));
    if (h1s.length !== 1) pageErrors.push(`expected exactly 1 H1, found ${h1s.length}`);
    else {
      const h1 = h1s[0];
      if (!normalizeKey(h1).includes(normalizeKey(part.brand))) pageErrors.push('H1 missing brand');
      if (!normalizeKey(h1).includes(normalizeKey(part.part_number))) {
        pageErrors.push('H1 missing part number');
      }
    }

    // JSON-LD
    let nodes = [];
    try {
      nodes = parseLdGraph(html);
    } catch (e) {
      pageErrors.push(String(e.message || e));
    }
    const products = nodes.filter((n) => n['@type'] === 'Product');
    const crumbs = nodes.filter((n) => n['@type'] === 'BreadcrumbList');
    if (products.length !== 1) pageErrors.push(`expected 1 Product JSON-LD, found ${products.length}`);
    if (crumbs.length !== 1) pageErrors.push(`expected 1 BreadcrumbList JSON-LD, found ${crumbs.length}`);

    if (products.length === 1) {
      const p = products[0];
      if (p.offers || p.offer) pageErrors.push('Product JSON-LD must not include offers');
      const rawProduct = JSON.stringify(p);
      if (/"@type"\s*:\s*"Offer"/i.test(rawProduct)) pageErrors.push('Product graph contains Offer');
      if (/"price"\s*:/i.test(rawProduct)) pageErrors.push('Product JSON-LD contains price');
      if (/"availability"\s*:/i.test(rawProduct)) pageErrors.push('Product JSON-LD contains availability');

      if (!p.name) pageErrors.push('Product.name missing');
      if (p.sku !== part.part_number) pageErrors.push(`Product.sku mismatch (got ${p.sku})`);
      if (p.mpn !== part.part_number) pageErrors.push(`Product.mpn mismatch (got ${p.mpn})`);
      if (p.url !== part.canonical) pageErrors.push(`Product.url mismatch (got ${p.url})`);
      const brandName = p.brand && (p.brand.name || p.brand);
      if (!brandName || String(brandName).toLowerCase() !== String(part.brand).toLowerCase()) {
        pageErrors.push(`Product.brand mismatch (got ${brandName})`);
      }
      if (!p.description || !String(p.description).trim()) pageErrors.push('Product.description missing');
      if (p.name && h1s[0] && p.name !== h1s[0]) {
        pageErrors.push(`Product.name not coherent with H1 ("${p.name}" vs "${h1s[0]}")`);
      }
    }

    if (crumbs.length === 1) {
      const els = crumbs[0].itemListElement;
      if (!Array.isArray(els) || els.length < 3) {
        pageErrors.push('BreadcrumbList must have >= 3 items');
      } else {
        const last = els[els.length - 1];
        if (last.item !== part.canonical) {
          pageErrors.push(`Breadcrumb last item must be self canonical (got ${last.item})`);
        }
      }
    }

    // no SEO ?part= links
    if (/href="[^"]*\?part=/i.test(html) || /href='[^']*\?part=/i.test(html)) {
      pageErrors.push('contains SEO href with ?part=');
    }

    // no redirect meta / canonical elsewhere already checked
    if (/http-equiv=["']refresh["']/i.test(html)) pageErrors.push('meta refresh redirect present');
    if (/brand-redirect-stub|window\.location\s*=/.test(html)) {
      pageErrors.push('redirect behavior detected');
    }

    // crawlable inbound link from brand OR case
    const brandFile = path.join(ROOT, 'marche', `${part.brand_slug}.html`);
    const crawlHref = `href="../parts/${part.brand_slug}/${part.part_slug}.html"`;
    const crawlHrefAbs = `href="/parts/${part.brand_slug}/${part.part_slug}.html"`;
    const crawlHrefAbsFull = `href="${part.canonical}"`;
    let inbound = false;
    if (fs.existsSync(brandFile)) {
      const brandHtml = fs.readFileSync(brandFile, 'utf8');
      if (brandHtml.includes(crawlHref) || brandHtml.includes(crawlHrefAbs) || brandHtml.includes(crawlHrefAbsFull)) {
        inbound = true;
      }
      if (/\bnoindex\b/i.test(brandHtml) && brandHtml.includes(crawlHref)) {
        // brand itself must stay indexable when linking MVP parts
        pageErrors.push(`brand page marche/${part.brand_slug}.html is noindex`);
      }
      if (/"@type":"Product"/.test(brandHtml)) {
        pageErrors.push(`brand page marche/${part.brand_slug}.html must not emit Product JSON-LD`);
      }
      if (/"@type":"Offer"/.test(brandHtml)) {
        pageErrors.push(`brand page marche/${part.brand_slug}.html must not emit Offer JSON-LD`);
      }
    }
    if (!inbound && part.case_slug) {
      const caseFile = path.join(ROOT, 'casi', `${part.case_slug}.html`);
      if (fs.existsSync(caseFile)) {
        const caseHtml = fs.readFileSync(caseFile, 'utf8');
        if (
          caseHtml.includes(`href="../parts/${part.brand_slug}/${part.part_slug}.html"`) ||
          caseHtml.includes(`href="/parts/${part.brand_slug}/${part.part_slug}.html"`) ||
          caseHtml.includes(part.canonical)
        ) {
          inbound = true;
        }
      }
    }
    if (!inbound) {
      pageErrors.push('missing crawlable inbound link from brand or case page');
    }

    // Shared footer must expose company LinkedIn (no nofollow)
    if (!html.includes('href="https://www.linkedin.com/company/abcspareparts"')) {
      pageErrors.push('missing LinkedIn company footer link');
    } else {
      const li = html.match(/<a[^>]*href="https:\/\/www\.linkedin\.com\/company\/abcspareparts"[^>]*>/i);
      if (!li) pageErrors.push('LinkedIn anchor malformed');
      else {
        if (!/target="_blank"/.test(li[0])) pageErrors.push('LinkedIn missing target=_blank');
        if (!/rel="noopener noreferrer"/.test(li[0])) pageErrors.push('LinkedIn missing rel=noopener noreferrer');
        if (/nofollow/i.test(li[0])) pageErrors.push('LinkedIn must not use nofollow');
      }
      if (!html.includes('aria-label="Segui ABCspareparts su LinkedIn"')) {
        pageErrors.push('LinkedIn missing required aria-label');
      }
    }

    // sitemap contains this URL exactly once (already checked duplicates globally)
    const sitemapHits = locs.filter((u) => u === part.canonical).length;
    if (sitemapHits !== 1) pageErrors.push(`sitemap occurrences = ${sitemapHits}, expected 1`);

    const ok = pageErrors.length === 0;
    results.push({ url: part.canonical, ok, errors: pageErrors });
    for (const e of pageErrors) errors.push(`${id}: ${e}`);
  }

  // write machine-readable report artifact
  const report = {
    generated: new Date().toISOString(),
    mvp_count: parts.length,
    sitemap_count: locs.length,
    passed: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    sitemap_in_index: indexXml.includes(`${BASE}/sitemap-parts.xml`),
    results
  };
  fs.writeFileSync(path.join(ROOT, 'PARTS-MVP-TEST-RESULTS.json'), `${JSON.stringify(report, null, 2)}\n`);

  if (errors.length) fail(errors);

  console.log(
    `verify-parts-mvp: OK — ${results.length} pages, ${locs.length} sitemap URLs, all checklist gates passed`
  );
}

main();
