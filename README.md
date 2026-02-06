# ABCspareparts – Pagina statica esportata

Pagina landing statica esportata da ERPNext, pronta per il deployment su un altro dominio.

## Contenuto

- **index.html** – Pagina principale con HTML, CSS e JavaScript incorporati
- **legal.css** – Stili condivisi per le pagine legali
- **legal-i18n.js** – Traduzioni (DE, EN, IT, ES, FR) per le pagine legali
- **datenschutz.html** – Datenschutzerklärung (Privacy)
- **impressum.html** – Impressum
- **agb.html** – Allgemeine Geschäftsbedingungen (AGB)
- **versand.html** – Informazioni versand
- **cookies.html** – Cookie-Richtlinie

## Funzionalità

- Selettore lingua (DE, EN, IT, ES, FR)
- Persistenza della lingua scelta (localStorage)
- Hero, Benefits, Contatto, Footer responsive

## Deployment

1. Copia la cartella `static-export` sul tuo server web o hosting (Netlify, Vercel, hosting statico, ecc.)
2. Configura il server per servire `index.html` come pagina principale
3. Aggiorna i link nel footer se necessario (vedi sotto)

## Personalizzazione

### Contenuto pagine legali

Le pagine legali contengono **template/placeholder**. Sostituiscili con il contenuto reale da ERPNext o dal tuo avvocato. Ogni pagina ha una nota "Ersetzen Sie diesen Inhalt..." con indicazioni.

### Link legali

I link nel footer puntano alle pagine locali (datenschutz.html, impressum.html, ecc.). Se le pagine legali sono su un altro dominio, aggiorna i link in index.html e nelle pagine legali con URL assoluti.

### Email contatto

Il form usa `mailto:info@abcspareparts.eu`. Per un form che invii a un backend, sostituisci l'attributo `action` del form con l'URL del tuo endpoint.

## Requisiti

Nessuna dipendenza. Funziona su qualsiasi server che serva file HTML statici.
