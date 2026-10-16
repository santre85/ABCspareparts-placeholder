# ERPNext Integration Report

**Date:** 2026-10-16  
**PR:** https://github.com/santre85/ABCspareparts-placeholder/pull/79  
**Branch:** `cursor/erp-hydac-preview-eb41`  
**Status:** ✅ Complete – Draft PR ready for review

---

## Executive Summary

Successfully integrated ERPNext items as clickable part numbers on brand pages. Applied to **HYDAC only** as preview. System designed for nightly re-runs from ERPNext exports.

### Key Results

- ✅ 29 HYDAC codes added (from 435 ERPNext items)
- ✅ Existing UI mechanism reused (no new layout)
- ✅ Descriptions kept short, NO prices published
- ✅ Passes external link validation
- ✅ Screenshots captured (DE/EN, desktop/mobile)

---

## Implementation

### 1. Scripts Created

#### `import-erp-items.js`
- **Input:** TSV with `item_code`, `brand`, `description`
- **Process:**
  - Normalizes brand names (case, accents)
  - Maps to `brand-slugs.json` (11,959 brands)
  - Logs unmatched brands (NOT auto-created)
- **Output:** `erp-items.json` (110 matched brands, 394 items)

#### `merge-erp-brand-parts.js <slug>`
- **Input:** `erp-items.json`, `brand-order-parts.json`
- **Process:**
  - Merges codes for specified brand
  - Deduplicates with existing codes
  - Prefers longer descriptions
- **Output:** Updated `brand-order-parts.json`
- **Side effects:** Updates sitemaps, `llms.txt`

### 2. Data Flow

```
ERPNext TSV → import-erp-items.js → erp-items.json
                                            ↓
                         merge-erp-brand-parts.js hydac
                                            ↓
                            brand-order-parts.json
                                            ↓
                         generate-brand-pages.js
                                            ↓
                            marche/hydac.html
```

---

## HYDAC Results

### Codes Added (29 total)

| Code | Description |
|------|-------------|
| 2103421 | UEBERG-ST FPU G3-W21,8x1/14 (BAUGR) |
| 2108819 | ADAPTER FPU A6-G3/4A BOLENZ (BAUGR) |
| 2110629 | ADAPTER FPU A7-G1/4 QHP (BAUGR) |
| 2114310 | FPU-1-350/100F2,5A3 |
| 2116149 | FPU-1-350/400A3 (ohne Schlauch) |
| 2117669 | Seal kit for FPU-1 |
| 2124524 | ADAPTER FPU A8-G 3/4LEDUC (BAUGR)* |
| 2128638 | ADAPTER FPU A9-VG8 GREER (BAUGR)* |
| 2128849 | ADAPTER FPU A10-7/8-14-UNF HYDAC (BAUGR) |
| 236376 | UEBERG-ST FPU G2-G5/8-ISO228 (BAUGR) |
| 236515 | charging hose F W24,32x1/14 (4,0m) |
| 291531 | ADAPTER FPU A5-M8x1 LEDUC (BAUGR) |
| 291533 | ADAPTER FPU A3-7/8-14UNF HYDAC |
| 291536 | ADAPTER FPU A4-7/8-14UNF OLAER (BAUGR) |
| 3018210 | ADAPTER FPU A11-M16x2 Hydac (BAUGR) |
| 3019418 | charging hose FM M30x1,5 (4,0m) |
| 3019420 | charging hose FW W30x2 (4,0m) |
| 3203185 | ADAPTER FPU A12-M16x2 MINIMESS (BAUGR) |
| 3269153 | Seal kit for FPU adapter |
| 361619 | ADAPTER FPU A1-M16x1,5 MINIMESS (BAUGR) |
| 373405 | charging hose F W24,32x1/14 (10,0m) |
| 3911267 | ADAPTER FPU A13 5/8-18UNF HYDAC (BAUGR) |
| 606765 | pressure gauge HN60-01-A 63/ 100/G 1/4B |
| 606766 | pressure gauge HN60-01-A 63/ 160/G 1/4B |
| 608034 | pressure gauge HN60-01-A 63/ 600/G 1/4B |
| 635139 | Pressure gauge 0-10bar |
| 635141 | Pressure gauge 0-100bar |
| 635142 | Pressure gauge 0-250bar |
| 635143 | Pressure gauge 0-400bar |

### UI Integration

- **Location:** https://abcspareparts.eu/marche/hydac.html (when merged)
- **Section:** "Diese Teilenummern anfragen" / "Request these part numbers"
- **Behavior:** Click code → opens pre-filled inquiry form
- **Languages:** DE (default), EN, IT, ES, FR via selector
- **No prices shown** – inquiry-based quoting only

---

## Brand Matching Statistics

