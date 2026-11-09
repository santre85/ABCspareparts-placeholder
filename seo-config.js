'use strict';

/**
 * SEO URL architecture for ABCspareparts (static GitHub Pages site).
 *
 * TODAY: one HTML document per page; UI language is client-side (localStorage).
 * Canonical + sitemap URLs are always the clean path without ?lang= / ?part=.
 *
 * FUTURE (dedicated language URLs — not migrated yet):
 *   /          → de (default / x-default)
 *   /en/…      → English
 *   /it/…      → Italian
 *   /es/…      → Spanish
 *   /fr/…      → French
 * When those paths exist, wire reciprocal hreflang in generators using LANG_PREFIXES.
 */

const BASE = 'https://abcspareparts.eu';

/** Primary content language until /en/, /it/, … landings exist. */
const PRIMARY_LANG = 'de';

/**
 * Planned path prefixes for a future multilingual URL tree.
 * Empty string = site root (current default German experience).
 */
const FUTURE_LANG_PREFIXES = {
  de: '',
  en: '/en',
  it: '/it',
  es: '/es',
  fr: '/fr'
};

/**
 * Current hreflang set: only languages that resolve to a real distinct URL.
 * Until dedicated prefixes ship, de and x-default both point at the clean URL.
 */
function hreflangLinks(absoluteCleanUrl) {
  return [
    `<link rel="alternate" hreflang="x-default" href="${absoluteCleanUrl}">`,
    `<link rel="alternate" hreflang="${PRIMARY_LANG}" href="${absoluteCleanUrl}">`
  ].join('\n  ');
}

/**
 * Reciprocal hreflang for real translated equivalents only.
 * @param {Record<string, string>} langToAbsoluteUrl e.g. { de: '...', en: '...' }
 * Always emits x-default (defaults to de, else first entry).
 */
function hreflangLinksForAlternates(langToAbsoluteUrl) {
  const entries = Object.entries(langToAbsoluteUrl || {}).filter(([, url]) => !!url);
  if (!entries.length) throw new Error('hreflangLinksForAlternates requires at least one URL');
  const xDefault = langToAbsoluteUrl[PRIMARY_LANG] || entries[0][1];
  const lines = [`<link rel="alternate" hreflang="x-default" href="${xDefault}">`];
  for (const [lang, url] of entries) {
    lines.push(`<link rel="alternate" hreflang="${lang}" href="${url}">`);
  }
  return lines.join('\n  ');
}

