'use strict';

const fs = require('fs');
const path = require('path');
const { assignUniqueSlugs } = require('./brand-slug.js');
const { FOOTER_CSS, withFooterI18n, buildFooterHtml } = require('./site-footer.js');

const ROOT = __dirname;
const MARCHE_DIR = path.join(ROOT, 'marche');
const BASE = 'https://abcspareparts.eu';
const TODAY = new Date().toISOString().slice(0, 10);
const MAX_META_LEN = 158;

function loadTopBrandBySlug() {
  try {
    const p = path.join(ROOT, 'top-brands-content.json');
    if (!fs.existsSync(p)) return {};
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    console.warn('top-brands-content.json:', e.message);
    return {};
  }
}

const TOP_BRAND_BY_SLUG = loadTopBrandBySlug();
if (Object.keys(TOP_BRAND_BY_SLUG).length) {
  console.log('top-brands-content.json: slugs', Object.keys(TOP_BRAND_BY_SLUG).length);
}

function loadPartsBySlug() {
  try {
    const p = path.join(ROOT, 'brand-order-parts.json');
    if (!fs.existsSync(p)) return new Map();
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    const map = new Map();
    for (const row of data.brands || []) {
      if (!row.brand_slug) continue;
      if (!row.parts?.length && !row.listino?.count) continue;
      map.set(row.brand_slug, {
        parts: row.parts || [],
        listino: row.listino || null
      });
    }
    console.log('brand-order-parts.json: brands with parts', map.size);
    return map;
  } catch (e) {
    console.warn('brand-order-parts.json:', e.message);
    return new Map();
  }
}

function mergeTopBrandContent(translations, slug) {
  const row = TOP_BRAND_BY_SLUG[slug];
  if (!row || typeof row !== 'object') return;
  const langs = ['de', 'en', 'it', 'es', 'fr'];
  for (const L of langs) {
    const text = String(row[L] || row.de || row.en || '').trim();
    if (text) translations[L].brand_top_extra = text;
  }
}

const PRICE_FOCUS_BRANDS = new Set([
  'SIEMENS', 'SMC', 'SICK', 'KEYENCE', 'TURCK', 'WEG',
  'GEFRAN', 'IFM', 'LEUZE', 'BAUMER', 'SCHMERSAL', 'BOSCH REXROTH'
]);

function normalizeBrandKey(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .toUpperCase();
}

function isPriceFocusBrand(brand) {
  return PRICE_FOCUS_BRANDS.has(normalizeBrandKey(brand));
}

