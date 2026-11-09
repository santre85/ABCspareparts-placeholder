'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Directory brand count from brand-groups.json (same dataset as A-Z + search).
 * {n} in the strings below is filled at generate time so titles cannot go stale.
 */
function directoryBrandCount() {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'brand-groups.json'), 'utf8'));
  let n = 0;
  const groups = data.groups || {};
  for (const key of data.orderedKeys || Object.keys(groups)) {
    n += (groups[key] || []).length;
  }
  return n;
}

function marcheI18nFor(lang, n) {
  const src = MARCHE_I18N[lang];
  if (!src) throw new Error('unknown marche lang ' + lang);
  const count = n == null ? directoryBrandCount() : n;
  const out = {};
  for (const [k, v] of Object.entries(src)) {
    out[k] = String(v).replace(/\{n\}/g, String(count));
  }
  return out;
}

const MARCHE_I18N = {
  de: {
    page_title: "Ersatzteile nach Hersteller – {n}+ Marken | ABCspareparts",
    page_description: "{n}+ Hersteller für Industrieersatzteile und MRO. Teilenummer anfragen – Angebot oft in 24 Stunden, Versand in der EU.",
    og_title: "Ersatzteile nach Hersteller – {n}+ Marken | ABCspareparts",
    og_description: "{n}+ Hersteller für Industrieersatzteile und MRO. Teilenummer anfragen – Angebot oft in 24 Stunden, Versand in der EU.",
    twitter_title: "Ersatzteile nach Hersteller – {n}+ Marken | ABCspareparts",
    twitter_description: "{n}+ Hersteller für Industrieersatzteile und MRO. Teilenummer anfragen – Angebot oft in 24 Stunden, Versand in der EU.",
    jsonld_name: "Ersatzteile nach Hersteller – {n}+ Marken | ABCspareparts",
    jsonld_description: "{n}+ Hersteller für Industrieersatzteile und MRO. Teilenummer anfragen – Angebot oft in 24 Stunden, Versand in der EU.",
    marche_h1: "Marken und Hersteller",
    marche_subtitle: "Über {n} Marken für Industrieersatzteile. <a href=\"/\">Zurück zur Startseite</a>",
    marche_list_title: "Von ABCspareparts vertriebene Markenliste",
    marche_letters_title: "Schnellnavigation A-Z",
    marche_search_label: "Marke oder Artikelnummer suchen",
    marche_search_button: "Suchen",
    marche_search_placeholder: "z. B. Siemens oder 1SDA038324R0001 …",
    marche_no_results: "Keine Marken gefunden für",
    marche_showing_results: "Zeige {{count}} Marken für"
  },
  en: {
    page_title: "Spare parts by manufacturer – {n}+ brands | ABCspareparts",
    page_description: "Browse {n}+ manufacturers for industrial spare parts and MRO. Request a part number – quote often within 24 hours, EU shipping.",
    og_title: "Spare parts by manufacturer – {n}+ brands | ABCspareparts",
    og_description: "Browse {n}+ manufacturers for industrial spare parts and MRO. Request a part number – quote often within 24 hours, EU shipping.",
    twitter_title: "Spare parts by manufacturer – {n}+ brands | ABCspareparts",
    twitter_description: "Browse {n}+ manufacturers for industrial spare parts and MRO. Request a part number – quote often within 24 hours, EU shipping.",
    jsonld_name: "Spare parts by manufacturer – {n}+ brands | ABCspareparts",
    jsonld_description: "Browse {n}+ manufacturers for industrial spare parts and MRO. Request a part number – quote often within 24 hours, EU shipping.",
    marche_h1: "Brands and Manufacturers",
    marche_subtitle: "Over {n} brands for industrial spare parts. <a href=\"/en/\">Back to home</a>",
    marche_list_title: "Brand list distributed by ABCspareparts",
    marche_letters_title: "Quick navigation A-Z",
    marche_search_label: "Search brand or part number",
    marche_search_button: "Search",
    marche_search_placeholder: "e.g. Siemens or 1SDA038324R0001 …",
    marche_no_results: "No brands found for",
    marche_showing_results: "Showing {{count}} brands for"
  },
  it: {
    page_title: "Ricambi per produttore – {n}+ marche | ABCspareparts",
    page_description: "Sfoglia {n}+ produttori di ricambi industriali e MRO. Richiedi codice – preventivo spesso entro 24 ore, spedizione UE.",
    og_title: "Ricambi per produttore – {n}+ marche | ABCspareparts",
    og_description: "Sfoglia {n}+ produttori di ricambi industriali e MRO. Richiedi codice – preventivo spesso entro 24 ore, spedizione UE.",
    twitter_title: "Ricambi per produttore – {n}+ marche | ABCspareparts",
    twitter_description: "Sfoglia {n}+ produttori di ricambi industriali e MRO. Richiedi codice – preventivo spesso entro 24 ore, spedizione UE.",
    jsonld_name: "Ricambi per produttore – {n}+ marche | ABCspareparts",
    jsonld_description: "Sfoglia {n}+ produttori di ricambi industriali e MRO. Richiedi codice – preventivo spesso entro 24 ore, spedizione UE.",
    marche_h1: "Marche e produttori",
    marche_subtitle: "Oltre {n} marchi per ricambi industriali. <a href=\"/it/\">Torna alla home</a>",
    marche_list_title: "Elenco marchi distribuiti da ABCspareparts",
    marche_letters_title: "Navigazione rapida A-Z",
    marche_search_label: "Cerca marca o codice articolo",
    marche_search_button: "Cerca",
    marche_search_placeholder: "ad es. Siemens o 1SDA038324R0001 …",
    marche_no_results: "Nessuna marca trovata per",
    marche_showing_results: "Mostra {{count}} marche per"
  },
  es: {
    page_title: "Recambios por fabricante – {n}+ marcas | ABCspareparts",
    page_description: "Explore {n}+ fabricantes de recambios industriales y MRO. Solicite referencia – presupuesto a menudo en 24 horas, envío UE.",
    og_title: "Recambios por fabricante – {n}+ marcas | ABCspareparts",
    og_description: "Explore {n}+ fabricantes de recambios industriales y MRO. Solicite referencia – presupuesto a menudo en 24 horas, envío UE.",
    twitter_title: "Recambios por fabricante – {n}+ marcas | ABCspareparts",
    twitter_description: "Explore {n}+ fabricantes de recambios industriales y MRO. Solicite referencia – presupuesto a menudo en 24 horas, envío UE.",
    jsonld_name: "Recambios por fabricante – {n}+ marcas | ABCspareparts",
    jsonld_description: "Explore {n}+ fabricantes de recambios industriales y MRO. Solicite referencia – presupuesto a menudo en 24 horas, envío UE.",
    marche_h1: "Marcas y fabricantes",
    marche_subtitle: "Más de {n} marcas para repuestos industriales. <a href=\"/es/\">Volver al inicio</a>",
    marche_list_title: "Lista de marcas distribuidas por ABCspareparts",
    marche_letters_title: "Navegación rápida A-Z",
    marche_search_label: "Buscar marca o número de pieza",
    marche_search_button: "Buscar",
    marche_search_placeholder: "p. ej. Siemens o 1SDA038324R0001 …",
    marche_no_results: "No se encontraron marcas para",
    marche_showing_results: "Mostrando {{count}} marcas para"
  },
  fr: {
    page_title: "Pièces par fabricant – {n}+ marques | ABCspareparts",
    page_description: "Parcourez {n}+ fabricants de pièces industrielles et MRO. Demandez une référence – devis souvent sous 24 h, livraison UE.",
    og_title: "Pièces par fabricant – {n}+ marques | ABCspareparts",
    og_description: "Parcourez {n}+ fabricants de pièces industrielles et MRO. Demandez une référence – devis souvent sous 24 h, livraison UE.",
    twitter_title: "Pièces par fabricant – {n}+ marques | ABCspareparts",
    twitter_description: "Parcourez {n}+ fabricants de pièces industrielles et MRO. Demandez une référence – devis souvent sous 24 h, livraison UE.",
    jsonld_name: "Pièces par fabricant – {n}+ marques | ABCspareparts",
    jsonld_description: "Parcourez {n}+ fabricants de pièces industrielles et MRO. Demandez une référence – devis souvent sous 24 h, livraison UE.",
    marche_h1: "Marques et fabricants",
    marche_subtitle: "Plus de {n} marques pour pièces détachées industrielles. <a href=\"/fr/\">Retour à l'accueil</a>",
    marche_list_title: "Liste des marques distribuées par ABCspareparts",
    marche_letters_title: "Navigation rapide A-Z",
    marche_search_label: "Rechercher marque ou référence",
    marche_search_button: "Rechercher",
    marche_search_placeholder: "par ex. Siemens ou 1SDA038324R0001 …",
    marche_no_results: "Aucune marque trouvée pour",
    marche_showing_results: "Affichage de {{count}} marques pour"
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MARCHE_I18N, directoryBrandCount, marcheI18nFor };
}
