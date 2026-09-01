# SEO Pre-Merge Review

## Verdict

**READY FOR PR REVIEW**

---

## Repository State

| Field | Value |
|-------|-------|
| Branch name | `fix/technical-seo-foundation` |
| Base branch | `main` |
| Initial commit hash | `f9fe3974b0684337b52f8adcb8c34c221f5bdb9c` |
| Final commit hash | `2c8c424726624e5ff8eaf15d72f5c78ad29aef10` |
| Git status before rebuild | Clean working tree; only untracked `SEO_AUDIT_REPORT.md` |
| Git status after rebuild | 116 modified generated files; untracked `SEO_AUDIT_REPORT.md` |
| Local synchronization commit created | Yes — `2c8c42472` `chore(seo): synchronize generated pages after remediation` |
| Commit still needs pushing | Yes — sync commit is local only (not pushed per instructions) |

---

## Build Commands

Canonical full sequence (from `package.json` + `README.md`):

| # | Command | Exit | Notes |
|---|---------|------|-------|
| 1 | `node extract-brands.js` | 0 | `marche.html`, `brand-groups.json`, `index.html` priority brands |
| 2 | `npm run build:brand-pages` | 0 | All 11,959 brand pages + `sitemap-brands.xml` |
| 3 | `node generate-case-pages.js` | 0 | `casi.html` + 12 case pages; brand cross-links updated |
| 4 | `node build-brand-parts.js` | 0 | `sitemap-index.xml`, `sitemap.xml` lastmod, `robots.txt`, `llms.txt` |
| 5 | `npm run verify` | 0 | `verify-build: OK — 11959 brands, 11959 HTML pages, 11959 sitemap URLs + SEO checks` |

**Why this sequence:** Matches README build order: marche hub first (`extract-brands`), then all brand pages, then cases (which patch brand cross-links), then brand-parts/sitemap maintenance, then verification. No `--only=` partial rebuild used.

---

## Full Regeneration Result

| Metric | Value |
|--------|-------|
| Total files modified by full generation | **116** |
| Category A (expected) | **116** |
| Category B (pre-existing drift) | **0** (all drift absorbed into A as required sync) |
| Category C (unexpected/risky) | **0** |
| All generated output synchronized with source | **Yes** |

### Category explanation

**A — Expected (116 files)**

1. **`sitemap-brands.xml` (1 file)** — All 11,959 `<lastmod>` values updated to build date `2026-09-01` by full `generate-brand-pages.js` run.

2. **`marche/*.html` (115 files)** — Brand pages in `brand-order-parts.json` (38 brands with quotable parts/listino) plus case-linked brands where committed output lagged the generator:
   - `dateModified` in JSON-LD: `2026-08-27` → `2026-09-01`
   - ItemList `numberOfItems` aligned to actual `itemListElement` count (SEO-003) on pages with quotable parts/listino
   - Minor case-cross-link HTML sync from `generate-case-pages.js` (e.g. `parts-compact` class, case link markup on `roemheld.html`)

3. **No changes** to the other ~11,844 brand pages, `marche.html`, `index.html`, `casi/*`, or other sitemaps — already synchronized with current generators.

**B — Pre-existing drift:** None remaining after full rebuild.

**C — Unexpected/risky:** None identified.

### `generate-brand-pages.js` change scope

The remediation change in `generate-brand-pages.js` affects **only pages with quotable parts or listino data** (`brand-order-parts.json`):

| Output area | Affected? |
|-------------|-----------|
| ItemList JSON-LD `numberOfItems` | **Yes** — only on pages with `#quotable-parts` ItemList |
| Title tags | No |
| Meta descriptions | No |
| Canonical tags | No |
| hreflang | No |
| FAQ schema/content | No |
| Static HTML links | No |
| Language/JS behavior | No |
| Product schema entries | No (only count metadata) |

Thin brand pages (~11,900) are regenerated with identical SEO output except `dateModified` when build date differs.

