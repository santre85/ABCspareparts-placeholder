#!/usr/bin/env node
'use strict';

const fs = require('fs');

// Template for brand content following abel pattern WITHOUT external links
function createBrandContent(slug, config) {
  const {
    display,
    focus,
    desc,
    company,
    priceCompetitive = false,
    related = [],
    uncertain = false,
    products = [],
    applications = [],
    techPoints = [],
    founded = null
  } = config;

  const baseUrl = `https://abcspareparts.eu/marche/${slug}.html`;
  
  // Build German content
  const de = {
    meta_title: `${display} ${getMetaTitleSuffix(focus, 'de')} – Ersatzteile | ABCspareparts`,
    meta_description: `${display} ${desc}. ${priceCompetitive ? 'Attraktive Konditionen. ' : ''}Typ und Menge senden – Angebot oft in 24 h.`,
    brand_h1: `${display} – ${getBrandH1(focus, 'de')}`,
    brand_intro: `ABCspareparts beschafft ${display} ${getBrandIntro(focus, 'de')} für Industrie und Instandhaltung in ganz Europa.${priceCompetitive ? ' Für viele ' + display + ' Ersatzteile können wir attraktive Konditionen anbieten.' : ''} Senden Sie uns Typ, Artikelnummer und Menge – wir antworten in der Regel innerhalb von 24 Stunden.`,
    brand_intro_p2: `Wir prüfen die Verfügbarkeit des Originalteils und, wo technisch sinnvoll, kompatible Alternativen oder Nachfolgemodelle. Diese Seite ersetzt keine Live-Bestandsliste: Nutzen Sie bitte die unverbindliche <a href="#contact">Anfrage</a>.`,
    bx_about_title: `Über ${display}`,
    bx_about_text: uncertain 
      ? `<p>${display} bezeichnet ${desc} im industriellen Bereich. Diese Seite dient der Ersatzteilbeschaffung auf Anfrage für Kunden, die solche Komponenten im MRO-Einsatz benötigen.</p>${company ? `<p>${company}</p>` : ''}`
      : `<p>${company || display + ' ist ein Hersteller von ' + desc + '.'}</p>${founded ? `<p>Gegründet: ${founded}</p>` : ''}`,
    bx_products_title: `${display} Produkte, die wir beschaffen`,
    bx_products_intro: `Typische Anfragen betreffen:`,
    bx_products_list: products.length > 0 
      ? products.map(p => `<li>${p}</li>`).join('')
      : `<li>${desc}</li><li>Ersatz- und Verschleißteile</li>`,
    bx_tech_title: `Worauf es bei ${display} Ersatzteilen ankommt`,
    bx_tech_list: techPoints.length > 0
      ? techPoints.map(t => `<li>${t}</li>`).join('')
      : `<li><strong>Vollständige Typnummer:</strong> Genaue Artikelnummer vom Typenschild erleichtert die Zuordnung.</li><li><strong>Technische Daten:</strong> Spannung, Schaltleistung, Abmessungen oder Anschlussart angeben.</li><li><strong>Einsatzort:</strong> Anlage oder Maschine nennen, in der das Teil verbaut ist.</li>`,
    bx_apps_title: `Typische Einsatzbereiche`,
    bx_apps_list: applications.length > 0
      ? applications.map(a => `<li>${a}</li>`).join('')
      : `<li>Maschinen- und Anlagenbau</li><li>Instandhaltung und MRO</li><li>Industrieautomation</li>`,
    bx_request_title: `Diese Angaben beschleunigen Ihr Angebot`,
    bx_request_list: `<li>Vollständige Typ- oder Artikelnummer vom Typenschild (ein Foto hilft)</li><li>Technische Eckdaten wie Spannung, Größe oder Leistung</li><li>Anlage oder Maschine, in der das Teil verbaut ist</li><li>Menge und gewünschter Liefertermin</li><li>Nur Original oder kompatible Alternative möglich</li>`,
    brand_faq_q4: `Beschafft ABCspareparts auch ältere oder nicht mehr gelistete ${display} Teile?`,
    brand_faq_a4: `Ja. Wir fragen beim Hersteller sowie bei Distributoren und Brokern in Europa nach. Ist das Original nicht mehr erhältlich, schlagen wir nach Rücksprache ein Nachfolgemodell oder eine kompatible Alternative vor.`,
    brand_faq_q5: `Was sind typische ${display} Produkte?`,
    brand_faq_a5: products.length > 0 ? products[0] : desc.charAt(0).toUpperCase() + desc.slice(1) + '.',
    brand_faq_q6: company ? `Wer stellt ${display} her?` : `Wo wird ${display} eingesetzt?`,
    brand_faq_a6: company || `${display} Komponenten werden in verschiedenen industriellen Anwendungen eingesetzt.`,
    bx_note: `${display} ist ein Name bzw. eine Marke${company ? ' von ' + company : ' im industriellen Bereich'}. Die Nennung dient ausschließlich der Identifikation der Produkte. Angaben basieren auf öffentlich zugänglichen Informationen. Stand: Oktober 2026.`
  };

  // English
  const en = {
    meta_title: `${display} ${getMetaTitleSuffix(focus, 'en')} – Spare Parts | ABCspareparts`,
    meta_description: `${display} ${desc}. ${priceCompetitive ? 'Competitive prices. ' : ''}Send type and quantity – quote often in 24 h.`,
    brand_h1: `${display} – ${getBrandH1(focus, 'en')}`,
    brand_intro: `ABCspareparts sources ${display} ${getBrandIntro(focus, 'en')} for industry and maintenance across Europe.${priceCompetitive ? ' We can offer competitive pricing on many ' + display + ' spare parts.' : ''} Send us the type, part number and quantity – we usually reply within 24 hours.`,
    brand_intro_p2: `We check availability of the original part and, where technically appropriate, compatible alternatives or successor models. This page is not a live stock list: please use the non-binding <a href="#contact">request</a>.`,
    bx_about_title: `About ${display}`,
    bx_about_text: uncertain
      ? `<p>${display} refers to ${desc} in the industrial sector. This page serves spare parts procurement on request for customers who need such components in MRO use.</p>${company ? `<p>${company}</p>` : ''}`
      : `<p>${company || display + ' is a manufacturer of ' + desc + '.'}</p>${founded ? `<p>Founded: ${founded}</p>` : ''}`,
    bx_products_title: `${display} products we source`,
    bx_products_intro: `Typical requests cover:`,
    bx_products_list: products.length > 0
      ? products.map(p => `<li>${translateProduct(p, 'en')}</li>`).join('')
      : `<li>${desc}</li><li>Spare and wear parts</li>`,
    bx_tech_title: `What matters with ${display} spare parts`,
    bx_tech_list: techPoints.length > 0
      ? techPoints.map(t => `<li>${translateTechPoint(t, 'en')}</li>`).join('')
      : `<li><strong>Full type number:</strong> Exact part number from the rating plate helps identification.</li><li><strong>Technical data:</strong> state voltage, rating, dimensions or connection type.</li><li><strong>Application:</strong> name the plant or machine the part is installed in.</li>`,
    bx_apps_title: `Typical applications`,
    bx_apps_list: applications.length > 0
      ? applications.map(a => `<li>${translateApplication(a, 'en')}</li>`).join('')
      : `<li>Machinery and plant engineering</li><li>Maintenance and MRO</li><li>Industrial automation</li>`,
    bx_request_title: `This information speeds up your quote`,
    bx_request_list: `<li>Full type or part number from the rating plate (a photo helps)</li><li>Key technical data such as voltage, size or rating</li><li>Plant or machine the part is installed in</li><li>Quantity and required delivery date</li><li>Original only, or compatible alternative acceptable</li>`,
    brand_faq_q4: `Does ABCspareparts also source older or no longer listed ${display} parts?`,
    brand_faq_a4: `Yes. We check with the manufacturer as well as distributors and brokers in Europe. If the original is no longer available, we propose – after consultation – a successor model or compatible alternative.`,
    brand_faq_q5: `What are typical ${display} products?`,
    brand_faq_a5: products.length > 0 ? translateProduct(products[0], 'en') : desc.charAt(0).toUpperCase() + desc.slice(1) + '.',
    brand_faq_q6: company ? `Who makes ${display}?` : `Where is ${display} used?`,
    brand_faq_a6: company || `${display} components are used in various industrial applications.`,
    bx_note: `${display} is a name or trademark${company ? ' of ' + company : ' in the industrial sector'}, mentioned solely to identify products. Information is based on publicly available sources. Last updated: October 2026.`
  };

  // Add similar translations for it, es, fr (simplified here for brevity)
  const it = translateToItalian(de, display, company);
  const es = translateToSpanish(de, display, company);
  const fr = translateToFrench(de, display, company);

  return {
    intro: "",
    products: [],
    applications: [],
    faq: [],
    related_slugs: related.filter(r => r !== slug),
    related_labels: {},
    faq_after: [
      { q: "brand_faq_q4", a: "brand_faq_a4" },
      { q: "brand_faq_q5", a: "brand_faq_a5" },
      { q: "brand_faq_q6", a: "brand_faq_a6" }
    ],
    faq_note_key: "bx_note",
    blocks: [
      {
        type: "info",
        id: "ueber-marke",
        headingId: "ueber-marke-h",
        className: "brand-info",
        titleKey: "bx_about_title",
        bodyKey: "bx_about_text"
      },
      {
        type: "info",
        id: "produkte",
        headingId: "produkte-h",
        className: "brand-info",
        titleKey: "bx_products_title",
        introKey: "bx_products_intro",
        listKey: "bx_products_list",
        listClass: "brand-list"
      },
      {
        type: "info",
        id: "technik",
        headingId: "technik-h",
        className: "brand-info",
        titleKey: "bx_tech_title",
        listKey: "bx_tech_list",
        listClass: "brand-list"
      },
      {
        type: "grid",
        className: "brand-info-grid",
        items: [
          {
            type: "info",
            id: "anwendungen",
            headingId: "anwendungen-h",
            className: "brand-info",
            titleKey: "bx_apps_title",
            listKey: "bx_apps_list",
            listClass: "brand-list brand-list-compact"
          },
          {
            type: "info",
            id: "anfrage",
            headingId: "anfrage-h",
            className: "brand-info brand-info-accent",
            titleKey: "bx_request_title",
            listKey: "bx_request_list",
            listClass: "brand-list brand-list-check"
          }
        ]
      }
    ],
    schema: {
      name_from: "meta_title",
      date_modified: true,
      about: { "@id": `${baseUrl}#brand` },
      mentions: { "@id": `${baseUrl}#manufacturer` },
      extra: [
        {
          "@type": "Brand",
          "@id": `${baseUrl}#brand`,
          name: display
        },
        {
          "@type": "Organization",
          "@id": `${baseUrl}#manufacturer`,
          brand: { "@id": `${baseUrl}#brand` },
          name: company || display
        },
        {
          "@type": "Service",
          "@id": `${baseUrl}#service`,
          name: `Beschaffung von ${display} Ersatzteilen`,
          serviceType: "MRO-Ersatzteilbeschaffung",
          provider: { "@id": "https://abcspareparts.eu/#organization" },
          brand: { "@id": `${baseUrl}#brand` },
          areaServed: { "@type": "Place", name: "Europa" }
        }
      ]
    },
    i18n: { de, en, it, es, fr }
  };
}