function readBrandsFromIndex() {
  const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const match = indexHtml.match(/const brands = (\[[\s\S]*?\];\s*\n)/);
  if (!match) throw new Error('brands array not found in index.html');
  return eval(match[1].replace(/\];\s*\n?$/, ']'));
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(s) {
  return escapeHtml(s).replace(/'/g, '&#39;');
}

function buildTranslations(brand) {
  const H = escapeHtml(brand);
  const highlightPricing = isPriceFocusBrand(brand);
  const sub = {
    de: encodeURIComponent(`Anfrage ${brand} Ersatzteile – ABCspareparts`),
    en: encodeURIComponent(`${brand} spare parts enquiry – ABCspareparts`),
    it: encodeURIComponent(`Richiesta ricambi ${brand} – ABCspareparts`),
    es: encodeURIComponent(`Solicitud recambios ${brand} – ABCspareparts`),
    fr: encodeURIComponent(`Demande pièces ${brand} – ABCspareparts`)
  };

  return withFooterI18n({
    de: {
      meta_title: highlightPricing
        ? `${H} Ersatzteile zu Top-Konditionen | ABCspareparts`
        : `${H} Ersatzteile anfragen | ABCspareparts – Angebot oft in 24h`,
      meta_description: highlightPricing
        ? `${H} Ersatzteile zu wettbewerbsfähigen Preisen: Originalteile und geprüfte Alternativen. Teilenummer senden und schnell ein unverbindliches Angebot erhalten.`
        : `${H} Originalteile und geprüfte Alternativen für Automatisierung und MRO. Teilenummer einreichen – unverbindliches Angebot, Rückmeldung meist innerhalb von 24 Stunden. Europa-weit.`,
      brand_breadcrumb: `<a href="../index.html">Home</a> · <a href="../marche.html">Marken</a> · ${H}`,
      brand_h1: `${H} – Industrieersatzteile & MRO`,
      brand_intro: `ABCspareparts beschafft Originalteile und geprüfte Alternativen für ${H} (Industrieersatzteile, Automatisierung, MRO). Nutzen Sie das Formular für Teilenummern und Mengen – wir melden uns in der Regel innerhalb von 24 Stunden.`,
      brand_intro_p2: `Für ${H} prüft ABCspareparts Verfügbarkeit, Liefermöglichkeiten in Europa und – wo sinnvoll – geprüfte Alternativen zu Originalteilen. Diese Seite ersetzt keinen Lager- oder Echtzeit-Abgleich: nutzen Sie die unverbindliche <a href="#contact">Anfrage</a>, damit wir mit Teilenummern und Menge kalkulieren können.`,
      brand_form_hint: `Bitte im Formular Hersteller (${H}), Teilenummer, Menge und Kontext angeben.`,
      brand_faq_title: 'Häufige Fragen',
      brand_faq_q1: `Wie bestelle ich Ersatzteile für ${H}?`,
      brand_faq_a1: 'Senden Sie eine Anfrage mit Teilenummer, Menge und ggf. Maschine oder Anwendung über das unten stehende Formular oder an info@abcspareparts.eu. Wir prüfen Verfügbarkeit, Lieferzeit und Konditionen – unverbindlich.',
      brand_faq_q2: 'Liefert ABCspareparts in ganz Europa?',
      brand_faq_a2: 'Ja, die Lieferung richtet sich nach Artikel, Verfügbarkeit und Ziel. Details klären wir nach Ihrer Anfrage mit den konkreten Referenzen.',
      brand_faq_q3: 'Gibt es neben Originalteilen auch Alternativen?',
      brand_faq_a3: 'Wo technisch sinnvoll und geprüft, sind Alternativen möglich. Teilen Sie im Formular Ihre Präferenz (Original, Alternative oder beides) und den technischen Kontext mit.',
      brand_email_alt: `Oder schreiben Sie an <a href="mailto:info@abcspareparts.eu?subject=${sub.de}">info@abcspareparts.eu</a> <span class="muted">(Betreff ist vorausgefüllt)</span>`,
      related_title: 'Ähnliche Marken',
      related_intro: 'Weitere Hersteller für industrielle Ersatzteile und MRO:',
      contact_title: 'Bereit für Ihr Angebot?',
      contact_intro: 'Persönlich erreichbar per Telefon, WhatsApp und E-Mail – oder senden Sie uns Ihre Anfrage direkt über das Formular.',
      contact_info_title: 'Kontakt',
      contact_address: 'ABCspareparts<br>Serena Sarlo<br>Äussere Uferstrasse 16<br>86154 Augsburg<br>Deutschland',
      contact_channels: '<li><strong>Telefon:</strong> <a href="tel:+4915222466077">+49 152 22466077</a></li><li><strong>WhatsApp:</strong> <a href="https://wa.me/4915222466077" target="_blank" rel="noopener">+49 152 22466077</a></li><li><strong>E-Mail:</strong> <a href="mailto:info@abcspareparts.eu">info@abcspareparts.eu</a></li>',
      contact_hours_title: 'Erreichbarkeit',
      contact_hours: '<li>Montag - Freitag: 09:00 - 18:00</li><li>Samstag: 10:00 - 14:00</li><li>Sonntag: Geschlossen</li>',
      contact_form_title: 'Online-Anfrage',
      contact_iframe_title: `Anfrageformular – ${H} Ersatzteile`,
      contact_legal_note: 'Vollständige rechtliche Angaben im <a href="../impressum.html" target="_blank" rel="noopener">Impressum</a>.',
      brand_parts_title: 'Diese Teilenummern anfragen',
      brand_parts_intro: 'Codes zur Anfrage (aus Angeboten, Lieferungen oder Herstellerlisten). Keine Preise auf der Seite — klicken Sie auf einen Code, um das vorausgefüllte Formular zu öffnen.',
      brand_parts_search: 'Teilenummer suchen…',
      brand_parts_search_hint: 'Mindestens 3 Zeichen eingeben, dann auf einen Code klicken, um anzufragen.',
      brand_parts_listino_intro: 'Herstellerliste: suchen Sie eine Teilenummer und fordern Sie ein unverbindliches Angebot an. Es werden keine Preise angezeigt.',
      brand_parts_examples_label: 'Suchbeispiele (klicken zum Ausprobieren):',
      brand_parts_sample_title: 'Beispiel-Artikel (Auswahl)',
      brand_parts_sample_intro: 'Kleine Liste aus dem Katalog — klicken Sie einen Code, um anzufragen. Weitere Codes über die Suche oben.',
      brand_parts_count: 'codes',
      brand_parts_empty: 'Keine Treffer',
      brand_parts_type_more: 'Bitte mindestens 3 Zeichen eingeben…',
      brand_parts_case: 'Erfolgsgeschichte',
      brand_parts_quote: 'Angebot anfragen',
      quote_modal_title: 'Unverbindliche Anfrage',
      quote_modal_close: 'Schließen',
      quote_modal_part_label: 'Teilenummer',
      quote_iframe_title: 'Anfrageformular'
    },
    en: {
      meta_title: highlightPricing
        ? `${H} spare parts at competitive prices | ABCspareparts`
        : `${H} spare parts – quote in 24h | ABCspareparts`,
      meta_description: highlightPricing
        ? `Competitive pricing on ${H} spare parts, with original components and verified alternatives. Send part numbers for a fast, no-obligation quotation.`
        : `Original ${H} parts and verified alternatives for automation and MRO. Send part numbers – no-obligation quote, we usually reply within 24 hours. Europe-wide delivery.`,
      brand_breadcrumb: `<a href="../index.html">Home</a> · <a href="../marche.html">Brands</a> · ${H}`,
      brand_h1: `${H} – industrial spare parts & MRO`,
      brand_intro: `ABCspareparts supplies original ${H} parts and verified alternatives for industrial automation and MRO. Send part numbers and quantities via the form – we usually respond within 24 hours.`,
      brand_intro_p2: `For ${H} we check stock options, Europe-wide supply, and – where appropriate – verified non-original alternatives. This page is not a live stock feed: use the <a href="#contact">no-obligation request</a> with part numbers and quantities so we can price and source accurately.`,
      brand_form_hint: `Please include manufacturer (${H}), part number, quantity and equipment context in the form where possible.`,
      brand_faq_title: 'Frequently asked questions',
      brand_faq_q1: `How do I order ${H} spare parts?`,
      brand_faq_a1: 'Send a request with part number, quantity, and equipment context (if known) using the form below or email info@abcspareparts.eu. We check availability, lead time, and price — no obligation.',
      brand_faq_q2: 'Do you deliver across Europe?',
      brand_faq_a2: 'Yes. Shipping depends on the item, availability, and destination. We confirm these details after we receive your part references.',
      brand_faq_q3: 'Do you offer alternatives to original parts?',
      brand_faq_a3: 'Where technically suitable and verified, alternatives may be available. State your preference (original, alternative, or either) in the form.',
      brand_email_alt: `Or email <a href="mailto:info@abcspareparts.eu?subject=${sub.en}">info@abcspareparts.eu</a> <span class="muted">(subject line is pre-filled)</span>`,
      related_title: 'Related brands',
      related_intro: 'Other manufacturers for industrial spare parts and MRO:',
      contact_title: 'Ready for your quote?',
      contact_intro: 'Reach us by phone, WhatsApp or email, or send your request using the form below.',
      contact_info_title: 'Contact',
      contact_address: 'ABCspareparts<br>Serena Sarlo<br>Äussere Uferstrasse 16<br>86154 Augsburg<br>Germany',
      contact_channels: '<li><strong>Phone:</strong> <a href="tel:+4915222466077">+49 152 22466077</a></li><li><strong>WhatsApp:</strong> <a href="https://wa.me/4915222466077" target="_blank" rel="noopener">+49 152 22466077</a></li><li><strong>Email:</strong> <a href="mailto:info@abcspareparts.eu">info@abcspareparts.eu</a></li>',
      contact_hours_title: 'Availability',
      contact_hours: '<li>Monday - Friday: 09:00 - 18:00</li><li>Saturday: 10:00 - 14:00</li><li>Sunday: Closed</li>',
      contact_form_title: 'Online request',
      contact_iframe_title: `Request form – ${H} spare parts`,
      contact_legal_note: 'Full legal details in our <a href="../impressum.html" target="_blank" rel="noopener">Imprint</a>.',
      brand_parts_title: 'Request these part numbers',
      brand_parts_intro: 'Codes available to request (from quotations, deliveries, or price lists). No prices on this page — click a code to open the pre-filled enquiry form.',
      brand_parts_search: 'Search part number…',
      brand_parts_search_hint: 'Type at least 3 characters, then click a code to request a quote.',
      brand_parts_listino_intro: 'Manufacturer list: search a part number and request a no-obligation quote. No prices are shown.',
      brand_parts_examples_label: 'Search examples (click to try):',
      brand_parts_sample_title: 'Sample part numbers',
      brand_parts_sample_intro: 'A small selection from the catalog — click a code to enquire. Use search above for more codes.',
      brand_parts_count: 'codes',
      brand_parts_empty: 'No matches',
      brand_parts_type_more: 'Please type at least 3 characters…',
      brand_parts_case: 'Success story',
      brand_parts_quote: 'Request quote',
      quote_modal_title: 'No-obligation enquiry',
      quote_modal_close: 'Close',
      quote_modal_part_label: 'Part number',
      quote_iframe_title: 'Request form'
    },
    it: {
      meta_title: highlightPricing
        ? `Ricambi ${H} a prezzi competitivi | ABCspareparts`
        : `Ricambi ${H} – preventivo in 24h | ABCspareparts`,
      meta_description: highlightPricing
        ? `Prezzi vantaggiosi su ricambi ${H}, originali e alternative verificate per automazione e MRO. Invia i codici articolo per una quotazione rapida senza impegno.`
        : `Ricambi originali ${H} e alternative verificate per automazione e MRO. Invii i codici articolo – preventivo senza impegno, di solito risposta entro 24 ore. Consegna in Europa.`,
      brand_breadcrumb: `<a href="../index.html">Home</a> · <a href="../marche.html">Marche</a> · ${H}`,
      brand_h1: `${H} – ricambi industriali e MRO`,
      brand_intro: `ABCspareparts fornisce ricambi ${H} originali e alternative verificate per automazione e MRO. Indichi codici articolo e quantità nel modulo – di solito rispondiamo entro 24 ore.`,
      brand_intro_p2: `Per ${H} verifichiamo disponibilità, consegne in Europa e, se adatto, alternative verificate. Questa scheda non sostituisce un elenco live: usi la <a href="#contact">richiesta senza impegno</a> con riferimenti e quantità per un preventivo mirato.`,
      brand_form_hint: `Nel modulo indichi se possibile costruttore (${H}), codice articolo, quantità e contesto macchina.`,
      brand_faq_title: 'Domande frequenti',
      brand_faq_q1: `Come ordino i ricambi ${H}?`,
      brand_faq_a1: 'Invii una richiesta con codice articolo, quantità e, se noto, la macchina o impiego. Tramite il modulo in basso o a info@abcspareparts.eu. Verifichiamo disponibilità e condizioni, senza impegno.',
      brand_faq_q2: 'Consegnate in tutta Europa?',
      brand_faq_a2: 'Sì: tempi e costi dipendono da articolo, disponibilità e destinazione, da confermare dopo l’inoltro della richiesta con i codici.',
      brand_faq_q3: 'Oltre all’originale, ci sono alternative?',
      brand_faq_a3: 'Se tecnicamente adatte e verificate, sì. Indichi in modulo l’esigenza (originale, alternativa o indifferente).',
      brand_email_alt: `Oppure scriva a <a href="mailto:info@abcspareparts.eu?subject=${sub.it}">info@abcspareparts.eu</a> <span class="muted">(oggetto precompilato)</span>`,
      related_title: 'Marche correlate',
      related_intro: 'Altri produttori per ricambi industriali e MRO:',
      contact_title: 'Pronto per il tuo preventivo?',
      contact_intro: 'Siamo raggiungibili per telefono, WhatsApp ed e-mail, oppure può inviare la richiesta con il modulo qui sotto.',
      contact_info_title: 'Contatti',
      contact_address: 'ABCspareparts<br>Serena Sarlo<br>Äussere Uferstrasse 16<br>86154 Augsburg<br>Germania',
      contact_channels: '<li><strong>Telefono:</strong> <a href="tel:+4915222466077">+49 152 22466077</a></li><li><strong>WhatsApp:</strong> <a href="https://wa.me/4915222466077" target="_blank" rel="noopener">+49 152 22466077</a></li><li><strong>E-mail:</strong> <a href="mailto:info@abcspareparts.eu">info@abcspareparts.eu</a></li>',
      contact_hours_title: 'Disponibilità',
      contact_hours: '<li>Lunedì - Venerdì: 09:00 - 18:00</li><li>Sabato: 10:00 - 14:00</li><li>Domenica: Chiuso</li>',
      contact_form_title: 'Richiesta online',
      contact_iframe_title: `Modulo richiesta – ricambi ${H}`,
      contact_legal_note: 'Dati legali completi nell\'<a href="../impressum.html" target="_blank" rel="noopener">Impressum</a>.',
      brand_parts_title: 'Richiedi questi codici articolo',
      brand_parts_intro: 'Codici disponibili per richiesta (da preventivi, forniture o listini). Nessun prezzo in pagina: clicchi su un codice per aprire il modulo già compilato.',
      brand_parts_search: 'Cerca codice articolo…',
      brand_parts_search_hint: 'Digiti almeno 3 caratteri, poi clicchi su un codice per richiederlo.',
      brand_parts_listino_intro: 'Listino costruttore: cerchi un codice e richieda un preventivo senza impegno. I prezzi non sono mostrati.',
      brand_parts_examples_label: 'Esempi di ricerca (clic per provare):',
      brand_parts_sample_title: 'Esempi di articoli',
      brand_parts_sample_intro: 'Piccola selezione dal catalogo — clicchi su un codice per richiederlo. Per altri codici usi la ricerca sopra.',
      brand_parts_count: 'codici',
      brand_parts_empty: 'Nessun risultato',
      brand_parts_type_more: 'Digiti almeno 3 caratteri…',
      brand_parts_case: 'Caso di successo',
      brand_parts_quote: 'Richiedi preventivo',
      quote_modal_title: 'Richiesta senza impegno',
      quote_modal_close: 'Chiudi',
      quote_modal_part_label: 'Codice articolo',
      quote_iframe_title: 'Modulo richiesta'
    },
    es: {
      meta_title: highlightPricing
        ? `Recambios ${H} a precios competitivos | ABCspareparts`
        : `Recambios ${H} – presupuesto en 24h | ABCspareparts`,
      meta_description: highlightPricing
        ? `Precios competitivos en recambios ${H}, originales y alternativas verificadas para automatización y MRO. Envíe referencias para una cotización rápida sin compromiso.`
        : `Recambios originales ${H} y alternativas verificadas para automatización y MRO. Envíe referencias – presupuesto sin compromiso, respuesta habitual en 24 horas. Envío en Europa.`,
      brand_breadcrumb: `<a href="../index.html">Inicio</a> · <a href="../marche.html">Marcas</a> · ${H}`,
      brand_h1: `${H} – recambios industriales y MRO`,
      brand_intro: `ABCspareparts suministra piezas ${H} originales y alternativas verificadas para automatización y MRO. Envíe referencias y cantidades en el formulario – solemos responder en 24 horas.`,
      brand_intro_p2: `Para ${H} comprobamos disponibilidad, envíos en Europa y, si aplica, alternativas verificadas. Esta página no es stock en vivo: use la <a href="#contact">solicitud sin compromiso</a> con referencias y cantidades para un presupuesto fiable.`,
      brand_form_hint: `Indique si puede fabricante (${H}), referencia, cantidad y contexto del equipo en el formulario.`,
      brand_faq_title: 'Preguntas frecuentes',
      brand_faq_q1: `¿Cómo pido recambios ${H}?`,
      brand_faq_a1: 'Envíe la referencia, la cantidad y, si conoce el equipo, el contexto. Con el formulario o a info@abcspareparts.eu. Revisamos disponibilidad, plazo y condiciones sin compromiso.',
      brand_faq_q2: '¿Hacen envíos a toda Europa?',
      brand_faq_a2: 'Sí, según el artículo, disponibilidad y destino, que se concretan al recibir sus referencias.',
      brand_faq_q3: '¿Ofrecen alternativas a originales?',
      brand_faq_a3: 'Sí, cuando técnicamente tenga sentido y estén verificadas. Indique en el formulario su preferencia (original, alternativa o ambas).',
      brand_email_alt: `O escriba a <a href="mailto:info@abcspareparts.eu?subject=${sub.es}">info@abcspareparts.eu</a> <span class="muted">(asunto pre-rellenado)</span>`,
      related_title: 'Marcas relacionadas',
      related_intro: 'Otros fabricantes para recambios industriales y MRO:',
      contact_title: '¿Listo para tu oferta?',
      contact_intro: 'Puede contactarnos por teléfono, WhatsApp o correo electrónico, o enviar su solicitud con el formulario siguiente.',
      contact_info_title: 'Contacto',
      contact_address: 'ABCspareparts<br>Serena Sarlo<br>Äussere Uferstrasse 16<br>86154 Augsburg<br>Alemania',
      contact_channels: '<li><strong>Teléfono:</strong> <a href="tel:+4915222466077">+49 152 22466077</a></li><li><strong>WhatsApp:</strong> <a href="https://wa.me/4915222466077" target="_blank" rel="noopener">+49 152 22466077</a></li><li><strong>E-mail:</strong> <a href="mailto:info@abcspareparts.eu">info@abcspareparts.eu</a></li>',
      contact_hours_title: 'Horario',
      contact_hours: '<li>Lunes - Viernes: 09:00 - 18:00</li><li>Sábado: 10:00 - 14:00</li><li>Domingo: Cerrado</li>',
      contact_form_title: 'Solicitud en línea',
      contact_iframe_title: `Formulario – recambios ${H}`,
      contact_legal_note: 'Datos legales completos en el <a href="../impressum.html" target="_blank" rel="noopener">Aviso legal</a>.',
      brand_parts_title: 'Solicitar estas referencias',
      brand_parts_intro: 'Códigos disponibles para solicitud (presupuestos, suministros o listas). Sin precios en la página: haga clic en un código para abrir el formulario precargado.',
      brand_parts_search: 'Buscar referencia…',
      brand_parts_search_hint: 'Escriba al menos 3 caracteres y haga clic en un código para solicitarlo.',
      brand_parts_listino_intro: 'Lista del fabricante: busque una referencia y solicite presupuesto sin compromiso. No se muestran precios.',
      brand_parts_examples_label: 'Ejemplos de búsqueda (clic para probar):',
      brand_parts_sample_title: 'Ejemplos de referencias',
      brand_parts_sample_intro: 'Pequeña selección del catálogo — haga clic en un código para solicitarlo. Use la búsqueda arriba para más códigos.',
      brand_parts_count: 'códigos',
      brand_parts_empty: 'Sin resultados',
      brand_parts_type_more: 'Escriba al menos 3 caracteres…',
      brand_parts_case: 'Caso de éxito',
      brand_parts_quote: 'Solicitar presupuesto',
      quote_modal_title: 'Solicitud sin compromiso',
      quote_modal_close: 'Cerrar',
      quote_modal_part_label: 'Referencia',
      quote_iframe_title: 'Formulario de solicitud'
    },
    fr: {
      meta_title: highlightPricing
        ? `Pièces ${H} à prix compétitifs | ABCspareparts`
        : `Pièces ${H} – devis sous 24h | ABCspareparts`,
      meta_description: highlightPricing
        ? `Prix compétitifs sur les pièces ${H}, d’origine et alternatives vérifiées pour l’automatisation et le MRO. Envoyez les références pour un devis rapide sans engagement.`
        : `Pièces d’origine ${H} et alternatives vérifiées pour l’automatisation et le MRO. Indiquez les références – devis sans engagement, réponse en général sous 24 h. Livraison en Europe.`,
      brand_breadcrumb: `<a href="../index.html">Accueil</a> · <a href="../marche.html">Marques</a> · ${H}`,
      brand_h1: `${H} – pièces industrielles et MRO`,
      brand_intro: `ABCspareparts fournit des pièces ${H} d’origine et des alternatives vérifiées pour l’automatisation et le MRO. Indiquez références et quantités dans le formulaire – réponse en général sous 24 h.`,
      brand_intro_p2: `Pour ${H}, nous contrôlons la disponibilité, les possibilités d’expédition en Europe et, le cas échéant, des alternatives vérifiées. Cette page n’est pas un stock temps réel : utilisez la <a href="#contact">demande sans engagement</a> avec références et quantités pour un devis fiable.`,
      brand_form_hint: `Indiquez si possible fabricant (${H}), référence, quantité et contexte machine dans le formulaire.`,
      brand_faq_title: 'Questions fréquentes',
      brand_faq_q1: `Comment commander des pièces ${H} ?`,
      brand_faq_a1: 'Envoyez la référence, la quantité et, si connu, le contexte machine, via le formulaire ci-dessous ou par e-mail à info@abcspareparts.eu. Nous vérifions disponibilité, délai et conditions — sans engagement.',
      brand_faq_q2: 'Livrez-vous en Europe entière ?',
      brand_faq_a2: 'Oui, selon l’article, la disponibilité et la destination, à confirmer après réception de vos références.',
      brand_faq_q3: 'Y a-t-il des alternatives à l’origine ?',
      brand_faq_a3: 'Oui, lorsque c’est techniquement cohérent et vérifié. Indiquez votre préférence (origine, alternative ou les deux) dans le formulaire.',
      brand_email_alt: `Ou écrivez à <a href="mailto:info@abcspareparts.eu?subject=${sub.fr}">info@abcspareparts.eu</a> <span class="muted">(objet prérempli)</span>`,
      related_title: 'Marques associées',
      related_intro: 'Autres fabricants pour pièces industrielles et MRO :',
      contact_title: 'Prêt pour votre devis?',
      contact_intro: 'Contactez-nous par téléphone, WhatsApp ou e-mail, ou envoyez votre demande via le formulaire ci-dessous.',
      contact_info_title: 'Contact',
      contact_address: 'ABCspareparts<br>Serena Sarlo<br>Äussere Uferstrasse 16<br>86154 Augsburg<br>Allemagne',
      contact_channels: '<li><strong>Téléphone:</strong> <a href="tel:+4915222466077">+49 152 22466077</a></li><li><strong>WhatsApp:</strong> <a href="https://wa.me/4915222466077" target="_blank" rel="noopener">+49 152 22466077</a></li><li><strong>E-mail:</strong> <a href="mailto:info@abcspareparts.eu">info@abcspareparts.eu</a></li>',
      contact_hours_title: 'Disponibilité',
      contact_hours: '<li>Lundi - Vendredi: 09:00 - 18:00</li><li>Samedi: 10:00 - 14:00</li><li>Dimanche: Fermé</li>',
      contact_form_title: 'Demande en ligne',
      contact_iframe_title: `Formulaire – pièces ${H}`,
      contact_legal_note: 'Informations légales complètes dans les <a href="../impressum.html" target="_blank" rel="noopener">mentions légales</a>.',
      brand_parts_title: 'Demander ces références',
      brand_parts_intro: 'Codes disponibles pour demande (devis, livraisons ou listes). Aucun prix sur la page : cliquez sur un code pour ouvrir le formulaire prérempli.',
      brand_parts_search: 'Rechercher une référence…',
      brand_parts_search_hint: 'Saisissez au moins 3 caractères, puis cliquez sur un code pour demander un devis.',
      brand_parts_listino_intro: 'Liste constructeur : recherchez une référence et demandez un devis sans engagement. Aucun prix n’est affiché.',
      brand_parts_examples_label: 'Exemples de recherche (cliquez pour essayer) :',
      brand_parts_sample_title: 'Exemples de références',
      brand_parts_sample_intro: 'Petite sélection du catalogue — cliquez sur un code pour demander. Utilisez la recherche ci-dessus pour d’autres codes.',
      brand_parts_count: 'références',
      brand_parts_empty: 'Aucun résultat',
      brand_parts_type_more: 'Saisissez au moins 3 caractères…',
      brand_parts_case: 'Histoire de réussite',
      brand_parts_quote: 'Demander un devis',
      quote_modal_title: 'Demande sans engagement',
      quote_modal_close: 'Fermer',
      quote_modal_part_label: 'Référence',
      quote_iframe_title: 'Formulaire de demande'
    }
  });
}

const PARTS_META_PREFIX = {
  de: ' Beispielcodes:',
  en: ' Example parts:',
  it: ' Codici es.:',
  es: ' Códigos ej.:',
  fr: ' Ex. références:'
};

const PARTS_META_MORE = {
  de: (n) => ` (+${n} weitere)`,
  en: (n) => ` (+${n} more)`,
  it: (n) => ` (+${n} altri)`,
  es: (n) => ` (+${n} más)`,
  fr: (n) => ` (+${n} de plus)`
};

function enrichMetaWithParts(translations, parts) {
  if (!parts || !parts.length) return translations;
  const codes = parts.map((p) => p.part_number);
  for (const lang of ['de', 'en', 'it', 'es', 'fr']) {
    const base = translations[lang].meta_description;
    const prefix = PARTS_META_PREFIX[lang];
    let budget = MAX_META_LEN - base.length - prefix.length;
    const shown = [];
    for (const code of codes) {
      const sep = shown.length ? ', ' : '';
      if (sep.length + code.length > budget - 8) break;
      shown.push(code);
      budget -= sep.length + code.length;
    }
    let extra = '';
    if (shown.length < codes.length) {
      extra = PARTS_META_MORE[lang](codes.length - shown.length);
    }
    let meta = `${base}${prefix} ${shown.join(', ')}${extra}`;
    if (meta.length > MAX_META_LEN) {
      meta = `${meta.slice(0, MAX_META_LEN - 1).trim()}…`;
    }
    translations[lang].meta_description = meta;
  }
  return translations;
}

function buildLdJson(brand, slug, tDe, suppliedParts, listino) {
  const pageUrl = `${BASE}/marche/${slug}.html`;
  const webPage = {
    '@type': 'WebPage',
    '@id': pageUrl + '#webpage',
    url: pageUrl,
    name: `${brand} – Industrieersatzteile & MRO | ABCspareparts`,
    description: tDe.meta_description,
    inLanguage: 'de',
    isPartOf: { '@id': `${BASE}/#website` },
    about: { '@type': 'Brand', name: brand },
    publisher: { '@id': `${BASE}/#organization` },
    primaryImageOfPage: { '@type': 'ImageObject', url: `${BASE}/logo.png` }
  };
  if ((suppliedParts && suppliedParts.length) || listino?.count) {
    webPage.dateModified = TODAY;
    webPage.mainEntity = { '@id': pageUrl + '#quotable-parts' };
  }
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@id': `${BASE}/#organization`,
        '@type': 'Organization',
        name: 'ABCspareparts',
        url: `${BASE}/`,
        logo: { '@type': 'ImageObject', url: `${BASE}/logo.png` }
      },
      webPage,
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE}/` },
          { '@type': 'ListItem', position: 2, name: 'Marken', item: `${BASE}/marche.html` },
          { '@type': 'ListItem', position: 3, name: brand, item: pageUrl }
        ]
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          { '@type': 'Question', name: tDe.brand_faq_q1, acceptedAnswer: { '@type': 'Answer', text: tDe.brand_faq_a1 } },
          { '@type': 'Question', name: tDe.brand_faq_q2, acceptedAnswer: { '@type': 'Answer', text: tDe.brand_faq_a2 } },
          { '@type': 'Question', name: tDe.brand_faq_q3, acceptedAnswer: { '@type': 'Answer', text: tDe.brand_faq_a3 } }
        ]
      }
    ]
  };
  if ((suppliedParts && suppliedParts.length) || listino?.count) {
    const seen = new Set();
    const elements = [];
    for (const part of suppliedParts || []) {
      const key = String(part.part_number || '').toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      elements.push({
        '@type': 'ListItem',
        position: elements.length + 1,
        item: {
          '@type': 'Product',
          name: `${brand} ${part.part_number}`,
          sku: part.part_number,
          mpn: part.part_number,
          description: part.description || part.part_number,
          brand: { '@type': 'Brand', name: brand },
          offers: {
            '@type': 'Offer',
            url: pageUrl,
            availability: 'https://schema.org/InStock',
            seller: { '@id': `${BASE}/#organization` }
          }
        }
      });
    }
    for (const code of listino?.preview || []) {
      const key = String(code || '').toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      elements.push({
        '@type': 'ListItem',
        position: elements.length + 1,
        item: {
          '@type': 'Product',
          name: `${brand} ${code}`,
          sku: code,
          mpn: code,
          description: `${brand} ${code} – request a quote (no list price on site)`,
          brand: { '@type': 'Brand', name: brand },
          offers: {
            '@type': 'Offer',
            url: pageUrl,
            availability: 'https://schema.org/InStock',
            seller: { '@id': `${BASE}/#organization` }
          }
        }
      });
    }
    graph['@graph'].push({
      '@type': 'ItemList',
      '@id': pageUrl + '#quotable-parts',
      name: listino?.count
        ? `${brand} – searchable manufacturer part codes`
        : `${brand} – quotable part numbers`,
      description: (listino?.count
        ? (tDe.brand_parts_listino_intro || tDe.brand_parts_intro)
        : tDe.brand_parts_intro
      ).replace(/<[^>]+>/g, ''),
      numberOfItems: listino?.count || suppliedParts.length,
      url: pageUrl,
      itemListElement: elements.slice(0, 50)
    });
  }
  return JSON.stringify(graph);
}

