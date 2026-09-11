# Architettura lingue (ABCspareparts)

## Stato attuale (produzione)

| Aspetto | Policy |
|--------|--------|
| URL canoniche | Sempre path pulito (`/marche/siemens.html`), **mai** `?lang=` |
| UI multilingua | Selettore on-page + `localStorage` (de/en/it/es/fr) sullo **stesso** documento HTML |
| `?lang=` | Legacy UX ancora leggibile; **non** in sitemap, **non** in link SEO interni, **non** in hreflang |
| hreflang oggi | Solo `x-default` + `de` → stessa URL pulita (nessuna URL EN/IT/… distinta ancora esiste) |
| Default | Tedesco (`de`) come lingua primaria dei contenuti statici |

Helper: `seo-config.js` → `hreflangLinks(url)` e `hreflangLinksForAlternates({de,en,…})`.

## Architettura futura (non migrata in massa)

Prefissi pianificati (`FUTURE_LANG_PREFIXES`):

- `de` → `/` (root)
- `en` → `/en/…`
- `it` → `/it/…`
- `es` → `/es/…`
- `fr` → `/fr/…`

Regole obbligatorie:

1. **Nessuna generazione automatica 12.000 × 5.** Solo pagine realmente tradotte.
2. hreflang **solo** tra URL equivalenti esistenti e tradotte (reciproche).
3. Canonical = URL della lingua della pagina; cluster hreflang chiuso.
4. Sitemap: una URL per lingua **solo** se la pagina esiste; niente query string.
5. Redirect 301 solo quando un path lingua dedicato sostituisce un URL legacy — **non** ora per `?lang=`.

## Pilota limitato (fase corrente)

**Obiettivo:** validare hreflang reciproco su 1–3 URL, senza toccare le ~12k brand page.

| Step | Azione | Stato |
|------|--------|--------|
| P0 | Documentare architettura + helper `hreflangLinksForAlternates` | ✅ questo branch |
| P1 | Pubblicare `/en/impressum.html` (testo legale EN revisionato da umano) + hreflang reciproco con `/impressum.html` | ⏳ pending approvazione legale |
| P2 | Stesso pattern su `datenschutz` / `agb` se/quando traduzioni legali firmate | future |
| P3 | Valutare landings `/en/`, `/it/` per home — **non** brand mass | future |

**Non in scope del pilota:** clone massivo brand, `?lang=` → path, hreflang inventati, sitemap lingua finché le URL non esistono.

## Criteri go/no-go per espandere

- Traduzione umana (o revisionata) disponibile
- URL distinta raggiungibile con HTTP 200
- Canonical self + hreflang reciproci verificati in URL Inspection
- Nessun impatto su canonical delle pagine DE esistenti
