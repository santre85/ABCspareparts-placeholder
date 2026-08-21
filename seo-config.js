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

/** Absolute canonical for a site-root-relative path (e.g. "marche/siemens.html" or ""). */
function canonicalUrl(pathFromRoot) {
  const clean = String(pathFromRoot || '').replace(/^\//, '');
  return clean ? `${BASE}/${clean}` : `${BASE}/`;
}

module.exports = {
  BASE,
  PRIMARY_LANG,
  FUTURE_LANG_PREFIXES,
  hreflangLinks,
  canonicalUrl
};
