# Technical SEO Remediation — PR Notes

**Branch:** `fix/technical-seo-foundation`  
**Audit source:** `SEO_AUDIT_REPORT.md`  
**Scope:** Small, safe, reviewable technical SEO fixes only (no stack change, no brand deletions, no noindex on brands).

---

## Files changed

| File | Change |
|------|--------|
| `extract-brands.js` | Pre-render `#brandGroups` static HTML; embed brand data inline; stop `?lang=` URL writes; patch `index.html` priority brands + unified count |
| `marche.html` | Generated — 11,959 crawlable static brand links in `#brandGroups` |
| `index.html` | Static “Ersatzteile nach Hersteller” section (38 priority brands); brand count `11959+`; CSS for priority grid |
| `generate-brand-pages.js` | ItemList `numberOfItems` matches capped `itemListElement` array |
| `generate-case-pages.js` | WebPage/CollectionPage `inLanguage: 'de'` (not multi-lang array) |
| `sitemap.xml` | Removed `cookies.html` (noindex) and duplicate `casi.html` |
| `verify-build.js` | New SEO remediation checks (static links, sitemaps, ItemList, brand count) |
| `README.md` | Accurate sitemap strategy, robots/canonical docs, no `sitemap-parts-*` |
| `marche/{abb,siemens,schneider-electric,ifm,telemecanique,schneider}.html` | Regenerated listino brand pages (ItemList fix) |
| `casi.html`, `casi/*.html` | Regenerated (schema `inLanguage` fix) |
| `listini-data/*.json` | `generated` date bump from `build:brand-parts` |

---

## Completed tasks

### TASK 1 — Static brand links in marche.html (SEO-001)
- Build source: `extract-brands.js` (reads `index.html` brands array).
- `#brandGroups` now contains full A–Z static `<a href="marche/{slug}.html">` markup at build time.
- JS search/filter remains progressive enhancement; restores static HTML when filter cleared.
- Brand data embedded as `BRAND_GROUPS_INIT` (no `fetch('brand-groups.json')` required for initial render).
- Page usable with JavaScript disabled.

### TASK 2 — Static homepage brand links (SEO-002)
- Added `#priorityBrands` section with heading “Ersatzteile nach Hersteller”.
- 38 brands from `brand-order-parts.json` (listino/priority set).
- Visible link: `Alle 11959 Marken anzeigen` → `marche.html`.
- Existing JS carousels unchanged.

### TASK 3 — Fix ItemList JSON-LD count (SEO-003)
- `numberOfItems` now equals `elements.slice(0, 50).length` (max 50 entries preserved).
- Example: Siemens was 91293 → now 24 (actual emitted ListItems).

### TASK 4 — Sitemap hygiene (SEO-008, SEO-009)
- `cookies.html` removed from `sitemap.xml`.
- `casi.html` removed from `sitemap.xml` (kept only in `sitemap-cases.xml`).
- `sitemap-index.xml` unchanged (4 child sitemaps).

### TASK 5 — Stop `?lang=` on marche.html (SEO-004)
- `history.replaceState` no longer sets `lang` query param.
- Language selection uses existing `localStorage` + `languageSelect`.
- `?q=` retained for shareable search state; canonical remains clean.

### TASK 6 — Schema language consistency (SEO-016)
- Case study WebPage and hub CollectionPage JSON-LD: `inLanguage: 'de'`.
- Article JSON-LD already `inLanguage: 'de'` — unchanged.
- hreflang x-default/de preserved.

### TASK 7 — Documentation and consistency (SEO-007, SEO-019, SEO-025)
- README updated: active sitemap strategy, no `sitemap-parts-*`, robots allows all, canonical strategy for params.
- Brand count unified to **11959** (from `brands.length` in `extract-brands.js`) on homepage and marche hub.

---

## Validation commands run

```bash
node extract-brands.js
# Count: 11959 - marche.html, brand-groups.json, and index.html priority brands written

node generate-brand-pages.js --only=abb,siemens,schneider-electric,ifm,telemecanique,schneider
# 6 listino brand pages regenerated

node generate-case-pages.js
# 12 case pages + casi.html hub regenerated

node build-brand-parts.js
# sitemap-index.xml + sitemap.xml lastmod + robots.txt + llms.txt updated

npm run verify
# verify-build: OK — 11959 brands, 11959 HTML pages, 11959 sitemap URLs + SEO checks
```

### Automated checks confirmed
1. `marche.html` `#brandGroups` non-empty with ~11,959 static `marche/*.html` links
2. `index.html` has `#priorityBrands` with 38+ static brand links and `marche.html`
3. `cookies.html` absent from all sitemaps
4. `casi.html` in exactly one sitemap (`sitemap-cases.xml`)
5. No `?lang=`, `?q=`, `?part=` in any sitemap XML
6. Listino brand ItemList `numberOfItems` === `itemListElement.length` (≤ 50)
7. Full `verify-build.js` pass

---

## Deliberate non-changes

- No `noindex` on brand pages (SEO-005 thin-content strategy deferred).
- No `/index.html` server 301 (SEO-006 — infra/CDN decision).
- No `robots.txt` disallow for `?lang=` / `?q=` / `?part=` (canonical strategy retained).
- No language-specific URL folders.
- No full rebuild of all 11,959 brand pages (only 6 listino pages regenerated for ItemList fix; others unchanged until next `build:brand-pages`).
- No PR opened or deployed (per instructions).
- `SEO_AUDIT_REPORT.md` left untracked (audit artifact, not part of remediation).

---

## Rollback notes

1. `git checkout main -- extract-brands.js generate-brand-pages.js generate-case-pages.js verify-build.js README.md sitemap.xml index.html`
2. Regenerate outputs: `npm run build:marche && npm run build:brand-pages && npm run build:casi && npm run build:brand-parts`
3. Or revert the merge commit if already merged.
4. GSC: resubmit `sitemap-index.xml` after rollback if sitemap URLs changed.

---

## Manual live-site verification (post-deploy)

1. **View source** on `https://abcspareparts.eu/marche.html` — confirm `#brandGroups` contains brand `<a href="marche/...">` links without JS.
2. **View source** on `https://abcspareparts.eu/` — confirm `#priorityBrands` section and `marche.html` link in raw HTML.
3. **Disable JS** — browse `marche.html`, confirm brand list visible and filter degrades gracefully.
4. **Language switch** on `marche.html` — URL should not gain `?lang=` (only `?q=` when searching).
5. **Rich Results Test** on `marche/siemens.html` — ItemList `numberOfItems` should match visible ListItem count (≤ 50).
6. **GSC Sitemaps** — resubmit `sitemap-index.xml`; confirm no warnings for `cookies.html`; `casi.html` discovered once.
7. **GSC URL Inspection** on `marche.html?lang=en` — canonical should remain `https://abcspareparts.eu/marche.html`.
