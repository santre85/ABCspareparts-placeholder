#!/usr/bin/env node
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { COPY } = require('./footer-disclaimer.js');

const ROOT = __dirname;
const PORT = 8096;
const BASE = `http://127.0.0.1:${PORT}`;
const TOTAL_MS = 90000;
const PAGE_MS = 15000;

let failed = 0;
function ok(cond, msg) {
  if (cond) console.log('  ✓', msg);
  else {
    console.log('  ✗', msg);
    failed++;
  }
}

function startServer() {
  const types = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json',
    '.css': 'text/css',
    '.svg': 'image/svg+xml',
    '.png': 'image/png'
  };
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent((req.url || '/').split('?')[0].split('#')[0]);
      let filePath = path.join(ROOT, urlPath === '/' ? '/index.html' : urlPath);
      if (filePath.endsWith('/')) filePath = path.join(filePath, 'index.html');
      const rel = path.relative(ROOT, filePath);
      if (rel.startsWith('..')) {
        res.writeHead(403);
        res.end('forbidden');
        return;
      }
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('Not Found');
          return;
        }
        res.writeHead(200, { 'Content-Type': types[path.extname(filePath)] || 'text/plain' });
        res.end(data);
      });
    });
    server.listen(PORT, '127.0.0.1', () => resolve(server));
    server.on('error', reject);
  });
}