---

## SEO Validation Results

| Check | Result | Evidence |
|-------|--------|----------|
| 1. `marche.html` non-empty `#brandGroups` | **PASS** | `#brandGroups` contains 585,924 chars of static HTML |
| 2. Static crawlable brand links | **PASS** | 11,959 `href="marche/{slug}.html"` in raw HTML |
| 3. Link count ~11,959, valid files | **PASS** | 11,959 links, 11,959 unique slugs, 0 missing files |
| 4. `index.html` has `#priorityBrands` | **PASS** | `id="priorityBrands"` present in raw HTML |
| 5. Priority links → existing brand pages | **PASS** | 38 links, all target files exist |
| 6. Homepage static link to `/marche.html` | **PASS** | `href="marche.html"` found |
| 7. No `cookies.html` in sitemaps | **PASS** | Absent from all 5 sitemap files |
| 8. `/casi.html` in exactly one sitemap | **PASS** | Only in `sitemap-cases.xml` |
| 9. No `?lang=`/`?q=`/`?part=` in sitemaps | **PASS** | No parameter URLs in any sitemap XML |
| 10. Listino ItemList count matches entries | **PASS** | All 6 listino brands: `numberOfItems` === `itemListElement.length` |
| 11. ItemList ≤ 50 entries | **PASS** | No brand page exceeds 50 ListItems |
| 12. Case JSON-LD `inLanguage: "de"` | **PASS** | All published case pages + `casi.html` hub use `"de"` (not arrays) |
| 13. `marche.html` does not write `?lang=` | **PASS** | No `searchParams.set('lang')` in `marche.html` |
| 14. Canonical URLs absolute `https://abcspareparts.eu` | **PASS** | 16 indexable pages sampled (hubs, legal, brands, cases) — all correct |
| 15. No accidental `noindex` on indexable pages | **PASS** | Homepage, hubs, legal, sample brands — no `noindex` |
| 16. `npm run verify` passes | **PASS** | Exit 0 |

---

## Diff Summary

### Source files changed (vs `main`, from remediation commit)

- `extract-brands.js`, `generate-brand-pages.js`, `generate-case-pages.js`, `verify-build.js`
- `README.md`, `sitemap.xml` (template)
- `SEO_REMEDIATION_PR_NOTES.md`

### Generated files changed (sync commit)

- `sitemap-brands.xml` — lastmod refresh (11,959 URLs)
- `marche/*.html` (115 files) — dateModified + ItemList/case-link sync for parts-enabled brands

### Documentation

- `SEO_PRE_MERGE_REVIEW.md` (this file)
- `SEO_REMEDIATION_PR_NOTES.md` (prior remediation notes)

### Sample important generated files

- `marche/siemens.html` — ItemList `numberOfItems: 25` (was 91293)
- `marche/autronica.html` — ItemList `numberOfItems: 2`, `dateModified: 2026-09-01`
- `marche/roemheld.html` — case cross-link + parts section sync
- `sitemap-brands.xml` — uniform `lastmod: 2026-09-01`

### Intentionally excluded

- `SEO_AUDIT_REPORT.md` — read-only audit artifact, not part of remediation PR

---

## Manual Production Checks After Deploy

1. View-source check for static brand links on `/marche.html`
2. View-source check for `#priorityBrands` on homepage
3. `curl -IL https://abcspareparts.eu/index.html` and expected true 301 to `/`
4. Google Search Console sitemap resubmission for `https://abcspareparts.eu/sitemap-index.xml`
5. Google URL Inspection for `/marche.html`, Siemens brand page, and one thin brand page
6. Rich Results Test for `/marche/siemens.html`

---

## Deliberately Deferred Work

- Thin/near-duplicate brand page content strategy
- Server/CDN-level `/index.html` 301 redirect
- Language-specific URL architecture and hreflang expansion
- Any robots.txt parameter-blocking decision
- Any large-scale noindex/consolidation decision
