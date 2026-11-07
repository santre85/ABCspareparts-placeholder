#!/usr/bin/env node
'use strict';

/**
 * Bounded Playwright checks for item-page language + Siemens listino links.
 * Uses locale emulation (not Chrome --lang). Hard timeouts; never networkidle.
 * Does not submit the ERP quote form.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = 8094;
const BASE = `http://127.0.0.1:${PORT}`;
const TOTAL_MS = 90000;
const PAGE_MS = 12000;

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

async function main() {
  let server;
  let browser;
  const started = Date.now();
  try {
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

    async function openPage(locale, url, storageLang) {
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
          localStorage.setItem('lang', lang);
        }, storageLang);
        await page.reload({ waitUntil: 'domcontentloaded' });
      }
      await page.waitForSelector('#languageSelect', { state: 'attached' });
      return { context, page };
    }

    const nivus = `${BASE}/parts/nivus/nf7-5s1e1a001.html`;
    const siemensItem = `${BASE}/parts/siemens/3su1000-0aa10-0aa0.html`;
    const siemensBrand = `${BASE}/marche/siemens.html`;
    const erpH1 = 'NIVUS NF7-5S1E1A001 – NIVUS NivuFlow 750 transmitter';
    const erpDesc = 'NIVUS NF7-5S1E1A001NIVUS NivuFlow 750 transmitter';

    const locales = [
      { loc: 'de-DE', lang: 'de', brands: 'Marken', cta: 'Angebot anfragen' },
      { loc: 'en-GB', lang: 'en', brands: 'Brands', cta: 'Request quote' },
      { loc: 'it-IT', lang: 'it', brands: 'Marche', cta: 'Richiedi preventivo' },
      { loc: 'es-ES', lang: 'es', brands: 'Marcas', cta: 'Solicitar presupuesto' },
      { loc: 'fr-FR', lang: 'fr', brands: 'Marques', cta: 'Demander un devis' }
    ];

    console.log('NIVUS item: browser locales de/en/it/es/fr');
    for (const row of locales) {
      const { context, page } = await openPage(row.loc, nivus);
      const got = await page.evaluate(() => ({
        sel: document.getElementById('languageSelect') && document.getElementById('languageSelect').value,
        htmlLang: document.documentElement.lang,
        crumb: Array.from(document.querySelectorAll('.breadcrumb a')).map((a) => a.textContent.trim()),
        h1: document.querySelector('h1') && document.querySelector('h1').textContent.trim(),
        desc: document.querySelector('.part-meta dd.plain:last-of-type') &&
          document.querySelector('.part-meta dd.plain:last-of-type').textContent.trim(),
        cta: document.querySelector('a.cta-primary') && document.querySelector('a.cta-primary').textContent.trim(),
        href: document.querySelector('a.cta-primary') && document.querySelector('a.cta-primary').getAttribute('href')
      }));
      ok(got.sel === row.lang, `${row.loc} selector=${got.sel}`);
      ok(got.htmlLang === row.lang, `${row.loc} html lang=${got.htmlLang}`);
      ok(got.crumb.includes(row.brands), `${row.loc} breadcrumb has ${row.brands} (${got.crumb.join(' · ')})`);
      ok(!got.crumb.includes('Marken') || row.lang === 'de', `${row.loc} breadcrumb is not stuck on Marken`);
      ok(got.h1 === erpH1, `${row.loc} ERP H1 unchanged`);
      ok(got.desc === erpDesc, `${row.loc} ERP description unchanged`);
      ok(got.cta === row.cta, `${row.loc} CTA chrome=${got.cta}`);
      ok(/[?&]code=NF7-5S1E1A001/.test(got.href) && /[?&]brand=NIVUS/.test(got.href), `${row.loc} CTA has manufacturer+code`);
      if (row.lang === 'de') ok(got.href.indexOf('/en/') === -1, 'de CTA stays on German home');
      else ok(got.href.indexOf(`/${row.lang}/`) !== -1, `${row.loc} CTA keeps language prefix`);
      await context.close();
    }

    console.log('\nUnsupported locale → German; saved choice wins; switch persists');
    {
      const { context, page } = await openPage('zh-CN', nivus);
      const sel = await page.$eval('#languageSelect', (el) => el.value);
      const brands = await page.$$eval('.breadcrumb a', (as) => as.map((a) => a.textContent.trim()));
      ok(sel === 'de', `zh-CN falls back to de (got ${sel})`);
      ok(brands.includes('Marken'), 'zh-CN breadcrumb Marken');
      await context.close();
    }
    {
      const { context, page } = await openPage('fr-FR', nivus, 'it');
      const sel = await page.$eval('#languageSelect', (el) => el.value);
      const brands = await page.$$eval('.breadcrumb a', (as) => as.map((a) => a.textContent.trim()));
      ok(sel === 'it', `saved it wins over fr-FR browser (got ${sel})`);
      ok(brands.includes('Marche'), 'saved it breadcrumb Marche');
      await page.selectOption('#languageSelect', 'en');
      await page.waitForFunction(() => localStorage.getItem('lang') === 'en' && document.documentElement.lang === 'en');
      const after = await page.evaluate(() => ({
        sel: document.getElementById('languageSelect').value,
        stored: localStorage.getItem('lang'),
        brands: Array.from(document.querySelectorAll('.breadcrumb a')).map((a) => a.textContent.trim()),
        h1: document.querySelector('h1').textContent.trim()
      }));
      ok(after.sel === 'en' && after.stored === 'en', 'switching to en persists in localStorage');
      ok(after.brands.includes('Brands'), 'after switch, breadcrumb Brands');
      ok(after.h1 === erpH1, 'H1 still ERP after switch');
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#languageSelect');
      const reloaded = await page.evaluate(() => ({
        sel: document.getElementById('languageSelect').value,
        stored: localStorage.getItem('lang')
      }));
      ok(reloaded.sel === 'en' && reloaded.stored === 'en', `reload keeps saved en (got ${reloaded.sel}/${reloaded.stored})`);
      await context.close();
    }

    console.log('\nSiemens listino item + brand search');
    {
      const { context, page } = await openPage('en-GB', siemensItem);
      const got = await page.evaluate(() => ({
        sel: document.getElementById('languageSelect').value,
        brands: Array.from(document.querySelectorAll('.breadcrumb a')).map((a) => a.textContent.trim()),
        href: document.querySelector('a.cta-primary').getAttribute('href'),
        cta: document.querySelector('a.cta-primary').textContent.trim(),
        code: document.querySelector('[data-part-code]') && document.querySelector('[data-part-code]').getAttribute('data-part-code')
      }));
      ok(got.sel === 'en', `Siemens item selector en (${got.sel})`);
      ok(got.brands.includes('Brands'), `Siemens item breadcrumb Brands (${got.brands.join(' · ')})`);
      ok(got.cta === 'Request quote', `Siemens item CTA ${got.cta}`);
      ok(/[?&]code=3SU1000-0AA10-0AA0/i.test(got.href) && /[?&]brand=Siemens/.test(got.href), 'Siemens CTA manufacturer+code');
      ok(got.href.indexOf('/en/') !== -1, 'Siemens CTA keeps en prefix');
      await context.close();
    }
    {
      const context = await browser.newContext({
        locale: 'en-GB',
        extraHTTPHeaders: { 'Accept-Language': 'en-GB' }
      });
      context.setDefaultTimeout(PAGE_MS);
      context.setDefaultNavigationTimeout(PAGE_MS);
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (err) => errors.push(String(err)));
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
      });
      await page.route('**/listini-data/**', async (route) => {
        await new Promise((r) => setTimeout(r, 1800));
        await route.continue();
      });
      await page.goto(siemensBrand, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => {
        localStorage.setItem('lang', 'en');
      });
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#listinoSearchInput');
      await page.focus('#listinoSearchInput');
      await page.fill('#listinoSearchInput', '3SU1000-0AA10');
      await page.evaluate(() => {
        const el = document.getElementById('listinoSearchInput');
        el.dispatchEvent(new Event('input', { bubbles: true }));
      });
      await page.waitForFunction(() => document.querySelectorAll('#listinoResults li').length > 0, {
        timeout: 25000
      });
      const dump = await page.evaluate(() => ({
        html: (document.getElementById('listinoResults') || {}).innerHTML || '',
        errors: (window.__abcErr || []).slice(0, 5)
      }));
      const href = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('#listinoResults a.part-page-link'));
        const hit = links.find((a) => /3SU1000-0AA10-0AA0/i.test(a.textContent || ''));
        return hit ? hit.getAttribute('href') : (links[0] && links[0].getAttribute('href')) || '';
      });
      ok(
        href === '../parts/siemens/3su1000-0aa10-0aa0.html' || /\/parts\/siemens\/3su1000-0aa10-0aa0\.html$/.test(href),
        `Siemens search hit links to real file (${href || dump.html.slice(0, 180)})`
      );
      ok(errors.length === 0, `no page errors during Siemens search (${errors.slice(0, 2).join(' | ')})`);
      const intro = await page.$eval('[data-i18n="brand_parts_listino_intro"]', (el) => el.textContent);
      ok(/part page|fiche|scheda|Teileseite|ficha/i.test(intro), `listino intro mentions part pages (${intro.slice(0, 80)})`);
      ok(!/every code opens|all codes open the form|um das vorausgefüllte Formular/i.test(intro), 'listino intro is not form-only');
      await context.close();
    }

    ok(Date.now() - started < TOTAL_MS, `browser suite finished in ${Date.now() - started}ms`);
  } catch (e) {
    console.log('  ✗ browser run error:', e && e.message);
    failed++;
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (e) {}
    }
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  }
  if (failed) {
    console.log('\nBROWSER FAILED', failed);
    process.exit(1);
  }
  console.log('\nBrowser language/search checks passed.');
}

withTimeout(main(), TOTAL_MS, 'entire browser suite').catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