async function withTimeout(promise, ms, label) {
  let t;
  const timeout = new Promise((_, reject) => {
    t = setTimeout(() => reject(new Error(`timeout ${ms}ms: ${label}`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(t);
  }
}

function countFilesWith(dir, pred) {
  let n = 0;
  function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.html') && pred(p)) n++;
    }
  }
  walk(dir);
  return n;
}

async function main() {
  let server;
  let browser;
  const started = Date.now();
  try {
    const cta = fs.readFileSync(path.join(ROOT, 'part-cta-lang.js'), 'utf8');
    const si = fs.readFileSync(path.join(ROOT, 'parts/siemens/part-i18n.js'), 'utf8');
    const shared = fs.readFileSync(path.join(ROOT, 'footer-disclaimer.js'), 'utf8');
    const footer = fs.readFileSync(path.join(ROOT, 'site-footer.js'), 'utf8');
    ok(shared.includes("'abc-tm-disclaimer'"), 'shared module has idempotent id');
    ok(footer.includes("require('./footer-disclaimer.js')"), 'site-footer.js uses shared copy');
    ok(footer.includes('/footer-disclaimer.js'), 'generated footers load shared script');
    ok(cta.includes('/footer-disclaimer.js'), 'part-cta-lang.js loads shared script');
    ok(si.includes('/footer-disclaimer.js'), 'part-i18n.js loads shared script');
    ok(!fs.existsSync(path.join(ROOT, 'marche/keysight.html')), 'Keysight still excluded');

    const erp = countFilesWith(path.join(ROOT, 'parts'), (p) => {
      const rel = path.relative(ROOT, p).replace(/\\/g, '/');
      if (!rel.startsWith('parts/') || rel.startsWith('parts/siemens/')) return false;
      return fs.readFileSync(p, 'utf8').includes('part-cta-lang.js');
    });
    const siemensI18n = countFilesWith(path.join(ROOT, 'parts/siemens'), (p) => {
      if (path.basename(path.dirname(p)) !== 'siemens') return false;
      return fs.readFileSync(p, 'utf8').includes('part-i18n.js');
    });
    ok(erp >= 400, `ERP/other item pages hook part-cta-lang.js: ${erp}`);
    ok(siemensI18n >= 90000, `Siemens listino hook part-i18n.js: ${siemensI18n}`);

    const nivusBrand = fs.readFileSync(path.join(ROOT, 'marche/nivus.html'), 'utf8');
    ok(nivusBrand.includes('/footer-disclaimer.js') && nivusBrand.includes('abc-tm-disclaimer'), 'NIVUS brand has shared footer hook');
    ok(nivusBrand.includes('bx_about_title') && nivusBrand.includes('NivuFlow'), 'NIVUS editorial copy preserved');
    ok(nivusBrand.includes('PART_HREFS') && nivusBrand.includes('nf7-5s1e1a001'), 'NIVUS part href map preserved');
    const nivusItem = fs.readFileSync(path.join(ROOT, 'parts/nivus/nf7-5s1e1a001.html'), 'utf8');
    ok(!nivusItem.includes('abc-tm-disclaimer'), 'item HTML still has no static disclaimer (shared JS injects)');

    const brandWithHook = countFilesWith(path.join(ROOT, 'marche'), (p) => {
      if (path.dirname(p) !== path.join(ROOT, 'marche')) return false;
      const t = fs.readFileSync(p, 'utf8');
      if (t.includes('brand-redirect-stub')) return false;
      return t.includes('id="abc-tm-disclaimer"') && t.includes('/footer-disclaimer.js');
    });
    const serieHook = countFilesWith(path.join(ROOT, 'parts/siemens/serie'), (p) => {
      const t = fs.readFileSync(p, 'utf8');
      return t.includes('id="abc-tm-disclaimer"') && t.includes('/footer-disclaimer.js');
    });
    const stubs = ['marche/miele.html', 'marche/valmet.html', 'marche/rommelsbacher.html'];
    ok(stubs.every((f) => fs.readFileSync(path.join(ROOT, f), 'utf8').includes('brand-redirect-stub')), '3 noindex brand stubs unchanged');
    ok(brandWithHook === 11975, `brand pages with footer hook: ${brandWithHook}`);
    ok(serieHook === 1122, `Siemens serie hubs with footer hook: ${serieHook}`);
    const kat = fs.readFileSync(path.join(ROOT, 'parts/siemens/katalog.html'), 'utf8');
    ok(kat.includes('abc-tm-disclaimer') && kat.includes('/footer-disclaimer.js'), 'Siemens katalog has footer hook');

    const { chromium } = require('playwright');
    server = await startServer();
    browser = await withTimeout(
      chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
      }),
      20000,
      'chromium.launch'
    );

    async function open(locale, url, storageLang) {
      const context = await browser.newContext({
        locale,
        extraHTTPHeaders: { 'Accept-Language': locale }
      });
      context.setDefaultTimeout(PAGE_MS);
      context.setDefaultNavigationTimeout(PAGE_MS);
      const page = await context.newPage();
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      if (storageLang) {
        await page.evaluate((lang) => {
          try { localStorage.setItem('lang', lang); } catch (e) {}
        }, storageLang);
        await page.reload({ waitUntil: 'domcontentloaded' });
      }
      return { context, page };
    }

    const pages = [
      { name: 'home', url: `${BASE}/index.html` },
      { name: 'marche hub', url: `${BASE}/marche.html` },
      { name: 'NIVUS brand', url: `${BASE}/marche/nivus.html` },
      { name: 'NIVUS item', url: `${BASE}/parts/nivus/nf7-5s1e1a001.html` },
      { name: 'Siemens item', url: `${BASE}/parts/siemens/3su1000-0aa10-0aa0.html` },
      { name: 'Siemens serie', url: `${BASE}/parts/siemens/serie/3su1.html` },
      { name: 'Siemens katalog', url: `${BASE}/parts/siemens/katalog.html` },
      { name: 'impressum', url: `${BASE}/impressum.html` }
    ];

    console.log('\nFive-language text on NIVUS item + home');
    for (const row of [
      { loc: 'de-DE', lang: 'de' },
      { loc: 'en-GB', lang: 'en' },
      { loc: 'it-IT', lang: 'it' },
      { loc: 'es-ES', lang: 'es' },
      { loc: 'fr-FR', lang: 'fr' }
    ]) {
      const { context, page } = await open(row.loc, `${BASE}/parts/nivus/nf7-5s1e1a001.html`);
      await page.waitForFunction(() => document.getElementById('abc-tm-disclaimer'), { timeout: 8000 });
      const text = await page.$eval('#abc-tm-disclaimer', (el) => el.textContent.trim());
      const n = await page.$$eval('[data-abc-tm-disclaimer], #abc-tm-disclaimer', (els) => els.length);
      ok(text === COPY[row.lang], `NIVUS item ${row.lang} copy`);
      ok(n === 1, `NIVUS item ${row.lang} single disclaimer (${n})`);
      await context.close();
    }

    {
      const { context, page } = await open('fr-FR', `${BASE}/index.html`, 'it');
      await page.waitForSelector('#abc-tm-disclaimer');
      const before = await page.$eval('#abc-tm-disclaimer', (el) => el.textContent.trim());
      ok(before === COPY.it, 'home saved it wins over fr-FR');
      await page.selectOption('#languageSelect', 'en');
      await page.waitForFunction((en) => {
        const el = document.getElementById('abc-tm-disclaimer');
        return el && el.textContent.trim() === en;
      }, COPY.en);
      ok(true, 'home switch it→en updates disclaimer');
      const links = await page.$$eval('.footer-links a', (as) => as.map((a) => a.getAttribute('href')));
      ok(links.some((h) => /impressum/.test(h)) && links.some((h) => /marche/.test(h)), 'legal/brand footer links preserved');
      await context.close();
    }

    {
      const { context, page } = await open('en-GB', `${BASE}/parts/siemens/3su1000-0aa10-0aa0.html`, 'en');
      await page.waitForFunction(() => document.getElementById('abc-tm-disclaimer'), { timeout: 8000 });
      const n = await page.$$eval('#abc-tm-disclaimer', (els) => els.length);
      const text = await page.$eval('#abc-tm-disclaimer', (el) => el.textContent.trim());
      ok(n === 1 && text === COPY.en, `Siemens item single EN disclaimer (n=${n})`);
      await context.close();
    }

    {
      const { context, page } = await open('en-GB', `${BASE}/en/impressum.html`);
      await page.waitForSelector('#abc-tm-disclaimer');
      const text = await page.$eval('#abc-tm-disclaimer', (el) => el.textContent.trim());
      ok(text === COPY.en, 'en/impressum static EN disclaimer');
      await context.close();
    }

    {
      const enMarche = fs.readFileSync(path.join(ROOT, 'en/marche.html'), 'utf8');
      ok(enMarche.includes(COPY.en), 'en/marche.html static EN disclaimer (no-JS)');
      const { context, page } = await open('de-DE', `${BASE}/marche.html`, 'de');
      await page.waitForSelector('#abc-tm-disclaimer');
      await page.selectOption('#languageSelect', 'fr');
      await page.waitForFunction((fr) => {
        const el = document.getElementById('abc-tm-disclaimer');
        return el && el.textContent.trim() === fr;
      }, COPY.fr);
      ok(true, 'marche hub switch de→fr updates disclaimer');
      await context.close();
    }

    {
      const { context, page } = await open('de-DE', `${BASE}/marche/nivus.html`, 'de');
      await page.waitForSelector('#abc-tm-disclaimer');
      const n0 = await page.$$eval('#abc-tm-disclaimer', (els) => els.length);
      ok(n0 === 1, `NIVUS brand single node before switch (${n0})`);
      await page.selectOption('#languageSelect', 'it');
      await page.waitForFunction((it) => {
        const el = document.getElementById('abc-tm-disclaimer');
        return el && el.textContent.trim() === it;
      }, COPY.it);
      const n1 = await page.$$eval('#abc-tm-disclaimer', (els) => els.length);
      ok(n1 === 1 && (await page.$eval('#abc-tm-disclaimer', (el) => el.textContent.trim())) === COPY.it, 'NIVUS brand de→it, still one node');
      const h1 = await page.$eval('[data-i18n="brand_h1"]', (el) => el.textContent);
      ok(/NIVUS/.test(h1) && /ricambi|portata|ultrasuoni/i.test(h1), 'NIVUS editorial heading still translates');
      await context.close();
    }

    {
      const { context, page } = await open('es-ES', `${BASE}/parts/siemens/serie/3su1.html`, 'es');
      await page.waitForFunction(() => document.getElementById('abc-tm-disclaimer'), { timeout: 8000 });
      const text = await page.$eval('#abc-tm-disclaimer', (el) => el.textContent.trim());
      ok(text === COPY.es, 'serie hub follows saved es');
      const n = await page.$$eval('#abc-tm-disclaimer', (els) => els.length);
      ok(n === 1, 'serie hub single node');
      await context.close();
    }

    {
      const noJs = await browser.newContext({ javaScriptEnabled: false, locale: 'en-GB' });
      noJs.setDefaultTimeout(PAGE_MS);
      const page = await noJs.newPage();
      await page.goto(`${BASE}/marche/nivus.html`, { waitUntil: 'domcontentloaded' });
      const brandText = await page.$eval('#abc-tm-disclaimer', (el) => el.textContent.trim());
      ok(brandText === COPY.de, 'no-JS brand page keeps static DE disclaimer');
      await page.goto(`${BASE}/en/index.html`, { waitUntil: 'domcontentloaded' });
      const homeEn = await page.$eval('#abc-tm-disclaimer', (el) => el.textContent.trim());
      ok(homeEn === COPY.en, 'no-JS en/index static EN disclaimer');
      await page.goto(`${BASE}/parts/nivus/nf7-5s1e1a001.html`, { waitUntil: 'domcontentloaded' });
      const itemHas = await page.$('#abc-tm-disclaimer');
      ok(!itemHas, 'no-JS item page has no disclaimer (shared-script injection only)');
      await noJs.close();
    }

    for (const p of pages) {
      const { context, page } = await open('de-DE', p.url);
      await page.waitForFunction(() => document.querySelector('footer'), { timeout: 8000 });
      const has = await page.$('#abc-tm-disclaimer');
      ok(!!has, `${p.name} has disclaimer`);
      await context.close();
    }

    ok(Date.now() - started < TOTAL_MS, `suite finished in ${Date.now() - started}ms`);
  } catch (e) {
    console.log('  ✗ browser run error:', e && e.message);
    failed++;
  } finally {
    if (browser) {
      try { await browser.close(); } catch (e) {}
    }
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  }
  if (failed) {
    console.log('\nFOOTER DISCLAIMER FAILED', failed);
    process.exit(1);
  }
  console.log('\nFooter disclaimer checks passed.');
}

withTimeout(main(), TOTAL_MS, 'entire footer disclaimer suite').catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
