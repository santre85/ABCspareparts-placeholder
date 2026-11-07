#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execSync } = require('child_process');
const { existingPartHref, findExistingPartPage } = require('./part-page-paths.js');
const { partHrefMapForBrand, partCodeControlHtml, loadPartsBySlug } = require('./generate-brand-pages.js');

let failed = 0;
const summary = {
  itemHtml: 0,
  erpCtaLang: 0,
  siemensI18n: 0,
  brandsWithParts: 0,
  suppliedCodes: 0,
  suppliedMapped: 0,
  suppliedUnmapped: 0,
  listinoSidecarHits: 0,
  listinoCodes: 0
};

function ok(cond, msg) {
  if (cond) console.log('  ✓', msg);
  else {
    console.log('  ✗', msg);
    failed++;
  }
}

const ROOT = __dirname;
const PARTS = path.join(ROOT, 'parts');
const MARCHE = path.join(ROOT, 'marche');
const LISTINI = path.join(ROOT, 'listini-data');

console.log('Item-page language scripts');
const ctaSrc = fs.readFileSync(path.join(ROOT, 'part-cta-lang.js'), 'utf8');
ok(ctaSrc.includes('navigator.languages'), 'part-cta-lang.js walks navigator.languages');
ok(ctaSrc.includes('languageSelect'), 'part-cta-lang.js provides #languageSelect');
ok(ctaSrc.includes('data-part-brand'), 'CTA keeps manufacturer prefill');
ok(ctaSrc.includes('data-part-code'), 'CTA keeps part-number prefill');
ok(ctaSrc.includes('marche.html'), 'breadcrumb translation walks marche.html hrefs');
ok(!ctaSrc.includes('replace(/>Marken</g'), 'does not rely on fragile Marken regex');

const si = fs.readFileSync(path.join(ROOT, 'parts/siemens/part-i18n.js'), 'utf8');
ok(si.includes('navigator.languages'), 'Siemens part-i18n walks navigator.languages');
ok(si.includes('languageSelect'), 'Siemens part-i18n still binds #languageSelect');
ok(si.includes("data-part-brand', 'Siemens'"), 'Siemens CTA sets manufacturer');
ok(si.includes('data-part-code'), 'Siemens CTA sets part code');

console.log('\nLanguage resolver (saved choice > navigator.languages > de)');
function runVisitorLang(opts) {
  const sandbox = {
    LANG_RESULT: null,
    localStorage: {
      store: Object.assign({}, opts.store || {}),
      getItem(k) {
        return Object.prototype.hasOwnProperty.call(this.store, k) ? this.store[k] : null;
      },
      setItem(k, v) {
        this.store[k] = String(v);
      }
    },
    navigator: {
      languages: opts.languages || [],
      language: opts.language || 'de',
      userLanguage: opts.language || 'de'
    },
    document: {
      readyState: 'loading',
      addEventListener() {},
      querySelector() {
        return null;
      },
      querySelectorAll() {
        return [];
      },
      getElementById() {
        return null;
      },
      documentElement: { lang: 'de' },
      head: { appendChild() {} },
      body: { firstChild: null, insertBefore() {} },
      createElement() {
        return { setAttribute() {}, textContent: '', innerHTML: '' };
      }
    },
    window: {},
    console
  };
  sandbox.window = sandbox;
  sandbox.window.ABC_SIEMENS_PART_I18N = opts.siemens ? {} : undefined;
  vm.createContext(sandbox);
  vm.runInContext(ctaSrc + '\nLANG_RESULT = window.ABC_PART_CTA_LANG.visitorLang();', sandbox);
  return sandbox.LANG_RESULT;
}

ok(runVisitorLang({ store: { lang: 'it' }, languages: ['fr-FR', 'en'] }) === 'it', 'saved it wins over fr browser');
ok(runVisitorLang({ store: {}, languages: ['pt-BR', 'it-IT', 'en'] }) === 'it', 'skips unsupported pt, uses it');
ok(runVisitorLang({ store: {}, languages: ['zh-CN'], language: 'zh-CN' }) === 'de', 'unsupported browser langs fall back to de');
ok(runVisitorLang({ store: { lang: 'en' }, languages: ['de'] }) === 'en', 'saved en wins over de browser');
ok(runVisitorLang({ store: {}, languages: ['es-ES'] }) === 'es', 'es from browser languages');
ok(runVisitorLang({ store: {}, languages: ['de-DE'] }) === 'de', 'de from browser languages');
ok(runVisitorLang({ store: {}, languages: ['en-GB'] }) === 'en', 'en from browser languages');
ok(runVisitorLang({ store: {}, languages: ['fr-FR'] }) === 'fr', 'fr from browser languages');