function getMetaTitleSuffix(focus, lang) {
  const suffixes = {
    de: {
      sensors: 'Sensoren',
      pneumatics: 'Pneumatik',
      automation: 'Automation',
      drives: 'Antriebe',
      safety: 'Sicherheitstechnik',
      electrical: 'Elektrotechnik',
      default: 'Industriekomponenten'
    },
    en: {
      sensors: 'Sensors',
      pneumatics: 'Pneumatics',
      automation: 'Automation',
      drives: 'Drives',
      safety: 'Safety Technology',
      electrical: 'Electrical Components',
      default: 'Industrial Components'
    }
  };
  return (suffixes[lang] || suffixes.en)[focus] || (suffixes[lang] || suffixes.en).default;
}

function getBrandH1(focus, lang) {
  if (lang === 'de') {
    return 'Ersatzteile und Komponenten';
  }
  return 'spare parts and components';
}

function getBrandIntro(focus, lang) {
  if (lang === 'de') {
    return 'Ersatzteile und Komponenten';
  }
  return 'spare parts and components';
}

function translateProduct(p, lang) {
  // Simplified translation logic
  return p; // In production, would have full translation
}

function translateTechPoint(t, lang) {
  return t; // Simplified
}

function translateApplication(a, lang) {
  return a; // Simplified
}

