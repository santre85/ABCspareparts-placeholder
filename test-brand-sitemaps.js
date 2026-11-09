#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const {
  collectIndexableBrandPages,
  listBrandSitemapFiles,
  isIndexableBrandHtml,
  lastmodForRelPath,
  SITEMAP_URL_LIMIT,
  SITEMAP_BYTE_LIMIT
} = require('./write-brand-sitemaps.js');
const { isExcludedBrand } = require('./seo-config.js');

const ROOT = __dirname;
const BASE = 'https://abcspareparts.eu';

function parseLocs(xml) {
  return [...String(xml || '').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

function fail(msg) {
  throw new Error(msg);
}

const indexable = collectIndexableBrandPages();
const indexableUrls = new Set(indexable.map((p) => p.url));
if (indexable.length < 10000) {
  fail(`expected ~12k indexable brand pages, got ${indexable.length}`);
}

const emhart = indexable.find((p) => p.slug === 'emhart-teknologies');
if (!emhart) fail('emhart-teknologies.html must be indexable');

for (const stub of ['miele', 'rommelsbacher', 'valmet']) {
  if (indexableUrls.has(`${BASE}/marche/${stub}.html`)) {
    fail(`redirect stub ${stub} must not be treated as indexable`);
  }
}
for (const excluded of ['keysight', 'markem', 'markem-imaje', 'axiomtek-markem-imaje']) {
  if (indexableUrls.has(`${BASE}/marche/${excluded}.html`)) {
    fail(`excluded brand ${excluded} must not be indexable`);
  }
}

const siPath = path.join(ROOT, 'sitemap-index.xml');
if (!fs.existsSync(siPath)) fail('sitemap-index.xml missing');
const si = fs.readFileSync(siPath, 'utf8');
const childFiles = parseLocs(si).map((loc) => loc.replace(`${BASE}/`, ''));
const brandFiles = listBrandSitemapFiles();
if (!brandFiles.length) fail('no brand sitemap files');
for (const file of brandFiles) {
  if (!childFiles.includes(file)) fail(`sitemap-index.xml missing ${file}`);
}

const locToFile = new Map();
for (const file of childFiles) {
  const abs = path.join(ROOT, file);
  if (!fs.existsSync(abs)) fail(`sitemap-index.xml references missing ${file}`);
  const xml = fs.readFileSync(abs, 'utf8');
  const size = fs.statSync(abs).size;
  const locs = parseLocs(xml);
  if (locs.length > SITEMAP_URL_LIMIT) fail(`${file} exceeds URL limit`);
  if (size > SITEMAP_BYTE_LIMIT) fail(`${file} exceeds 50MB`);
  if (/\?part=|\?lang=|\?q=/.test(xml)) fail(`${file} contains query-string URLs`);
  for (const loc of locs) {
    if (locToFile.has(loc)) fail(`duplicate ${loc} in ${locToFile.get(loc)} and ${file}`);
    locToFile.set(loc, file);
  }
}

const missing = indexable.filter((p) => !locToFile.has(p.url));
if (missing.length) {
  fail(`${missing.length} indexable brand pages missing from sitemaps (e.g. ${missing[0].url})`);
}

const marcheDir = path.join(ROOT, 'marche');
for (const name of fs.readdirSync(marcheDir).filter((f) => f.endsWith('.html'))) {
  const slug = name.slice(0, -5);
  const html = fs.readFileSync(path.join(marcheDir, name), 'utf8');
  const url = `${BASE}/marche/${slug}.html`;
  if (isIndexableBrandHtml(html, slug) && !isExcludedBrand(slug, slug)) continue;
  if (locToFile.has(url)) fail(`non-indexable ${url} is listed in ${locToFile.get(url)}`);
}

const emhartFile = locToFile.get(emhart.url);
if (!emhartFile) fail('emhart-teknologies.html missing from sitemaps');
const emhartXml = fs.readFileSync(path.join(ROOT, emhartFile), 'utf8');
const emhartLastmod = (emhartXml.match(
  new RegExp(`<loc>${emhart.url}</loc>\\s*<lastmod>(\\d{4}-\\d{2}-\\d{2})</lastmod>`)
) || [])[1];
if (!emhartLastmod) fail('emhart-teknologies.html missing lastmod');
const expectedLastmod = lastmodForRelPath(emhart.relPath);
if (emhartLastmod !== expectedLastmod) {
  fail(`emhart lastmod ${emhartLastmod} !== git/file lastmod ${expectedLastmod}`);
}
if (emhartLastmod === new Date().toISOString().slice(0, 10) && expectedLastmod !== emhartLastmod) {
  fail('brand lastmod must not be stamped with today unless the page actually changed');
}

const lastmods = [...emhartXml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1]);
const uniqueLastmods = new Set(lastmods);
const today = new Date().toISOString().slice(0, 10);
if (lastmods.length > 100 && uniqueLastmods.size === 1 && lastmods[0] === today) {
  const unchanged = indexable.filter((p) => lastmodForRelPath(p.relPath) !== today);
  if (unchanged.length) {
    fail(`brand sitemap lastmod values are all today, but ${unchanged.length} pages were not updated (e.g. ${unchanged[0].relPath})`);
  }
}

console.log(
  'test-brand-sitemaps: OK —',
  indexable.length,
  'indexable brand pages in sitemaps',
  brandFiles.join(','),
  'emhart lastmod',
  emhartLastmod
);