console.log('\nOn-disk item pages (no rewrite of HTML in this change set)');
function countFilesWith(pattern) {
  try {
    const out = execSync(`rg -l --glob '*.html' --glob '!katalog.html' --glob '!**/serie/**' ${JSON.stringify(pattern)} parts`, {
      cwd: ROOT,
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024
    });
    return out.trim() ? out.trim().split('\n').length : 0;
  } catch (e) {
    if (e.status === 1) return 0;
    throw e;
  }
}
function countItemHtml() {
  try {
    const out = execSync(`find parts -name '*.html' ! -name 'katalog.html' ! -path '*/serie/*' | wc -l`, {
      cwd: ROOT,
      encoding: 'utf8'
    });
    return parseInt(out.trim(), 10) || 0;
  } catch {
    return 0;
  }
}
const itemCounts = {
  total: countItemHtml(),
  erp: countFilesWith('part-cta-lang.js'),
  siemens: countFilesWith('part-i18n.js')
};
summary.itemHtml = itemCounts.total;
summary.erpCtaLang = itemCounts.erp;
summary.siemensI18n = itemCounts.siemens;
ok(itemCounts.erp >= 500, `ERP/MVP item pages with part-cta-lang.js: ${itemCounts.erp}`);
ok(itemCounts.siemens >= 90000, `Siemens listino item pages with part-i18n.js: ${itemCounts.siemens}`);
ok(itemCounts.total >= 91000, `item HTML files (excl. katalog): ${itemCounts.total}`);

console.log('\nMapping: listed codes vs on-disk /parts/ pages');
ok(findExistingPartPage('nivus', 'NF7-5S1E1A001') === 'nf7-5s1e1a001.html', 'NIVUS NF7 maps to nf7-5s1e1a001.html');
ok(
  existingPartHref('nivus', 'NF7-5S1E1A001') === '../parts/nivus/nf7-5s1e1a001.html',
  'NIVUS NF7 href is the real file'
);
ok(existingPartHref('nivus', 'DOES-NOT-EXIST-XYZ') === null, 'unknown code does not invent a href');
ok(findExistingPartPage('gorter', 'SOFT PART SET') === null, 'descriptive Gorter row has no dedicated page');

const htmlLink = partCodeControlHtml('NF7-5S1E1A001', 'nivus', {
  'nf7-5s1e1a001': '../parts/nivus/nf7-5s1e1a001.html'
});
ok(htmlLink.includes('href="../parts/nivus/nf7-5s1e1a001.html"'), 'mapped code renders as page link');
ok(htmlLink.includes('part-page-link'), 'mapped code has part-page-link class');
ok(!htmlLink.includes('<button'), 'mapped code is not a quote button');

const htmlBtn = partCodeControlHtml('NO-SUCH-CODE', 'nivus', {});
ok(htmlBtn.includes('<button type="button" class="part-quote-btn"'), 'unmapped code stays a quote button');
ok(!htmlBtn.includes('href='), 'unmapped code has no invented href');

const partsBySlug = loadPartsBySlug();
summary.brandsWithParts = partsBySlug.size;
ok(partsBySlug.size > 8, `brands with supplied parts/listino: ${partsBySlug.size} (not just 8)`);

let suppliedMapped = 0;
let suppliedUnmapped = 0;
let suppliedCodes = 0;
const missingBrandPages = [];
const oldFormCopy = [];
const mappedButNotLinked = [];
for (const [slug, brandParts] of partsBySlug) {
  const brandFile = path.join(MARCHE, `${slug}.html`);
  if (!fs.existsSync(brandFile)) missingBrandPages.push(slug);
  const html = fs.existsSync(brandFile) ? fs.readFileSync(brandFile, 'utf8') : '';
  if (
    html.includes('um das vorausgefüllte Formular zu öffnen') ||
    html.includes('click a code to open the pre-filled enquiry form') ||
    html.includes('clicchi su un codice per aprire il modulo già compilato')
  ) {
    oldFormCopy.push(slug);
  }
  for (const part of brandParts.parts || []) {
    suppliedCodes++;
    const href = existingPartHref(slug, part.part_number);
    if (href) {
      suppliedMapped++;
      const abs = path.join(ROOT, href.replace('../', ''));
      if (!fs.existsSync(abs)) {
        failed++;
        console.log('  ✗ mapped href missing on disk', slug, part.part_number, href);
      }
      if (html && !html.includes(`href="${href}"`) && !html.includes(`href="${href.replace(/"/g, '&quot;')}"`)) {
        mappedButNotLinked.push(`${slug}:${part.part_number}`);
      }
    } else {
      suppliedUnmapped++;
    }
  }
}
summary.suppliedCodes = suppliedCodes;
summary.suppliedMapped = suppliedMapped;
summary.suppliedUnmapped = suppliedUnmapped;
ok(missingBrandPages.length === 0, `every parts brand has marche/{slug}.html (${missingBrandPages.slice(0, 5).join(', ') || 'ok'})`);
ok(oldFormCopy.length === 0, `no brand page still says every code opens the form (${oldFormCopy.slice(0, 5).join(', ') || 'ok'})`);
ok(
  mappedButNotLinked.length === 0,
  `supplied mapped codes appear as page links on brand HTML (${mappedButNotLinked.slice(0, 8).join(', ') || 'ok'})`
);
ok(suppliedMapped > 0, `supplied codes mapped to real files: ${suppliedMapped} / ${suppliedCodes}`);
ok(suppliedUnmapped >= 0, `supplied codes without a page (quote fallback): ${suppliedUnmapped}`);

