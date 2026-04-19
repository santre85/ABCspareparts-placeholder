'use strict';

/** URL path segment for marche/{slug}.html — shared by extract-brands.js and generate-brand-pages.js */

const RESERVED = new Set([
  'index', 'home', 'api', 'admin', 'assets', 'static', 'search', 'new', 'edit', 'null', 'undefined'
]);

function slugify(name) {
  let s = String(name)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/\+/g, ' plus ')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')
    .toLowerCase();
  if (!s) s = 'brand';
  if (s.length > 96) s = s.slice(0, 96).replace(/-+$/g, '');
  if (RESERVED.has(s)) s = s + '-marca';
  return s;
}

/**
 * @param {string[]} brands
 * @returns {{ brand: string, slug: string }[]}
 */
function assignUniqueSlugs(brands) {
  const used = new Set();
  const out = [];
  for (const brand of brands) {
    let base = slugify(brand);
    let slug = base;
    let n = 2;
    while (used.has(slug)) {
      slug = base + '-' + n;
      n++;
    }
    used.add(slug);
    out.push({ brand, slug });
  }
  return out;
}

module.exports = { slugify, assignUniqueSlugs };
