'use strict';

const MARCHE_I18N = {
  de: {
    page_title: "Über 11959 Hersteller durchsuchen | ABCspareparts – Ersatzteile unverbindlich anfragen",
    page_description: "Marke suchen, Liste filtern: 11959+ Hersteller für Industrieersatzteile und MRO. Originalteile & Alternativen. Jetzt Teilenummer einreichen – Antwort meist innerhalb von 24 Stunden. Formular oder E-Mail.",
    og_title: "Über 11959 Hersteller durchsuchen | ABCspareparts – Ersatzteile anfragen",
    og_description: "Marke suchen & filtern: 11959+ Hersteller für MRO und Industrieersatzteile. Unverbindlich anfragen – Antwort meist in 24h. Siemens, Festo, ABB u. v. m.",
    marche_h1: "Marken und Hersteller",
    marche_subtitle: "Über 11959 Marken für Industrieersatzteile. <a href=\"/\">Zurück zur Startseite</a>",
    marche_list_title: "Von ABCspareparts vertriebene Markenliste",
    marche_letters_title: "Schnellnavigation A-Z",
    marche_search_label: "Marke suchen",
    marche_search_button: "Suchen",
    marche_search_placeholder: "z. B. Siemens, Festo …",
    marche_no_results: "Keine Marken gefunden für",
    marche_showing_results: "Zeige {{count}} Marken für"
  },
  en: {
    page_title: "Search 11959+ Manufacturers | ABCspareparts – Request spare parts quote",
    page_description: "Search brand, filter list: 11959+ manufacturers for industrial spare parts and MRO. Original parts & alternatives. Submit part number now – response usually within 24 hours. Form or email.",
    og_title: "Search 11959+ Manufacturers | ABCspareparts – Request spare parts",
    og_description: "Search & filter: 11959+ manufacturers for MRO and industrial spare parts. Request quote – response usually within 24h. Siemens, Festo, ABB and more.",
    marche_h1: "Brands and Manufacturers",
    marche_subtitle: "Over 11959 brands for industrial spare parts. <a href=\"/en/\">Back to home</a>",
    marche_list_title: "Brand list distributed by ABCspareparts",
    marche_letters_title: "Quick navigation A-Z",
    marche_search_label: "Search brand",
    marche_search_button: "Search",
    marche_search_placeholder: "e.g. Siemens, Festo …",
    marche_no_results: "No brands found for",
    marche_showing_results: "Showing {{count}} brands for"
  },
  it: {
    page_title: "Cerca tra oltre 11959 produttori | ABCspareparts – Richiedi preventivo ricambi",
    page_description: "Cerca marca, filtra elenco: 11959+ produttori per ricambi industriali e MRO. Parti originali e alternative. Invia ora il codice pezzo – risposta di solito entro 24 ore. Modulo o email.",
    og_title: "Cerca tra oltre 11959 produttori | ABCspareparts – Richiedi ricambi",
    og_description: "Cerca e filtra: 11959+ produttori per MRO e ricambi industriali. Richiedi preventivo – risposta di solito entro 24h. Siemens, Festo, ABB e altri.",
    marche_h1: "Marche e produttori",
    marche_subtitle: "Oltre 11959 marchi per ricambi industriali. <a href=\"/it/\">Torna alla home</a>",
    marche_list_title: "Elenco marchi distribuiti da ABCspareparts",
    marche_letters_title: "Navigazione rapida A-Z",
    marche_search_label: "Cerca marca",
    marche_search_button: "Cerca",
    marche_search_placeholder: "ad es. Siemens, Festo …",
    marche_no_results: "Nessuna marca trovata per",
    marche_showing_results: "Mostra {{count}} marche per"
  },
  es: {
    page_title: "Buscar entre más de 11959 fabricantes | ABCspareparts – Solicitar presupuesto repuestos",
    page_description: "Buscar marca, filtrar lista: 11959+ fabricantes para repuestos industriales y MRO. Piezas originales y alternativas. Envíe número de pieza ahora – respuesta normalmente en 24 horas. Formulario o email.",
    og_title: "Buscar entre más de 11959 fabricantes | ABCspareparts – Solicitar repuestos",
    og_description: "Buscar y filtrar: 11959+ fabricantes para MRO y repuestos industriales. Solicite presupuesto – respuesta normalmente en 24h. Siemens, Festo, ABB y más.",
    marche_h1: "Marcas y fabricantes",
    marche_subtitle: "Más de 11959 marcas para repuestos industriales. <a href=\"/es/\">Volver al inicio</a>",
    marche_list_title: "Lista de marcas distribuidas por ABCspareparts",
    marche_letters_title: "Navegación rápida A-Z",
    marche_search_label: "Buscar marca",
    marche_search_button: "Buscar",
    marche_search_placeholder: "p. ej. Siemens, Festo …",
    marche_no_results: "No se encontraron marcas para",
    marche_showing_results: "Mostrando {{count}} marcas para"
  },
  fr: {
    page_title: "Rechercher parmi plus de 11959 fabricants | ABCspareparts – Demander devis pièces",
    page_description: "Rechercher marque, filtrer liste: 11959+ fabricants pour pièces détachées industrielles et MRO. Pièces d'origine et alternatives. Soumettez référence maintenant – réponse généralement sous 24 heures. Formulaire ou email.",
    og_title: "Rechercher parmi plus de 11959 fabricants | ABCspareparts – Demander pièces",
    og_description: "Rechercher et filtrer: 11959+ fabricants pour MRO et pièces détachées industrielles. Demandez devis – réponse généralement sous 24h. Siemens, Festo, ABB et plus.",
    marche_h1: "Marques et fabricants",
    marche_subtitle: "Plus de 11959 marques pour pièces détachées industrielles. <a href=\"/fr/\">Retour à l'accueil</a>",
    marche_list_title: "Liste des marques distribuées par ABCspareparts",
    marche_letters_title: "Navigation rapide A-Z",
    marche_search_label: "Rechercher marque",
    marche_search_button: "Rechercher",
    marche_search_placeholder: "par ex. Siemens, Festo …",
    marche_no_results: "Aucune marque trouvée pour",
    marche_showing_results: "Affichage de {{count}} marques pour"
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MARCHE_I18N };
}
