'use strict';

/**
 * Generate indexable /parts/siemens/{slug}.html pages for the full Siemens listino
 * (~91k codes), plus series hub pages and sharded sitemaps.
 *
 * MVP pages (parts-mvp.json) are left untouched (richer copy). Listino pages use a
 * compact template. Does not publish raw listini-data JSON.
 */

const fs = require('fs');
const path = require('path');
const { BASE } = require('./seo-config.js');
const { writeSitemapIndex } = require('./build-brand-parts.js');

const ROOT = __dirname;
const TODAY = new Date().toISOString().slice(0, 10);
const LISTINO_PATH = path.join(ROOT, 'listini-data/siemens.json');
const MVP_PATH = path.join(ROOT, 'parts-mvp.json');
const OUT_DIR = path.join(ROOT, 'parts/siemens');
const SERIES_DIR = path.join(OUT_DIR, 'serie');
const MANIFEST_PATH = path.join(ROOT, 'parts-siemens-listino-manifest.json');
const SITEMAP_PREFIX = 'sitemap-siemens-parts';
const SITEMAP_LIMIT = 45000;
const HUB_PAGE_SIZE = 500;

const SERIES_LABELS = {
  '3SU1': 'SIRIUS ACT',
  '1FK7': 'SIMOTICS S-1FK7',
  '3RT2': 'SIRIUS Schütze',
  '6ES7': 'SIMATIC S7',
  '6SL3': 'SINAMICS',
  '3VA6': '3VA Schutzschalter',
  '1FY2': 'SIMOTICS',
  '8MF1': 'Schaltschränke',
  '3VA5': '3VA Schutzschalter',
  '3VA2': '3VA Schutzschalter',
  '6FC5': 'SINUMERIK',
  '3VA1': '3VA Schutzschalter',
  '3VA9': '3VA Zubehör',
  '3RA2': 'SIRIUS',
  '6AV2': 'SIMATIC HMI',
  '1FK2': 'SIMOTICS',
  '3RV2': 'SIRIUS'
};

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function partSlug(partNumber) {
  let s = String(partNumber)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f\u00ad]/g, '')
    .replace(/\(NEW,\s*ORIGINAL PACKAGE\)/gi, 'new-original-package')
    .replace(/\(NEW\)/gi, 'new')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')
    .toLowerCase();
  if (!s) s = 'part';
  if (s.length > 96) s = s.slice(0, 96).replace(/-+$/g, '');
  return s;
}

function seriesPrefix(code) {
  const compact = String(code).replace(/[\s\u00ad]/g, '').toUpperCase();
  const m = compact.match(/^([0-9A-Z]{3,5})/);
  return m ? m[1].slice(0, 4) : 'OTHER';
}