function translateToItalian(de, display, company) {
  return {
    meta_title: de.meta_title.replace('Ersatzteile', 'Ricambi'),
    meta_description: de.meta_description.replace('Angebot oft in 24 h', 'preventivo spesso entro 24 h'),
    brand_h1: `${display} – ricambi e componenti`,
    brand_intro: `ABCspareparts fornisce ricambi ${display} per industria e manutenzione in tutta Europa. Ci invii tipo, codice e quantità – di solito rispondiamo entro 24 ore.`,
    brand_intro_p2: `Verifichiamo la disponibilità del ricambio originale e, se tecnicamente adatto, alternative compatibili o modelli successori. Questa pagina non sostituisce un elenco live: usi la <a href="#contact">richiesta senza impegno</a>.`,
    bx_about_title: `Chi è ${display}`,
    bx_about_text: de.bx_about_text,
    bx_products_title: `Prodotti ${display} che forniamo`,
    bx_products_intro: `Le richieste tipiche riguardano:`,
    bx_products_list: de.bx_products_list,
    bx_tech_title: `Cosa conta nei ricambi ${display}`,
    bx_tech_list: de.bx_tech_list,
    bx_apps_title: `Applicazioni tipiche`,
    bx_apps_list: de.bx_apps_list,
    bx_request_title: `Questi dati accelerano il preventivo`,
    bx_request_list: de.bx_request_list.replace('Typenschild', 'targhetta'),
    brand_faq_q4: de.brand_faq_q4.replace('Beschafft', 'ABCspareparts fornisce'),
    brand_faq_a4: de.brand_faq_a4,
    brand_faq_q5: de.brand_faq_q5,
    brand_faq_a5: de.brand_faq_a5,
    brand_faq_q6: de.brand_faq_q6,
    brand_faq_a6: de.brand_faq_a6,
    bx_note: `${display} è un nome o marchio${company ? ' di ' + company : ' nel settore industriale'}, citato solo per identificare i prodotti. Le informazioni si basano su fonti pubbliche. Aggiornato: ottobre 2026.`
  };
}

