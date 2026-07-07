'use strict';

const fs = require('fs');
const path = require('path');
const { assignUniqueSlugs } = require('./brand-slug.js');

const ROOT = __dirname;
const MARCHE_DIR = path.join(ROOT, 'marche');
const BASE = 'https://abcspareparts.eu';
const TODAY = new Date().toISOString().slice(0, 10);

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
      if (!row.brand_slug || !row.parts?.length) continue;
      map.set(row.brand_slug, row.parts);
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

  return {
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
      marca_footer_home: 'ABCspareparts',
      marca_footer_brands: 'Marken',
      marca_footer_imprint: 'Impressum',
      marca_footer_privacy: 'Datenschutz',
      brand_parts_title: 'Diese Teilenummern anfragen',
      brand_parts_intro: 'Diese Referenzen haben wir bereits für Kunden angeboten oder beschafft. Klicken Sie auf einen Code — das Anfrageformular öffnet sich in einem Fenster mit vorausgefüllter Marke und Teilenummer.',
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
      marca_footer_home: 'ABCspareparts',
      marca_footer_brands: 'Brands',
      marca_footer_imprint: 'Imprint',
      marca_footer_privacy: 'Privacy',
      brand_parts_title: 'Request these part numbers',
      brand_parts_intro: 'We have already quoted or supplied these references for customers across Europe. Click a part number to open the request form in a window with brand and code pre-filled.',
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
      marca_footer_home: 'ABCspareparts',
      marca_footer_brands: 'Marche',
      marca_footer_imprint: 'Impressum',
      marca_footer_privacy: 'Privacy',
      brand_parts_title: 'Richiedi questi codici articolo',
      brand_parts_intro: 'Queste referenze le abbiamo già quotate o fornite per clienti in Europa. Clicchi su un codice per aprire il modulo di richiesta in una finestra con marca e codice articolo già compilati.',
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
      marca_footer_home: 'ABCspareparts',
      marca_footer_brands: 'Marcas',
      marca_footer_imprint: 'Aviso legal',
      marca_footer_privacy: 'Privacidad',
      brand_parts_title: 'Solicitar estas referencias',
      brand_parts_intro: 'Estas referencias ya las hemos presupuestado o suministrado a clientes en Europa. Haga clic en un código para abrir el formulario de solicitud en una ventana con marca y referencia precargadas.',
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
      marca_footer_home: 'ABCspareparts',
      marca_footer_brands: 'Marques',
      marca_footer_imprint: 'Mentions légales',
      marca_footer_privacy: 'Confidentialité',
      brand_parts_title: 'Demander ces références',
      brand_parts_intro: 'Nous avons déjà chiffré ou fourni ces références pour des clients en Europe. Cliquez sur une référence pour ouvrir le formulaire de demande dans une fenêtre avec marque et code préremplis.',
      brand_parts_case: 'Histoire de réussite',
      brand_parts_quote: 'Demander un devis',
      quote_modal_title: 'Demande sans engagement',
      quote_modal_close: 'Fermer',
      quote_modal_part_label: 'Référence',
      quote_iframe_title: 'Formulaire de demande'
    }
  };
}

