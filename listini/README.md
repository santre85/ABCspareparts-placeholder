# Listini costruttore → pagine marca

Metti qui i file listino. Il **nome file** deve essere lo **slug** della pagina marca.

| File | Pagina |
|------|--------|
| `abb.xlsx` / `abb.csv` / `abb.txt` | https://abcspareparts.eu/marche/abb.html |
| `siemens.csv` | https://abcspareparts.eu/marche/siemens.html |

## Formati accettati

### 1. Solo codici (`.txt`) — consigliato se non c’è descrizione

```text
1SDA068187R1
1SFA619100R1011
ACS355-03E-01A9-4
```

Una riga = un codice. Righe vuote e `# commenti` ignorati.

### 2. CSV (`.csv`)

Con intestazione (riconosciuta automaticamente):

```csv
part_number,description
1SDA068187R1,Interruttore
1SFA619100R1011,
```

Senza intestazione: **prima colonna = codice**, seconda (opzionale) = descrizione.

Intestazioni riconosciute per il codice: `part_number`, `codice`, `articolo`, `Artikelnummer`, `sku`, `item_code`, …

### 3. Excel (`.xlsx` / `.xls`)

Prima foglio del workbook. Stessa logica colonne del CSV.
La descrizione può mancare: in pagina compare solo il codice cliccabile.

## Build

```bash
npm run build:brand-parts    # merge ORDINI + OFFERTE + listini/ → brand-order-parts.json
npm run build:brand-pages    # rigenera marche/*.html
```

I codici già presenti in ordini/preventivi **non vengono duplicati**.
