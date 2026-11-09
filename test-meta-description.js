#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const {
  META_MIN,
  META_MAX,
  META_BANNED,
  PRICE_META,
  decodeTitleEntities,
  decodedTitleLength,
  brandPageDescription,
  fitBrandDescription,
  fitMetaRange
} = require('./seo-config.js');
const { homeI18nFor } = require('./home-i18n.js');
const { directoryBrandCount, marcheI18nFor } = require('./marche-i18n.js');

const ROOT = __dirname;
const LANGS = ['de', 'en', 'it', 'es', 'fr'];
const SKIP_DIRS = new Set(['node_modules', 'parts', 'listini-data', '.git']);

function fail(msg) {
  throw new Error(msg);
}

function extractAttr(html, re) {
  const m = html.match(re);
  return m ? decodeTitleEntities(m[1].trim()) : '';
}

function collectHtmlFiles(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) collectHtmlFiles(full, acc);
    else if (name.endsWith('.html') && !/^test/i.test(name)) acc.push(full);
  }
  return acc;
}

function inRange(s) {
  const n = decodedTitleLength(s);
  return n >= META_MIN && n <= META_MAX;
}

function checkGeneratorContract() {
  for (const brand of ['A', 'HASL', 'WITTMANN', 'Panasonic', 'EMHART TEKNOLOGIES', 'A'.repeat(60)]) {
    for (const lang of LANGS) {
      const d = brandPageDescription(brand, lang);
      if (!inRange(d)) fail(`brandPageDescription(${brand}, ${lang}) is ${decodedTitleLength(d)}: ${d}`);
      if (META_BANNED.test(d)) fail(`brandPageDescription banned: ${d}`);
      const fitted = fitBrandDescription('too short', brand, lang, {});
      if (!inRange(fitted)) fail(`fitBrandDescription short pad ${lang} is ${decodedTitleLength(fitted)}: ${fitted}`);
    }
  }
  const n = directoryBrandCount();
  const home = homeI18nFor(n);
  for (const lang of LANGS) {
    if (!inRange(home[lang].seo_description)) {
      fail(`home ${lang} seo_description is ${decodedTitleLength(home[lang].seo_description)}`);
    }
    if (META_BANNED.test(home[lang].seo_description)) fail(`home ${lang} description banned term`);
    const marche = marcheI18nFor(lang, n);
    for (const key of ['page_description', 'og_description', 'twitter_description']) {
      if (!inRange(marche[key])) fail(`marche ${lang} ${key} is ${decodedTitleLength(marche[key])}`);
      if (META_BANNED.test(marche[key])) fail(`marche ${lang} ${key} banned term`);
    }
  }
  const clipped = fitMetaRange('x', 'de');
  if (!inRange(clipped)) fail(`fitMetaRange pad failed: ${clipped}`);
}

function checkMetaDescription() {
  checkGeneratorContract();

  const files = collectHtmlFiles(ROOT);
  const over = [];
  const under = [];
  const banned = [];
  let checked = 0;
  const seen = new Map();

  for (const file of files) {
    const html = fs.readFileSync(file, 'utf8');
    if (html.includes('<!-- brand-redirect-stub -->')) continue;
    if (/http-equiv="refresh"/i.test(html) && /noindex/i.test(html)) continue;
    const rel = path.relative(ROOT, file);
    const desc = extractAttr(html, /<meta[^>]+name="description"[^>]+content="([^"]*)"/i)
      || extractAttr(html, /<meta[^>]+content="([^"]*)"[^>]+name="description"/i);
    const og = extractAttr(html, /<meta[^>]+property="og:description"[^>]+content="([^"]*)"/i)
      || extractAttr(html, /<meta[^>]+content="([^"]*)"[^>]+property="og:description"/i);
    const tw = extractAttr(html, /<meta[^>]+name="twitter:description"[^>]+content="([^"]*)"/i)
      || extractAttr(html, /<meta[^>]+content="([^"]*)"[^>]+name="twitter:description"/i);
    const fields = [['description', desc], ['og:description', og], ['twitter:description', tw]];
    const trans = [...html.matchAll(/"meta_description"\s*:\s*"((?:\\.|[^"\\])*)"/g)]
      .map((m) => {
        try { return JSON.parse(`"${m[1]}"`); } catch { return decodeTitleEntities(m[1]); }
      });
    trans.forEach((t, idx) => fields.push([`translations.meta_description[${idx}]`, t]));

    for (const [field, value] of fields) {
      if (!value) continue;
      checked += 1;
      const len = decodedTitleLength(value);
      if (len < META_MIN) under.push({ rel, field, len, value });
      if (len > META_MAX) over.push({ rel, field, len, value });
      if (META_BANNED.test(value) || PRICE_META.test(value)) banned.push({ rel, field, len, value });
    }
    if (desc) {
      const prev = seen.get(desc);
      if (prev && prev !== rel) fail(`duplicate description on ${rel} and ${prev}: ${desc}`);
      seen.set(desc, rel);
    }
  }

  const homes = ['index.html', 'en/index.html', 'it/index.html', 'es/index.html', 'fr/index.html'];
  for (const rel of homes) {
    const html = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    if (/http-equiv=["']refresh["']/i.test(html)) {
      fail(`${rel} still has a MetaRefresh tag (Bing flags this on / and /en/)`);
    }
  }

  if (banned.length) {
    fail(`descriptions contain Original/authorized:\n${banned.slice(0, 8).map((x) => `${x.rel} ${x.field}: ${x.value}`).join('\n')}`);
  }
  if (under.length) {
    fail(`${under.length} descriptions under ${META_MIN} chars:\n${under.slice(0, 12).map((x) => `${x.rel} ${x.field} ${x.len}: ${x.value}`).join('\n')}`);
  }
  if (over.length) {
    fail(`${over.length} descriptions over ${META_MAX} chars:\n${over.slice(0, 12).map((x) => `${x.rel} ${x.field} ${x.len}: ${x.value}`).join('\n')}`);
  }

  return { checked, files: files.length };
}

if (require.main === module) {
  const r = checkMetaDescription();
  console.log(`test-meta-description: OK — ${r.checked} description fields on ${r.files} generated HTML files are ${META_MIN}–${META_MAX} chars.`);
}

module.exports = { checkMetaDescription };