function buildLdJson(brand, slug, tDe, suppliedParts) {
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
  if (suppliedParts && suppliedParts.length) {
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
  if (suppliedParts && suppliedParts.length) {
    graph['@graph'].push({
      '@type': 'ItemList',
      '@id': pageUrl + '#quotable-parts',
      name: `${brand} – quotable part numbers`,
      description: tDe.brand_parts_intro.replace(/<[^>]+>/g, ''),
      numberOfItems: suppliedParts.length,
      itemListElement: suppliedParts.map((part, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Product',
          name: `${brand} ${part.part_number}`,
          sku: part.part_number,
          mpn: part.part_number,
          description: part.description || part.part_number,
          brand: { '@type': 'Brand', name: brand },
          offers: {
            '@type': 'Offer',
            url: `${pageUrl}?part=${encodeURIComponent(part.part_number)}#contact`,
            availability: 'https://schema.org/InStock',
            seller: { '@id': `${BASE}/#organization` }
          }
        }
      }))
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

function buildSuppliedPartsHtml(suppliedParts) {
  if (!suppliedParts || !suppliedParts.length) return '';
  const items = suppliedParts.map((part) => {
    const pn = escapeHtml(part.part_number);
    const pnAttr = escapeAttr(part.part_number);
    const desc = part.description && part.description !== part.part_number
      ? `<span class="part-desc">${escapeHtml(part.description)}</span>`
      : '';
    const caseLink = part.case_slug
      ? `<a class="part-case-link" href="../casi/${escapeAttr(part.case_slug)}.html" data-i18n="brand_parts_case">Erfolgsgeschichte</a>`
      : '';
    return `<li><button type="button" class="part-quote-btn" data-part="${pnAttr}" title="${pnAttr}">${pn}</button>${desc}${caseLink}</li>`;
  }).join('\n          ');
  return `
      <section class="brand-supplied-parts" id="supplied-parts" aria-labelledby="brand-parts-heading">
        <h2 id="brand-parts-heading" data-i18n="brand_parts_title">Diese Teilenummern anfragen</h2>
        <p class="parts-intro" data-i18n="brand_parts_intro">Diese Referenzen haben wir bereits für Kunden angeboten oder beschafft.</p>
        <ul class="brand-parts-list">
          ${items}
        </ul>
      </section>`;
}

function buildHtml(brand, slug, translations, relatedRows, suppliedParts) {
  const pagePath = `marche/${slug}.html`;
  const pageUrl = `${BASE}/${pagePath}`;
  const tEn = translations.en;
  const d = translations.de;
  const hasSuppliedParts = !!(suppliedParts && suppliedParts.length);
  const ld = buildLdJson(brand, slug, d, suppliedParts);
  const translationsJson = JSON.stringify(translations);
  const brandJson = JSON.stringify(brand);
  const suppliedPartsHtml = buildSuppliedPartsHtml(suppliedParts);
  const quoteModalHtml = hasSuppliedParts ? buildQuoteModalHtml() : '';
  const suppliedPartsExtraCss = hasSuppliedParts ? `
    .part-quote-btn { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 0.92rem; font-weight: 700; color: #1e3a5f; background: #fff; border: 2px solid #e67e22; border-radius: 8px; padding: 0.35rem 0.65rem; cursor: pointer; }
    .part-quote-btn:hover, .part-quote-btn:focus { color: #fff; background: #e67e22; outline: none; }
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
  const partsJson = JSON.stringify((suppliedParts || []).map((p) => p.part_number));
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
  <link rel="alternate" hreflang="de" href="${pageUrl}?lang=de">
  <link rel="alternate" hreflang="en" href="${pageUrl}?lang=en">
  <link rel="alternate" hreflang="it" href="${pageUrl}?lang=it">
  <link rel="alternate" hreflang="es" href="${pageUrl}?lang=es">
  <link rel="alternate" hreflang="fr" href="${pageUrl}?lang=fr">
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
    .footer { background: #1e3a5f; color: #fff; padding: 1.75rem 1.5rem; text-align: center; margin-top: 1rem; }
    .footer a { color: #fff; text-decoration: none; margin: 0 0.35rem; }
    .footer a:hover { text-decoration: underline; }
    .footer .sep { opacity: 0.7; margin: 0 0.15rem; }
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

  <footer class="footer">
    <div class="container">
      <a href="../index.html" data-i18n="marca_footer_home">ABCspareparts</a>
      <span class="sep">·</span>
      <a href="../marche.html" data-i18n="marca_footer_brands">Marken</a>
      <span class="sep">·</span>
      <a href="../impressum.html" target="_blank" rel="noopener" data-i18n="marca_footer_imprint">Impressum</a>
      <span class="sep">·</span>
      <a href="../datenschutz.html" target="_blank" rel="noopener" data-i18n="marca_footer_privacy">Datenschutz</a>
      <p style="margin-top:1rem;font-size:0.9rem;opacity:0.9">&copy; 2026 ABCspareparts.</p>
    </div>
  </footer>

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
          a.href = relPrefix + base + '?lang=' + lang + (parts[1] ? '#' + parts[1] : '');
        }
      });
    }
    function getUrlPart() {
      var p = new URLSearchParams(window.location.search);
      return p.get('part') || '';
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
      try {
        if (history.replaceState) {
          var u = new URL(window.location.href);
          if (code) u.searchParams.set('part', code);
          else u.searchParams.delete('part');
          u.hash = '';
          history.replaceState(null, '', u.toString());
        }
      } catch (err) {}
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
  const langs = ['it', 'de', 'en', 'es', 'fr'];
  let body = '';
  for (const { slug } of rows) {
    const loc = `${BASE}/marche/${slug}.html`;
    const hasParts = partsBySlug && partsBySlug.has(slug);
    body += '  <url>\n';
    body += `    <loc>${loc}</loc>\n`;
    for (const l of langs) {
      body += `    <xhtml:link rel="alternate" hreflang="${l}" href="${loc}?lang=${l}"/>\n`;
    }
    body += `    <xhtml:link rel="alternate" hreflang="x-default" href="${loc}"/>\n`;
    body += `    <lastmod>${TODAY}</lastmod>\n`;
    body += `    <changefreq>${hasParts ? 'weekly' : 'monthly'}</changefreq>\n`;
    body += `    <priority>${hasParts ? '0.8' : '0.65'}</priority>\n`;
    body += '  </url>\n';
  }
  const xml = `---
layout: none
---
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${body}</urlset>
`;
  fs.writeFileSync(outPath, xml, 'utf8');
}

function writeSitemapIndex() {
  const outPath = path.join(ROOT, 'sitemap-index.xml');
  const casesBlock = fs.existsSync(path.join(ROOT, 'sitemap-cases.xml'))
    ? `  <sitemap>
    <loc>${BASE}/sitemap-cases.xml</loc>
    <lastmod>${TODAY}</lastmod>
  </sitemap>
`
    : '';
  const partsBlock = fs.existsSync(path.join(ROOT, 'sitemap-brand-parts.xml'))
    ? `  <sitemap>
    <loc>${BASE}/sitemap-brand-parts.xml</loc>
    <lastmod>${TODAY}</lastmod>
  </sitemap>
`
    : '';
  const xml = `---
layout: none
---
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${BASE}/sitemap.xml</loc>
    <lastmod>${TODAY}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE}/sitemap-brands.xml</loc>
    <lastmod>${TODAY}</lastmod>
  </sitemap>
${partsBlock}${casesBlock}</sitemapindex>
`;
  fs.writeFileSync(outPath, xml, 'utf8');
}

function main() {
  const brands = readBrandsFromIndex();
  const rows = assignUniqueSlugs(brands);
  const partsBySlug = loadPartsBySlug();

  fs.mkdirSync(MARCHE_DIR, { recursive: true });
  if (fs.existsSync(MARCHE_DIR)) {
    for (const name of fs.readdirSync(MARCHE_DIR)) {
      if (name.endsWith('.html')) {
        fs.unlinkSync(path.join(MARCHE_DIR, name));
      }
    }
  }

  let n = 0;
  for (let i = 0; i < rows.length; i++) {
    const { brand, slug } = rows[i];
    const relatedRows = [];
    for (let step = 1; step <= 3; step++) {
      const left = rows[i - step];
      const right = rows[i + step];
      if (left) relatedRows.push(left);
      if (right) relatedRows.push(right);
    }
    const translations = buildTranslations(brand);
    mergeTopBrandContent(translations, slug);
    const suppliedParts = partsBySlug.get(slug) || [];
    const html = buildHtml(brand, slug, translations, relatedRows, suppliedParts);
    fs.writeFileSync(path.join(MARCHE_DIR, slug + '.html'), html, 'utf8');
    n++;
    if (n % 500 === 0) console.log('Written', n, '/', rows.length);
  }

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

  console.log('Brand pages:', n, 'in', path.relative(ROOT, MARCHE_DIR));
  console.log('sitemap-brands.xml, sitemap-index.xml and brand-slugs.json updated.');
}

main();
