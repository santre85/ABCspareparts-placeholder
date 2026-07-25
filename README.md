# ABCspareparts

Sito statico multilingue (**DE / EN / IT / ES / FR**) per [abcspareparts.eu](https://abcspareparts.eu): ricambi industriali e MRO, ~12 000 marche, richieste senza impegno tramite form ERP.

## Contenuto principale

| Path | Descrizione |
|------|-------------|
| `index.html` | Homepage |
| `marche.html` + `marche/*.html` | Indice A–Z e pagine marca (~11 962) |
| `casi.html` + `casi/*.html` | Casi di successo (storie anonime) |
| `brand-order-parts.json` | Codici richiedibili (ordini, offerte, listini) |
| `listini-data/*.json` | Listini grandi (solo codici, **senza prezzi**) |
| `llms.txt` | Catalogo per AI / LLM |
| `sitemap-index.xml` | Indice sitemap (Search Console) |
| `sitemap-parts-*.xml` | Deep-link `?part=` per tutti i codici listino |
| `robots.txt` | Allow crawler + elenco sitemap |

Pagine legali: `impressum.html`, `datenschutz.html`, `agb.html`, `versand.html`, `cookies.html`.

## Listini pubblicati (codici richiedibili)

Nessun prezzo online: ogni codice apre il form di richiesta ERP.

| Marca | Pagina | Codici | Dati |
|-------|--------|--------|------|
| ABB | [marche/abb.html](https://abcspareparts.eu/marche/abb.html) | 127 792 | `listini-data/abb.json` |
| Siemens | [marche/siemens.html](https://abcspareparts.eu/marche/siemens.html) | 91 293 | `listini-data/siemens.json` |
| Schneider Electric | [marche/schneider-electric.html](https://abcspareparts.eu/marche/schneider-electric.html) | 60 738 | `listini-data/schneider-electric.json` |
| IFM | [marche/ifm.html](https://abcspareparts.eu/marche/ifm.html) | 14 787 | `listini-data/ifm.json` |
| Telemecanique | [marche/telemecanique.html](https://abcspareparts.eu/marche/telemecanique.html) | 6 301 | `listini-data/telemecanique.json` |
| SCHNEIDER | [marche/schneider.html](https://abcspareparts.eu/marche/schneider.html) | 737 | `listini-data/schneider.json` |

Totale listino grande: **~302 000** codici (+ codici ERP/casi su altre marche).

Dettagli import: [`listini/README.md`](listini/README.md).

## Sitemap (Google Search Console)

Caricare **solo** l’indice (contiene tutto ciò che va indicizzato):

```
https://abcspareparts.eu/sitemap-index.xml
```

Sitemap figlie (URL puliti, **senza** `?part=` / `?lang=`):

```
https://abcspareparts.eu/sitemap.xml
https://abcspareparts.eu/sitemap-brands.xml
https://abcspareparts.eu/sitemap-brand-parts.xml
https://abcspareparts.eu/sitemap-cases.xml
```

**Importante (GSC):** i deep-link `?part=` e le varianti `?lang=` sono solo UX lato client sulla stessa pagina HTML (canonical = URL pulito). Non vanno in sitemap: Google li trattava come duplicati / “scansionata ma non indicizzata”. `robots.txt` li disabilita al crawl.

`npm run build:brand-parts` aggiorna `sitemap-index.xml`, `sitemap.xml` (lastmod) e `robots.txt`.

## Build

```bash
npm install

# Catalogo codici + sitemap listino + llms.txt
npm run build:brand-parts

# Una sola pagina marca (consigliato con listini grandi)
node generate-brand-pages.js --only=abb

# Tutte le pagine marca (~12k) + sitemap-brands
npm run build:brand-pages

# Casi di successo
npm run build:casi

# Verifica coerenza HTML / sitemap / SEO
npm run verify
```

Import listino: metti `listini/{slug}.xlsx` (o `.csv` / `.txt`), poi `build:brand-parts` e `--only={slug}`. I file Excel restano in gitignore; in repo vanno `listini-data/{slug}.json` e la pagina marca.

## Funzionalità

- Lingue DE / EN / IT / ES / FR (`?lang=` + localStorage)
- Pagine marca con ricerca listino (≥3 caratteri), chip di esempio, sample SEO
- Click sul codice → modale form ERP (`erp.abcspareparts.eu`) precompilato
- JSON-LD (Organization, FAQ, ItemList/Product) e `llms.txt` per discoverability

## Deployment

Sito statico (GitHub Pages / hosting HTML). Dominio: **abcspareparts.eu** (`CNAME` nel repo).
