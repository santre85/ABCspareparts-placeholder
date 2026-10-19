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

/** Multilingual series copy used to differentiate part pages (factual family names only). */
const SERIES_I18N = {
  '3SU1': {
    family: 'SIRIUS ACT',
    de: 'Befehls- und Meldegerät der Serie SIRIUS ACT (3SU1) für Schaltanlagen und Maschinenbedienung.',
    en: 'SIRIUS ACT (3SU1) command and signaling device for panels and machine operator stations.',
    it: 'Dispositivo di comando e segnalazione SIRIUS ACT (3SU1) per quadri e stazioni operatore.',
    es: 'Dispositivo de mando y señalización SIRIUS ACT (3SU1) para cuadros y puestos de mando.',
    fr: 'Appareil de commande et signalisation SIRIUS ACT (3SU1) pour armoires et postes opérateur.'
  },
  '1FK7': {
    family: 'SIMOTICS S-1FK7',
    de: 'SIMOTICS S-1FK7 Servomotor / Antriebskomponente für Motion-Control und Werkzeugmaschinen.',
    en: 'SIMOTICS S-1FK7 servo motor / drive component for motion control and machine tools.',
    it: 'Servomotore / componente di azionamento SIMOTICS S-1FK7 per motion control e macchine utensili.',
    es: 'Servomotor / componente de accionamiento SIMOTICS S-1FK7 para motion control y máquinas herramienta.',
    fr: 'Servomoteur / composant d’entraînement SIMOTICS S-1FK7 pour motion control et machines-outils.'
  },
  '3RT2': {
    family: 'SIRIUS Schütz',
    de: 'SIRIUS Leistungsschütz / Schütz der Serie 3RT2 für Motoren und industrielle Lasten.',
    en: 'SIRIUS contactor (3RT2 series) for motors and industrial loads.',
    it: 'Contattore SIRIUS serie 3RT2 per motori e carichi industriali.',
    es: 'Contactor SIRIUS serie 3RT2 para motores y cargas industriales.',
    fr: 'Contacteur SIRIUS série 3RT2 pour moteurs et charges industrielles.'
  },
  '6ES7': {
    family: 'SIMATIC S7',
    de: 'SIMATIC S7 Baugruppe/Komponente (Serie 6ES7) für SPS-Automation und I/O.',
    en: 'SIMATIC S7 module/component (6ES7 series) for PLC automation and I/O.',
    it: 'Modulo/componente SIMATIC S7 (serie 6ES7) per automazione PLC e I/O.',
    es: 'Módulo/componente SIMATIC S7 (serie 6ES7) para automatización PLC e I/O.',
    fr: 'Module/composant SIMATIC S7 (série 6ES7) pour automatisation API et E/S.'
  },
  '6SL3': {
    family: 'SINAMICS',
    de: 'SINAMICS Antriebskomponente (Serie 6SL3) für Frequenzumrichter und Antriebstechnik.',
    en: 'SINAMICS drive component (6SL3 series) for converters and drive systems.',
    it: 'Componente di azionamento SINAMICS (serie 6SL3) per convertitori e sistemi di drive.',
    es: 'Componente de accionamiento SINAMICS (serie 6SL3) para convertidores y sistemas de drive.',
    fr: 'Composant d’entraînement SINAMICS (série 6SL3) pour convertisseurs et systèmes drive.'
  },
  '3VA6': {
    family: '3VA Kompaktleistungsschalter',
    de: '3VA Kompaktleistungsschalter / Schutzgerät der Serie 3VA6 für Niederspannungsnetze.',
    en: '3VA molded-case circuit breaker (3VA6 series) for low-voltage power distribution.',
    it: 'Interruttore automatico scatolato 3VA (serie 3VA6) per distribuzione in bassa tensione.',
    es: 'Interruptor automático de caja moldeada 3VA (serie 3VA6) para distribución en baja tensión.',
    fr: 'Disjoncteur boîtier moulé 3VA (série 3VA6) pour distribution basse tension.'
  },
  '1FY2': {
    family: 'SIMOTICS',
    de: 'SIMOTICS Motor-/Antriebskomponente (Serie 1FY2) für industrielle Motion-Anwendungen.',
    en: 'SIMOTICS motor/drive component (1FY2 series) for industrial motion applications.',
    it: 'Componente motore/azionamento SIMOTICS (serie 1FY2) per applicazioni motion industriali.',
    es: 'Componente motor/accionamiento SIMOTICS (serie 1FY2) para aplicaciones motion industriales.',
    fr: 'Composant moteur/entraînement SIMOTICS (série 1FY2) pour applications motion industrielles.'
  },
  '8MF1': {
    family: 'Schaltschranksystem',
    de: 'Siemens Schaltschrank-/Gehäusesystemkomponente (Serie 8MF1).',
    en: 'Siemens cabinet / enclosure system component (8MF1 series).',
    it: 'Componente sistema armadio/telaio Siemens (serie 8MF1).',
    es: 'Componente de sistema de armario/bastidor Siemens (serie 8MF1).',
    fr: 'Composant système armoire/châssis Siemens (série 8MF1).'
  },
  '3VA5': {
    family: '3VA Kompaktleistungsschalter',
    de: '3VA Kompaktleistungsschalter der Serie 3VA5 für industriellen Netzschutz.',
    en: '3VA molded-case circuit breaker (3VA5 series) for industrial power protection.',
    it: 'Interruttore automatico 3VA serie 3VA5 per protezione di rete industriale.',
    es: 'Interruptor automático 3VA serie 3VA5 para protección de red industrial.',
    fr: 'Disjoncteur 3VA série 3VA5 pour protection de réseau industriel.'
  },
  '3VA2': {
    family: '3VA Kompaktleistungsschalter',
    de: '3VA Kompaktleistungsschalter der Serie 3VA2 für Niederspannungsanwendungen.',
    en: '3VA molded-case circuit breaker (3VA2 series) for low-voltage applications.',
    it: 'Interruttore automatico 3VA serie 3VA2 per applicazioni in bassa tensione.',
    es: 'Interruptor automático 3VA serie 3VA2 para aplicaciones en baja tensión.',
    fr: 'Disjoncteur 3VA série 3VA2 pour applications basse tension.'
  },
  '6FC5': {
    family: 'SINUMERIK',
    de: 'SINUMERIK CNC-/Steuerungskomponente (Serie 6FC5) für Werkzeugmaschinen.',
    en: 'SINUMERIK CNC/control component (6FC5 series) for machine tools.',
    it: 'Componente CNC/controllo SINUMERIK (serie 6FC5) per macchine utensili.',
    es: 'Componente CNC/control SINUMERIK (serie 6FC5) para máquinas herramienta.',
    fr: 'Composant CNC/commande SINUMERIK (série 6FC5) pour machines-outils.'
  },
  '3VA1': {
    family: '3VA Kompaktleistungsschalter',
    de: '3VA Kompaktleistungsschalter der Serie 3VA1.',
    en: '3VA molded-case circuit breaker (3VA1 series).',
    it: 'Interruttore automatico 3VA serie 3VA1.',
    es: 'Interruptor automático 3VA serie 3VA1.',
    fr: 'Disjoncteur 3VA série 3VA1.'
  },
  '3VA9': {
    family: '3VA Zubehör',
    de: 'Zubehör / Hilfskomponente für 3VA Schutzschalter (Serie 3VA9).',
    en: 'Accessory / auxiliary component for 3VA circuit breakers (3VA9 series).',
    it: 'Accessorio / componente ausiliario per interruttori 3VA (serie 3VA9).',
    es: 'Accesorio / componente auxiliar para interruptores 3VA (serie 3VA9).',
    fr: 'Accessoire / composant auxiliaire pour disjoncteurs 3VA (série 3VA9).'
  },
  '3RA2': {
    family: 'SIRIUS',
    de: 'SIRIUS Motorstarter-/Lastabzweigkomponente (Serie 3RA2).',
    en: 'SIRIUS motor starter / feeder component (3RA2 series).',
    it: 'Componente avviamento motore / feeder SIRIUS (serie 3RA2).',
    es: 'Componente arrancador / feeder SIRIUS (serie 3RA2).',
    fr: 'Composant démarreur moteur / feeder SIRIUS (série 3RA2).'
  },
  '6AV2': {
    family: 'SIMATIC HMI',
    de: 'SIMATIC HMI Panel-/Bedienkomponente (Serie 6AV2).',
    en: 'SIMATIC HMI panel / operator component (6AV2 series).',
    it: 'Componente pannello/operatore SIMATIC HMI (serie 6AV2).',
    es: 'Componente panel/operador SIMATIC HMI (serie 6AV2).',
    fr: 'Composant panneau/opérateur SIMATIC HMI (série 6AV2).'
  },
  '1FK2': {
    family: 'SIMOTICS',
    de: 'SIMOTICS Servomotor-/Antriebskomponente (Serie 1FK2).',
    en: 'SIMOTICS servo motor / drive component (1FK2 series).',
    it: 'Componente servomotore/azionamento SIMOTICS (serie 1FK2).',
    es: 'Componente servomotor/accionamiento SIMOTICS (serie 1FK2).',
    fr: 'Composant servomoteur/entraînement SIMOTICS (série 1FK2).'
  },
  '3RV2': {
    family: 'SIRIUS',
    de: 'SIRIUS Motorschutzschalter / Schutzgerät (Serie 3RV2).',
    en: 'SIRIUS motor protection circuit breaker (3RV2 series).',
    it: 'Interruttore di protezione motore SIRIUS (serie 3RV2).',
    es: 'Interruptor de protección de motor SIRIUS (serie 3RV2).',
    fr: 'Disjoncteur de protection moteur SIRIUS (série 3RV2).'
  },
  '6AU1': {
    family: 'SIMOTION',
    de: 'SIMOTION Motion-Control-Komponente (Serie 6AU1).',
    en: 'SIMOTION motion-control component (6AU1 series).',
    it: 'Componente motion control SIMOTION (serie 6AU1).',
    es: 'Componente motion control SIMOTION (serie 6AU1).',
    fr: 'Composant motion control SIMOTION (série 6AU1).'
  },
  '1FT7': {
    family: 'SIMOTICS',
    de: 'SIMOTICS Synchron-Servomotor / Antrieb (Serie 1FT7).',
    en: 'SIMOTICS synchronous servo motor / drive (1FT7 series).',
    it: 'Servomotore sincrono / azionamento SIMOTICS (serie 1FT7).',
    es: 'Servomotor síncrono / accionamiento SIMOTICS (serie 1FT7).',
    fr: 'Servomoteur synchrone / entraînement SIMOTICS (série 1FT7).'
  },
  '1LE1': {
    family: 'SIMOTICS',
    de: 'SIMOTICS Niederspannungsmotor (Serie 1LE1).',
    en: 'SIMOTICS low-voltage motor (1LE1 series).',
    it: 'Motore bassa tensione SIMOTICS (serie 1LE1).',
    es: 'Motor de baja tensión SIMOTICS (serie 1LE1).',
    fr: 'Moteur basse tension SIMOTICS (série 1LE1).'
  },
  '1PH7': {
    family: 'SIMOTICS',
    de: 'SIMOTICS Hauptantrieb / Motorzubehör (Serie 1PH7).',
    en: 'SIMOTICS main drive / motor accessory (1PH7 series).',
    it: 'Azionamento principale / accessorio motore SIMOTICS (serie 1PH7).',
    es: 'Accionamiento principal / accesorio de motor SIMOTICS (serie 1PH7).',
    fr: 'Entraînement principal / accessoire moteur SIMOTICS (série 1PH7).'
  }
};