console.log('\nListino sidecars (verified on-disk hrefs only)');
const sidecarFiles = fs.readdirSync(LISTINI).filter((f) => f.endsWith('-part-hrefs.json'));
ok(sidecarFiles.includes('siemens-part-hrefs.json'), 'siemens-part-hrefs.json exists');
ok(sidecarFiles.length >= 1, `listino sidecar files: ${sidecarFiles.join(', ')}`);

let sidecarHits = 0;
let listinoCodes = 0;
for (const name of sidecarFiles) {
  const map = JSON.parse(fs.readFileSync(path.join(LISTINI, name), 'utf8'));
  const slug = name.replace(/-part-hrefs\.json$/, '');
  const catalogPath = path.join(LISTINI, `${slug}.json`);
  ok(fs.existsSync(catalogPath), `${slug}.json catalog exists for sidecar`);
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  const codes = catalog.codes || [];
  listinoCodes += codes.length;
  const keys = Object.keys(map);
  sidecarHits += keys.length;
  let broken = 0;
  for (const href of Object.values(map)) {
    if (!href || typeof href !== 'string' || !href.startsWith('../parts/')) {
      broken++;
      continue;
    }
    const abs = path.join(ROOT, href.replace('../', ''));
    if (!fs.existsSync(abs)) broken++;
  }
  ok(broken === 0, `${name}: ${keys.length} hrefs, 0 broken (catalog ${codes.length})`);
  const brandHtml = fs.readFileSync(path.join(MARCHE, `${slug}.html`), 'utf8');
  ok(
    brandHtml.includes(`data-part-hrefs-src="../listini-data/${slug}-part-hrefs.json"`),
    `${slug} brand page fetches sidecar`
  );
  ok(brandHtml.includes('data-listino-src='), `${slug} brand page has listino search`);
}
summary.listinoSidecarHits = sidecarHits;
summary.listinoCodes = listinoCodes;
ok(sidecarHits > 1000, `listino codes with a real item page (sidecar hits): ${sidecarHits}`);
ok(listinoCodes > 90000, `listino catalog codes covered: ${listinoCodes}`);

const siemensMap = JSON.parse(fs.readFileSync(path.join(LISTINI, 'siemens-part-hrefs.json'), 'utf8'));
ok(siemensMap['3su1000-0aa10-0aa0'] === '../parts/siemens/3su1000-0aa10-0aa0.html', 'Siemens 3SU1000-0AA10-0AA0 maps to real file');
ok(!siemensMap['this-code-is-not-in-catalog-xyz'], 'sidecar does not invent unknown keys');
ok(existingPartHref('siemens', 'ZZZ-NOT-A-SIEMENS-CODE') === null, 'unmapped Siemens code has no href');

const siemensBrand = fs.readFileSync(path.join(MARCHE, 'siemens.html'), 'utf8');
ok(siemensBrand.includes('SIMATIC') || siemensBrand.includes('SIPART'), 'Siemens editorial copy survived');
ok(!/klicken Sie auf einen Code, um das vorausgefüllte Formular/.test(siemensBrand), 'Siemens instruction is not form-only');

console.log('\nGenerated NIVUS brand page');
const nivusBrand = fs.readFileSync(path.join(MARCHE, 'nivus.html'), 'utf8');
ok(
  nivusBrand.includes('href="../parts/nivus/nf7-5s1e1a001.html"') &&
    nivusBrand.includes('class="part-quote-btn part-page-link"'),
  'NF7 primary control is the dedicated item page'
);
ok(nivusBrand.includes('Durchflussmessung') && nivusBrand.includes('NivuFlow'), 'editorial NIVUS copy survived');
ok(!/data-part="NF7-5S1E1A001"[^>]*>[\s\S]{0,20}<button/.test(nivusBrand), 'NF7 is not a quote-form button');

const nivusItem = fs.readFileSync(path.join(PARTS, 'nivus/nf7-5s1e1a001.html'), 'utf8');
ok(nivusItem.includes('NIVUS NivuFlow 750 transmitter'), 'ERP H1/description preserved on NIVUS item');
ok(nivusItem.includes('part-cta-lang.js'), 'NIVUS item loads shared selector script');
ok(!nivusItem.includes('id="languageSelect"'), 'NIVUS item HTML is not rewritten with an inline selector');

console.log('\nExclusions still absent');
ok(!fs.existsSync(path.join(MARCHE, 'keysight.html')), 'no keysight brand page');
ok(!fs.existsSync(path.join(MARCHE, 'markem.html')), 'no markem brand page');

const reportPath = path.join(ROOT, 'artifacts');
if (!fs.existsSync(reportPath)) fs.mkdirSync(reportPath, { recursive: true });
fs.writeFileSync(
  path.join(reportPath, 'item-lang-brand-links-counts.json'),
  JSON.stringify(summary, null, 2) + '\n'
);
console.log('\nCounts', JSON.stringify(summary, null, 2));

if (failed) {
  console.log('\nFAILED', failed);
  process.exit(1);
}
console.log('\nAll mapping/language tests passed.');
