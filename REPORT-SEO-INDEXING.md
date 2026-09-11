# REPORT-SEO-INDEXING.md

**Branch:** `cursor/seo-indexing-mvp-b832`  
**Date:** 2026-09-11  
**Status:** MVP `/parts/` **prepared for review** — pages + draft `sitemap-parts.xml` generated; **not yet declared in `sitemap-index.xml`** pending your approval of the list/example below.

---

## 1. File modificati / aggiunti

| File | Ruolo |
|------|--------|
| `parts-mvp.json` | Selezione curata 77 part number (RFQ + casi) |
| `generate-parts-pages.js` | Template/generatore `/parts/{brand}/{part}.html` |
| `parts/**/*.html` | 77 pagine MVP generate |
| `sitemap-parts.xml` | Sitemap parts (**draft**, non in index) |
| `generate-brand-pages.js` | Link crawlable «Teileseite» verso `/parts/` (stesso stile dei link case) |
| `build-brand-parts.js` | `writeSitemapIndex({ includePartsSitemap })` |
| `verify-build.js` | Controlli MVP + igiene sitemap |
| `seo-config.js` | `hreflangLinksForAlternates` |
| `top-brands-content.json` | SEO copy brand prioritarie (no redesign) |
| `_config.yml` | Include/defaults per `sitemap-parts.xml` |
| `package.json` | `build:parts`, `build:parts:publish` |
| `ARCHITECTURE-LINGUE.md` | Architettura lingue + pilota |
| `CLOUDFLARE-REDIRECT-CHECKLIST.md` | Checklist 301 `/index.html` → `/` |
| `PRIORITY-BRANDS-SEO-CONTENT.md` | Prep contenuti 38 brand |
| `REPORT-SEO-INDEXING.md` | Questo report |
| Brand HTML prioritarie / con MVP | Rigenerate (contenuti + link parts) |
| Case brand links | Ripristinati via `npm run build:casi` |

**Non toccati:** design system globale, CSS condiviso brand form, CTA commerciali, ERP iframe, Product schema sulle brand page (resta vietato).

---

## 2. Redirect Cloudflare da configurare

Vedi `CLOUDFLARE-REDIRECT-CHECKLIST.md`.

| Da | A | Codice |
|----|---|--------|
| `https://abcspareparts.eu/index.html` | `https://abcspareparts.eu/` | **301** |

**Blocco attuale:** se i nameserver pubblici sono ancora Gandi, la rule Cloudflare non è attiva. Dopo NS → Cloudflare Active, creare Redirect Rule path equals `/index.html`.

Altri redirect già documentati in `_redirects` / esempi nginx-apache restano riferimento; GitHub Pages non li applica.

---

## 3. URL / pattern da escludere (sitemap & SEO links)

| Pattern | Motivo | Come |
|---------|--------|------|
| `*?part=*` | Variante query della brand page | Canonical clean; **non** in sitemap; **non** link SEO |
| `*?lang=*` | UI language legacy | Idem; niente hreflang su `?lang=` |
| `/listini-data/*` | JSON grezzo | `robots.txt` Disallow |
| `cookies.html` | noindex | Fuori da tutte le sitemap |
| Stub redirect (`casi-di-successo/*`, `marca-siemens.html`, …) | 301/soft + noindex | Canonical verso target; non in sitemap indexabile |
| `/index.html` | Duplicato home | 301 Cloudflare → `/` |
| Shard legacy `sitemap-parts-*.xml` / `sitemap-part-codes.xml` | Query/listino mass | Vietati da verify-build |
| Pagine `/parts/` oltre MVP | Thin / senza dati unici | Solo `parts-mvp.json` |

Brand page (~12k): **restano indexabili**. Nessun mass-noindex.

---

## 4. Struttura sitemap finale

```
robots.txt
  └── Sitemap: https://abcspareparts.eu/sitemap-index.xml   (unica dichiarazione)

sitemap-index.xml
  ├── sitemap.xml                 (core)
  ├── sitemap-brands.xml          (~11959 brand clean)
  ├── sitemap-brand-parts.xml     (38 brand prioritarie)
  ├── sitemap-cases.xml           (hub + 12 casi)
  └── sitemap-parts.xml           (77 MVP /parts/)  ← DOPO approvazione: npm run build:parts:publish
```

**Ora:** `sitemap-parts.xml` esiste on-disk come **draft** e **non** è referenziato dall’index (policy: generare/attivare la sitemap parts solo al lancio MVP).