function seriesInfo(prefix) {
  if (SERIES_I18N[prefix]) return SERIES_I18N[prefix];
  // Heuristic families for less common prefixes (still unique per series).
  const p = String(prefix || '').toUpperCase();
  let family = 'Industriekomponente';
  if (p.startsWith('6ES') || p.startsWith('6AV') || p.startsWith('6AG')) family = 'SIMATIC';
  else if (p.startsWith('6SL') || p.startsWith('6SE')) family = 'SINAMICS';
  else if (p.startsWith('3SU') || p.startsWith('3RT') || p.startsWith('3RA') || p.startsWith('3RV')) family = 'SIRIUS';
  else if (p.startsWith('3VA')) family = '3VA';
  else if (p.startsWith('1FK') || p.startsWith('1FT') || p.startsWith('1LE') || p.startsWith('1PH') || p.startsWith('1FY')) family = 'SIMOTICS';
  else if (p.startsWith('6FC')) family = 'SINUMERIK';
  else if (p.startsWith('6AU')) family = 'SIMOTION';
  return {
    family,
    de: `Siemens ${family}-Katalogkomponente der Serie ${p} für Industrie- und MRO-Anwendungen.`,
    en: `Siemens ${family} catalog component (series ${p}) for industrial and MRO applications.`,
    it: `Componente a catalogo Siemens ${family} (serie ${p}) per applicazioni industriali e MRO.`,
    es: `Componente de catálogo Siemens ${family} (serie ${p}) para aplicaciones industriales y MRO.`,
    fr: `Composant catalogue Siemens ${family} (série ${p}) pour applications industrielles et MRO.`
  };
}

