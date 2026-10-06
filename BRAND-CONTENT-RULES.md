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
