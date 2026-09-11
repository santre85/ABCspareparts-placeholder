# Priority brands — SEO content prep (no design/CSS/UX change)

Scope: **38 brand pages** in `brand-order-parts.json` (+ related top brands already in `top-brands-content.json`).

## What changed in this branch

- Expanded `top-brands-content.json` with brand-specific `brand_top_extra` copy (DE/EN/IT/ES/FR) derived from real RFQ codes, listino size, and/or success cases.
- Regenerated those brand HTML pages so the existing `lead-top-brand` block shows the richer text.
- **No** changes to layout, CSS, CTA, forms, or commercial pricing claims.
- Brand pages remain `index, follow` with clean self-canonical. **No** mass-noindex. **No** static noindex for `?part=` / `?lang=`.

## How content is applied

`generate-brand-pages.js` → `mergeTopBrandContent()`:

- Legacy map `{ de, en, … }` → `brand_top_extra`
- Extended map `{ fields: { meta_title: {de…}, … } }` → any translation key

Further title/H1 uniqueness can be layered later via `fields` without touching design.

## Priority slug list (38 from brand-order-parts)

abb, atlas-copco, autronica, baldwin, baumer, fagor, harmsco, hengstler, herborner, hi-force-hydraulics, hubner-elektromaschinen-ag, humphrey, ifm, konecranes, kubler, kuhnke, leuze, m-and-s-armaturen, m-plus-s-hydraulic, mettler-toledo, mst, ningbo-hongbo-weite-motor-co-ltd, pronomic, radio-energie, renishaw, rexroth, roemheld, schneider, schneider-electric, schunk, siemens, spectrex-inc, steute, sym-bang, tamagawa, telemecanique, tokheim, zollern

## Next editorial pass (optional, still no redesign)

For each of the 38, optionally add `fields.meta_title` / `fields.brand_h1` / `fields.brand_intro` with human-reviewed uniqueness beyond template + top_extra. Keep FAQ/form/CTA strings unchanged unless copy is factually wrong.