function buildQuoteModalHtml() {
  return `
  <div id="quoteModal" class="quote-modal" hidden>
    <div class="quote-modal-backdrop" data-close-modal></div>
    <div class="quote-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="quoteModalTitle">
      <button type="button" class="quote-modal-close" data-close-modal data-i18n-aria="quote_modal_close" aria-label="Schließen">&times;</button>
      <h2 id="quoteModalTitle" data-i18n="quote_modal_title">Unverbindliche Anfrage</h2>
      <p class="quote-modal-part"><span data-i18n="quote_modal_part_label">Teilenummer</span>: <strong id="quoteModalPart"></strong></p>
      <div class="quote-modal-iframe-wrap">
        <iframe id="quoteFormIframe" data-i18n-title="quote_iframe_title" title="Anfrageformular"></iframe>
      </div>
    </div>
  </div>`;
}

function buildSuppliedPartsHtml(brandParts) {
  if (!brandParts) return '';
  const suppliedParts = brandParts.parts || [];
  const listino = brandParts.listino;
  if (!suppliedParts.length && !listino?.count) return '';

  const compact = suppliedParts.length
    ? suppliedParts.every((part) => !part.description || part.description === part.part_number)
    : true;
  const showInlineSearch = suppliedParts.length >= 12 && !listino?.count;

  const items = suppliedParts
    .map((part) => {
      const pn = escapeHtml(part.part_number);
      const pnAttr = escapeAttr(part.part_number);
      const searchKey = escapeAttr(String(part.part_number).toLowerCase());
      const desc =
        part.description && part.description !== part.part_number
          ? `<span class="part-desc">${escapeHtml(part.description)}</span>`
          : '';
      const caseLink = part.case_slug
        ? `<a class="part-case-link" href="../casi/${escapeAttr(part.case_slug)}.html" data-i18n="brand_parts_case">Erfolgsgeschichte</a>`
        : '';
      return `<li class="part-row" data-part-search="${searchKey}"><button type="button" class="part-quote-btn" data-part="${pnAttr}" title="${pnAttr}">${pn}</button>${desc}${caseLink}</li>`;
    })
    .join('\n          ');

  const inlineSearchHtml = showInlineSearch
    ? `<div class="parts-toolbar">
        <label class="parts-search-label" for="partsSearchInput"><span class="visually-hidden" data-i18n="brand_parts_search">Teilenummer suchen…</span></label>
        <input type="search" id="partsSearchInput" class="parts-search-input" data-i18n-placeholder="brand_parts_search" placeholder="Teilenummer suchen…" autocomplete="off">
        <span class="parts-count" id="partsCountLabel">${suppliedParts.length} <span data-i18n="brand_parts_count">codes</span></span>
      </div>
      <p class="parts-empty" id="partsEmpty" hidden data-i18n="brand_parts_empty">Keine Treffer</p>`
    : '';

  const listinoPreview = listino?.preview || [];
  const listinoExamples = listino?.examples || [];

  const sampleListHtml = listinoPreview.length
    ? `<div class="listino-sample" id="listinoSample">
        <h3 class="parts-sample-title" data-i18n="brand_parts_sample_title">Beispiel-Artikel (Auswahl)</h3>
        <p class="parts-intro parts-sample-intro" data-i18n="brand_parts_sample_intro">Kleine Liste aus dem Katalog — klicken Sie einen Code, um anzufragen. Weitere Codes über die Suche oben.</p>
        <ul class="brand-parts-list parts-compact-list" id="listinoSampleList">
          ${listinoPreview
            .map((code) => {
              const pn = escapeHtml(code);
              const pnAttr = escapeAttr(code);
              return `<li><button type="button" class="part-quote-btn" data-part="${pnAttr}" title="${pnAttr}">${pn}</button></li>`;
            })
            .join('\n          ')}
        </ul>
      </div>`
    : '';

  const examplesHtml = listinoExamples.length
    ? `<div class="listino-examples" id="listinoExamples">
        <p class="parts-examples-label" data-i18n="brand_parts_examples_label">Suchbeispiele (klicken zum Ausprobieren):</p>
        <div class="parts-example-chips" role="group" aria-label="Search examples">
          ${listinoExamples
            .map((ex) => {
              const v = escapeHtml(ex);
              const a = escapeAttr(ex);
              return `<button type="button" class="parts-example-chip" data-listino-example="${a}">${v}</button>`;
            })
            .join('\n          ')}
        </div>
      </div>`
    : '';

  const listinoHtml = listino?.count
    ? `<div class="listino-search" id="listinoSearch" data-listino-src="../${escapeAttr(listino.file)}" data-listino-count="${listino.count}">
        <p class="parts-intro" data-i18n="brand_parts_listino_intro">Herstellerliste: suchen Sie eine Teilenummer und fordern Sie ein unverbindliches Angebot an. Es werden keine Preise angezeigt.</p>
        <div class="parts-toolbar">
          <label class="parts-search-label" for="listinoSearchInput"><span class="visually-hidden" data-i18n="brand_parts_search">Teilenummer suchen…</span></label>
          <input type="search" id="listinoSearchInput" class="parts-search-input" data-i18n-placeholder="brand_parts_search" placeholder="Teilenummer suchen…" autocomplete="off" enterkeyhint="search">
          <span class="parts-count" id="listinoCountLabel">${listino.count} <span data-i18n="brand_parts_count">codes</span></span>
        </div>
        ${examplesHtml}
        <p class="parts-hint" data-i18n="brand_parts_search_hint">Mindestens 3 Zeichen eingeben, dann auf einen Code klicken, um anzufragen.</p>
        <p class="parts-empty" id="listinoEmpty" hidden data-i18n="brand_parts_empty">Keine Treffer</p>
        <p class="parts-type-more" id="listinoTypeMore" data-i18n="brand_parts_type_more">Bitte mindestens 3 Zeichen eingeben…</p>
        <ul class="brand-parts-list parts-compact-list" id="listinoResults"></ul>
        ${sampleListHtml}
        <noscript>
          <p class="parts-intro">${escapeHtml((listinoPreview.length ? listinoPreview : []).join(', '))}</p>
        </noscript>
      </div>`
    : '';

  const inlineList = suppliedParts.length
    ? `${inlineSearchHtml}
        <ul class="brand-parts-list" id="brandPartsList">
          ${items}
        </ul>`
    : '';

  return `
      <section class="brand-supplied-parts${compact ? ' parts-compact' : ''}" id="quotable-parts" aria-labelledby="brand-parts-heading">
        <h2 id="brand-parts-heading" data-i18n="brand_parts_title">Diese Teilenummern anfragen</h2>
        <p class="parts-intro" data-i18n="brand_parts_intro">Codes zur Anfrage. Keine Preise auf der Seite.</p>
        ${inlineList}
        ${listinoHtml}
      </section>`;
}

