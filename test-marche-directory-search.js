#!/usr/bin/env node
'use strict';

/**
 * Bounded Playwright checks for Brands directory search on de/en/it/es/fr hubs.
 * Serves the repo locally (live-equivalent paths). Does not submit forms.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { directoryBrandCount } = require('./marche-i18n.js');

const ROOT = __dirname;
const PORT = 8095;
const BASE = `http://127.0.0.1:${PORT}`;
const TOTAL_MS = 90000;
const PAGE_MS = 15000;
const EXPECTED = directoryBrandCount();

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
    '.png': 'image/png',
    '.xml': 'application/xml'
  };
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent((req.url || '/').split('?')[0].split('#')[0]);
      let filePath = path.join(ROOT, urlPath);
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

const HUBS = [
  { lang: 'de', path: '/marche.html', locale: 'de-DE' },
  { lang: 'en', path: '/en/marche.html', locale: 'en-GB' },
  { lang: 'it', path: '/it/marche.html', locale: 'it-IT' },
  { lang: 'es', path: '/es/marche.html', locale: 'es-ES' },
  { lang: 'fr', path: '/fr/marche.html', locale: 'fr-FR' }
];

const SEARCHES = [
  { q: 'Kfm', slug: 'kfm' },
  { q: 'MEASUREX', slug: 'measurex' },
  { q: 'Powasert', slug: 'powasert' },
  { q: 'NIVUS', slug: 'nivus' }
];

function countStaticLinks(html) {
  const m = html.match(/<div class="brand-groups" id="brandGroups">([\s\S]*?)<\/div>\s*<\/div>\s*<\/main>/);
  if (!m) return 0;
  return (m[1].match(/href="[^"]*marche\/[^"]+\.html"/g) || []).length;
}

async function main() {
  let server;
  let browser;
  const started = Date.now();
  try {
    ok(EXPECTED === 11975, `source-of-truth directoryBrandCount=${EXPECTED}`);
    ok(!fs.existsSync(path.join(ROOT, 'marche/keysight.html')), 'Keysight still excluded');
    ok(!fs.existsSync(path.join(ROOT, 'marche/markem.html')), 'Markem still excluded');

    for (const hub of HUBS) {
      const abs = path.join(ROOT, hub.path.replace(/^\//, ''));
      const html = fs.readFileSync(abs, 'utf8');
      ok(html.includes("fetch('/brand-groups.json')"), `${hub.lang} fetches /brand-groups.json`);
      ok(!/fetch\('brand-groups\.json'\)/.test(html), `${hub.lang} does not use relative brand-groups.json`);
      ok(countStaticLinks(html) === EXPECTED, `${hub.lang} static A-Z links=${countStaticLinks(html)}`);
      ok(String(EXPECTED).length && html.includes(String(EXPECTED)), `${hub.lang} metadata/copy includes ${EXPECTED}`);
      ok(!html.includes('11959'), `${hub.lang} has no stale 11959 count`);
      ok(!/keysight|markem-imaje/i.test(html.match(/id="brandGroups">[\s\S]*?<\/div>\s*<\/div>\s*<\/main>/)[0]), `${hub.lang} A-Z has no excluded brands`);
    }

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

    for (const hub of HUBS) {
      console.log(`\nDirectory ${hub.lang} ${hub.path}`);
      const context = await browser.newContext({
        locale: hub.locale,
        extraHTTPHeaders: { 'Accept-Language': hub.locale }
      });
      context.setDefaultTimeout(PAGE_MS);
      context.setDefaultNavigationTimeout(PAGE_MS);
      const page = await context.newPage();
      const jsonHits = [];
      page.on('response', (r) => {
        if (/brand-groups\.json(\?|$)/.test(r.url())) jsonHits.push({ url: r.url(), status: r.status() });
      });
      await page.goto(`${BASE}${hub.path}`, { waitUntil: 'domcontentloaded' });
      await page.evaluate((lang) => {
        try { localStorage.setItem('lang', lang); } catch (e) {}
      }, hub.lang);
      const jsonWait = page.waitForResponse(
        (r) => /\/brand-groups\.json(\?|$)/.test(new URL(r.url()).pathname) && r.ok(),
        { timeout: 20000 }
      );
      await page.reload({ waitUntil: 'domcontentloaded' });
      const jsonResp = await jsonWait;
      ok(jsonResp.ok(), `${hub.lang} JSON HTTP ${jsonResp.status()}`);
      ok(
        jsonHits.every((h) => new URL(h.url).pathname === '/brand-groups.json'),
        `${hub.lang} JSON path is /brand-groups.json (${jsonHits.map((h) => new URL(h.url).pathname).join(',')})`
      );
      ok(
        !jsonHits.some((h) => /^\/(en|it|es|fr)\//.test(new URL(h.url).pathname)),
        `${hub.lang} did not request language-prefixed JSON`
      );

      await page.waitForSelector('#brandSearchInput');
      const staticN = await page.$$eval('#brandGroups a', (as) => as.length);
      ok(staticN === EXPECTED, `${hub.lang} rendered A-Z ${staticN}`);

      for (const row of SEARCHES) {
        await page.fill('#brandSearchInput', row.q);
        await page.evaluate(() => {
          const el = document.getElementById('brandSearchInput');
          el.dispatchEvent(new Event('input', { bubbles: true }));
        });
        await page.waitForFunction(
          (slug) => {
            const links = Array.from(document.querySelectorAll('#brandGroups a'));
            return links.length > 0 && links.length < 500 && links.some((a) => (a.getAttribute('href') || '').indexOf(`/${slug}.html`) !== -1 || (a.getAttribute('href') || '').indexOf(`marche/${slug}.html`) !== -1);
          },
          row.slug,
          { timeout: 12000 }
        );
        const hit = await page.evaluate((slug) => {
          const a = Array.from(document.querySelectorAll('#brandGroups a')).find((el) =>
            (el.getAttribute('href') || '').indexOf(`${slug}.html`) !== -1
          );
          return a
            ? { href: a.getAttribute('href'), text: a.textContent.trim(), n: document.querySelectorAll('#brandGroups a').length }
            : { href: '', text: '', n: document.querySelectorAll('#brandGroups a').length };
        }, row.slug);
        const abs = path.join(ROOT, 'marche', `${row.slug}.html`);
        ok(fs.existsSync(abs), `${hub.lang} ${row.q} target file exists`);
        ok(
          hit.href === `marche/${row.slug}.html` || hit.href === `/marche/${row.slug}.html`,
          `${hub.lang} ${row.q} → ${hit.href}`
        );
      }

      await page.fill('#brandSearchInput', 'zzzxqnotabrand999');
      await page.evaluate(() => {
        const el = document.getElementById('brandSearchInput');
        el.dispatchEvent(new Event('input', { bubbles: true }));
      });
      await page.waitForFunction(() => {
        const meta = document.getElementById('brandSearchMeta');
        const n = document.querySelectorAll('#brandGroups a').length;
        return n === 0 && meta && meta.className.indexOf('brand-search-empty') !== -1;
      }, { timeout: 12000 });
      ok(true, `${hub.lang} no-results empties list`);

      await page.fill('#brandSearchInput', '');
      await page.evaluate(() => {
        const el = document.getElementById('brandSearchInput');
        el.dispatchEvent(new Event('input', { bubbles: true }));
      });
      await page.waitForFunction((expected) => document.querySelectorAll('#brandGroups a').length === expected, EXPECTED, {
        timeout: 12000
      });
      const restored = await page.evaluate(() =>
        Array.from(document.querySelectorAll('#brandGroups a')).some((a) => (a.getAttribute('href') || '').indexOf('nivus.html') !== -1)
      );
      ok(restored, `${hub.lang} clearing search restores static A-Z including NIVUS`);

      await context.close();
    }

    console.log('\nStatic fallback when JSON fails (en)');
    {
      const context = await browser.newContext({
        locale: 'en-GB',
        extraHTTPHeaders: { 'Accept-Language': 'en-GB' }
      });
      context.setDefaultTimeout(PAGE_MS);
      const page = await context.newPage();
      await page.route('**/brand-groups.json', (route) => route.abort());
      await page.goto(`${BASE}/en/marche.html`, { waitUntil: 'domcontentloaded' });
      const n = await page.$$eval('#brandGroups a', (as) => as.length);
      const nivus = await page.evaluate(() =>
        Array.from(document.querySelectorAll('#brandGroups a')).some((a) => (a.getAttribute('href') || '').indexOf('nivus.html') !== -1)
      );
      ok(n === EXPECTED, `JSON abort still shows static A-Z (${n})`);
      ok(nivus, 'JSON abort still lists NIVUS');
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
    console.log('\nMARCHE DIR FAILED', failed);
    process.exit(1);
  }
  console.log('\nDirectory search checks passed.');
}

withTimeout(main(), TOTAL_MS, 'entire marche directory suite').catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
