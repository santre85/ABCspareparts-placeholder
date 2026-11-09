#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const {
  TITLE_MAX,
  TITLE_BANNED,
  TITLE_KEYWORD,
  decodeTitleEntities,
  decodedTitleLength,
  brandPageTitle,
  fitBrandTitle,
  clipToTitleMax
} = require('./seo-config.js');
const { homeI18nFor } = require('./home-i18n.js');
const { directoryBrandCount, marcheI18nFor } = require('./marche-i18n.js');

const ROOT = __dirname;
const LANGS = ['de', 'en', 'it', 'es', 'fr'];
const SKIP_DIRS = new Set(['node_modules', 'parts', 'listini-data', '.git']);

function fail(msg) {
  throw new Error(msg);
}

function extractTag(html, re) {
  const m = html.match(re);
  return m ? decodeTitleEntities(m[1].trim()) : '';
}

function collectHtmlFiles(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      collectHtmlFiles(full, acc);
    } else if (name.endsWith('.html') && !/^test/i.test(name)) {
      acc.push(full);
    }
  }
  return acc;
}

function collectPartsHtml(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) collectPartsHtml(full, acc);
    else if (name.endsWith('.html')) acc.push(full);
  }
  return acc;
}

function checkGeneratorContract() {
  const samples = [
    'HASL',
    '3M',
    'Siemens',
    'Emhart Teknologies',
    'GF PIPING SYSTEMS',
    'A'.repeat(80)
  ];
  for (const brand of samples) {
    for (const lang of LANGS) {
      const t = brandPageTitle(brand, lang);
      if (decodedTitleLength(t) > TITLE_MAX) {
        fail(`brandPageTitle(${brand}, ${lang}) is ${decodedTitleLength(t)} chars: ${t}`);
      }
      if (TITLE_BANNED.test(t)) fail(`brandPageTitle banned term: ${t}`);
      const kw = TITLE_KEYWORD[lang];
      if (!t.toLowerCase().includes(kw.toLowerCase())) {
        fail(`brandPageTitle missing keyword ${kw}: ${t}`);
      }
      const fitted = fitBrandTitle(`${brand} Originalteile anfragen | ABCspareparts – Angebot oft in 24h`, brand, lang);
      if (decodedTitleLength(fitted) > TITLE_MAX) {
        fail(`fitBrandTitle overflow for ${brand} ${lang}: ${fitted}`);
      }
      if (TITLE_BANNED.test(fitted)) fail(`fitBrandTitle kept banned term: ${fitted}`);
    }
  }
  const clipped = clipToTitleMax('X'.repeat(90) + ' | ABCspareparts');
  if (decodedTitleLength(clipped) > TITLE_MAX) fail(`clipToTitleMax overflow: ${clipped}`);

  const n = directoryBrandCount();
  const home = homeI18nFor(n);
  for (const lang of LANGS) {
    const title = home[lang].seo_title;
    if (decodedTitleLength(title) > TITLE_MAX) {
      fail(`home ${lang} seo_title is ${decodedTitleLength(title)} chars: ${title}`);
    }
    const marche = marcheI18nFor(lang, n);
    for (const key of ['page_title', 'og_title', 'twitter_title']) {
      if (decodedTitleLength(marche[key]) > TITLE_MAX) {
        fail(`marche ${lang} ${key} is ${decodedTitleLength(marche[key])} chars: ${marche[key]}`);
      }
    }
  }
}

function checkTitleLength() {
  checkGeneratorContract();

  const files = collectHtmlFiles(ROOT);
  const over = [];
  const seenTitles = new Map();
  let checked = 0;

  for (const file of files) {
    const html = fs.readFileSync(file, 'utf8');
    if (html.includes('<!-- brand-redirect-stub -->')) continue;
    if (/http-equiv="refresh"/i.test(html) && /noindex/i.test(html)) continue;
    const rel = path.relative(ROOT, file);
    const title = extractTag(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
    const og = extractTag(html, /<meta[^>]+property="og:title"[^>]+content="([^"]*)"/i)
      || extractTag(html, /<meta[^>]+content="([^"]*)"[^>]+property="og:title"/i);
    const tw = extractTag(html, /<meta[^>]+name="twitter:title"[^>]+content="([^"]*)"/i)
      || extractTag(html, /<meta[^>]+content="([^"]*)"[^>]+name="twitter:title"/i);
    const fields = [['title', title], ['og:title', og], ['twitter:title', tw]];
    const transTitles = [...html.matchAll(/"meta_title"\s*:\s*"((?:\\.|[^"\\])*)"/g)]
      .map((m) => {
        try { return JSON.parse(`"${m[1]}"`); } catch { return decodeTitleEntities(m[1]); }
      });
    transTitles.forEach((t, idx) => fields.push([`translations.meta_title[${idx}]`, t]));

    for (const [field, value] of fields) {
      if (!value) continue;
      checked += 1;
      const len = decodedTitleLength(value);
      if (len > TITLE_MAX) over.push({ rel, field, len, value });
      if (TITLE_BANNED.test(value)) over.push({ rel, field, len, value, banned: true });
    }
    if (title) {
      const prev = seenTitles.get(title);
      if (prev && prev !== rel) {
        fail(`duplicate <title> on ${rel} and ${prev}: ${title}`);
      }
      seenTitles.set(title, rel);
    }
  }

  const bannedHits = over.filter((x) => x.banned);
  const lengthHits = over.filter((x) => !x.banned);
  if (bannedHits.length) {
    const sample = bannedHits.slice(0, 8).map((x) => `${x.rel} ${x.field}: ${x.value}`).join('\n');
    fail(`titles contain Original/authorized:\n${sample}`);
  }
  if (lengthHits.length) {
    const sample = lengthHits.slice(0, 12).map((x) => `${x.rel} ${x.field} ${x.len}: ${x.value}`).join('\n');
    fail(`${lengthHits.length} generated titles exceed ${TITLE_MAX} chars:\n${sample}`);
  }

  const partsFiles = collectPartsHtml(path.join(ROOT, 'parts'));
  let partsOver = 0;
  for (const file of partsFiles) {
    const html = fs.readFileSync(file, 'utf8');
    const title = extractTag(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
    if (title && decodedTitleLength(title) > TITLE_MAX) partsOver += 1;
  }

  return { checked, files: files.length, partsOver, partsFiles: partsFiles.length };
}

if (require.main === module) {
  const r = checkTitleLength();
  console.log(
    `test-title-length: OK — ${r.checked} title fields on ${r.files} generated HTML files ≤${TITLE_MAX}.`,
    `parts/*.html titles over ${TITLE_MAX} (report only): ${r.partsOver}/${r.partsFiles}`
  );
}

module.exports = { checkTitleLength };