function buildHtml(brand, slug, translations, relatedRows, brandParts) {
  const pagePath = `marche/${slug}.html`;
  const pageUrl = `${BASE}/${pagePath}`;
  const tEn = translations.en;
  const d = translations.de;
  const suppliedParts = brandParts?.parts || [];
  const listino = brandParts?.listino || null;
  const hasSuppliedParts = suppliedParts.length > 0 || !!(listino && listino.count);
  const ld = buildLdJson(brand, slug, d, suppliedParts, listino);
  const translationsJson = JSON.stringify(translations);
  const brandJson = JSON.stringify(brand);
  const suppliedPartsHtml = buildSuppliedPartsHtml(brandParts);
  const quoteModalHtml = hasSuppliedParts ? buildQuoteModalHtml() : '';
  const suppliedPartsExtraCss = hasSuppliedParts ? `
    .part-quote-btn { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 0.92rem; font-weight: 700; color: #1e3a5f; background: #fff; border: 2px solid #e67e22; border-radius: 8px; padding: 0.35rem 0.65rem; cursor: pointer; }
    .part-quote-btn:hover, .part-quote-btn:focus { color: #fff; background: #e67e22; outline: none; }
    .parts-toolbar { display: flex; flex-wrap: wrap; gap: 0.65rem; align-items: center; margin-bottom: 0.85rem; }
    .parts-search-input { flex: 1; min-width: 180px; padding: 0.55rem 0.75rem; border: 1px solid #c5d4e3; border-radius: 8px; font-size: 0.95rem; }
    .parts-search-input:focus { outline: 2px solid #e67e22; border-color: #e67e22; }
    .parts-count { font-size: 0.85rem; color: #556; white-space: nowrap; }
    .parts-empty, .parts-hint, .parts-type-more { font-size: 0.9rem; color: #666; margin: 0 0 0.75rem; }
    .listino-search { margin-top: 0.5rem; }
    .listino-examples { margin: 0 0 0.85rem; }
    .parts-examples-label { font-size: 0.88rem; color: #445; margin: 0 0 0.4rem; }
    .parts-example-chips { display: flex; flex-wrap: wrap; gap: 0.4rem; }
    .parts-example-chip { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 0.85rem; font-weight: 600; color: #2d5a87; background: #fff; border: 1px solid #b8c9dc; border-radius: 6px; padding: 0.3rem 0.55rem; cursor: pointer; }
    .parts-example-chip:hover, .parts-example-chip:focus { border-color: #e67e22; color: #e67e22; outline: none; }
    .listino-sample { margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid #d5e2ef; }
    .parts-sample-title { font-size: 1.05rem; color: #1e3a5f; margin: 0 0 0.35rem; font-weight: 700; }
    .parts-sample-intro { margin-bottom: 0.75rem !important; }
    .brand-parts-list { max-height: min(520px, 60vh); overflow: auto; padding-right: 0.25rem; }
    #listinoSampleList { max-height: none; overflow: visible; }
    .brand-supplied-parts.parts-compact .brand-parts-list,
    .parts-compact-list { display: flex; flex-direction: row; flex-wrap: wrap; gap: 0.45rem; }
    .brand-supplied-parts.parts-compact .brand-parts-list li,
    .parts-compact-list li { padding: 0; background: transparent; border: none; border-radius: 0; }
    .visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }
    .quote-modal[hidden] { display: none !important; }
    .quote-modal { position: fixed; inset: 0; z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 1rem; }
    .quote-modal-backdrop { position: absolute; inset: 0; background: rgba(30, 58, 95, 0.55); }
    .quote-modal-dialog { position: relative; z-index: 1; width: min(720px, 100%); max-height: calc(100vh - 2rem); overflow: auto; background: #fff; border-radius: 12px; box-shadow: 0 16px 48px rgba(0,0,0,0.25); padding: 1.25rem 1.25rem 1rem; }
    .quote-modal-dialog h2 { font-size: 1.2rem; color: #1e3a5f; margin-bottom: 0.35rem; padding-right: 2rem; }
    .quote-modal-part { font-size: 0.92rem; color: #444; margin-bottom: 0.85rem; }
    .quote-modal-part strong { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; color: #1e3a5f; }
    .quote-modal-close { position: absolute; top: 0.65rem; right: 0.75rem; border: none; background: transparent; font-size: 1.75rem; line-height: 1; color: #666; cursor: pointer; }
    .quote-modal-close:hover { color: #e67e22; }
    .quote-modal-iframe-wrap { border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; }
    .quote-modal-iframe-wrap iframe { width: 100%; height: min(900px, 70vh); border: none; display: block; }
    body.quote-modal-open { overflow: hidden; }` : '';
  const partsJson = JSON.stringify(suppliedParts.map((p) => p.part_number));
  const relatedLinks = (relatedRows || [])
    .map(({ brand: relatedBrand, slug: relatedSlug }) =>
      `<li><a href="../marche/${relatedSlug}.html">${escapeHtml(relatedBrand)}</a></li>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title id="pageTitle">${escapeHtml(translations.de.meta_title)}</title>
  <meta id="pageDescription" name="description" content="${escapeAttr(translations.de.meta_description)}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <link rel="canonical" href="${pageUrl}">
  <link rel="alternate" type="text/plain" href="${BASE}/llms.txt" title="Site summary for AI assistants">
  <link rel="alternate" hreflang="x-default" href="${pageUrl}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:title" content="${escapeAttr(d.meta_title)}">
  <meta property="og:description" content="${escapeAttr(d.meta_description)}">
  <meta property="og:image" content="${BASE}/logo.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="ABCspareparts">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeAttr(d.meta_title)}">
  <meta name="twitter:description" content="${escapeAttr(d.meta_description)}">
  <meta name="twitter:image" content="${BASE}/logo.png">
  <script type="application/ld+json">${ld}</script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 1100px; margin: 0 auto; padding: 0 1.5rem; }
    .language-selector { position: fixed; top: 1rem; right: 1rem; z-index: 1000; }
    .language-selector select { padding: 0.5rem 2rem 0.5rem 0.75rem; font-size: 0.9rem; border: 1px solid #ddd; border-radius: 6px; background: #fff; cursor: pointer; }
    .page-hero { background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); color: #fff; padding: 2.5rem 1.5rem 2rem; }
    .breadcrumb { font-size: 0.9rem; opacity: 0.95; margin-bottom: 1rem; }
    .breadcrumb a { color: #e67e22; text-decoration: none; font-weight: 600; }
    .breadcrumb a:hover { text-decoration: underline; }
    .page-hero h1 { font-size: clamp(1.35rem, 4vw, 2rem); line-height: 1.3; margin-bottom: 0.75rem; word-wrap: break-word; }
    .page-hero .lead { max-width: 720px; font-size: 1.05rem; opacity: 0.95; }
    .page-hero .lead.lead-extra { margin-top: 0.7rem; font-size: 0.98rem; line-height: 1.6; }
    .page-hero .lead a { color: #e67e22; font-weight: 600; text-decoration: none; border-bottom: 1px solid rgba(230, 126, 34, 0.5); }
    .page-hero .lead a:hover { text-decoration: underline; border-bottom-color: #fff; }
    .page-hero .lead.lead-top-brand { margin-top: 0.9rem; padding: 0.75rem 0.9rem; max-width: 720px; font-size: 0.95rem; line-height: 1.55; background: rgba(0,0,0,0.12); border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); }
    .brand-body { padding: 2rem 1.5rem 1rem; }
    .brand-form-hint { max-width: 720px; margin: 0 auto 1rem; color: #555; font-size: 0.98rem; text-align: center; }
    .brand-email-alt { max-width: 720px; margin: 0 auto 2rem; text-align: center; font-size: 0.95rem; color: #444; }
    .brand-email-alt a { color: #1e3a5f; font-weight: 600; }
    .related-brands { max-width: 820px; margin: 0 auto 2rem; padding: 1rem 1.1rem; border: 1px solid #e6eaf0; border-radius: 10px; background: #f9fbfe; }
    .related-brands h2 { font-size: 1.15rem; color: #1e3a5f; margin-bottom: 0.35rem; }
    .related-brands p { font-size: 0.92rem; color: #556; margin-bottom: 0.7rem; }
    .related-brands ul { list-style: none; display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 0.4rem 1rem; }
    .related-brands a { color: #1e3a5f; text-decoration: none; font-weight: 600; border-bottom: 1px solid #c5d4e3; }
    .related-brands a:hover { color: #e67e22; border-bottom-color: #e67e22; }
    .brand-faq { max-width: 820px; margin: 0 auto 2.25rem; padding: 1.2rem 1.15rem; border: 1px solid #e3eaf1; border-radius: 10px; background: #f6f9fc; }
    .brand-faq h2 { font-size: 1.2rem; color: #1e3a5f; margin-bottom: 0.9rem; }
    .brand-faq .faq-item { margin-bottom: 0.95rem; }
    .brand-faq h3 { font-size: 0.98rem; color: #1e3a5f; margin: 0 0 0.3rem; font-weight: 600; }
    .brand-faq p { margin: 0; font-size: 0.92rem; color: #444; line-height: 1.55; }
    .brand-supplied-parts { max-width: 820px; margin: 0 auto 2rem; padding: 1.2rem 1.15rem; border: 1px solid #dce8f4; border-radius: 10px; background: #f0f6fb; }
    .brand-supplied-parts h2 { font-size: 1.2rem; color: #1e3a5f; margin-bottom: 0.5rem; }
    .brand-supplied-parts .parts-intro { font-size: 0.92rem; color: #445; margin-bottom: 1rem; line-height: 1.55; }
    .brand-parts-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.65rem; }
    .brand-parts-list li { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.35rem 0.75rem; padding: 0.55rem 0.65rem; background: #fff; border: 1px solid #e3eaf1; border-radius: 8px; }
    .part-desc { font-size: 0.88rem; color: #556; flex: 1; min-width: 120px; }
    .part-case-link { font-size: 0.85rem; color: #2d5a87; text-decoration: none; font-weight: 600; white-space: nowrap; }
    .part-case-link:hover { text-decoration: underline; }
${suppliedPartsExtraCss}
    .muted { color: #666; font-weight: 400; }
    .contact-lead { text-align: center; max-width: 640px; margin: 0 auto 2rem; color: #555; font-size: 1.05rem; line-height: 1.55; }
    .contact-layout { display: grid; grid-template-columns: minmax(280px, 380px) 1fr; gap: 2.5rem; align-items: start; max-width: 1100px; margin: 0 auto; }
    @media (max-width: 900px) { .contact-layout { grid-template-columns: 1fr; } }
    .contact-info-card { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 10px; padding: 1.75rem 1.5rem; }
    .contact-info-card h3 { font-size: 1.2rem; color: #1e3a5f; margin-bottom: 1rem; }
    .contact-info-card h4 { font-size: 0.95rem; color: #1e3a5f; margin: 1.25rem 0 0.5rem; }
    .contact-address { font-style: normal; color: #444; line-height: 1.65; margin-bottom: 1rem; font-size: 0.95rem; }
    .contact-channels, .contact-hours { list-style: none; margin: 0; padding: 0; font-size: 0.95rem; }
    .contact-channels li, .contact-hours li { margin-bottom: 0.45rem; color: #444; line-height: 1.5; }
    .contact-channels a { color: #1e3a5f; font-weight: 600; text-decoration: none; border-bottom: 1px solid #2d5a87; }
    .contact-channels a:hover { color: #e67e22; border-bottom-color: #e67e22; }
    .contact-legal-note { margin-top: 1.25rem; font-size: 0.88rem; color: #666; line-height: 1.5; }
    .contact-legal-note a { color: #1e3a5f; text-decoration: underline; }
    .section-contact { padding: 1rem 1.5rem 3rem; }
    .section-contact > .container > h2 { text-align: center; margin-bottom: 1rem; font-size: 1.75rem; color: #1e3a5f; }
    .contact-form-wrap h3 { font-size: 1.15rem; color: #1e3a5f; margin-bottom: 1rem; text-align: center; }
    .contact-iframe-wrap { max-width: 700px; margin: 0 auto; border-radius: 8px; overflow: hidden; border: 1px solid #e0e0e0; }
    .contact-iframe-wrap iframe { width: 100%; height: 1050px; border: none; display: block; }
${FOOTER_CSS}
  </style>
</head>
<body>
  <div class="language-selector">
    <select id="languageSelect">
      <option value="de">🇩🇪 Deutsch</option>
      <option value="en">🇬🇧 English</option>
      <option value="it">🇮🇹 Italiano</option>
      <option value="es">🇪🇸 Español</option>
      <option value="fr">🇫🇷 Français</option>
    </select>
  </div>

  <header class="page-hero">
    <div class="container">
      <nav class="breadcrumb" data-i18n="brand_breadcrumb" aria-label="Breadcrumb">${d.brand_breadcrumb}</nav>
      <h1 data-i18n="brand_h1">${d.brand_h1}</h1>
      <p class="lead" data-i18n="brand_intro">${d.brand_intro}</p>
      <p class="lead lead-extra" data-i18n="brand_intro_p2">${d.brand_intro_p2}</p>
${d.brand_top_extra ? `      <p class="lead lead-top-brand" data-i18n="brand_top_extra">${escapeHtml(d.brand_top_extra)}</p>
` : ''}    </div>
  </header>

  <main id="main-content">
  <div class="brand-body">
    <div class="container">
      <p class="brand-form-hint" data-i18n="brand_form_hint">${d.brand_form_hint}</p>
      <p class="brand-email-alt" data-i18n="brand_email_alt">${d.brand_email_alt}</p>
${suppliedPartsHtml}
      <section class="related-brands" aria-label="Related brands">
        <h2 data-i18n="related_title">${escapeHtml(d.related_title)}</h2>
        <p data-i18n="related_intro">${escapeHtml(d.related_intro)}</p>
        <ul>
          ${relatedLinks}
        </ul>
      </section>
      <section class="brand-faq" id="marken-faq" aria-labelledby="brand-faq-heading">
        <h2 id="brand-faq-heading" data-i18n="brand_faq_title">${escapeHtml(d.brand_faq_title)}</h2>
        <div class="faq-item">
          <h3 data-i18n="brand_faq_q1">${d.brand_faq_q1}</h3>
          <p data-i18n="brand_faq_a1">${d.brand_faq_a1}</p>
        </div>
        <div class="faq-item">
          <h3 data-i18n="brand_faq_q2">${d.brand_faq_q2}</h3>
          <p data-i18n="brand_faq_a2">${d.brand_faq_a2}</p>
        </div>
        <div class="faq-item">
          <h3 data-i18n="brand_faq_q3">${d.brand_faq_q3}</h3>
          <p data-i18n="brand_faq_a3">${d.brand_faq_a3}</p>
        </div>
      </section>
    </div>
  </div>

  <section class="section-contact" id="contact">
    <div class="container">
      <h2 data-i18n="contact_title">${escapeHtml(d.contact_title)}</h2>
      <p class="contact-lead" data-i18n="contact_intro">${escapeHtml(d.contact_intro)}</p>
      <div class="contact-layout">
        <aside class="contact-info-card" aria-labelledby="contact-info-heading">
          <h3 id="contact-info-heading" data-i18n="contact_info_title">${escapeHtml(d.contact_info_title)}</h3>
          <address class="contact-address" data-i18n="contact_address">${d.contact_address}</address>
          <ul class="contact-channels" data-i18n="contact_channels">${d.contact_channels}</ul>
          <h4 data-i18n="contact_hours_title">${escapeHtml(d.contact_hours_title)}</h4>
          <ul class="contact-hours" data-i18n="contact_hours">${d.contact_hours}</ul>
          <p class="contact-legal-note" data-i18n="contact_legal_note">${d.contact_legal_note}</p>
        </aside>
        <div class="contact-form-wrap">
          <h3 data-i18n="contact_form_title">${escapeHtml(d.contact_form_title)}</h3>
          <div class="contact-iframe-wrap">
            <iframe id="contactFormIframe" src="https://erp.abcspareparts.eu/lead-request/new" data-i18n-title="contact_iframe_title" title="${escapeAttr(d.contact_iframe_title)}"></iframe>
          </div>
        </div>
      </div>
    </div>
  </section>
  </main>
${quoteModalHtml}

${buildFooterHtml('../')}

  <script>
  (function () {
    var BRAND = ${brandJson};
    var translations = ${translationsJson};
    var SELECTED_PART = '';

    var pages = ['index.html', 'marche.html', 'casi.html', 'impressum.html', 'datenschutz.html', 'agb.html', 'versand.html', 'cookies.html'];

    function isLangInternalPage(base) {
      if (pages.indexOf(base) !== -1) return true;
      if (/^marche\\/[^/]+\\.html$/i.test(base)) return true;
      if (/^casi\\/[^/]+\\.html$/i.test(base)) return true;
      return false;
    }

    function getLangFromUrl() {
      var p = new URLSearchParams(window.location.search);
      var l = p.get('lang');
      return l && ['de', 'en', 'it', 'es', 'fr'].indexOf(l) !== -1 ? l : null;
    }
    function getCurrentLang() {
      return getLangFromUrl() || (typeof localStorage !== 'undefined' && localStorage.getItem('lang')) || (navigator.language && navigator.language.split('-')[0]) || 'de';
    }
    function updateLinksWithLang(lang) {
      // Keep language in localStorage only — do not append ?lang= to every link.
      // Query variants were flooding GSC as "Alternate page with proper canonical".
      try { localStorage.setItem('lang', lang); } catch (e) {}
      document.querySelectorAll('a[href]').forEach(function (a) {
        var h = a.getAttribute('href') || '';
        if (h.indexOf('#') === 0 || h.indexOf('mailto:') === 0 || h.indexOf('tel:') === 0 || h.indexOf('https://wa.me') === 0) return;
        if (h.indexOf('http://') === 0 || h.indexOf('https://') === 0) return;
        var parts = h.split('#');
        var pathNoQuery = parts[0].split('?')[0];
        var relPrefix = '';
        var base = pathNoQuery;
        if (pathNoQuery.indexOf('../') === 0) {
          var strip = 0;
          while (pathNoQuery.slice(strip, strip + 3) === '../') strip += 3;
          relPrefix = pathNoQuery.slice(0, strip);
          base = pathNoQuery.slice(strip);
        }
        if (isLangInternalPage(base)) {
          a.href = relPrefix + base + (parts[1] ? '#' + parts[1] : '');
        }
      });
    }
    function getUrlPart() {
      var p = new URLSearchParams(window.location.search);
      var fromQuery = p.get('part');
      if (fromQuery) return fromQuery;
      var hash = (window.location.hash || '').replace(/^#/, '');
      if (hash.indexOf('quote=') === 0) {
        try { return decodeURIComponent(hash.slice(6)); } catch (e) { return hash.slice(6); }
      }
      return '';
    }
    function setQuoteDeepLink(code) {
      try {
        if (!history.replaceState) return;
        var u = new URL(window.location.href);
        u.searchParams.delete('part');
        u.searchParams.delete('lang');
        var path = u.pathname + (u.search || '');
        history.replaceState(null, '', code ? path + '#quote=' + encodeURIComponent(code) : path);
      } catch (err) {}
    }
    function buildIframeSrc(langCode, partNumber) {
      var lang = langCode || 'en';
      var url = 'https://erp.abcspareparts.eu/lead-request/new?_lang=' + encodeURIComponent(lang) + '&custom_manufacturer=' + encodeURIComponent(BRAND);
      var part = partNumber || SELECTED_PART || getUrlPart() || '';
      if (part) url += '&custom_part_numbers=' + encodeURIComponent(part);
      return url;
    }
    function updateFormIframeLang(langCode, partNumber) {
      var iframe = document.getElementById('contactFormIframe');
      if (!iframe) return;
      iframe.src = buildIframeSrc(langCode, partNumber);
    }
${hasSuppliedParts ? `    var quoteModal = document.getElementById('quoteModal');
    var quoteIframe = document.getElementById('quoteFormIframe');
    var quoteModalPart = document.getElementById('quoteModalPart');
    function openQuoteModal(part, lang) {
      if (!quoteModal) return;
      var code = part || SELECTED_PART || getUrlPart() || '';
      SELECTED_PART = code;
      if (quoteModalPart) quoteModalPart.textContent = code;
      if (quoteIframe) quoteIframe.src = buildIframeSrc(lang, code);
      quoteModal.removeAttribute('hidden');
      document.body.classList.add('quote-modal-open');
      setQuoteDeepLink(code);
    }
    function closeQuoteModal() {
      if (!quoteModal) return;
      quoteModal.setAttribute('hidden', '');
      document.body.classList.remove('quote-modal-open');
      if (quoteIframe) quoteIframe.src = 'about:blank';
    }
    function initPartQuoteButtons() {
      document.querySelectorAll('.part-quote-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var langSel = document.getElementById('languageSelect');
          var lang = langSel ? langSel.value : 'de';
          openQuoteModal(btn.getAttribute('data-part') || '', lang);
        });
      });
      document.querySelectorAll('[data-close-modal]').forEach(function (el) {
        el.addEventListener('click', closeQuoteModal);
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && quoteModal && !quoteModal.hasAttribute('hidden')) closeQuoteModal();
      });
    }
    function initPartsSearch() {
      var input = document.getElementById('partsSearchInput');
      if (!input) return;
      var rows = document.querySelectorAll('#brandPartsList .part-row');
      var empty = document.getElementById('partsEmpty');
      var countLabel = document.getElementById('partsCountLabel');
      function applyFilter() {
        var q = (input.value || '').trim().toLowerCase().replace(/\\s+/g, '');
        var visible = 0;
        rows.forEach(function (row) {
          var key = (row.getAttribute('data-part-search') || '').replace(/\\s+/g, '');
          var show = !q || key.indexOf(q) !== -1;
          row.hidden = !show;
          if (show) visible++;
        });
        if (empty) empty.hidden = visible !== 0;
        if (countLabel) {
          var unit = countLabel.querySelector('[data-i18n=\"brand_parts_count\"]');
          countLabel.childNodes[0].nodeValue = visible + ' ';
          if (!unit) countLabel.textContent = visible + '';
        }
      }
      input.addEventListener('input', applyFilter);
    }
    function initListinoSearch() {
      var box = document.getElementById('listinoSearch');
      if (!box) return;
      var src = box.getAttribute('data-listino-src');
      var input = document.getElementById('listinoSearchInput');
      var results = document.getElementById('listinoResults');
      var empty = document.getElementById('listinoEmpty');
      var typeMore = document.getElementById('listinoTypeMore');
      var countLabel = document.getElementById('listinoCountLabel');
      var total = parseInt(box.getAttribute('data-listino-count') || '0', 10) || 0;
      var codes = null;
      var loading = false;
      var MAX_SHOW = 40;
      function escapeHtmlLocal(s) {
        return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;');
      }
      function render(matches, q) {
        results.innerHTML = '';
        matches.slice(0, MAX_SHOW).forEach(function (code) {
          var li = document.createElement('li');
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'part-quote-btn';
          btn.setAttribute('data-part', code);
          btn.title = code;
          btn.textContent = code;
          btn.addEventListener('click', function () {
            var langSel = document.getElementById('languageSelect');
            var lang = langSel ? langSel.value : 'de';
            openQuoteModal(code, lang);
          });
          li.appendChild(btn);
          results.appendChild(li);
        });
        if (empty) empty.hidden = !(q && matches.length === 0);
        if (typeMore) typeMore.hidden = !!q;
        if (countLabel) {
          var unit = countLabel.querySelector('[data-i18n=\"brand_parts_count\"]');
          var shown = matches.length ? Math.min(matches.length, MAX_SHOW) + (matches.length > MAX_SHOW ? '+' : '') : total;
          countLabel.childNodes[0].nodeValue = shown + ' ';
          if (!unit) countLabel.textContent = String(shown);
        }
      }
      function searchNow() {
        var q = (input.value || '').trim().toLowerCase().replace(/\\s+/g, '');
        if (q.length < 3) {
          render([], '');
          if (typeMore) typeMore.hidden = false;
          if (empty) empty.hidden = true;
          return;
        }
        if (!codes) return;
        var matches = [];
        for (var i = 0; i < codes.length; i++) {
          var c = codes[i];
          if (String(c).toLowerCase().replace(/\\s+/g, '').indexOf(q) !== -1) {
            matches.push(c);
            if (matches.length >= 200) break;
          }
        }
        render(matches, q);
      }
      function ensureLoaded(cb) {
        if (codes) { cb(); return; }
        if (loading) return;
        loading = true;
        fetch(src).then(function (r) { return r.json(); }).then(function (data) {
          codes = data.codes || [];
          total = data.count || codes.length;
          loading = false;
          cb();
        }).catch(function () {
          loading = false;
          if (empty) { empty.hidden = false; empty.textContent = 'Catalog load error'; }
        });
      }
      if (input) {
        input.addEventListener('input', function () {
          var q = (input.value || '').trim();
          if (q.length < 3) { searchNow(); return; }
          ensureLoaded(searchNow);
        });
        input.addEventListener('focus', function () { ensureLoaded(function () {}); });
      }
      box.querySelectorAll('[data-listino-example]').forEach(function (chip) {
        chip.addEventListener('click', function () {
          if (!input) return;
          input.value = chip.getAttribute('data-listino-example') || '';
          input.focus();
          ensureLoaded(searchNow);
        });
      });
      // Deep-link ?part=CODE opens modal even for listino-only pages
      var urlPart = getUrlPart();
      if (urlPart) {
        ensureLoaded(function () {
          var hit = codes && codes.some(function (c) { return String(c).toLowerCase() === String(urlPart).toLowerCase(); });
          if (hit || true) {
            // Always allow quote for typed part on brand page
          }
        });
      }
    }` : ''}
    function changeLanguage(lang) {
      var t = translations[lang] || translations.de;
      var pt = document.getElementById('pageTitle');
      var pd = document.getElementById('pageDescription');
      if (t.meta_title && pt) pt.textContent = t.meta_title;
      if (t.meta_description && pd) pd.setAttribute('content', t.meta_description);
      document.querySelectorAll('[data-i18n]').forEach(function (el) {
        var k = el.getAttribute('data-i18n');
        if (t[k]) el.innerHTML = t[k];
      });
      document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
        var k = el.getAttribute('data-i18n-title');
        if (t[k]) el.setAttribute('title', t[k]);
      });
      document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
        var k = el.getAttribute('data-i18n-aria');
        if (t[k]) el.setAttribute('aria-label', t[k]);
      });
      document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
        var k = el.getAttribute('data-i18n-placeholder');
        if (t[k]) el.setAttribute('placeholder', t[k]);
      });
      document.documentElement.lang = lang;
      try { localStorage.setItem('lang', lang); } catch (e) {}
      updateLinksWithLang(lang);
      updateFormIframeLang(lang, SELECTED_PART || getUrlPart());
${hasSuppliedParts ? `      if (quoteModal && !quoteModal.hasAttribute('hidden') && quoteIframe) {
        var activePart = quoteModalPart ? quoteModalPart.textContent : '';
        quoteIframe.src = buildIframeSrc(lang, activePart);
      }` : ''}
    }

    document.addEventListener('DOMContentLoaded', function () {
      var raw = getCurrentLang();
      var lang = ['de', 'en', 'it', 'es', 'fr'].indexOf(raw) !== -1 ? raw : 'de';
      var sel = document.getElementById('languageSelect');
      if (sel) sel.value = lang;
      var initialPart = getUrlPart();
      if (initialPart) SELECTED_PART = initialPart;
      changeLanguage(lang);
${hasSuppliedParts ? `      initPartQuoteButtons();
      initPartsSearch();
      initListinoSearch();
      if (initialPart) {
        setTimeout(function () { openQuoteModal(initialPart, lang); }, 200);
      }` : ''}
      if (sel) sel.addEventListener('change', function () { changeLanguage(this.value); });
    });
  })();
  </script>
</body>
</html>
`;
}

