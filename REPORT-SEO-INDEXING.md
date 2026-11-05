# REPORT-SEO-INDEXING.md

**Branch:** `cursor/seo-indexing-mvp-b832`  
**Date:** 2026-09-11  
**Status:** MVP `/parts/` **PUBLISHED in repo** — `sitemap-parts.xml` is listed in `sitemap-index.xml`. Pre-merge gate `npm run verify` / `verify:parts` = **77/77 PASS**. No next batch.

**Test artifacts:** `PARTS-MVP-TEST-REPORT.md`, `PARTS-MVP-TEST-RESULTS.json`

---

## 1. File modificati / aggiunti

| File | Ruolo |
|------|--------|
| `parts-mvp.json` | Selezione curata **77** part number (RFQ + casi) — frozen |
| `generate-parts-pages.js` | Template/generatore `/parts/{brand}/{part}.html` |
| `parts/**/*.html` | 77 pagine MVP |
| `sitemap-parts.xml` | Sitemap parts (**live** in index) |
| `verify-parts-mvp.js` | Gate pre-merge obbligatorio URL-per-URL |
| `generate-brand-pages.js` | Link crawlable «Teileseite» verso `/parts/` |
| `build-brand-parts.js` | `writeSitemapIndex({ includePartsSitemap })` |
| `verify-build.js` | Controlli MVP + richiede parts in index dopo publish |
| `seo-config.js` | `hreflangLinksForAlternates` |
| `top-brands-content.json` | SEO copy brand prioritarie (no redesign) |
| `_config.yml` | Include/defaults per `sitemap-parts.xml` |
| `package.json` | `build:parts`, `build:parts:publish`, `verify:parts` |
| `ARCHITECTURE-LINGUE.md` | Architettura lingue + pilota |
| `CLOUDFLARE-REDIRECT-CHECKLIST.md` | Checklist 301 `/index.html` → `/` |
| `PRIORITY-BRANDS-SEO-CONTENT.md` | Prep contenuti 38 brand |
| `REPORT-SEO-INDEXING.md` | Questo report |
| `PARTS-MVP-TEST-REPORT.md` | Esito test URL-per-URL |

**Non toccati:** design system, CSS layout brand, form, CTA commerciali. Nessun Product/Offer sulle brand page.

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
  └── sitemap-parts.xml           (77 MVP /parts/)  ← LIVE
```

`lastmod` = data reale di build (`YYYY-MM-DD`). Solo URL **200**, indexabili, canoniche `/parts/…`, senza query/redirect/noindex/404/duplicati.

---

## 4b. Esito test pre-merge (obbligatorio)

| Gate | Esito |
|------|-------|
| `npm run build:parts:publish` | OK — 77 pages, sitemap in index |
| `npm run verify` (= verify-build + verify-parts-mvp) | **PASS 77/77** |
| Errori risolti in sessione | HTML entity decode in confronti title/H1/Product.name (`&quot;`, `&amp;`); gate robots/canonical/JSON-LD |
| Prossimo batch | **Non generato** (fermo fino a GSC/organic) |

Dettaglio URL-per-URL: `PARTS-MVP-TEST-REPORT.md`.

**HTTP 200 post-deploy:** dopo merge su GitHub Pages, rieseguire curl/`URL Inspection` sulle 77 URL (pre-merge: file statici presenti e HTML validi = surrogate 200).

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

## 9. Publish eseguito

```bash
npm run build:parts:publish   # ✓ sitemap-parts.xml in sitemap-index.xml
npm run verify                # ✓ 77/77
```

Nessun batch successivo. Prossima espansione solo dopo verifica Search Console e rendimento organico del MVP.

## 10. Post-deploy live verification

- Timestamp: `2026-09-11T11:09:23.462Z`
- Commit live: `777dc73a882b0ef5773f092caccbf19f8c155618`
- Result: **77/77 PASS** (HTTP 200, self-canonical, robots index/follow, title/H1/Product coherent, present in live `sitemap-parts.xml`)
- Detail: `POST-DEPLOY-PARTS-MVP-REPORT.md` / `POST-DEPLOY-PARTS-MVP-RESULTS.json`
- Next `/parts/` batch: **blocked** until GSC/organic review
- Cloudflare 301 `/index.html` → `/`: still open (manual)

