#!/usr/bin/env node
'use strict';

/**
 * Footer-only patch for existing brand pages and Siemens serie/katalog hubs.
 * Does not regenerate pages, does not touch item HTML, does not delete/rename.
 * Idempotent. Re-run safe.
 */
const fs = require('fs');
const path = require('path');
const { COPY, CSS } = require('./footer-disclaimer.js');

const ROOT = __dirname;
const DISCLAIMER_P =
  `<p id="abc-tm-disclaimer" class="footer-trademark" data-i18n="footer_trademark" data-abc-tm-disclaimer="1" role="note">${COPY.de}</p>`;
const SCRIPT = '<script src="/footer-disclaimer.js" defer></script>';
const BRAND_CSS = `    ${CSS}`;
const SERIE_CSS = CSS;

const RIGHTS = {
  de: 'Alle Rechte vorbehalten.',
  en: 'All rights reserved.',
  it: 'Tutti i diritti riservati.',
  es: 'Todos los derechos reservados.',
  fr: 'Tous droits réservés.'
};

function jsonVal(s) {
  return JSON.stringify(s);
}

function insertTranslationKeys(html) {
  let out = html;
  for (const lang of Object.keys(RIGHTS)) {
    const rights = RIGHTS[lang];
    const needle = `"footer_rights":"${rights}"`;
    const insert = `"footer_rights":"${rights}","footer_trademark":${jsonVal(COPY[lang])}`;
    if (out.includes(`"footer_trademark":${jsonVal(COPY[lang])}`)) continue;
    const n = out.split(needle).length - 1;
    if (n !== 1) {
      throw new Error(`expected 1 footer_rights (${lang}) match, got ${n}`);
    }
    out = out.replace(needle, insert);
  }
  return out;
}

function patchBrand(html, file) {
  if (html.includes('brand-redirect-stub')) return { html, skipped: 'stub' };
  if (html.includes('id="abc-tm-disclaimer"') && html.includes('/footer-disclaimer.js') && html.includes('"footer_trademark"')) {
    return { html, skipped: 'already' };
  }
  let out = html;
  if (!out.includes('.footer-trademark{')) {
    const cssMark = '.footer-info { font-size: 0.9rem; opacity: 0.9; }';
    if (!out.includes(cssMark)) throw new Error(`${file}: missing footer-info CSS`);
    out = out.replace(cssMark, `${cssMark}\n${BRAND_CSS}`);
  }
  const infoMark =
    '        <p>&copy; 2026 ABCspareparts. <span data-i18n="footer_rights">Alle Rechte vorbehalten.</span></p>';
  if (!out.includes('id="abc-tm-disclaimer"')) {
    if (!out.includes(infoMark)) throw new Error(`${file}: missing copyright line`);
    out = out.replace(infoMark, `${infoMark}\n        ${DISCLAIMER_P}`);
  }
  if (!out.includes('src="/footer-disclaimer.js"')) {
    if (!/<\/body>/i.test(out)) throw new Error(`${file}: missing </body>`);
    out = out.replace(/<\/body>/i, `  ${SCRIPT}\n</body>`);
  }
  out = insertTranslationKeys(out);
  return { html: out, skipped: null };
}

function patchSerie(html, file, footerHtml) {
  if (html.includes('id="abc-tm-disclaimer"') && html.includes('/footer-disclaimer.js')) {
    return { html, skipped: 'already' };
  }
  let out = html;
  const cssMark = 'footer{background:#1e3a5f;color:#fff;padding:1rem;text-align:center}footer a{color:#fff}';
  if (!out.includes('.footer-trademark{')) {
    if (!out.includes(cssMark)) throw new Error(`${file}: missing compact footer CSS`);
    out = out.replace(cssMark, `${cssMark}\n${SERIE_CSS}`);
  }
  if (!out.includes('id="abc-tm-disclaimer"')) {
    if (!out.includes(footerHtml)) throw new Error(`${file}: unexpected footer`);
    const next = footerHtml.replace(
      '</footer>',
      `<p id="abc-tm-disclaimer" class="footer-trademark" data-abc-tm-disclaimer="1" role="note">${COPY.de}</p></footer>`
    );
    out = out.replace(footerHtml, next);
  }
  if (!out.includes('src="/footer-disclaimer.js"')) {
    out = out.replace(/<\/body>/i, `${SCRIPT}\n</body>`);
  }
  return { html: out, skipped: null };
}