function writeSitemapBrands(rows, partsBySlug) {
  const outPath = path.join(ROOT, 'sitemap-brands.xml');
  let body = '';
  for (const { slug } of rows) {
    const loc = `${BASE}/marche/${slug}.html`;
    const hasParts = partsBySlug && partsBySlug.has(slug);
    body += '  <url>\n';
    body += `    <loc>${loc}</loc>\n`;
    body += `    <lastmod>${TODAY}</lastmod>\n`;
    body += `    <changefreq>${hasParts ? 'weekly' : 'monthly'}</changefreq>\n`;
    body += `    <priority>${hasParts ? '0.8' : '0.65'}</priority>\n`;
    body += '  </url>\n';
  }
  const xml = `---
layout: none
---
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}</urlset>
`;
  fs.writeFileSync(outPath, xml, 'utf8');
}

function writeSitemapIndex() {
  // Keep listino shard sitemaps in the index (do not overwrite with a partial list).
  const { writeSitemapIndex: writeFullSitemapIndex, updateRobotsTxt } = require('./build-brand-parts.js');
  writeFullSitemapIndex();
  updateRobotsTxt();
}

function parseOnlySlugs(argv) {
  const only = [];
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--only' && argv[i + 1]) {
      only.push(...String(argv[++i]).split(',').map((s) => s.trim()).filter(Boolean));
    } else if (a.startsWith('--only=')) {
      only.push(...a.slice('--only='.length).split(',').map((s) => s.trim()).filter(Boolean));
    }
  }
  return [...new Set(only.map((s) => s.toLowerCase()))];
}