### Matched Brands (110 brands, 394 items)

**Top brands by item count:**
- Phoenix Contact: 51 codes
- Rockwell: 29 codes
- **Hydac: 29 codes** ← applied
- Siemens: 20 codes
- MST: 14 codes
- M&S Armaturen: 12 codes
- Keyence: 11 codes
- Müller Martini: 10 codes
- Biesse: 10 codes
- Allen Bradley: 8 codes
- BÜRKERT: 7 codes
- BOSCH REXROTH: 6 codes
- FLEXLINK: 6 codes
- (... +97 more brands)

### Unmatched Brands (20 brands, 41 items)

| Brand | Items | Suggested Mapping |
|-------|-------|-------------------|
| HERBORNER PUMPEN | 7 | → HERBORNER |
| Scheuerle | 6 | (add to brand-slugs.json) |
| ABC | 5 | (add to brand-slugs.json) |
| Hi force | 2 | → Hi-Force Hydraulics |
| BROVIND | 2 | (add to brand-slugs.json) |
| Gorter | 2 | (add to brand-slugs.json) |
| SEPATRON | 2 | (add to brand-slugs.json) |
| MADATEC | 2 | (add to brand-slugs.json) |
| AMPLIDAN - DNH | 2 | (add to brand-slugs.json) |
| ATLAS COPCO SCA | 1 | → Atlas Copco |
| (... +10 more) | | |

**Recommendation:** Add overrides in `import-erp-items.js` for common mismatches.

---

## Screenshots

**Location:** `/workspace/artifacts/screenshots/`

### Generated Files

1. `hydac-de-desktop-parts.png` (70K, 1280px)
2. `hydac-de-mobile-parts.png` (115K, 390px)
3. `hydac-en-desktop-parts.png` (70K, 1280px)
4. `hydac-en-mobile-parts.png` (115K, 390px)

All screenshots show the "Diese Teilenummern anfragen" section with the 29 new codes displayed as clickable buttons in the existing UI pattern.

---

## Validation

### External Links Check
```
✅ check-brand-external-links.js
   - Checked 11,962 pages
   - No forbidden URLs found
   - No external manufacturer links
```

### Sitemap Updates
```
✅ sitemap-brand-parts.xml
   - HYDAC page included
   - lastmod: 2026-10-16
   - priority: 0.85

✅ llms.txt
   - HYDAC section updated with 29 codes
   - Deep links use #quote=CODE format
```

---

## Nightly Automation Design

### Workflow

```bash
#!/bin/bash
# Nightly ERP sync (run from cron or CI)

# 1. Fetch latest ERPNext export
fetch_erp_export.sh > /tmp/erp-latest.tsv

# 2. Import to erp-items.json
node import-erp-items.js /tmp/erp-latest.tsv

# 3. Merge for active brands
node merge-erp-brand-parts.js hydac
# node merge-erp-brand-parts.js phoenix-contact  # (future)

# 4. Regenerate pages
node generate-brand-pages.js

# 5. Deploy (depends on hosting)
# git add -A && git commit -m "Daily ERP sync" && git push
```

### Key Features
- **Idempotent:** Re-run safe (deduplicates codes)
- **Incremental:** Only specified brands updated
- **Logged:** Unmatched brands tracked for manual review
- **No prices:** Never imports or publishes pricing data

---

## Files Changed (Summary)

### New Files
- `import-erp-items.js` (311 lines)
- `merge-erp-brand-parts.js` (134 lines)
- `erp-items.json` (data file, 110 brands)

### Modified Files
- `brand-order-parts.json` (HYDAC entry added)
- `sitemap-brand-parts.xml` (lastmod updated)
- `llms.txt` (HYDAC section updated)
- `marche/hydac.html` (29 codes added)
- `marche/*.html` (11,961 files regenerated, no content change)

---

## Next Steps

### Before Merge
1. ✅ Review screenshots
2. ✅ Verify HYDAC codes display correctly
3. ⏳ Test inquiry form pre-fill
4. ⏳ Approve approach

### After Merge
1. Set up nightly ERPNext export
2. Configure cron job for `import + merge + generate`
3. Add overrides for unmatched brands
4. Roll out to additional brands (Phoenix Contact, Rockwell, Siemens, ...)
5. Monitor sitemap in Google Search Console

### Potential Improvements
- Add `BRAND_OVERRIDES` for HERBORNER PUMPEN, Hi force, etc.
- Auto-notify when unmatched count increases
- Dashboard for ERP sync status
- A/B test inquiry conversion rate

---

## Contact

**PR:** https://github.com/santre85/ABCspareparts-placeholder/pull/79  
**Questions:** See PR comments or contact agent

---

*Report generated: 2026-10-16*