function stripPatch(html) {
  return html
    .replace(/\n?\s*\.footer-trademark\{[^}]+\}/g, '')
    .replace(/\n?\s*<p id="abc-tm-disclaimer"[^>]*>[\s\S]*?<\/p>/g, '')
    .replace(/\n?\s*<script src="\/footer-disclaimer\.js" defer><\/script>/g, '')
    .replace(/,"footer_trademark":"[^"]*"/g, '');
}

function listHtml(dir) {
  return fs.readdirSync(dir).filter((n) => n.endsWith('.html')).map((n) => path.join(dir, n));
}

function main() {
  const stats = {
    brandPatched: 0,
    brandAlready: 0,
    brandStub: 0,
    seriePatched: 0,
    serieAlready: 0,
    katalogPatched: 0,
    mismatches: []
  };

  for (const file of listHtml(path.join(ROOT, 'marche'))) {
    const orig = fs.readFileSync(file, 'utf8');
    const { html, skipped } = patchBrand(orig, path.relative(ROOT, file));
    if (skipped === 'stub') {
      stats.brandStub++;
      continue;
    }
    if (skipped === 'already') {
      stats.brandAlready++;
      continue;
    }
    if (stripPatch(html) !== orig) {
      stats.mismatches.push(path.relative(ROOT, file));
      continue;
    }
    if (html !== orig) {
      fs.writeFileSync(file, html);
      stats.brandPatched++;
    }
  }

  const serieFooter = '<footer><a href="../../../marche/siemens.html">Siemens</a> · © ABCspareparts</footer>';
  for (const file of listHtml(path.join(ROOT, 'parts/siemens/serie'))) {
    const orig = fs.readFileSync(file, 'utf8');
    const { html, skipped } = patchSerie(orig, path.relative(ROOT, file), serieFooter);
    if (skipped === 'already') {
      stats.serieAlready++;
      continue;
    }
    if (stripPatch(html) !== orig) {
      stats.mismatches.push(path.relative(ROOT, file));
      continue;
    }
    if (html !== orig) {
      fs.writeFileSync(file, html);
      stats.seriePatched++;
    }
  }

  const katPath = path.join(ROOT, 'parts/siemens/katalog.html');
  const katOrig = fs.readFileSync(katPath, 'utf8');
  const katFooter = '<footer><a href="../../marche/siemens.html">Siemens</a> · © ABCspareparts</footer>';
  const kat = patchSerie(katOrig, 'parts/siemens/katalog.html', katFooter);
  if (kat.skipped === 'already') {
    stats.katalogPatched = 0;
  } else if (stripPatch(kat.html) !== katOrig) {
    stats.mismatches.push('parts/siemens/katalog.html');
  } else if (kat.html !== katOrig) {
    fs.writeFileSync(katPath, kat.html);
    stats.katalogPatched = 1;
  }

  console.log(JSON.stringify(stats, null, 2));
  if (stats.mismatches.length) {
    console.error('Footer-only proof failed for', stats.mismatches.length, 'files');
    console.error(stats.mismatches.slice(0, 20).join('\n'));
    process.exit(1);
  }
  if (stats.brandPatched + stats.brandAlready !== 11975) {
    console.error('Unexpected brand coverage', stats);
    process.exit(1);
  }
  if (stats.seriePatched + stats.serieAlready !== 1122) {
    console.error('Unexpected serie coverage', stats);
    process.exit(1);
  }
}

main();
