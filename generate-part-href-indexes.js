#!/usr/bin/env node
'use strict';

/**
 * Write listini-data/<slug>-part-hrefs.json for each manufacturer listino.
 * Keys are lowercase codes; values are verified ../parts/<slug>/<file> hrefs
 * from on-disk files only (findExistingPartPage). Never invents paths.
 */
const fs = require('fs');
const path = require('path');
const { writePartHrefIndex, resetCatalog } = require('./part-page-paths.js');

const ROOT = __dirname;
const DIR = path.join(ROOT, 'listini-data');

function main() {
  resetCatalog();
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.json') && !f.endsWith('-part-hrefs.json'));
  let totalHits = 0;
  for (const name of files) {
    const src = path.join(DIR, name);
    const data = JSON.parse(fs.readFileSync(src, 'utf8'));
    const slug = data.brand_slug;
    const codes = Array.isArray(data.codes) ? data.codes : [];
    if (!slug || !codes.length) continue;
    const out = path.join(DIR, `${slug}-part-hrefs.json`);
    const hits = writePartHrefIndex(out, slug, codes);
    totalHits += hits;
    console.log(`${name}: ${codes.length} codes → ${hits} existing pages (${path.relative(ROOT, out)})`);
  }
  console.log('Total verified listino→page hrefs', totalHits);
}

if (require.main === module) main();

module.exports = { main };