function translateToSpanish(de, display, company) {
  return {
    meta_title: de.meta_title.replace('Ersatzteile', 'Repuestos'),
    meta_description: de.meta_description.replace('Angebot oft in 24 h', 'oferta a menudo en 24 h'),
    brand_h1: `${display} – repuestos y componentes`,
    brand_intro: `ABCspareparts suministra repuestos ${display} para industria y mantenimiento en toda Europa. Envíenos el tipo, código y cantidad – normalmente respondemos en 24 horas.`,
    brand_intro_p2: `Comprobamos la disponibilidad del repuesto original y, cuando es técnicamente adecuado, alternativas compatibles o modelos sucesores. Esta página no es un listado de stock en tiempo real: utilice la <a href="#contact">solicitud sin compromiso</a>.`,
    bx_about_title: `Sobre ${display}`,
    bx_about_text: de.bx_about_text,
    bx_products_title: `Productos ${display} que suministramos`,
    bx_products_intro: `Las solicitudes habituales abarcan:`,
    bx_products_list: de.bx_products_list,
    bx_tech_title: `Lo que importa en los repuestos ${display}`,
    bx_tech_list: de.bx_tech_list,
    bx_apps_title: `Aplicaciones típicas`,
    bx_apps_list: de.bx_apps_list,
    bx_request_title: `Estos datos aceleran su oferta`,
    bx_request_list: de.bx_request_list.replace('Typenschild', 'placa'),
    brand_faq_q4: de.brand_faq_q4.replace('Beschafft', '¿ABCspareparts también suministra'),
    brand_faq_a4: de.brand_faq_a4,
    brand_faq_q5: de.brand_faq_q5,
    brand_faq_a6: de.brand_faq_a6,
    brand_faq_q6: de.brand_faq_q6,
    brand_faq_a5: de.brand_faq_a5,
    bx_note: `${display} es un nombre o marca${company ? ' de ' + company : ' en el sector industrial'}, mencionado solo para identificar los productos. La información se basa en fuentes públicas. Actualizado: octubre de 2026.`
  };
}