Solo URL **200**, indexabili, canoniche, senza query/redirect/noindex/404/duplicati.

---

## 5. Elenco pagine MVP `/parts/` proposte (77)

Selezione: codici con **storico RFQ/ordini** e descrizione unica, più riferimenti da **casi di successo** pubblicati. Esclusi codici con sola uguaglianza brand+codice+form (es. un codice Pronomic senza descrizione distinta).

Vedi `parts-mvp.json` per il dataset completo. Anteprima:

1. atlas-copco \| 80701.000507 \| https://abcspareparts.eu/parts/atlas-copco/80701.000507.html  
2. autronica \| V-430/BH200 \| …/parts/autronica/v-430-bh200.html  
3. autronica \| V-530/BH500 \| …/parts/autronica/v-530-bh500.html  
4. baldwin \| 13144.04 \| …  
5. baldwin \| 13144.05 \| …  
6. baldwin \| 45.877.05 \| …  
…  
77. zollern \| 1199182 \| …/parts/zollern/1199182.html  

(Elenco numerato completo in `parts-mvp.json` → campo `parts[].canonical`.)

Per ogni pagina MVP:

- HTTP 200 (static file)
- Canonical self assoluto
- Title / meta / H1 unici
- Product JSON-LD **senza** Offer/price/availability
- BreadcrumbList JSON-LD
- Link crawlable dalla brand page (`Teileseite`)
- Inclusione **solo** in `sitemap-parts.xml` (dopo publish)

---

## 6. Test URL Inspection (Search Console)

Dopo merge + deploy + (opzionale) publish sitemap:

1. `https://abcspareparts.eu/` e `https://abcspareparts.eu/index.html` (atteso 301 quest’ultimo)
2. Una brand priority: `https://abcspareparts.eu/marche/siemens.html` — canonical self, indexable
3. Variante query (non da indexare come URL distinta): `…/marche/siemens.html?part=6AV2124-0MC010-AX0` — Google deve vedere canonical clean
4. MVP esempio: `https://abcspareparts.eu/parts/humphrey/41024vdc.html`
5. Altri 3–5 `/parts/` sparsi (Siemens HMI, Rexroth pump, Leuze RSL410-M, Baldwin 45.877.05)
6. `https://abcspareparts.eu/sitemap-index.xml` e, dopo publish, `sitemap-parts.xml`
7. Verifica rich results / schema: Product **senza** Offer (warning Merchant accettabile; niente prezzo inventato)

---

## 7. Azioni manuali Search Console

1. Completare attivazione Cloudflare + 301 `/index.html` (checklist).
2. Dopo deploy: **Ispeziona URL** sui punti §6; richiedere indicizzazione degli URL MVP chiave.
3. **Non** reinviare sitemap figlie singole se già nell’index — aggiornare solo `sitemap-index.xml`.
4. Dopo `build:parts:publish`: attendere refresh crawler; monitorare «Crawled – currently not indexed» sui `/parts/`.
5. Rimuovere eventuali proprietà/sitemap storiche che puntavano a `sitemap-part-codes.xml` o shard `?part=`.
6. Non usare rimozione URL di massa sulle 12k brand.
7. Merchant Center: non aspettarsi Product rich result senza Offer — coerente con quote-only.

---

## 8. Criteri per i prossimi part number

Pubblicare un nuovo `/parts/{brand}/{code}` **solo se**:

1. Esiste **dato unico reale** oltre a brand + codice + form (descrizione RFQ, note tecniche, caso pubblicato, specifica verificabile).
2. C’è segnale di domanda: RFQ reale, marginalità/acquistabilità nota, o query organica documentata.
3. Conteggio batch successivo ancora limitato (es. +50), mai dump listino (~300k).
4. Aggiungere a `parts-mvp.json` (o successore versionato), rigenerare, link crawlable dalla brand, aggiornare solo `sitemap-parts.xml`.
5. Product JSON-LD solo con sku/name/brand/description verificabili — **mai** Offer/price/availability inventati.
6. Se manca contenuto unico → restare sulla brand page + `#quote=CODE` (niente thin page).

---

## 9. Come pubblicare la sitemap parts (dopo il tuo OK)

```bash
npm run build:parts:publish   # include sitemap-parts.xml in sitemap-index.xml
npm run verify
```

Fino ad allora: pagine possono restare sul branch/PR per review senza essere dichiarate a Google.
