# Audit SEO — indicizzazione abcspareparts.eu

**Data:** 2026-09-18  
**Ambito:** sito statico live (`https://abcspareparts.eu`), generatori e sitemap in repo.  
**Obiettivo:** capire perché molte URL non finiscono in Google e cosa fare, in ordine di impatto.

Questo documento è la fotografia dell’audit. I fix tecnici già applicati in questo branch sono elencati in fondo (§8).

---

## Verdetto

Google non sta «perdendo» le pagine per un `robots.txt` sbagliato. Sta **rifiutando di indicizzare un catalogo di ~11.900 pagine marca quasi identiche**, e nel frattempo spreca crawl budget su duplicati e URL morti.

Segnali:

| Segnale | Esito live (2026-09-18) |
|--------|--------------------------|
| `site:abcspareparts.eu` | Nessun risultato utile in SERP |
| Sitemap sottomesse | **12 056 URL** (di cui **11 959 marche**) |
| Pagine marca con copy unica | **47** (listino/RFQ + `top-brands-content.json`) |
| Pagine marca template (stesso H1/FAQ/form, cambia solo il nome) | **~11 912** |
| `/index.html` | **HTTP 200**, non 301 (soft-redirect JS) |
| Host | GitHub Pages / Fastly — **Cloudflare non è attivo** |

Finché la sitemap dice a Google «indicizza 12k doorway page», le URL che *meritano* indice (home, hub marche, Siemens/ABB, casi, `/parts/`) restano in coda o vengono trattate come sito a bassa qualità.

---

## Architettura attuale (da conoscere)

| Tipo | Quantità | Indexabile? | In sitemap? |
|------|----------|-------------|-------------|
| Homepage `/` | 1 | sì | sì |
| Hub `/marche.html` | 1 | sì | sì |
| Marche `/marche/{slug}.html` | 11 959 | sì (`index,follow`) | **tutte** (prima di questo branch) |
| Casi `/casi/*.html` | 12 + hub | sì | sì |
| Parts MVP `/parts/...` | 77 | sì | sì |
| Legali | 5 | sì, tranne cookies `noindex` | sì, tranne cookies |
| Stub redirect (`marca-siemens.html`, `casi-di-successo/*`, Miele, …) | ~16 | `noindex` | no |
| JSON listini `/listini-data/` | 6 file | `Disallow` in robots | no |

Canonical sempre pulito (`https://abcspareparts.eu/...`), hreflang solo `de` + `x-default` sulla stessa URL. Le 5 lingue UI sono client-side (`localStorage`), non URL distinte.

---

## Perché Google non indicizza (cause, in ordine)

### P0 — Contenuto duplicato / thin su scala catalogo

Quasi tutte le pagine marca sono generate dallo stesso template:

- Title: `{Marca} Ersatzteile anfragen | ABCspareparts – Angebot oft in 24h` (**11 946** su 11 959)
- Intro, FAQ, form contatto, footer identici (cambia solo il nome marca)
- FAQ identiche in JSON-LD (`FAQPage`) su migliaia di URL
- Link «Ähnliche Marken» verso i vicini alfabetici (es. HDMI → marche altrettanto thin)

Google classifica questo pattern come **near-duplicate / doorway**. In Search Console vedrai soprattutto:

- *Crawled – currently not indexed*
- *Duplicate, Google chose different canonical*
- *Alternate page with proper canonical tag*
- *Discovered – currently not indexed*

**Cosa fare:** non chiedere l’indice per le 12k template. Tenere in sitemap solo URL con contenuto unico (listino, RFQ, caso, copy curata). Le pagine thin possono restare `index,follow` per gli utenti; Google le prenderà se vorrà, ma non vanno spinte. Passo successivo (editoriale, non fatto qui): `noindex,follow` sulle thin se GSC continua a sprecarci crawl.

### P0 — Crawl budget: hub marche da 1,6 MB + sitemap da 12k URL

`/marche.html` pesava **1,65 MB** perché la lista A–Z era **triplicata**: HTML statico + JSON inline + copia HTML in JS. Googlebot deve scaricare quella pagina per scoprire i link.

`sitemap-brands.xml` (~2,1 MB) elencava **tutte** le 11 959 marche, e le 39 prioritarie erano **duplicate** anche in `sitemap-brand-parts.xml`.

**Cosa fare:** sitemap piccola e hub più leggero (già applicato in questo branch).

### P1 — `/index.html` è un duplicato della home

```
GET https://abcspareparts.eu/          → 200
GET https://abcspareparts.eu/index.html → 200  (stesso body)
```

Canonical punta a `/`, c’è un redirect JS e un `<noscript>` refresh: **non basta**. GitHub Pages non esegue `_redirects` / `.htaccess`. Serve **301 HTTP** da Cloudflare (NS ancora non su Cloudflare — `server: GitHub.com`).

GSC può tenere `/index.html` come URL indicizzata o come duplicato della home.

Checklist: `CLOUDFLARE-REDIRECT-CHECKLIST.md`.

### P1 — Redirect stub solo JS (soft 200)

Esempi live tutti **200** con `noindex` + `location.replace`:

- `/marca-siemens.html`
- `/casi-di-successo.html`
- `/casi-di-successo/*.html`
- `/marche/miele.html` (e altri brand rimossi)

Google deve comunque scaricarli. Senza 301 vero restano «crawled, not indexed» e consumano budget. Stesso vincolo infra: Cloudflare/nginx.

### P1 — Meta description tagliate sulle marche che *vuoi* in indice

38 pagine prioritarie (ABB, Siemens, Atlas Copco, …) avevano description troncata a 158 caratteri con `…` a metà frase. In SERP sembrano spam da template. Corretto in questo branch.

