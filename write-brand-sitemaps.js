#!/usr/bin/env node
'use strict';

/**
 * Canonical writer for brand-page XML sitemaps.
 *
 * Scans on-disk marche/*.html so full rebuilds, --only regenerations, and
 * nightly ERP syncs cannot shrink the URL list. Indexable public brand pages
 * go into sitemap-brands.xml (sharded if needed). Brands that already live in
 * sitemap-brand-parts.xml are omitted here to avoid duplicates.
 *
 * lastmod comes from git history of each HTML file (or the file mtime / today
 * when the working tree has uncommitted edits). Never stamps today's date on
 * every URL.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { BASE, isExcludedBrand } = require('./seo-config.js');

const ROOT = __dirname;
const MARCHE_DIR = path.join(ROOT, 'marche');
const TODAY = new Date().toISOString().slice(0, 10);
const SITEMAP_URL_LIMIT = 45000;
const SITEMAP_BYTE_LIMIT = 50 * 1024 * 1024;

let gitLastmodCache = null;
let dirtyRelCache = null;

function loadGitLastmods() {
  if (gitLastmodCache) return gitLastmodCache;
  const map = Object.create(null);
  try {
    const out = execSync('git log --format=%cs --name-only -- marche/ sitemap*.xml', {
      cwd: ROOT,
      encoding: 'utf8',
      maxBuffer: 256 * 1024 * 1024,
      stdio: ['pipe', 'pipe', 'ignore']
    });
    let date = null;
    for (const line of out.split('\n')) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(line)) {
        date = line;
        continue;
      }
      if (!line || !date) continue;
      if (map[line] === undefined) map[line] = date;
    }
  } catch (err) {
    // Detached / shallow / non-git checkout: fall back to mtime per file.
  }
  gitLastmodCache = map;
  return map;
}

function loadDirtyRelPaths() {
  if (dirtyRelCache) return dirtyRelCache;
  const set = new Set();
  try {
    const out = execSync('git status --porcelain -- marche/ sitemap*.xml', {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    });
    for (const line of out.split('\n')) {
      if (!line) continue;
      const rel = line.slice(3).trim().replace(/ -> .*$/, '');
      if (rel) set.add(rel);
    }
  } catch (err) {
    // ignore
  }
  dirtyRelCache = set;
  return set;
}

/** Bust caches after this process writes sitemap/HTML files. */
function invalidateLastmodCaches() {
  gitLastmodCache = null;
  dirtyRelCache = null;
}

function lastmodForRelPath(relPath) {
  const rel = String(relPath || '').replace(/^\.\//, '');
  if (loadDirtyRelPaths().has(rel)) return TODAY;
  const fromGit = loadGitLastmods()[rel];
  if (fromGit) return fromGit;
  const abs = path.join(ROOT, rel);
  if (fs.existsSync(abs)) {
    return fs.statSync(abs).mtime.toISOString().slice(0, 10);
  }
  return TODAY;
}

function isIndexableBrandHtml(html, slug) {
  if (!html || !slug) return false;
  if (html.includes('<!-- brand-redirect-stub -->')) return false;
  if (/\bnoindex\b/i.test(html)) return false;
  if (!/name="robots"\s+content="index,\s*follow/i.test(html)) return false;
  const canonical = `${BASE}/marche/${slug}.html`;
  if (!html.includes(`rel="canonical" href="${canonical}"`)) return false;
  if (isExcludedBrand(slug, slug)) return false;
  return true;
}

function loadPartsSlugSet(partsBySlug) {
  if (partsBySlug && typeof partsBySlug.keys === 'function') {
    return new Set([...partsBySlug.keys()].filter(Boolean));
  }
  try {
    const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'brand-order-parts.json'), 'utf8'));
    return new Set(
      (data.brands || [])
        .filter((b) => b.brand_slug && ((b.parts && b.parts.length) || b.listino?.count))
        .map((b) => b.brand_slug)
    );
  } catch (err) {
    return new Set();
  }
}

/**
 * Indexable public /marche/<slug>.html pages (200 on disk, index,follow, self-canonical).
 * Excludes noindex redirect stubs and permanently excluded brands.
 */