function seriesSlug(prefix) {
  return String(prefix).toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function loadMvpSlugSet() {
  const mvp = JSON.parse(fs.readFileSync(MVP_PATH, 'utf8'));
  const byNorm = new Map();
  const slugs = new Set();
  for (const p of mvp.parts || []) {
    if (p.brand_slug !== 'siemens') continue;
    slugs.add(p.part_slug);
    const norm = String(p.part_number)
      .toLowerCase()
      .replace(/[\u00ad]/g, '')
      .replace(/\s+/g, '');
    byNorm.set(norm, p);
  }
  return { slugs, byNorm, mvp };
}

function buildCompactPartHtml(code, slug) {
  const display = String(code).replace(/\s+/g, ' ').trim();
  const pageUrl = `${BASE}/parts/siemens/${slug}.html`;
  const quoteUrl = `../../marche/siemens.html#quote=${encodeURIComponent(code)}`;
  const title = `Siemens ${display} anfragen | ABCspareparts`;
  const desc = `Siemens ${display}: Anfrage bei ABCspareparts. Keine Preise – Konditionen nach Prüfung.`;
  const h1 = `Siemens ${display}`;
  const prefix = seriesPrefix(code);
  const seriesHref = `serie/${seriesSlug(prefix)}.html`;
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: h1,
    sku: code,
    mpn: code,
    description: desc,
    brand: { '@type': 'Brand', name: 'Siemens' },
    url: pageUrl
  };

  return `<!DOCTYPE html>
<html lang="de"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(desc)}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${pageUrl}">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<style>body{font-family:system-ui,sans-serif;margin:0;color:#222;line-height:1.45}header{background:#1e3a5f;color:#fff;padding:1.1rem}header a{color:#e67e22}main{padding:1rem}code{font-family:ui-monospace,monospace}.cta{display:inline-block;margin:.4rem .4rem 0 0;padding:.55rem .9rem;background:#e67e22;color:#fff;text-decoration:none;border-radius:6px;font-weight:600}.sec{background:#1e3a5f}footer{margin-top:1.5rem;padding:1rem;background:#1e3a5f;color:#fff;font-size:.85rem}footer a{color:#fff}</style>
</head><body>
<header><nav><a href="../../marche/siemens.html">Siemens</a> · <a href="katalog.html">Katalog</a></nav>
<h1>${escapeHtml(h1)}</h1></header>
<main>
<p>Hersteller: <a href="../../marche/siemens.html">Siemens</a> · Serie: <a href="${seriesHref}">${escapeHtml(prefix)}</a></p>
<p>Teilenummer: <code>${escapeHtml(display)}</code></p>
<p>Katalogcode zur unverbindlichen Anfrage. Keine Preise auf der Seite.</p>
<p><a class="cta" href="${quoteUrl}">Angebot anfragen</a>
<a class="cta sec" href="../../marche/siemens.html">Markenseite</a></p>
</main>
<footer><a href="katalog.html">Siemens-Katalog</a> · © ABCspareparts</footer>
</body></html>
`;
}

function buildSeriesHubHtml(prefix, entries, pageIndex, pageCount) {
  const slug = seriesSlug(prefix);
  const label = SERIES_LABELS[prefix] ? `${prefix} (${SERIES_LABELS[prefix]})` : prefix;
  const pageUrl =
    pageIndex === 0
      ? `${BASE}/parts/siemens/serie/${slug}.html`
      : `${BASE}/parts/siemens/serie/${slug}-${pageIndex + 1}.html`;
  const title = `Siemens Serie ${label} – Katalogcodes | ABCspareparts`;
  const desc = `Siemens Serie ${prefix}: ${entries.length} Katalogcodes auf dieser Seite zur unverbindlichen Anfrage bei ABCspareparts.`;
  const fileName = pageIndex === 0 ? `${slug}.html` : `${slug}-${pageIndex + 1}.html`;

  const pager = [];
  for (let i = 0; i < pageCount; i++) {
    const href = i === 0 ? `${slug}.html` : `${slug}-${i + 1}.html`;
    const labelN = String(i + 1);
    pager.push(i === pageIndex ? `<strong>${labelN}</strong>` : `<a href="${href}">${labelN}</a>`);
  }

  const list = entries
    .map(
      (e) =>
        `<li><a href="../${escapeHtml(e.slug)}.html">${escapeHtml(e.code)}</a></li>`
    )
    .join('\n');

  const html = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(desc)}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${pageUrl}">