### P2 — Homepage: H1 = solo logo; schema incoerente

- `<h1>` era un’immagine con `alt="ABCspareparts"` (poco testo per query MRO).
- JSON-LD della home includeva un `CollectionPage` sui casi con `"inLanguage": ["de","en","it","es","fr"]` (lingue per cui **non esistono URL**).
- `og:image` dichiarava 1200×630 ma `logo.png` è **760×200**.
- Nessun favicon (`rel="icon"` assente in tutto il sito).

### P2 — Lingue: hreflang finto vs UI a 5 lingue

Il selettore DE/EN/IT/ES/FR non cambia URL. Google vede un solo documento tedesco. Non è un blocco all’indicizzazione, ma:

- query italiane/inglesi non hanno landing dedicata
- `?lang=` legacy esiste ancora (canonical pulito, ok)

Architettura futura: `ARCHITECTURE-LINGUE.md`. Non clonare le 12k marche in 5 lingue.

### P3 — Altri punti (non sono la causa del «non indicizzato»)

| Punto | Nota |
|-------|------|
| `www` → apex | 301 corretto |
| HTTP → HTTPS | 301 corretto |
| `robots.txt` | `Allow: /`, solo `Disallow: /listini-data/`, una sola Sitemap (indice) |
| Trailing slash `/marche/siemens.html/` | **404** GitHub Pages (ok, non in sitemap) |
| Form ERP in iframe | contenuto non crawlabile (voluto: quote-only, niente Offer/prezzo) |
| Product JSON-LD su `/parts/` senza Offer | warning Merchant accettabile |
| `llms.txt` | utile per AI, irrilevante per Google |
| LinkedIn usa ancora `www.abcspareparts.eu` in alcuni post | 301, impatto SEO basso |

---

## Cosa indicizzare (priorità URL)

Google ha un budget piccolo per un dominio nuovo / a bassa autorità. **Chiedi l’indice solo di:**

1. `https://abcspareparts.eu/`
2. `https://abcspareparts.eu/marche.html`
3. 39 marche con listino/RFQ (`sitemap-brand-parts.xml`)
4. ~8 marche con copy curata senza listino (SMC, SICK, Keyence, …)
5. Hub + 12 casi (`sitemap-cases.xml`)
6. 77 `/parts/` MVP (`sitemap-parts.xml`)
7. Impressum, Datenschutz, AGB, Versand

Totale da spingere: **~140 URL**, non 12 000.

---

## Azioni Search Console (manuali, dopo il deploy)

1. **Cloudflare:** NS attivi + Redirect Rule 301 `/index.html` → `/`. Verifica: `curl -sI https://abcspareparts.eu/index.html` deve dare `301` e `Location: https://abcspareparts.eu/`.
2. In GSC, proprietà **apex** `https://abcspareparts.eu` (non www).
3. Sitemap: inviare **solo** `https://abcspareparts.eu/sitemap-index.xml`. Rimuovere eventuali sitemap vecchie (`sitemap-part-codes.xml`, shard `?part=`).
4. URL Inspection (richiedi indicizzazione, poche al giorno):
   - `/`
   - `/marche.html`
   - `/marche/siemens.html`, `/marche/abb.html`, `/marche/ifm.html`
   - 1 caso (es. Siemens HMI)
   - 2–3 `/parts/` (Humphrey, Rexroth, Leuze)
5. Report **Pagine**:
   - «Scansionata, al momento non indicizzata» sulle thin → atteso; non reinviare in massa.
   - «Duplicata» su `/index.html` → deve sparire dopo il 301.
6. Non usare «Rimuovi URL» sulle 12k marche.

---

## Roadmap editoriale (dopo questo branch)

| Priorità | Azione | Perché |
|----------|--------|--------|
| Alta | Copy unica su title/H1/intro delle 47 marche prioritarie (`top-brands-content.json` → `fields.meta_title` / `brand_h1`) | Ranking, non solo indice |
| Alta | Più casi di successo veri (1 pagina = 1 storia) | Unici, linkabili, E-E-A-T |
| Media | Espandere `/parts/` solo con dati RFQ reali (+50 max), mai dump listino | Thin Product pages fanno danni |
| Media | Se GSC continua a crawlarle: `noindex,follow` sulle marche senza parts/copy | Libera crawl |
| Bassa | Landing `/en/` `/it/` (home + 1 legale), hreflang reciproco | Query non-DE |
| Bassa | 301 Cloudflare anche sugli stub `marca-siemens.html` / `casi-di-successo/` | Pulizia GSC |
| Non fare | Generare 300k pagine codice da listino | Garantisce deindicizzazione di massa |

---

## Cosa è già stato corretto in questo branch

1. **`sitemap-brands.xml`** elenca solo marche con contenuto unico **escluse** quelle già in `sitemap-brand-parts.xml` (niente 12k template, niente duplicati).
2. **Meta description** prioritarie: niente più taglio con `…`.
3. **`/marche.html`**: lista A–Z resta nell’HTML (crawlable); JS non la duplica; la ricerca carica `brand-groups.json`.
4. Homepage: schema `WebPage` + `Organization.sameAs` LinkedIn, `inLanguage: de`, H1 alt descrittivo, `og:image` 760×200, favicon.
5. Favicon sulle pagine generate e legali.
6. Link «marche correlate» (al rebuild) puntano a marche con contenuto, non ai vicini alfabetici thin.
7. Gate `npm run verify` allineato alla nuova policy sitemap.

**Non fatto qui (serve CDN o decisione editoriale):** 301 `/index.html`, 301 sugli stub, `noindex` di massa, URL per lingua, OG 1200×630 dedicato.

---

## Come verificare in locale

```bash
npm run verify
# sitemap-brands.xml deve avere poche decine di URL, non 11959
```