function translateToFrench(de, display, company) {
  return {
    meta_title: de.meta_title.replace('Ersatzteile', 'Pièces'),
    meta_description: de.meta_description.replace('Angebot oft in 24 h', 'devis souvent sous 24 h'),
    brand_h1: `${display} – pièces et composants`,
    brand_intro: `ABCspareparts fournit pièces ${display} pour industrie et maintenance dans toute l'Europe. Envoyez-nous le type, la référence et la quantité – nous répondons généralement sous 24 heures.`,
    brand_intro_p2: `Nous vérifions la disponibilité de la pièce d'origine et, lorsque c'est techniquement pertinent, des alternatives compatibles ou des modèles successeurs. Cette page ne remplace pas une liste de stock en temps réel : utilisez la <a href="#contact">demande sans engagement</a>.`,
    bx_about_title: `À propos de ${display}`,
    bx_about_text: de.bx_about_text,
    bx_products_title: `Produits ${display} que nous fournissons`,
    bx_products_intro: `Les demandes typiques concernent :`,
    bx_products_list: de.bx_products_list,
    bx_tech_title: `Ce qui compte pour les pièces ${display}`,
    bx_tech_list: de.bx_tech_list,
    bx_apps_title: `Applications typiques`,
    bx_apps_list: de.bx_apps_list,
    bx_request_title: `Ces informations accélèrent votre devis`,
    bx_request_list: de.bx_request_list.replace('Typenschild', 'plaque'),
    brand_faq_q4: de.brand_faq_q4.replace('Beschafft', 'ABCspareparts fournit-il'),
    brand_faq_a4: de.brand_faq_a4,
    brand_faq_q5: de.brand_faq_q5,
    brand_faq_a5: de.brand_faq_a5,
    brand_faq_q6: de.brand_faq_q6,
    brand_faq_a6: de.brand_faq_a6,
    bx_note: `${display} est un nom ou une marque${company ? ' de ' + company : ' dans le secteur industriel'}, cité uniquement pour identifier les produits. Les informations reposent sur des sources publiques. Mise à jour : octobre 2026.`
  };
}

// Brand definitions with detailed metadata
const brandConfigs = {
  'abitron': {
    display: 'ABITRON',
    focus: 'electronics',
    desc: 'Industrieelektronik und Steuerungskomponenten',
    company: null,
    uncertain: false,
    products: [
      '<strong>Steuerungen</strong> und Regelungstechnik',
      '<strong>Elektronikmodule</strong> und Baugruppen',
      'Ersatzteile für Industrieelektronik'
    ],
    applications: ['Maschinen- und Anlagenbau', 'Industrieautomation', 'Prozesssteuerung'],
    techPoints: [
      '<strong>Typnummer:</strong> Genaue Modulbezeichnung vom Gehäuse oder Etikett.',
      '<strong>Seriennummer:</strong> Falls vorhanden, erleichtert die eindeutige Zuordnung.',
      '<strong>Anlage:</strong> Maschine oder System, in dem das Bauteil verbaut ist.'
    ]
  },
  // Continue with all other brands...
};

console.log('Generator ready. Run with brand slug to generate content.');
