const fs = require('fs');
const path = require('path');

// Path to additional brands list (arg or default)
const listPath = process.argv[2] || path.join(__dirname, 'brands_list.txt');
if (!fs.existsSync(listPath)) {
  console.error('File not found:', listPath);
  process.exit(1);
}

const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const match = indexHtml.match(/const brands = (\[[\s\S]*?\];\s*\n)/);
if (!match) {
  console.error('brands array not found in index.html');
  process.exit(1);
}

const existingBrands = eval(match[1].replace(/\];\s*\n?$/, ']'));

function normalize(name) {
  return String(name)
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/-/g, '')
    .replace(/&/g, 'and')
    .replace(/\+/g, '')
    .replace(/\./g, '')
    .replace(/,/g, '')
    .replace(/\//g, '')
    .replace(/['']/g, '')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ä/g, 'a')
    .replace(/ß/g, 'ss');
}

function slugToDisplay(slug) {
  const s = String(slug).trim();
  if (!s) return '';
  if (s === '3m') return '3M';
  const parts = s.replace(/--/g, ' ').split(/-+/).filter(Boolean);
  return parts.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

const blacklist = new Set([
  'about', 'about-us', 'contact-us', 'signin', 'login', 'logout', 'brands', 'search',
  'warranty', 'refunds', 'terms-and-conditions', 'policy-privacy', 'careers', 'checkout',
  'account', 'impress', 'shipping', 'services', 'software', 'contacts', 'value', 'scope',
  'unit', 'panel', 'index', 'robot', 'fiber', 'dream', 'facts', 'brand', 'sensors', 'modules',
  'join-our-team', 'purchase-methods', 'secure-payments', 'returns-and-refunds', 'core-values',
  'all-categories', 'most-viewed-products', 'store-reviews', 'design-installation', 'guest-tracking',
  'sitemanager', 'careers', 'checkout', 'account', 'contacts', 'career', 'contact-us', 'about-us'
]);

const normalizedExisting = new Set(existingBrands.map(normalize));
const merged = [...existingBrands];
let added = 0;

const lines = fs.readFileSync(listPath, 'utf8').split(/\r?\n/);
for (const line of lines) {
  const slug = line.trim().toLowerCase();
  if (!slug || blacklist.has(slug)) continue;
  const display = slugToDisplay(slug);
  if (!display) continue;
  const norm = normalize(display);
  if (normalizedExisting.has(norm)) continue;
  normalizedExisting.add(norm);
  merged.push(display);
  added++;
}

// Sort merged list alphabetically (case-insensitive) so duplicates from different spellings stay consistent
merged.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

const newArrayStr = 'const brands = [' + merged.map(b => JSON.stringify(b)).join(',') + '];\n';
const newIndex = indexHtml.replace(/const brands = \[[\s\S]*?\];\s*\n/, newArrayStr);
fs.writeFileSync(path.join(__dirname, 'index.html'), newIndex, 'utf8');
console.log('Existing brands:', existingBrands.length);
console.log('Added (no duplicates):', added);
console.log('Total brands:', merged.length);
console.log('index.html updated.');