<style>
body{font-family:system-ui,sans-serif;margin:0;color:#333;line-height:1.5}
.hero{background:linear-gradient(135deg,#1e3a5f,#2d5a87);color:#fff;padding:1.5rem 1.25rem}
.hero a{color:#e67e22;font-weight:600;text-decoration:none}
.wrap{max-width:920px;margin:0 auto;padding:0 1.25rem}
main{padding:1.25rem 0 2rem}
ul{columns:2;gap:1.5rem;padding-left:1.1rem}
@media(max-width:640px){ul{columns:1}}
.pager{margin:1rem 0;display:flex;flex-wrap:wrap;gap:.5rem;align-items:center}
footer{background:#1e3a5f;color:#fff;padding:1rem;text-align:center}footer a{color:#fff}
</style>
</head>
<body>
<header class="hero"><div class="wrap">
<nav><a href="../../../">Home</a> · <a href="../../../marche/siemens.html">Siemens</a> · <a href="../katalog.html">Katalog</a> · ${escapeHtml(prefix)}</nav>
<h1>Siemens Serie ${escapeHtml(label)}</h1>
<p>${entries.length} Codes (Seite ${pageIndex + 1}/${pageCount}). Klicken Sie einen Code für die Teileseite / Anfrage.</p>
</div></header>
<main><div class="wrap">
${pageCount > 1 ? `<p class="pager">Seiten: ${pager.join(' · ')}</p>` : ''}
<ul>
${list}
</ul>
${pageCount > 1 ? `<p class="pager">Seiten: ${pager.join(' · ')}</p>` : ''}
<p><a href="../katalog.html">Alle Siemens-Serien</a> · <a href="../../../marche/siemens.html">Markenseite Siemens</a></p>
</div></main>
<footer><a href="../../../marche/siemens.html">Siemens</a> · © ABCspareparts</footer>
</body>
</html>
`;
  return { fileName, html, pageUrl };
}

function buildCatalogIndexHtml(seriesStats) {
  const pageUrl = `${BASE}/parts/siemens/katalog.html`;
  const rows = seriesStats
    .map((s) => {
      const href = `serie/${seriesSlug(s.prefix)}.html`;
      const label = SERIES_LABELS[s.prefix] ? `${s.prefix} – ${SERIES_LABELS[s.prefix]}` : s.prefix;
      return `<li><a href="${href}">${escapeHtml(label)}</a> <span>(${s.count})</span></li>`;
    })
    .join('\n');
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Siemens Katalogcodes – Serienübersicht | ABCspareparts</title>
<meta name="description" content="Übersicht der Siemens-Katalogserien bei ABCspareparts mit indexierbaren Teileseiten zur unverbindlichen Anfrage.">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${pageUrl}">
<style>
body{font-family:system-ui,sans-serif;margin:0;color:#333;line-height:1.5}
.hero{background:linear-gradient(135deg,#1e3a5f,#2d5a87);color:#fff;padding:1.5rem 1.25rem}
.hero a{color:#e67e22;font-weight:600;text-decoration:none}
.wrap{max-width:920px;margin:0 auto;padding:0 1.25rem}
main{padding:1.25rem 0 2rem}
ul{columns:2;gap:1.5rem}@media(max-width:640px){ul{columns:1}}
footer{background:#1e3a5f;color:#fff;padding:1rem;text-align:center}footer a{color:#fff}
</style>
</head>
<body>
<header class="hero"><div class="wrap">
<nav><a href="../../">Home</a> · <a href="../../marche/siemens.html">Siemens</a> · Katalog</nav>
<h1>Siemens Katalog – Serienübersicht</h1>
<p>${seriesStats.reduce((n, s) => n + s.count, 0)} indexierbare Katalogcodes in ${seriesStats.length} Serienpräfixen.</p>
</div></header>
<main><div class="wrap">
<ul>
${rows}
</ul>
<p><a href="../../marche/siemens.html">Zur Markenseite Siemens</a></p>
</div></main>
<footer><a href="../../marche/siemens.html">Siemens</a> · © ABCspareparts</footer>
</body>
</html>
`;
}

function writeSitemapShard(fileName, urls) {
  let body = '';
  for (const loc of urls) {
    body += `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${TODAY}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.55</priority>\n  </url>\n`;
  }
  const xml = `---
layout: none
---
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}</urlset>
`;
  fs.writeFileSync(path.join(ROOT, fileName), xml, 'utf8');
}

function main() {
  const t0 = Date.now();
  const listino = JSON.parse(fs.readFileSync(LISTINO_PATH, 'utf8'));
  const codes = listino.codes || [];
  if (!codes.length) throw new Error('Siemens listino has no codes');

  const { slugs: mvpSlugs, byNorm } = loadMvpSlugSet();
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(SERIES_DIR, { recursive: true });

  // Remove previous listino-only pages (keep MVP slugs). Also clear old series hubs.
  for (const name of fs.readdirSync(OUT_DIR)) {
    const full = path.join(OUT_DIR, name);
    const st = fs.statSync(full);
    if (st.isFile() && name.endsWith('.html') && name !== 'katalog.html') {
      const slug = name.replace(/\.html$/, '');
      if (!mvpSlugs.has(slug)) fs.unlinkSync(full);
    }
  }
  for (const name of fs.readdirSync(SERIES_DIR)) {
    if (name.endsWith('.html')) fs.unlinkSync(path.join(SERIES_DIR, name));
  }
  for (const name of fs.readdirSync(ROOT)) {
    if (/^sitemap-siemens-parts-\d+\.xml$/i.test(name)) fs.unlinkSync(path.join(ROOT, name));
  }

  const usedSlugs = new Set(mvpSlugs);
  const entries = [];
  const bySeries = new Map();
  let skippedMvp = 0;
  let written = 0;

  for (const code of codes) {
    const norm = String(code)
      .toLowerCase()
      .replace(/[\u00ad]/g, '')
      .replace(/\s+/g, '');
    if (byNorm.has(norm)) {
      skippedMvp += 1;
      const mvp = byNorm.get(norm);
      const prefix = seriesPrefix(code);
      if (!bySeries.has(prefix)) bySeries.set(prefix, []);
      bySeries.get(prefix).push({ code: mvp.part_number, slug: mvp.part_slug, mvp: true });
      continue;
    }

    let slug = partSlug(code);
    let n = 2;
    while (usedSlugs.has(slug)) {
      slug = `${partSlug(code)}-${n}`;
      n += 1;
    }
    usedSlugs.add(slug);

    const html = buildCompactPartHtml(code, slug);
    fs.writeFileSync(path.join(OUT_DIR, `${slug}.html`), html, 'utf8');
    written += 1;

    const prefix = seriesPrefix(code);
    if (!bySeries.has(prefix)) bySeries.set(prefix, []);
    bySeries.get(prefix).push({ code, slug, mvp: false });
    entries.push({ code, slug, path: `parts/siemens/${slug}.html` });

    if (written % 10000 === 0) {
      console.log(`… wrote ${written} listino pages`);
    }
  }

  // Series hubs
  const seriesStats = [];
  const hubUrls = [];
  const sortedPrefixes = [...bySeries.keys()].sort(
    (a, b) => bySeries.get(b).length - bySeries.get(a).length || a.localeCompare(b)
  );
  for (const prefix of sortedPrefixes) {
    const all = bySeries.get(prefix);
    seriesStats.push({ prefix, count: all.length });
    const pageCount = Math.max(1, Math.ceil(all.length / HUB_PAGE_SIZE));
    for (let i = 0; i < pageCount; i++) {
      const slice = all.slice(i * HUB_PAGE_SIZE, (i + 1) * HUB_PAGE_SIZE);
      const { fileName, html, pageUrl } = buildSeriesHubHtml(prefix, slice, i, pageCount);
      fs.writeFileSync(path.join(SERIES_DIR, fileName), html, 'utf8');
      hubUrls.push(pageUrl);
    }
  }

  fs.writeFileSync(path.join(OUT_DIR, 'katalog.html'), buildCatalogIndexHtml(seriesStats), 'utf8');
  hubUrls.unshift(`${BASE}/parts/siemens/katalog.html`);

  // Sitemaps: hubs first shard, then part URLs
  const allUrls = [
    ...hubUrls,
    ...entries.map((e) => `${BASE}/${e.path}`),
    // MVP siemens pages already in sitemap-parts.xml — still include listino-only
  ];
  const shardFiles = [];
  for (let i = 0; i < allUrls.length; i += SITEMAP_LIMIT) {
    const chunk = allUrls.slice(i, i + SITEMAP_LIMIT);
    const name = `${SITEMAP_PREFIX}-${shardFiles.length + 1}.xml`;
    writeSitemapShard(name, chunk);
    shardFiles.push(name);
  }
  writeSitemapIndex({ includePartsSitemap: true });

  const manifest = {
    generated: TODAY,
    brand: 'Siemens',
    brand_slug: 'siemens',
    listino_count: codes.length,
    pages_written: written,
    skipped_mvp_overlap: skippedMvp,
    series_count: seriesStats.length,
    hub_urls: hubUrls.length,
    sitemap_files: shardFiles,
    series: seriesStats.slice(0, 50),
    note: 'Full Siemens listino indexable /parts/ pages. MVP overlaps kept as richer pages.'
  };
  fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  // Patch brand page: ensure catalog + series hub links exist (lightweight inject if missing)
  const brandPath = path.join(ROOT, 'marche/siemens.html');
  let brandHtml = fs.readFileSync(brandPath, 'utf8');
  const catalogBlock = `
      <div class="listino-sample" id="siemensCatalogIndex">
        <h3 class="parts-sample-title">Siemens Katalog (indexiert)</h3>
        <p class="parts-intro parts-sample-intro">${codes.length} Teileseiten für den Herstellerlistino — Serienübersicht und Einzelcodes für Suche &amp; KI.</p>
        <p><a class="part-case-link" href="../parts/siemens/katalog.html">Zur Serienübersicht / Katalog</a></p>
        <ul class="brand-parts-list parts-compact-list">
          ${sortedPrefixes
            .slice(0, 24)
            .map((p) => {
              const c = bySeries.get(p).length;
              return `<li><a class="part-case-link" href="../parts/siemens/serie/${seriesSlug(p)}.html">${escapeHtml(p)}</a> <span class="part-desc">${c} codes</span></li>`;
            })
            .join('\n          ')}
        </ul>
      </div>`;
  if (brandHtml.includes('id="siemensCatalogIndex"')) {
    brandHtml = brandHtml.replace(
      /<div class="listino-sample" id="siemensCatalogIndex">[\s\S]*?<\/div>\s*(?=<div class="listino-sample" id="indexablePartPages"|<\/section>)/,
      `${catalogBlock}\n        `
    );
  } else if (brandHtml.includes('id="indexablePartPages"')) {
    brandHtml = brandHtml.replace(
      '<div class="listino-sample" id="indexablePartPages">',
      `${catalogBlock}\n        <div class="listino-sample" id="indexablePartPages">`
    );
  } else if (brandHtml.includes('id="quotable-parts"')) {
    brandHtml = brandHtml.replace('</section>', `${catalogBlock}\n      </section>`);
  }
  fs.writeFileSync(brandPath, brandHtml, 'utf8');

  // llms.txt: replace long per-code Siemens dump note with catalog pointer
  const llmsPath = path.join(ROOT, 'llms.txt');
  let llms = fs.readFileSync(llmsPath, 'utf8');
  const siemensCatalogNote = `- [Siemens full catalog index](${BASE}/parts/siemens/katalog.html) — ${codes.length} indexable /parts/siemens/{code} URLs by series (see also sitemap-siemens-parts-*.xml)
- [Siemens brand page](${BASE}/marche/siemens.html) — ERP quotable codes + on-page listino search`;
  if (/Siemens full catalog index/.test(llms)) {
    llms = llms.replace(/- \[Siemens full catalog index\][\s\S]*?(?=\n- \[Siemens brand page\]|\n- \[|$)/, `${siemensCatalogNote}\n`);
  } else if (/## Full part number catalog/.test(llms)) {
    llms = llms.replace(
      '## Full part number catalog',
      `## Full part number catalog\n\n${siemensCatalogNote}\n`
    );
  }
  fs.writeFileSync(llmsPath, llms, 'utf8');

  const sec = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`Siemens listino parts: wrote ${written} pages, skipped MVP overlap ${skippedMvp}`);
  console.log(`Series hubs: ${hubUrls.length - 1} pages + katalog.html`);
  console.log(`Sitemaps: ${shardFiles.join(', ')}`);
  console.log(`Done in ${sec}s`);
}

if (require.main === module) {
  main();
}

module.exports = { partSlug, seriesPrefix, buildCompactPartHtml };