function collectIndexableBrandPages() {
  const pages = [];
  if (!fs.existsSync(MARCHE_DIR)) return pages;
  const files = fs.readdirSync(MARCHE_DIR).filter((f) => f.endsWith('.html')).sort();
  for (const file of files) {
    const slug = file.slice(0, -5);
    if (isExcludedBrand(slug, slug)) continue;
    const html = fs.readFileSync(path.join(MARCHE_DIR, file), 'utf8');
    if (!isIndexableBrandHtml(html, slug)) continue;
    pages.push({
      slug,
      file,
      relPath: `marche/${file}`,
      url: `${BASE}/marche/${slug}.html`
    });
  }
  return pages;
}

function listBrandSitemapFiles() {
  const numbered = fs
    .readdirSync(ROOT)
    .filter((name) => /^sitemap-brands-\d+\.xml$/i.test(name))
    .sort((a, b) => {
      const na = Number((a.match(/(\d+)\.xml$/i) || [])[1] || 0);
      const nb = Number((b.match(/(\d+)\.xml$/i) || [])[1] || 0);
      return na - nb;
    });
  if (numbered.length) return numbered;
  if (fs.existsSync(path.join(ROOT, 'sitemap-brands.xml'))) return ['sitemap-brands.xml'];
  return [];
}

function urlEntryXml(url, lastmod, changefreq, priority) {
  return `  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>
`;
}

function wrapUrlset(body) {
  return `---
layout: none
---
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}</urlset>
`;
}

function shardFileNames(shardCount) {
  if (shardCount <= 1) return ['sitemap-brands.xml'];
  return Array.from({ length: shardCount }, (_, i) => `sitemap-brands-${i + 1}.xml`);
}

/**
 * Write sitemap-brands.xml (or sitemap-brands-N.xml shards) for every
 * indexable brand page that is not already listed in sitemap-brand-parts.xml.
 */
function writeBrandSitemaps(options = {}) {
  const partsSlugSet = loadPartsSlugSet(options.partsBySlug);
  const pages = collectIndexableBrandPages();
  const entries = [];
  for (const page of pages) {
    if (partsSlugSet.has(page.slug)) continue;
    entries.push({
      url: page.url,
      lastmod: lastmodForRelPath(page.relPath)
    });
  }

  const urlXml = entries.map((e) => urlEntryXml(e.url, e.lastmod, 'monthly', '0.7'));
  const shards = [];
  let current = [];
  let currentBytes = 0;
  const overhead = Buffer.byteLength(wrapUrlset(''), 'utf8');

  const flush = () => {
    if (!current.length) return;
    shards.push(current);
    current = [];
    currentBytes = 0;
  };

  for (const xml of urlXml) {
    const bytes = Buffer.byteLength(xml, 'utf8');
    const wouldCount = current.length + 1;
    const wouldBytes = overhead + currentBytes + bytes;
    if (current.length && (wouldCount > SITEMAP_URL_LIMIT || wouldBytes > SITEMAP_BYTE_LIMIT)) {
      flush();
    }
    current.push(xml);
    currentBytes += bytes;
  }
  flush();

  if (!shards.length) {
    shards.push([]);
  }

  const names = shardFileNames(shards.length);
  for (let i = 0; i < names.length; i++) {
    const xml = wrapUrlset(shards[i].join(''));
    fs.writeFileSync(path.join(ROOT, names[i]), xml, 'utf8');
  }

  invalidateLastmodCaches();

  console.log(
    `sitemap-brands: ${entries.length} indexable brand URLs in ${names.join(', ')} ` +
      `(excluded ${partsSlugSet.size} parts-priority already in sitemap-brand-parts.xml)`
  );

  return {
    files: names,
    urlCount: entries.length,
    indexableCount: pages.length,
    partsPriorityCount: partsSlugSet.size
  };
}

module.exports = {
  BASE,
  TODAY,
  SITEMAP_URL_LIMIT,
  SITEMAP_BYTE_LIMIT,
  lastmodForRelPath,
  invalidateLastmodCaches,
  isIndexableBrandHtml,
  collectIndexableBrandPages,
  listBrandSitemapFiles,
  writeBrandSitemaps,
  loadPartsSlugSet
};

if (require.main === module) {
  const result = writeBrandSitemaps();
  const { writeSitemapIndex } = require('./build-brand-parts.js');
  writeSitemapIndex();
  console.log('sitemap-index.xml refreshed. indexable brand pages:', result.indexableCount);
}