const SERIES_LABELS = Object.fromEntries(
  Object.entries(SERIES_I18N).map(([k, v]) => [k, v.family])
);

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
  const prefix = seriesPrefix(code);
  const seriesHref = `serie/${seriesSlug(prefix)}.html`;
  const info = seriesInfo(prefix);
  const family = info.family;
  const h1 = `Siemens ${display} – ${family}`;
  const metaDescription = `Siemens ${display} (${family}, Serie ${prefix}): ${info.de} Unverbindliche Anfrage – keine Preise.`.slice(
    0,
    158
  );
  const title = `Siemens ${display} – ${family} | ABCspareparts`;
  const bodyDe = `ABCspareparts beschafft die Siemens-Referenz <strong>${escapeHtml(display)}</strong> (${escapeHtml(family)}, Serie ${escapeHtml(prefix)}) für Industrie und Instandhaltung in Europa. Serienkontext: ${escapeHtml(info.de)} Verfügbarkeit und Konditionen prüfen wir nach Ihrer Anfrage — keine Preise auf der Seite.`;
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: h1,
    sku: code,
    mpn: code,
    description: metaDescription,
    category: family,
    brand: { '@type': 'Brand', name: 'Siemens' },
    url: pageUrl
  };
  const ctxJson = JSON.stringify({ display, prefix }).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html lang="de"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title id="pageTitle">${escapeHtml(title)}</title>
