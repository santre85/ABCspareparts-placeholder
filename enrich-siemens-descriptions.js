'use strict';

/**
 * Apply siemens-part-descriptions.json onto parts-mvp.json (Siemens rows only).
 * Does not invent specs — only copies researched Mall/datasheet text already in the store.
 * Usage: node enrich-siemens-descriptions.js
 */

const fs = require('fs');
const path = require('path');
const { lookupPartDescription } = require('./generate-siemens-listino-parts.js');

const ROOT = __dirname;
const MVP_PATH = path.join(ROOT, 'parts-mvp.json');

function main() {
  const mvp = JSON.parse(fs.readFileSync(MVP_PATH, 'utf8'));
  let updated = 0;
  for (const p of mvp.parts || []) {
    if (p.brand_slug !== 'siemens') continue;
    const d = lookupPartDescription(p.part_number);
    if (!d) continue;
    let next;
    if (d.en && d.title && d.en.toLowerCase().includes(String(d.title).toLowerCase().slice(0, 24))) {
      next = d.en;
    } else if (d.title && d.en) {
      next = `${d.title}. ${d.en}`;
    } else {
      next = d.en || d.title || '';
    }
    next = next.slice(0, 500);
    if (!next || next === p.description) continue;
    p.description = next;
    if (!Array.isArray(p.selection_reasons)) p.selection_reasons = [];
    if (!p.selection_reasons.includes('online_datasheet_description')) {
      p.selection_reasons.push('online_datasheet_description');
    }
    updated += 1;
  }
  fs.writeFileSync(MVP_PATH, `${JSON.stringify(mvp, null, 2)}\n`, 'utf8');
  console.log(`enrich-siemens-descriptions: updated ${updated} MVP Siemens rows`);
}

if (require.main === module) main();
