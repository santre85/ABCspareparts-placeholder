# Listini costruttore → pagine marca

Metti qui i file listino. Il **nome file** deve essere lo **slug** della pagina marca.

| File | Pagina |
|------|--------|
| `abb.xlsx` / `abb.csv` / `abb.txt` | https://abcspareparts.eu/marche/abb.html |
| `siemens.csv` | https://abcspareparts.eu/marche/siemens.html |

## Cosa viene pubblicato sul sito

**Solo i codici articolo** (e, se c’è, una descrizione testuale).

- **Nessun prezzo** viene importato o mostrato (colonne Preis / Price / EUR / Netto / … ignorate)
- Non è un catalogo con listino: ogni codice è un pulsante per **richiedere** quell’articolo
- Click sul codice → finestra con form ERP precompilato (marca + codice)

Anche se l’Excel contiene prezzi, sul sito restano solo i codici richiedibili.

## Formati accettati

### 1. Solo codici (`.txt`)

```text
1SDA068187R1
1SFA619100R1011
ACS355-03E-01A9-4
```

Una riga = un codice. Righe vuote e `# commenti` ignorati.

### 2. CSV (`.csv`)

```csv
part_number,description
1SDA068187R1,Interruttore
1SFA619100R1011,
```

Senza intestazione: **prima colonna = codice**. Colonne prezzo ignorate.

### 3. Excel (`.xlsx` / `.xls`)

Prima foglio del workbook. Basta la colonna codice; descrizione e prezzi possono esserci o no.

## Listini grandi (es. ABB 100k+ codici)

Se il file ha più di 200 codici:
- i codici vanno in `listini-data/{slug}.json` (solo codici, **senza prezzi**)
- sulla pagina marca compare una **ricerca** (min. 3 caratteri)
- click sul risultato → form di richiesta precompilato
- il `.xlsx` resta locale (gitignore), in git va solo il JSON

## Build (step-by-step)

```bash
# 1) Metti il file listino (es. listini/abb.xlsx) — i prezzi non vengono pubblicati
# 2) Rigenera catalogo JSON
npm run build:brand-parts

# 3) Rigenera SOLO la pagina marca interessata (consigliato per listini grandi)
node generate-brand-pages.js --only=abb

# Oppure tutte le pagine (lento, ~12k file):
npm run build:brand-pages
```

I codici già presenti in ordini/preventivi **non vengono duplicati**.