<meta id="pageDescription" name="description" content="${escapeHtml(metaDescription)}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${pageUrl}">
<link rel="alternate" hreflang="x-default" href="${pageUrl}">
<link rel="alternate" hreflang="de" href="${pageUrl}">
<link rel="alternate" hreflang="en" href="${pageUrl}">
<link rel="alternate" hreflang="it" href="${pageUrl}">
<link rel="alternate" hreflang="es" href="${pageUrl}">
<link rel="alternate" hreflang="fr" href="${pageUrl}">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<style>
body{font-family:system-ui,sans-serif;margin:0;color:#222;line-height:1.5}
header{background:#1e3a5f;color:#fff;padding:1rem 1.1rem}
header a{color:#e67e22;text-decoration:none;font-weight:600}
.top{display:flex;flex-wrap:wrap;gap:.5rem 1rem;justify-content:space-between;align-items:center}
.lang{display:flex;gap:.35rem;flex-wrap:wrap}
.lang button{background:transparent;border:1px solid rgba(255,255,255,.45);color:#fff;border-radius:4px;padding:.2rem .45rem;cursor:pointer;font-size:.8rem}
.lang button.active{background:#e67e22;border-color:#e67e22}
h1{font-size:clamp(1.1rem,3.4vw,1.65rem);margin:.55rem 0 .35rem}
.lead{opacity:.95;max-width:46rem}
main{padding:1rem 1.1rem 1.5rem;max-width:820px}
.meta{background:#f0f6fb;border:1px solid #dce8f4;border-radius:8px;padding:.85rem 1rem;margin:0 0 1rem}
.meta dt{font-weight:600;color:#1e3a5f;margin-top:.35rem}.meta dd{margin:0;font-family:ui-monospace,monospace}
.meta dd.plain{font-family:inherit}
.cta{display:inline-block;margin:.35rem .45rem .35rem 0;padding:.6rem 1rem;border-radius:7px;font-weight:600;text-decoration:none}
.cta-a{background:#e67e22;color:#fff}.cta-b{background:#1e3a5f;color:#fff}
footer{background:#1e3a5f;color:#fff;padding:1rem;text-align:center;font-size:.85rem}footer a{color:#fff}
</style>
</head><body>
<header>
<div class="top">
<nav><a href="../../marche/siemens.html">Siemens</a> · <a href="katalog.html" data-i18n="nav_catalog">Katalog</a></nav>
<div class="lang" role="group" aria-label="Language">
<button type="button" data-set-lang="de" class="active">DE</button>
<button type="button" data-set-lang="en">EN</button>
<button type="button" data-set-lang="it">IT</button>
<button type="button" data-set-lang="es">ES</button>
<button type="button" data-set-lang="fr">FR</button>
</div>
</div>
<h1 data-i18n="h1">${escapeHtml(h1)}</h1>
<p class="lead" data-i18n="lead">${escapeHtml(info.de)}</p>
</header>
<main>
<dl class="meta">
<dt data-i18n="brand_label">Hersteller</dt><dd class="plain"><a href="../../marche/siemens.html">Siemens</a></dd>
<dt data-i18n="series_label">Serie</dt><dd class="plain"><a href="${seriesHref}">${escapeHtml(prefix)} – ${escapeHtml(family)}</a></dd>
<dt data-i18n="part_label">Teilenummer</dt><dd>${escapeHtml(display)}</dd>
</dl>
<p data-i18n-html="body">${bodyDe}</p>
<p>
<a class="cta cta-a" href="${quoteUrl}" data-i18n="cta">Angebot anfragen</a>
<a class="cta cta-b" href="../../marche/siemens.html" data-i18n="brand_cta">Zur Markenseite Siemens</a>
<a class="cta cta-b" href="${seriesHref}" data-i18n="series_cta">Weitere Codes Serie ${escapeHtml(prefix)}</a>
</p>
</main>
<footer><a href="katalog.html" data-i18n="catalog">Siemens-Katalog</a> · © ABCspareparts</footer>
<script src="part-i18n.js" defer></script>
<script>
document.addEventListener('DOMContentLoaded', function () {
  if (window.ABC_SIEMENS_PART_I18N) window.ABC_SIEMENS_PART_I18N.boot(${ctxJson});
});
</script>
</body></html>
`;
}

function buildSeriesHubHtml(prefix, entries, pageIndex, pageCount) {
  const slug = seriesSlug(prefix);
  const info = seriesInfo(prefix);
  const label = `${prefix} (${info.family})`;
  const pageUrl =
    pageIndex === 0
      ? `${BASE}/parts/siemens/serie/${slug}.html`
      : `${BASE}/parts/siemens/serie/${slug}-${pageIndex + 1}.html`;
  const title = `Siemens Serie ${label} – Katalogcodes | ABCspareparts`;
  const desc = `${info.de} ${entries.length} Katalogcodes auf dieser Seite zur Anfrage.`;
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
.intro{background:#f0f6fb;border:1px solid #dce8f4;border-radius:8px;padding:.85rem 1rem;margin:0 0 1rem}
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
<p class="intro">${escapeHtml(info.de)} / ${escapeHtml(info.en)}</p>
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
    note: 'Full Siemens listino indexable /parts/ pages with DE/EN/IT/ES/FR UI + series-specific descriptions. MVP overlaps kept as richer pages.',
    i18n: true
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
