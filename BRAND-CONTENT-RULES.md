# Brand Content Business Rules

## No External Manufacturer Links

**Business Rule:** Brand pages (`/marche/<slug>.html`) must NEVER contain any way for customers to reach the manufacturer directly.

This rule applies to:
- Manufacturer website URLs
- Investor relations pages
- Product documentation PDFs
- Wikipedia links about manufacturers
- Manufacturer contact information (addresses, phone numbers, emails)
- Social media links to manufacturers

### Rationale

ABCspareparts is a reseller and wants customers to request quotes exclusively through the site. External manufacturer links would allow customers to bypass the quote request process.

### Implementation

1. **brand-content.json** - No external URLs allowed in:
   - JSON-LD schema blocks: no `url`, `sameAs`, `address`, `telephone`, `email`, `contactPoint` properties
   - i18n text fields: no `<a href="...">` tags with external URLs
   - Notes and disclaimers: reword to remove source citations with URLs

2. **Allowed domains:**
   - `abcspareparts.eu` (site's own domain)
   - `schema.org` (JSON-LD vocabulary)
   - Site-wide contact methods (WhatsApp, contact form)

3. **Validation:** Run `node check-brand-external-links.js` to verify compliance.

### Cleaning External Links

If brand content contains external links:

```bash
# Clean brand-content.json
node clean-brand-content.js

# Regenerate affected pages
node generate-brand-pages.js --only=brand-slug

# Validate
node check-brand-external-links.js
```

### Text Rewording Examples

**Before:** "Angaben basieren auf öffentlichen Herstellerinformationen (manufacturer.com)."
**After:** "Angaben basieren auf öffentlich zugänglichen Herstellerinformationen."

**Before:** "Information is based on public sources (wikipedia.org)."
**After:** "Information is based on publicly available sources."

Keep trademark disclaimers intact, just remove the URL citations.

## Nightly ERP Part Page Pipeline

**Business Rule:** Every new ERP item must automatically get:
1. An entry in `search-index.json` (for autocomplete)
2. A static page at `/parts/<brand>/<code>.html` with the **exact same template** as existing curated pages (e.g. `/parts/pronomic/220390.html`)
3. An entry in `sitemap-search-index-parts.xml`

### End-to-End Workflow

After importing new ERP items (e.g. via `import-erp-items.js` or merging with `merge-erp-brand-parts.js`), run:

```bash
npm run nightly:parts
```

This executes the complete pipeline:
1. `generate-search-index.js` - Reads `erp-items.json` + `brand-order-parts.json`, generates `search-index.json`
2. `generate-search-index-parts.js` - Creates `/parts/<brand>/<code>.html` for every code in search index (using shared template from `generate-parts-pages.js`)
3. `verify-search-index-pages.js` - Verifies all indexed codes have pages
4. Updates `sitemap-search-index-parts.xml` automatically

### Template Consistency

All generated part pages share the same template:
- Full SEO meta tags (title, description, robots, canonical, hreflang, og:*, twitter:*)
- JSON-LD @graph: Organization, WebPage, BreadcrumbList, Product (sku, mpn, brand) — **NO offers/prices**
- Breadcrumb navigation: `Home · Marken · Brand · code`
- Part metadata block: Hersteller / Teilenummer / Beschreibung (conditional)
- Neutral description: "ABCspareparts prüft die Referenz auf Beschaffbarkeit..."
- Primary CTA links to home contact form with `?code=<code>#contact`
- Complete footer with all standard links

### GitHub Actions Integration

To automate this nightly (e.g. on ERP data merge):

```yaml
# .github/workflows/nightly-erp-sync.yml
name: Nightly ERP Part Pages
on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM UTC daily
  workflow_dispatch:

jobs:
  sync-parts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm install
      - run: npm run nightly:parts
      - name: Commit generated pages
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add parts/ search-index.json sitemap-search-index-parts.xml
          git diff --staged --quiet || git commit -m "Auto-generate part pages from nightly ERP sync"
          git push
```

### Manual Testing

Test the pipeline locally:

```bash
# 1. Add a fake ERP item to erp-items.json (do not commit)
# 2. Run the pipeline
npm run nightly:parts
# 3. Verify the new page exists at parts/<brand>/<code>.html
# 4. Verify entry in search-index.json
# 5. Verify entry in sitemap-search-index-parts.xml
# 6. Revert test changes
git restore erp-items.json parts/ search-index.json sitemap-search-index-parts.xml
```