/** Absolute canonical for a site-root-relative path (e.g. "marche/siemens.html" or ""). */
function canonicalUrl(pathFromRoot) {
  const clean = String(pathFromRoot || '').replace(/^\//, '');
  return clean ? `${BASE}/${clean}` : `${BASE}/`;
}

/** Favicon / touch icon — absolute so it works from /marche/ and /parts/. */
const ICON_LINKS = [
  `<link rel="icon" type="image/svg+xml" href="${BASE}/ABC_logo4.svg">`,
  `<link rel="apple-touch-icon" href="${BASE}/logo.png">`
].join('\n  ');

/**
 * Related-brand linking (not sitemap membership). All indexable /marche/*.html
 * pages belong in a sitemap listed by sitemap-index.xml; this set is only the
 * higher-quality subset used for "similar brands" blocks.
 * @param {Iterable<string>} partSlugs
 * @param {Record<string, unknown>} topBrandBySlug
 */
function collectIndexWorthySlugs(partSlugs, topBrandBySlug) {
  const set = new Set();
  for (const slug of partSlugs || []) {
    if (slug) set.add(String(slug));
  }
  for (const slug of Object.keys(topBrandBySlug || {})) {
    if (slug) set.add(slug);
  }
  return set;
}

/**
 * Brands permanently excluded from generation and sitemaps.
 * Match is case-insensitive against brand name and slug after stripping
 * spaces, hyphens, slashes, and dots. Exact-key match only (no substring),
 * so plain AXIOMTEK is not treated as AXIOMTEK / MARKEM-IMAJE.
 */
const EXCLUDED_BRANDS = [
  'keysight',
  'keysight technologies',
  'keysight-technologies',
  'markem',
  'markem imaje',
  'markem-imaje',
  'axiomtek / markem-imaje',
  'axiomtek / markem imaje',
  'axiomtek-markem-imaje',
  'axiomtek markem imaje'
];

function normalizeExcludedKey(str) {
  return String(str || '').toLowerCase().replace(/[\s\-\/\.]/g, '');
}

function isExcludedBrand(brandName, brandSlug) {
  const keys = [brandName, brandSlug].filter(Boolean).map(normalizeExcludedKey);
  return EXCLUDED_BRANDS.some((excluded) => {
    const ex = normalizeExcludedKey(excluded);
    return ex && keys.some((k) => k === ex);
  });
}

/** Bing / SERP title limit (decoded character count). */
const TITLE_MAX = 70;

const TITLE_KEYWORD = {
  de: 'Ersatzteile',
  en: 'spare parts',
  it: 'Ricambi',
  es: 'Recambios',
  fr: 'Pièces'
};

const TITLE_BANNED = /\bOriginal(?:teile)?\b|\bauthorized\b/i;

function decodeTitleEntities(s) {
  return String(s || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function decodedTitleLength(s) {
  return [...decodeTitleEntities(s)].length;
}

function titleKeyword(lang) {
  return TITLE_KEYWORD[lang] || TITLE_KEYWORD.de;
}

/**
 * Brand + localized "Ersatzteile" first; keep ABCspareparts when it fits.
 * Never uses Original / Originalteile / authorized.
 */
function brandPageTitle(brand, lang) {
  const name = String(brand || '').trim();
  const kw = titleKeyword(lang);
  const site = 'ABCspareparts';
  const candidates = [`${name} ${kw} | ${site}`, `${name} ${kw}`];
  for (const c of candidates) {
    if (decodedTitleLength(c) <= TITLE_MAX) return c;
  }
  const suffix = ` ${kw}`;
  const budget = TITLE_MAX - suffix.length;
  const clipped = `${[...name].slice(0, Math.max(1, budget - 1)).join('')}…`;
  return `${clipped}${suffix}`;
}

function titleStartsWithBrand(title, brand) {
  const t = decodeTitleEntities(title).trim().toLowerCase();
  const b = String(brand || '').trim().toLowerCase();
  return b && t.startsWith(b);
}

function fitBrandTitle(title, brand, lang) {
  const t = String(title || '').trim();
  const kw = titleKeyword(lang);
  const decoded = decodeTitleEntities(t);
  const hasKw = decoded.toLowerCase().includes(kw.toLowerCase());
  if (
    t
    && decodedTitleLength(t) <= TITLE_MAX
    && !TITLE_BANNED.test(decoded)
    && titleStartsWithBrand(t, brand)
    && hasKw
  ) {
    return t;
  }
  return brandPageTitle(brand, lang);
}

/** Clip any title to TITLE_MAX decoded characters. */
function clipToTitleMax(title) {
  const t = String(title || '').trim();
  if (decodedTitleLength(t) <= TITLE_MAX) return t;
  const withoutSite = t.replace(/\s*\|\s*ABCspareparts\s*$/i, '').trim();
  if (withoutSite && decodedTitleLength(withoutSite) <= TITLE_MAX) return withoutSite;
  const chars = [...decodeTitleEntities(withoutSite || t)];
  return `${chars.slice(0, Math.max(1, TITLE_MAX - 1)).join('')}…`;
}

/** Bing / SERP meta description range (decoded character count). */
const META_MIN = 120;
const META_MAX = 160;
const META_BANNED = /\bOriginal(?:teile|s)?\b|\bauthorized\b|\boriginali\b|\boriginales\b|\bd['']origine\b/i;
const PRICE_META = /\b(?:Preis(?:e|en)?|prices?|prezzi|precios|Konditionen|competitiv[eo]s?)\b/i;

const META_TAIL = {
  de: 'Teilenummer senden – unverbindliches Angebot, oft in 24 Stunden, Lieferung in Europa.',
  en: 'Send a part number – no-obligation quote, often within 24 hours, delivery in Europe.',
  it: 'Invii il codice – preventivo senza impegno, spesso entro 24 ore, consegna in Europa.',
  es: 'Envíe la referencia – presupuesto sin compromiso, a menudo en 24 horas, entrega en Europa.',
  fr: 'Indiquez la référence – devis sans engagement, souvent sous 24 h, livraison en Europe.'
};

const META_MID = {
  de: 'Ersatzteile für Industrie und MRO.',
  en: 'spare parts for industry and MRO.',
  it: 'ricambi per industria e MRO.',
  es: 'recambios para industria y MRO.',
  fr: 'pièces pour industrie et MRO.'
};

function stripHtmlText(s) {
  return String(s || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function clipDecoded(text, max) {
  const decoded = decodeTitleEntities(String(text || '').replace(/\s+/g, ' ').trim());
  if ([...decoded].length <= max) return decoded;
  const cut = [...decoded].slice(0, max).join('');
  const lastPeriod = cut.lastIndexOf('.');
  if (lastPeriod >= META_MIN - 1) return cut.slice(0, lastPeriod + 1).trim();
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > Math.min(90, max - 30) ? cut.slice(0, lastSpace) : cut).replace(/[.,;:–-]+$/g, '').trim();
}

function sanitizeMeta(text) {
  let t = stripHtmlText(text);
  t = t
    .replace(/\bOriginalteile\b/gi, 'Ersatzteile')
    .replace(/\bpièces d['']origine\b/gi, 'pièces')
    .replace(/\boriginals?\b/gi, '')
    .replace(/\boriginali\b/gi, '')
    .replace(/\boriginales\b/gi, '')
    .replace(/\bauthorized\b/gi, '')
    .replace(/\s*(?:zu )?(?:fairen |Top-)?(?:Preisen|Konditionen)\.?\s*/gi, ' ')
    .replace(/\s*competitive prices\.?\s*/gi, ' ')
    .replace(/\s*attraktive(?: Konditionen)?\.?\s*/gi, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,;:])/g, '$1')
    .replace(/^[.,;:\s]+/, '')
    .trim();
  return t;
}

function productFactFromBag(bag) {
  if (!bag || typeof bag !== 'object') return '';
  const listKey = Object.keys(bag).find((k) => /products_list$|bx_products_list/.test(k) && bag[k]);
  if (!listKey) return '';
  const items = [...String(bag[listKey]).matchAll(/<li>([\s\S]*?)<\/li>/gi)]
    .map((m) => stripHtmlText(m[1]).replace(/\s*\(.*$/, '').trim())
    .filter((s) => s && s.length > 2 && !META_BANNED.test(s) && !PRICE_META.test(s));
  if (!items.length) return '';
  return items.slice(0, 3).join(', ');
}

function brandPageDescription(brand, lang, fact) {
  const name = String(brand || '').trim() || 'ABCspareparts';
  const mid = META_MID[lang] || META_MID.de;
  const tail = META_TAIL[lang] || META_TAIL.de;
  const factBit = fact ? ` ${clipDecoded(fact, 48)}.` : '';
  const candidates = [
    `${name} ${mid}${factBit} ${tail}`,
    `${name} ${mid} ${tail}`,
    `${name} ${titleKeyword(lang)}. ${tail}`
  ];
  for (const c of candidates) {
    const cleaned = c.replace(/\s{2,}/g, ' ').replace(/\s+\./g, '.').trim();
    const n = decodedTitleLength(cleaned);
    if (n >= META_MIN && n <= META_MAX && !META_BANNED.test(cleaned) && !PRICE_META.test(cleaned)) {
      return cleaned;
    }
  }
  const fallback = `${name} ${mid} ${tail}`.replace(/\s{2,}/g, ' ').trim();
  if (decodedTitleLength(fallback) < META_MIN) {
    return clipDecoded(`${fallback} ${tail}`, META_MAX);
  }
  return clipDecoded(fallback, META_MAX);
}

function fitBrandDescription(text, brand, lang, bag) {
  const sanitized = sanitizeMeta(text);
  const fact = productFactFromBag(bag);
  if (
    sanitized
    && decodedTitleLength(sanitized) >= META_MIN
    && decodedTitleLength(sanitized) <= META_MAX
    && /[.!?]$/.test(sanitized)
    && !META_BANNED.test(sanitized)
    && !PRICE_META.test(sanitized)
    && titleStartsWithBrand(sanitized, brand)
  ) {
    return sanitized;
  }
  if (sanitized && decodedTitleLength(sanitized) < META_MIN && !META_BANNED.test(sanitized) && !PRICE_META.test(sanitized)) {
    const tail = META_TAIL[lang] || META_TAIL.de;
    let padded = sanitized;
    if (brand && !titleStartsWithBrand(padded, brand)) {
      padded = `${String(brand).trim()} ${padded}`;
    }
    if (!padded.toLowerCase().includes(tail.slice(0, 18).toLowerCase())) {
      padded = `${padded.replace(/[.]+$/, '')}. ${tail}`;
    }
    const mid = META_MID[lang] || META_MID.de;
    if (decodedTitleLength(padded) < META_MIN && !padded.toLowerCase().includes('mro')) {
      padded = `${padded.replace(/[.]+$/, '')}. ${mid}`;
    }
    padded = padded.replace(/\s{2,}/g, ' ').trim();
    if (decodedTitleLength(padded) >= META_MIN && decodedTitleLength(padded) <= META_MAX && !META_BANNED.test(padded)) {
      return padded;
    }
    if (decodedTitleLength(padded) > META_MAX) {
      const clipped = clipDecoded(padded, META_MAX);
      if (decodedTitleLength(clipped) >= META_MIN) return clipped;
    }
  }
  return brandPageDescription(brand, lang, fact);
}

function fitMetaRange(text, lang) {
  const sanitized = sanitizeMeta(text);
  if (
    decodedTitleLength(sanitized) >= META_MIN
    && decodedTitleLength(sanitized) <= META_MAX
    && !META_BANNED.test(sanitized)
    && !PRICE_META.test(sanitized)
  ) {
    return sanitized;
  }
  const tail = META_TAIL[lang] || META_TAIL.de;
  let padded = sanitized || tail;
  if (decodedTitleLength(padded) < META_MIN) {
    padded = `${padded.replace(/[.]+$/, '')}. ${tail}`;
  }
  padded = padded.replace(/\s{2,}/g, ' ').trim();
  if (decodedTitleLength(padded) < META_MIN) {
    padded = `${padded} ${(META_MID[lang] || META_MID.de)}`;
  }
  if (decodedTitleLength(padded) > META_MAX) return clipDecoded(padded, META_MAX);
  return padded.replace(/\s{2,}/g, ' ').trim();
}

module.exports = {
  BASE,
  PRIMARY_LANG,
  FUTURE_LANG_PREFIXES,
  hreflangLinks,
  hreflangLinksForAlternates,
  canonicalUrl,
  ICON_LINKS,
  collectIndexWorthySlugs,
  EXCLUDED_BRANDS,
  isExcludedBrand,
  TITLE_MAX,
  TITLE_KEYWORD,
  TITLE_BANNED,
  decodeTitleEntities,
  decodedTitleLength,
  titleKeyword,
  brandPageTitle,
  fitBrandTitle,
  clipToTitleMax,
  META_MIN,
  META_MAX,
  META_BANNED,
  PRICE_META,
  brandPageDescription,
  fitBrandDescription,
  fitMetaRange,
  clipDecoded,
  sanitizeMeta
};