function main() {
  const onlySlugs = parseOnlySlugs(process.argv);
  const brands = readBrandsFromIndex();
  const rows = assignUniqueSlugs(brands);
  const partsBySlug = loadPartsBySlug();
  const targetRows = onlySlugs.length
    ? rows.filter((r) => onlySlugs.includes(r.slug))
    : rows;

  if (onlySlugs.length && !targetRows.length) {
    throw new Error(`No matching brand slugs for --only=${onlySlugs.join(',')}`);
  }

  fs.mkdirSync(MARCHE_DIR, { recursive: true });
  if (!onlySlugs.length && fs.existsSync(MARCHE_DIR)) {
    for (const name of fs.readdirSync(MARCHE_DIR)) {
      if (!name.endsWith('.html')) continue;
      const full = path.join(MARCHE_DIR, name);
      const content = fs.readFileSync(full, 'utf8');
      // Preserve noindex redirect stubs for removed brands (GSC / old bookmarks).
      if (content.includes('<!-- brand-redirect-stub -->')) continue;
      fs.unlinkSync(full);
    }
  }

  let n = 0;
  for (let i = 0; i < rows.length; i++) {
    const { brand, slug } = rows[i];
    if (onlySlugs.length && !onlySlugs.includes(slug)) continue;

    const relatedRows = [];
    for (let step = 1; step <= 3; step++) {
      const left = rows[i - step];
      const right = rows[i + step];
      if (left) relatedRows.push(left);
      if (right) relatedRows.push(right);
    }
    const translations = buildTranslations(brand);
    mergeTopBrandContent(translations, slug);
    const brandParts = partsBySlug.get(slug) || null;
    if (brandParts?.parts?.length) enrichMetaWithParts(translations, brandParts.parts);
    else if (brandParts?.listino?.count) {
      const sample = (brandParts.listino.preview || []).slice(0, 3).join(', ');
      for (const lang of ['de', 'en', 'it', 'es', 'fr']) {
        const base = String(translations[lang].meta_description || '');
        const note = {
          de: ` z. B. ${sample}. ${brandParts.listino.count}+ Codes suchbar — Anfrage ohne Preise.`,
          en: ` e.g. ${sample}. ${brandParts.listino.count}+ codes searchable — quote, no prices.`,
          it: ` es. ${sample}. ${brandParts.listino.count}+ codici cercabili — senza prezzi.`,
          es: ` p. ej. ${sample}. ${brandParts.listino.count}+ códigos — solicitud sin precios.`,
          fr: ` ex. ${sample}. ${brandParts.listino.count}+ références — devis sans prix.`
        }[lang];
        const budget = Math.max(40, MAX_META_LEN - note.length);
        const head = base.length > budget ? `${base.slice(0, budget - 1).trim()}…` : base;
        let meta = head + note;
        if (meta.length > MAX_META_LEN) meta = `${meta.slice(0, MAX_META_LEN - 1).trim()}…`;
        translations[lang].meta_description = meta;
      }
    }
    const html = buildHtml(brand, slug, translations, relatedRows, brandParts);
    fs.writeFileSync(path.join(MARCHE_DIR, slug + '.html'), html, 'utf8');
    n++;
    if (n % 500 === 0) console.log('Written', n, '/', targetRows.length);
  }

  if (!onlySlugs.length) {
    writeSitemapBrands(rows, partsBySlug);
    writeSitemapIndex();
    fs.writeFileSync(
      path.join(ROOT, 'brand-slugs.json'),
      JSON.stringify(rows.reduce((acc, { brand, slug }) => {
        acc[brand] = slug;
        return acc;
      }, {}), null, 0),
      'utf8'
    );
    console.log('sitemap-brands.xml, sitemap-index.xml and brand-slugs.json updated.');
  } else {
    console.log('Partial rebuild (--only): skipped full sitemap-brands rewrite.');
  }

  console.log('Brand pages:', n, onlySlugs.length ? `(only: ${onlySlugs.join(',')})` : '', 'in', path.relative(ROOT, MARCHE_DIR));
}

if (require.main === module) {
  main();
}
