'use strict';

const fs = require('fs');
const path = require('path');
const { assignUniqueSlugs } = require('./brand-slug.js');
const { FOOTER_CSS, withFooterI18n, buildFooterHtml } = require('./site-footer.js');
const { ICON_LINKS, collectIndexWorthySlugs, isExcludedBrand, brandPageTitle, fitBrandTitle } = require('./seo-config.js');
const { findExistingPartPage, existingPartHref, writePartHrefIndex } = require('./part-page-paths.js');
const { writeBrandSitemaps } = require('./write-brand-sitemaps.js');

const NAV_I18N = {
  de: {
    nav_home: 'Home',
    nav_impressum: 'Impressum',
    nav_datenschutz: 'Datenschutz',
    nav_agb: 'AGB',
    nav_versand: 'Versand',
    nav_cookies: 'Cookies'
  },
  en: {
    nav_home: 'Home',
    nav_impressum: 'Imprint',
    nav_datenschutz: 'Privacy',
    nav_agb: 'Terms',
    nav_versand: 'Shipping',
    nav_cookies: 'Cookies'
  },
  it: {
    nav_home: 'Home',
    nav_impressum: 'Impressum',
    nav_datenschutz: 'Privacy',
    nav_agb: 'Condizioni',
    nav_versand: 'Spedizione',
    nav_cookies: 'Cookie'
  },
  es: {
    nav_home: 'Home',
    nav_impressum: 'Aviso legal',
    nav_datenschutz: 'Privacidad',
    nav_agb: 'Términos',
    nav_versand: 'Envío',
    nav_cookies: 'Cookies'
  },
  fr: {
    nav_home: 'Accueil',
    nav_impressum: 'Mentions légales',
    nav_datenschutz: 'Confidentialité',
    nav_agb: 'CGV',
    nav_versand: 'Livraison',
    nav_cookies: 'Cookies'
  }
};

function withNavI18n(pageI18n) {
  const out = {};
  for (const lang of ['de', 'en', 'it', 'es', 'fr']) {
    out[lang] = { ...NAV_I18N[lang], ...(pageI18n[lang] || {}) };
  }
  return out;
}

const ROOT = __dirname;
const MARCHE_DIR = path.join(ROOT, 'marche');
const BASE = 'https://abcspareparts.eu';
const TODAY = new Date().toISOString().slice(0, 10);
const MAX_META_LEN = 160;

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

function loadBrandContentBySlug() {
  try {
    const p = path.join(ROOT, 'brand-content.json');
    if (!fs.existsSync(p)) return {};
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
    return data;
  } catch (e) {
    console.warn('brand-content.json:', e.message);
    return {};
  }
}

function cleanTextList(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item == null ? '' : item).trim()).filter(Boolean);
}

/** Filled brand-content.json entry, or null when the slug is missing or every field is empty. */
function brandContentForSlug(slug) {
  const row = BRAND_CONTENT_BY_SLUG[slug];
  if (!row || typeof row !== 'object' || Array.isArray(row)) return null;
  const intro = String(row.intro == null ? '' : row.intro).trim();
  const products = cleanTextList(row.products);
  const applications = cleanTextList(row.applications);
  const faq = Array.isArray(row.faq)
    ? row.faq
        .filter((item) => item && typeof item === 'object')
        .map((item) => ({
          q: String(item.q == null ? '' : item.q).trim(),
          a: String(item.a == null ? '' : item.a).trim()
        }))
        .filter((item) => item.q && item.a)
    : [];
  const blocks = Array.isArray(row.blocks) ? row.blocks : [];
  const faqAfter = Array.isArray(row.faq_after)
    ? row.faq_after
        .filter((item) => item && item.q && item.a)
        .map((item) => ({ q: String(item.q), a: String(item.a) }))
    : [];
  const faqNoteKey = String(row.faq_note_key || '').trim();
  const relatedLabels = row.related_labels && typeof row.related_labels === 'object' && !Array.isArray(row.related_labels)
    ? row.related_labels
    : null;
  const schema = row.schema && typeof row.schema === 'object' && !Array.isArray(row.schema) ? row.schema : null;
  const hasRich = blocks.length || faqAfter.length || faqNoteKey || schema || (relatedLabels && Object.keys(relatedLabels).length);
  if (!intro && !products.length && !applications.length && !faq.length && !hasRich) return null;
  return { intro, products, applications, faq, blocks, faqAfter, faqNoteKey, relatedLabels, schema };
}

function mergeBrandContentI18n(translations, slug) {
  const i18n = BRAND_CONTENT_BY_SLUG[slug] && BRAND_CONTENT_BY_SLUG[slug].i18n;
  if (!i18n || typeof i18n !== 'object') return;
  for (const L of ['de', 'en', 'it', 'es', 'fr']) {
    const bag = i18n[L];
    if (!bag || typeof bag !== 'object' || Array.isArray(bag)) continue;
    for (const [key, value] of Object.entries(bag)) {
      if (value == null) continue;
      const text = String(value);
      if (!text.trim()) continue;
      translations[L][key] = text;
    }
  }
}

const BRAND_CONTENT_BY_SLUG = loadBrandContentBySlug();
if (Object.keys(BRAND_CONTENT_BY_SLUG).length) {
  console.log('brand-content.json: slugs', Object.keys(BRAND_CONTENT_BY_SLUG).length);
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

/** MVP /parts/{brand}/{slug}.html pages — crawlable internal links only (no ?part=). */
function loadMvpPartsIndex() {
  try {
    const p = path.join(ROOT, 'parts-mvp.json');
    if (!fs.existsSync(p)) return new Map();
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    const map = new Map();
    for (const part of data.parts || []) {
      if (!part.brand_slug || !part.part_number || !part.part_slug) continue;
      const key = `${part.brand_slug}|${String(part.part_number).toLowerCase()}`;
      map.set(key, part);
    }
    console.log('parts-mvp.json: indexable part pages', map.size);
    return map;
  } catch (e) {
    console.warn('parts-mvp.json:', e.message);
    return new Map();
  }
}

function mergeTopBrandContent(translations, slug) {
  const row = TOP_BRAND_BY_SLUG[slug];
  if (!row || typeof row !== 'object') return;
  const langs = ['de', 'en', 'it', 'es', 'fr'];

  // Extended format: { fields: { meta_title: {de,en,...}, brand_intro: {...}, ... } }
  // Overrides any translation key (SEO title/description, H1, FAQ, etc.).
  if (row.fields && typeof row.fields === 'object') {
    for (const [key, byLang] of Object.entries(row.fields)) {
      if (!byLang || typeof byLang !== 'object' || Array.isArray(byLang)) continue;
      for (const L of langs) {
        const text = String(byLang[L] || byLang.de || byLang.en || '').trim();
        if (text) translations[L][key] = text;
      }
    }
    return;
  }

  // Legacy format: { de: "...", en: "..." } → brand_top_extra only
  for (const L of langs) {
    const text = String(row[L] || row.de || row.en || '').trim();
    if (text) translations[L].brand_top_extra = text;
  }
}

const PRICE_FOCUS_BRANDS = new Set([
  'SIEMENS', 'SMC', 'SICK', 'KEYENCE', 'TURCK', 'WEG',
  'GEFRAN', 'IFM', 'LEUZE', 'BAUMER', 'SCHMERSAL', 'BOSCH REXROTH',
  'AVENTICS', 'BALLUFF', 'BECKHOFF', 'BERNSTEIN', 'CARLO GAVAZZI',
  'COGNEX', 'CONTROL TECHNIQUES', 'DATALOGIC', 'DI SORIC', 'EBM PAPST',
  'EUCHNER', 'FESTO', 'GRUNDFOS', 'HONEYWELL', 'IFM ELECTRONIC',
  'IMI NORGREN', 'NORGREN', 'IPF ELECTRONIC', 'LENZE',
  'LEUZE ELECTRONIC', 'MAC', 'MAC VALVES', 'METAL WORK', 'METAL WORK PNEUMATIC',
  'MICRO DETECTORS', 'MITSUBISHI ELECTRIC', 'OMRON', 'PANASONIC',
  'PARKER', 'PEPPERL FUCHS', 'PEPPERL PLUS FUCHS', 'PHOENIX CONTACT',
  'PILZ', 'PIZZATO', 'REXROTH', 'SCHNEIDER ELECTRIC', 'SCHNEIDER',
  'SEW EURODRIVE', 'SIKO', 'WENGLOR', 'WIKA', 'YASKAWA'
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

  return withFooterI18n(withNavI18n({
    de: {
      meta_title: brandPageTitle(brand, 'de'),
      meta_description: highlightPricing
        ? `${H} Ersatzteile zu fairen Preisen: Originalteile und geprüfte Alternativen. Teilenummer senden – Angebot oft in 24h.`
        : `${H} Originalteile und geprüfte Alternativen für MRO. Teilenummer senden – unverbindliches Angebot, oft in 24 Stunden.`,
      brand_breadcrumb: `<a href="../">Home</a> · <a href="../marche.html">Marken</a> · ${H}`,
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
      load_form_heading: 'Anfrageformular laden',
      load_form_description: 'Klicken Sie hier, um das Kontaktformular zu laden. Das Formular ist auf einem externen Server gehostet und setzt Session-Cookies.',
      load_form_button: 'Formular laden',
      brand_parts_title: 'Diese Teilenummern anfragen',
      brand_parts_intro: 'Codes aus Angeboten, Lieferungen oder Listen. Keine Preise. Existiert eine Teileseite, öffnet der Klick diese Seite; sonst das Anfrageformular mit Hersteller und Code.',
      brand_parts_search: 'Teilenummer suchen…',
      brand_parts_search_hint: 'Mindestens 3 Zeichen, dann auf einen Code klicken: Teileseite falls vorhanden, sonst Anfrageformular.',
      brand_parts_listino_intro: 'Herstellerliste: suchen Sie eine Teilenummer. Treffer mit vorhandener Teileseite öffnen diese Seite; andere öffnen das Anfrageformular. Keine Preise.',
      brand_parts_examples_label: 'Suchbeispiele (klicken zum Ausprobieren):',
      brand_parts_sample_title: 'Beispiel-Artikel (Auswahl)',
      brand_parts_sample_intro: 'Auswahl aus dem Katalog. Klick öffnet die Teileseite, wenn sie existiert, sonst das Anfrageformular. Weitere Codes über die Suche.',
      brand_parts_count: 'codes',
      brand_parts_empty: 'Keine Treffer',
      brand_parts_type_more: 'Bitte mindestens 3 Zeichen eingeben…',
      brand_parts_case: 'Erfolgsgeschichte',
      brand_parts_detail: 'Teileseite',
      brand_parts_indexable_title: 'Indexierte Teileseiten',
      brand_parts_indexable_intro: 'Eigene URLs für ausgewählte Markencodes — auffindbar für Suche und KI.',
      brand_parts_quote: 'Angebot anfragen',
      quote_modal_title: 'Unverbindliche Anfrage',
      quote_modal_close: 'Schließen',
      quote_modal_part_label: 'Teilenummer',
      quote_iframe_title: 'Anfrageformular',
      quick_box_title: 'Teilenummer gesucht? Schnellanfrage',
      quick_box_intro: 'Senden Sie uns Ihre Teilenummer direkt – per Formular, WhatsApp oder E-Mail:',
      quick_box_part_label: 'Teilenummer',
      quick_box_part_placeholder: 'Teilenummer vom Typenschild',
      quick_box_qty_label: 'Menge (optional)',
      quick_box_qty_placeholder: '1',
      quick_box_form_button: 'Formular öffnen',
      quick_box_whatsapp_button: 'WhatsApp',
      quick_box_email_button: 'E-Mail'
    },
    en: {
      meta_title: brandPageTitle(brand, 'en'),
      meta_description: highlightPricing
        ? `Competitive ${H} spare-part pricing: originals and vetted alternatives. Send part numbers for a no-obligation quote, often within 24h.`
        : `Original ${H} parts and vetted alternatives for MRO. Send part numbers – no-obligation quote, we usually reply within 24 hours.`,
      brand_breadcrumb: `<a href="../">Home</a> · <a href="../marche.html">Brands</a> · ${H}`,
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
      load_form_heading: 'Load request form',
      load_form_description: 'Click here to load the contact form. The form is hosted on an external server and sets session cookies.',
      load_form_button: 'Load form',
      brand_parts_title: 'Request these part numbers',
      brand_parts_intro: 'Codes from quotations, deliveries or lists. No prices. If a dedicated part page exists, the code opens that page; otherwise the enquiry form with manufacturer and code.',
      brand_parts_search: 'Search part number…',
      brand_parts_search_hint: 'Type at least 3 characters, then click a code: part page if it exists, otherwise the enquiry form.',
      brand_parts_listino_intro: 'Catalog search: hits with an existing part page open that page; others open the enquiry form. No prices.',
      brand_parts_examples_label: 'Search examples (click to try):',
      brand_parts_sample_title: 'Sample part numbers',
      brand_parts_sample_intro: 'A catalog sample. Click opens the part page when it exists, otherwise the enquiry form. Use search for more codes.',
      brand_parts_count: 'codes',
      brand_parts_empty: 'No matches',
      brand_parts_type_more: 'Please type at least 3 characters…',
      brand_parts_case: 'Success story',
      brand_parts_detail: 'Part page',
      brand_parts_indexable_title: 'Indexed part pages',
      brand_parts_indexable_intro: 'Dedicated URLs for selected brand codes — discoverable by search engines and AI.',
      brand_parts_quote: 'Request quote',
      quote_modal_title: 'No-obligation enquiry',
      quote_modal_close: 'Close',
      quote_modal_part_label: 'Part number',
      quote_iframe_title: 'Request form',
      quick_box_title: 'Looking for a part number? Quick request',
      quick_box_intro: 'Send us your part number directly – via form, WhatsApp or email:',
      quick_box_part_label: 'Part number',
      quick_box_part_placeholder: 'Part number from nameplate',
      quick_box_qty_label: 'Quantity (optional)',
      quick_box_qty_placeholder: '1',
      quick_box_form_button: 'Open form',
      quick_box_whatsapp_button: 'WhatsApp',
      quick_box_email_button: 'Email'
    },
    it: {
      meta_title: brandPageTitle(brand, 'it'),
      meta_description: highlightPricing
        ? `Prezzi competitivi su ricambi ${H}: originali e alternative verificate. Invia i codici per un preventivo senza impegno, spesso in 24h.`
        : `Ricambi originali ${H} e alternative verificate per MRO. Invii i codici – preventivo senza impegno, di solito risposta entro 24 ore.`,
      brand_breadcrumb: `<a href="../">Home</a> · <a href="../marche.html">Marche</a> · ${H}`,
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
      load_form_heading: 'Carica il modulo di richiesta',
      load_form_description: 'Clicca qui per caricare il modulo di contatto. Il modulo è ospitato su un server esterno e imposta cookie di sessione.',
      load_form_button: 'Carica modulo',
      brand_parts_title: 'Richiedi questi codici articolo',
      brand_parts_intro: 'Codici da preventivi, forniture o listini. Nessun prezzo. Se esiste la scheda codice, il clic la apre; altrimenti il modulo con produttore e codice.',
      brand_parts_search: 'Cerca codice articolo…',
      brand_parts_search_hint: 'Almeno 3 caratteri, poi clic su un codice: scheda se esiste, altrimenti modulo di richiesta.',
      brand_parts_listino_intro: 'Listino: i risultati con scheda codice aprono quella pagina; gli altri aprono il modulo. Nessun prezzo.',
      brand_parts_examples_label: 'Esempi di ricerca (clic per provare):',
      brand_parts_sample_title: 'Esempi di articoli',
      brand_parts_sample_intro: 'Selezione dal catalogo. Il clic apre la scheda se esiste, altrimenti il modulo. Altri codici dalla ricerca.',
      brand_parts_count: 'codici',
      brand_parts_empty: 'Nessun risultato',
      brand_parts_type_more: 'Digiti almeno 3 caratteri…',
      brand_parts_case: 'Caso di successo',
      brand_parts_detail: 'Scheda codice',
      brand_parts_indexable_title: 'Pagine codice indicizzate',
      brand_parts_indexable_intro: 'URL dedicate per codici selezionati — trovabili da motori di ricerca e AI.',
      brand_parts_quote: 'Richiedi preventivo',
      quote_modal_title: 'Richiesta senza impegno',
      quote_modal_close: 'Chiudi',
      quote_modal_part_label: 'Codice articolo',
      quote_iframe_title: 'Modulo richiesta',
      quick_box_title: 'Cerca un codice articolo? Richiesta rapida',
      quick_box_intro: 'Ci invii il codice direttamente – tramite modulo, WhatsApp o e-mail:',
      quick_box_part_label: 'Codice articolo',
      quick_box_part_placeholder: 'Codice dalla targhetta',
      quick_box_qty_label: 'Quantità (opzionale)',
      quick_box_qty_placeholder: '1',
      quick_box_form_button: 'Apri modulo',
      quick_box_whatsapp_button: 'WhatsApp',
      quick_box_email_button: 'E-mail'
    },
    es: {
      meta_title: brandPageTitle(brand, 'es'),
      meta_description: highlightPricing
        ? `Precios competitivos en recambios ${H}: originales y alternativas. Envíe referencias para un presupuesto sin compromiso, a menudo en 24h.`
        : `Recambios originales ${H} y alternativas para MRO. Envíe referencias – presupuesto sin compromiso, respuesta habitual en 24 horas.`,
      brand_breadcrumb: `<a href="../">Inicio</a> · <a href="../marche.html">Marcas</a> · ${H}`,
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
      load_form_heading: 'Cargar formulario de solicitud',
      load_form_description: 'Haga clic aquí para cargar el formulario de contacto. El formulario está alojado en un servidor externo y establece cookies de sesión.',
      load_form_button: 'Cargar formulario',
      brand_parts_title: 'Solicitar estas referencias',
      brand_parts_intro: 'Códigos de presupuestos, suministros o listas. Sin precios. Si hay ficha de código, el clic la abre; si no, el formulario con fabricante y código.',
      brand_parts_search: 'Buscar referencia…',
      brand_parts_search_hint: 'Al menos 3 caracteres y clic en un código: ficha si existe, si no el formulario.',
      brand_parts_listino_intro: 'Lista: los resultados con ficha abren esa página; el resto abre el formulario. Sin precios.',
      brand_parts_examples_label: 'Ejemplos de búsqueda (clic para probar):',
      brand_parts_sample_title: 'Ejemplos de referencias',
      brand_parts_sample_intro: 'Muestra del catálogo. El clic abre la ficha si existe; si no, el formulario. Más códigos con la búsqueda.',
      brand_parts_count: 'códigos',
      brand_parts_empty: 'Sin resultados',
      brand_parts_type_more: 'Escriba al menos 3 caracteres…',
      brand_parts_case: 'Caso de éxito',
      brand_parts_detail: 'Ficha del código',
      brand_parts_indexable_title: 'Fichas de código indexadas',
      brand_parts_indexable_intro: 'URL dedicadas para códigos seleccionados — localizables por buscadores e IA.',
      brand_parts_quote: 'Solicitar presupuesto',
      quote_modal_title: 'Solicitud sin compromiso',
      quote_modal_close: 'Cerrar',
      quote_modal_part_label: 'Referencia',
      quote_iframe_title: 'Formulario de solicitud',
      quick_box_title: '¿Busca una referencia? Solicitud rápida',
      quick_box_intro: 'Envíenos su referencia directamente – por formulario, WhatsApp o email:',
      quick_box_part_label: 'Referencia',
      quick_box_part_placeholder: 'Referencia de la placa',
      quick_box_qty_label: 'Cantidad (opcional)',
      quick_box_qty_placeholder: '1',
      quick_box_form_button: 'Abrir formulario',
      quick_box_whatsapp_button: 'WhatsApp',
      quick_box_email_button: 'Email'
    },
    fr: {
      meta_title: brandPageTitle(brand, 'fr'),
      meta_description: highlightPricing
        ? `Prix compétitifs sur les pièces ${H} : origine et alternatives. Envoyez les références pour un devis sans engagement, souvent sous 24h.`
        : `Pièces d’origine ${H} et alternatives pour le MRO. Indiquez les références – devis sans engagement, réponse en général sous 24 h.`,
      brand_breadcrumb: `<a href="../">Accueil</a> · <a href="../marche.html">Marques</a> · ${H}`,
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
      load_form_heading: 'Charger le formulaire de demande',
      load_form_description: 'Cliquez ici pour charger le formulaire de contact. Le formulaire est hébergé sur un serveur externe et définit des cookies de session.',
      load_form_button: 'Charger le formulaire',
      brand_parts_title: 'Demander ces références',
      brand_parts_intro: 'Codes issus de devis, livraisons ou listes. Aucun prix. S’il existe une fiche, le clic l’ouvre ; sinon le formulaire avec fabricant et code.',
      brand_parts_search: 'Rechercher une référence…',
      brand_parts_search_hint: 'Au moins 3 caractères, puis clic : fiche si elle existe, sinon formulaire.',
      brand_parts_listino_intro: 'Liste : les résultats avec fiche ouvrent cette page ; les autres ouvrent le formulaire. Aucun prix.',
      brand_parts_examples_label: 'Exemples de recherche (cliquez pour essayer) :',
      brand_parts_sample_title: 'Exemples de références',
      brand_parts_sample_intro: 'Extrait du catalogue. Le clic ouvre la fiche si elle existe, sinon le formulaire. Autres codes via la recherche.',
      brand_parts_count: 'références',
      brand_parts_empty: 'Aucun résultat',
      brand_parts_type_more: 'Saisissez au moins 3 caractères…',
      brand_parts_case: 'Histoire de réussite',
      brand_parts_detail: 'Fiche référence',
      brand_parts_indexable_title: 'Pages référence indexées',
      brand_parts_indexable_intro: 'URL dédiées pour des références sélectionnées — trouvables par les moteurs et l’IA.',
      brand_parts_quote: 'Demander un devis',
      quote_modal_title: 'Demande sans engagement',
      quote_modal_close: 'Fermer',
      quote_modal_part_label: 'Référence',
      quote_iframe_title: 'Formulaire de demande',
      quick_box_title: 'Vous cherchez une référence ? Demande rapide',
      quick_box_intro: 'Envoyez-nous votre référence directement – par formulaire, WhatsApp ou email :',
      quick_box_part_label: 'Référence',
      quick_box_part_placeholder: 'Référence de la plaque',
      quick_box_qty_label: 'Quantité (facultatif)',
      quick_box_qty_placeholder: '1',
      quick_box_form_button: 'Ouvrir le formulaire',
      quick_box_whatsapp_button: 'WhatsApp',
      quick_box_email_button: 'Email'
    }
  }));
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

function clipMeta(text, max = MAX_META_LEN) {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 90 ? cut.slice(0, lastSpace) : cut).replace(/[.,;:–-]+$/, '').trim();
}

function enrichMetaWithParts(translations, parts) {
  if (!parts || !parts.length) return translations;
  const codes = parts.map((p) => p.part_number);
  for (const lang of ['de', 'en', 'it', 'es', 'fr']) {
    const base = String(translations[lang].meta_description || '').trim();
    const prefix = PARTS_META_PREFIX[lang];
    let budget = MAX_META_LEN - base.length - prefix.length;
    // Keep curated SEO descriptions intact instead of truncating mid-sentence.
    if (budget < 12) {
      translations[lang].meta_description = base;
      continue;
    }
    const shown = [];
    for (const code of codes) {
      const sep = shown.length ? ', ' : '';
      const moreLen = 14;
      if (sep.length + code.length + moreLen > budget) break;
      shown.push(code);
      budget -= sep.length + code.length;
    }
    if (!shown.length) {
      translations[lang].meta_description = base;
      continue;
    }
    const extra = shown.length < codes.length ? PARTS_META_MORE[lang](codes.length - shown.length) : '';
    translations[lang].meta_description = clipMeta(`${base}${prefix} ${shown.join(', ')}${extra}`);
  }
  return translations;
}

function applyListinoMeta(translations, brand, listino) {
  const sample = String((listino.preview || [])[0] || '').trim();
  const count = listino.count;
  const sampleBit = sample ? { de: ` (z. B. ${sample})`, en: ` (e.g. ${sample})`, it: ` (es. ${sample})`, es: ` (p. ej. ${sample})`, fr: ` (ex. ${sample})` } : { de: '', en: '', it: '', es: '', fr: '' };
  const notes = {
    de: `${brand} Ersatzteile, Original und Alternativen. ${count}+ Codes suchbar${sampleBit.de}. Anfrage ohne Preise, oft in 24h.`,
    en: `${brand} spare parts, originals and alternatives. ${count}+ codes searchable${sampleBit.en}. Quote, no prices, often within 24h.`,
    it: `Ricambi ${brand}, originali e alternative. ${count}+ codici cercabili${sampleBit.it}. Preventivo senza prezzi, spesso in 24h.`,
    es: `Recambios ${brand}, originales y alternativas. ${count}+ códigos${sampleBit.es}. Solicitud sin precios, a menudo en 24h.`,
    fr: `Pièces ${brand}, origine et alternatives. ${count}+ références${sampleBit.fr}. Devis sans prix, souvent sous 24h.`
  };
  for (const lang of ['de', 'en', 'it', 'es', 'fr']) {
    translations[lang].meta_description = clipMeta(notes[lang]);
  }
}

function relatedRowsFor(slug, rows, index, worthySet) {
  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  const picked = [];
  const seen = new Set([slug]);
  const fromBrand = BRAND_CONTENT_BY_SLUG[slug] && BRAND_CONTENT_BY_SLUG[slug].related_slugs;
  const fromTop = TOP_BRAND_BY_SLUG[slug] && TOP_BRAND_BY_SLUG[slug].related_slugs;
  const override = Array.isArray(fromBrand) && fromBrand.length ? fromBrand : fromTop;
  const cap = Array.isArray(fromBrand) && fromBrand.length ? fromBrand.length : 6;
  if (Array.isArray(override) && override.length) {
    for (const relatedSlug of override) {
      const row = bySlug.get(String(relatedSlug || '').trim());
      if (!row || seen.has(row.slug)) continue;
      seen.add(row.slug);
      picked.push(row);
      if (picked.length >= cap) break;
    }
    if (Array.isArray(fromBrand) && fromBrand.length && picked.length) return picked;
    if (picked.length >= 6) return picked;
  }
  const worthyRows = rows.filter((r) => worthySet && worthySet.has(r.slug) && !seen.has(r.slug));
  if (worthyRows.length) {
    const start = index % worthyRows.length;
    for (let i = 0; i < worthyRows.length && picked.length < 6; i++) {
      const row = worthyRows[(start + i) % worthyRows.length];
      if (seen.has(row.slug)) continue;
      seen.add(row.slug);
      picked.push(row);
    }
    if (picked.length) return picked;
  }
  const relatedRows = [];
  for (let step = 1; step <= 3; step++) {
    const left = rows[index - step];
    const right = rows[index + step];
    if (left) relatedRows.push(left);
    if (right) relatedRows.push(right);
  }
  return relatedRows;
}

function buildLdJson(brand, slug, tDe, suppliedParts, listino, extraFaq, brandContent) {
  const pageUrl = `${BASE}/marche/${slug}.html`;
  const schema = brandContent && brandContent.schema;
  const useMetaTitle = schema && schema.name_from === 'meta_title' && tDe.meta_title;
  const pageName = useMetaTitle
    ? String(tDe.meta_title).trim()
    : `${String(tDe.brand_h1 || `${brand} – Industrieersatzteile & MRO`).trim()} | ABCspareparts`;
  const webPage = {
    '@type': 'WebPage',
    '@id': pageUrl + '#webpage',
    url: pageUrl,
    name: pageName,
    description: tDe.meta_description,
    inLanguage: 'de',
    isPartOf: { '@id': `${BASE}/#website` },
    about: (schema && schema.about) || { '@type': 'Brand', name: brand },
    publisher: { '@id': `${BASE}/#organization` },
    primaryImageOfPage: { '@type': 'ImageObject', url: `${BASE}/logo.png` }
  };
  if (schema && schema.mentions) webPage.mentions = schema.mentions;
  if ((suppliedParts && suppliedParts.length) || listino?.count || (schema && schema.date_modified)) {
    webPage.dateModified = TODAY;
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
          ...(extraFaq || []).map((item) => ({
            '@type': 'Question',
            name: item.q,
            acceptedAnswer: { '@type': 'Answer', text: item.a }
          })),
          { '@type': 'Question', name: tDe.brand_faq_q1, acceptedAnswer: { '@type': 'Answer', text: tDe.brand_faq_a1 } },
          { '@type': 'Question', name: tDe.brand_faq_q2, acceptedAnswer: { '@type': 'Answer', text: tDe.brand_faq_a2 } },
          { '@type': 'Question', name: tDe.brand_faq_q3, acceptedAnswer: { '@type': 'Answer', text: tDe.brand_faq_a3 } },
          ...((brandContent && brandContent.faqAfter) || [])
            .map((item) => ({
              '@type': 'Question',
              name: tDe[item.q],
              acceptedAnswer: { '@type': 'Answer', text: tDe[item.a] }
            }))
            .filter((item) => item.name && item.acceptedAnswer.text)
        ]
      }
    ]
  };
  if (schema && Array.isArray(schema.extra) && schema.extra.length) {
    graph['@graph'].push(...schema.extra);
  }
  // Quote-only: do not emit Product/ItemList JSON-LD for part codes. Merchant rich
  // results require Offer/price we do not publish — omit schema instead of inventing it.
  let json = JSON.stringify(graph);
  // Keep `<` out of the script body when brand FAQs are present (JSON text stays equivalent).
  const hasCustomLd = (extraFaq && extraFaq.length)
    || (brandContent && brandContent.faqAfter && brandContent.faqAfter.length)
    || (schema && Array.isArray(schema.extra) && schema.extra.length);
  if (hasCustomLd) json = json.replace(/</g, '\\u003c');
  return json;
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

function buildQuickBoxHtml(brand) {
  return `
      <section class="quick-box" id="quick-box" aria-labelledby="quick-box-heading">
        <h2 id="quick-box-heading" data-i18n="quick_box_title">Teilenummer gesucht? Schnellanfrage</h2>
        <p class="quick-box-intro" data-i18n="quick_box_intro">Senden Sie uns Ihre Teilenummer direkt – per Formular, WhatsApp oder E-Mail:</p>
        <form class="quick-box-form" id="quickBoxForm" onsubmit="return false;">
          <div class="quick-box-input-group">
            <label for="quickBoxPart" data-i18n="quick_box_part_label">Teilenummer</label>
            <input type="text" id="quickBoxPart" class="quick-box-input" data-i18n-placeholder="quick_box_part_placeholder" placeholder="z. B. 4092008, ETP12HT0513" required>
          </div>
          <div class="quick-box-input-group">
            <label for="quickBoxQty" data-i18n="quick_box_qty_label">Menge (optional)</label>
            <input type="number" id="quickBoxQty" class="quick-box-input" data-i18n-placeholder="quick_box_qty_placeholder" placeholder="1" min="1">
          </div>
          <div class="quick-box-buttons">
            <button type="button" class="quick-box-btn quick-box-btn-form" data-action="form" data-i18n="quick_box_form_button">Formular öffnen</button>
            <button type="button" class="quick-box-btn quick-box-btn-whatsapp" data-action="whatsapp" data-i18n="quick_box_whatsapp_button">WhatsApp</button>
            <button type="button" class="quick-box-btn quick-box-btn-email" data-action="email" data-i18n="quick_box_email_button">E-Mail</button>
          </div>
        </form>
      </section>
`;
}

function partHrefMapForBrand(brandSlug, brandParts, mvpIndex) {
  const map = {};
  function add(code) {
    if (!code || !brandSlug) return;
    const href = existingPartHref(brandSlug, code);
    if (href) map[String(code).toLowerCase()] = href;
  }
  for (const part of (brandParts && brandParts.parts) || []) add(part.part_number);
  for (const code of (brandParts && brandParts.listino && brandParts.listino.preview) || []) add(code);
  if (mvpIndex) {
    for (const part of mvpIndex.values()) {
      if (part.brand_slug === brandSlug) add(part.part_number);
    }
  }
  return map;
}

function partCodeControlHtml(code, brandSlug, hrefMap) {
  const pn = escapeHtml(code);
  const pnAttr = escapeAttr(code);
  const href = (hrefMap && hrefMap[String(code).toLowerCase()]) || existingPartHref(brandSlug, code);
  if (href) {
    return `<a class="part-quote-btn part-page-link" href="${escapeAttr(href)}" data-part="${pnAttr}" title="${pnAttr}">${pn}</a>`;
  }
  return `<button type="button" class="part-quote-btn" data-part="${pnAttr}" title="${pnAttr}">${pn}</button>`;
}

function buildSuppliedPartsHtml(brandParts, brandSlug, mvpIndex, hrefMap) {
  if (!brandParts) return '';
  const suppliedParts = brandParts.parts || [];
  const listino = brandParts.listino;
  if (!suppliedParts.length && !listino?.count) return '';
  hrefMap = hrefMap || partHrefMapForBrand(brandSlug, brandParts, mvpIndex);

  const compact = suppliedParts.length
    ? suppliedParts.every((part) => !part.description || part.description === part.part_number)
    : true;
  const showInlineSearch = suppliedParts.length >= 12 && !listino?.count;

  const items = suppliedParts
    .map((part) => {
      const searchKey = escapeAttr(String(part.part_number).toLowerCase());
      const desc =
        part.description && part.description !== part.part_number
          ? `<span class="part-desc">${escapeHtml(part.description)}</span>`
          : '';
      const caseLink = part.case_slug
        ? `<a class="part-case-link" href="../casi/${escapeAttr(part.case_slug)}.html" data-i18n="brand_parts_case">Erfolgsgeschichte</a>`
        : '';
      const diskHref = hrefMap[String(part.part_number).toLowerCase()] || existingPartHref(brandSlug, part.part_number);
      const mvp = mvpIndex && brandSlug
        ? mvpIndex.get(`${brandSlug}|${String(part.part_number).toLowerCase()}`)
        : null;
      const partPageLink =
        diskHref
          ? ''
          : mvp
            ? `<a class="part-case-link" href="../parts/${escapeAttr(mvp.brand_slug)}/${escapeAttr(mvp.part_slug)}.html" data-i18n="brand_parts_detail">Teileseite</a>`
            : '';
      return `<li class="part-row" data-part-search="${searchKey}">${partCodeControlHtml(part.part_number, brandSlug, hrefMap)}${desc}${partPageLink}${caseLink}</li>`;
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
        <p class="parts-intro parts-sample-intro" data-i18n="brand_parts_sample_intro">Auswahl aus dem Katalog. Klick öffnet die Teileseite, wenn sie existiert, sonst das Anfrageformular. Weitere Codes über die Suche.</p>
        <ul class="brand-parts-list parts-compact-list" id="listinoSampleList">
          ${listinoPreview
            .map((code) => {
              return `<li>${partCodeControlHtml(code, brandSlug, hrefMap)}</li>`;
            })
            .join('\n          ')}
        </ul>
      </div>`
    : '';

  const mvpForBrand = [];
  if (mvpIndex && brandSlug) {
    for (const part of mvpIndex.values()) {
      if (part.brand_slug === brandSlug) mvpForBrand.push(part);
    }
    mvpForBrand.sort((a, b) =>
      String(a.part_number).localeCompare(String(b.part_number), undefined, { sensitivity: 'base' })
    );
  }
  const indexablePartsHtml = mvpForBrand.length
    ? `<div class="listino-sample" id="indexablePartPages">
        <h3 class="parts-sample-title" data-i18n="brand_parts_indexable_title">Indexierte Teileseiten</h3>
        <p class="parts-intro parts-sample-intro" data-i18n="brand_parts_indexable_intro">Eigene URLs für ausgewählte Markencodes — auffindbar für Suche und KI.</p>
        <ul class="brand-parts-list parts-compact-list" id="indexablePartPagesList">
          ${mvpForBrand
            .map((part) => {
              const pn = escapeHtml(part.part_number);
              const disk = existingPartHref(part.brand_slug, part.part_number);
              const href = disk || `../parts/${escapeAttr(part.brand_slug)}/${escapeAttr(part.part_slug)}.html`;
              const desc =
                part.description && part.description !== part.part_number
                  ? ` <span class="part-desc">${escapeHtml(part.description)}</span>`
                  : '';
              return `<li><a class="part-case-link" href="${escapeAttr(href)}">${pn}</a>${desc}</li>`;
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
    ? `<div class="listino-search" id="listinoSearch" data-listino-src="../${escapeAttr(listino.file)}" data-part-hrefs-src="../${escapeAttr(String(listino.file).replace(/\.json$/i, '-part-hrefs.json'))}" data-listino-count="${listino.count}">
        <p class="parts-intro" data-i18n="brand_parts_listino_intro">Herstellerliste: suchen Sie eine Teilenummer. Treffer mit vorhandener Teileseite öffnen diese Seite; andere öffnen das Anfrageformular. Keine Preise.</p>
        <div class="parts-toolbar">
          <label class="parts-search-label" for="listinoSearchInput"><span class="visually-hidden" data-i18n="brand_parts_search">Teilenummer suchen…</span></label>
          <input type="search" id="listinoSearchInput" class="parts-search-input" data-i18n-placeholder="brand_parts_search" placeholder="Teilenummer suchen…" autocomplete="off" enterkeyhint="search">
          <span class="parts-count" id="listinoCountLabel">${listino.count} <span data-i18n="brand_parts_count">codes</span></span>
        </div>
        ${examplesHtml}
        <p class="parts-hint" data-i18n="brand_parts_search_hint">Mindestens 3 Zeichen, dann auf einen Code klicken: Teileseite falls vorhanden, sonst Anfrageformular.</p>
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
        <p class="parts-intro" data-i18n="brand_parts_intro">Codes aus Angeboten, Lieferungen oder Listen. Keine Preise. Existiert eine Teileseite, öffnet der Klick diese Seite; sonst das Anfrageformular mit Hersteller und Code.</p>
        ${inlineList}
        ${listinoHtml}
        ${indexablePartsHtml}
      </section>`;
}

function buildBrandContentListSection(title, items) {
  const lis = items.map((item) => `          <li>${escapeHtml(item)}</li>`).join('\n');
  return `      <section class="related-brands" aria-label="${escapeAttr(title)}">
        <h2>${escapeHtml(title)}</h2>
        <ul>
${lis}
        </ul>
      </section>`;
}

function buildBrandContentIntroHtml(content) {
  if (!content || !content.intro) return '';
  return `      <p class="lead lead-extra">${escapeHtml(content.intro)}</p>\n`;
}

function buildBrandContentListsHtml(content) {
  if (!content) return '';
  const blocks = [];
  if (content.products.length) {
    blocks.push(buildBrandContentListSection('Typische Produkte und Teilenummern', content.products));
  }
  if (content.applications.length) {
    blocks.push(buildBrandContentListSection('Einsatzbereiche', content.applications));
  }
  if (!blocks.length) return '';
  return blocks.join('\n') + '\n';
}

function buildBrandContentFaqHtml(content) {
  if (!content || !content.faq.length) return '';
  return content.faq.map((item) => `        <div class="faq-item">
          <h3>${escapeHtml(item.q)}</h3>
          <p>${escapeHtml(item.a)}</p>
        </div>`).join('\n') + '\n';
}

const BRAND_RICH_CSS = `
    .brand-info { margin: 0 0 1.6rem; padding: 1.2rem 1.15rem; border: 1px solid #e3eaf1; border-radius: 10px; background: #fff; }
    .brand-info h2 { font-size: 1.2rem; color: #1e3a5f; margin-bottom: 0.7rem; }
    .brand-info p { margin-bottom: 0.6rem; color: #333; }
    .brand-list { list-style: none; display: grid; gap: 0.45rem; }
    .brand-list li { position: relative; padding-left: 1.2rem; }
    .brand-list li::before { content: ""; position: absolute; left: 0; top: 0.62em; width: 0.45rem; height: 0.45rem; border-radius: 2px; background: #e67e22; }
    .brand-list-compact { grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 0.35rem 1rem; }
    .brand-list-check li::before { content: "✓"; width: auto; height: auto; background: none; color: #e67e22; font-weight: 700; top: 0; }
    .brand-info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 0 1.2rem; }
    .brand-info-accent { background: #fff8f1; border-color: #f5d6b8; }
    .brand-note { font-size: 0.82rem; color: #667; margin-top: 1rem; }
    .brand-note a { color: #1e3a5f; }
`;

function renderBrandBlock(block, d, indent) {
  if (!block || typeof block !== 'object') return '';
  const pad = indent || '      ';
  if (block.type === 'grid') {
    const inner = (Array.isArray(block.items) ? block.items : [])
      .map((item) => renderBrandBlock(item, d, pad + '  '))
      .filter(Boolean)
      .join('\n');
    if (!inner) return '';
    return `${pad}<div class="${escapeAttr(block.className || 'brand-info-grid')}">\n${inner}\n${pad}</div>`;
  }
  const titleKey = String(block.titleKey || '');
  if (!titleKey || !d[titleKey]) return '';
  const headingId = block.headingId ? escapeAttr(block.headingId) : '';
  let inner = '';
  if (block.introKey && d[block.introKey]) {
    inner += `\n${pad}  <p data-i18n="${escapeAttr(block.introKey)}">${d[block.introKey]}</p>`;
  }
  if (block.bodyKey && d[block.bodyKey]) {
    inner += `\n${pad}  <div data-i18n="${escapeAttr(block.bodyKey)}">${d[block.bodyKey]}</div>`;
  }
  if (block.listKey && d[block.listKey]) {
    inner += `\n${pad}  <ul class="${escapeAttr(block.listClass || 'brand-list')}" data-i18n="${escapeAttr(block.listKey)}">${d[block.listKey]}</ul>`;
  }
  return `${pad}<section class="${escapeAttr(block.className || 'brand-info')}"${block.id ? ` id="${escapeAttr(block.id)}"` : ''}${headingId ? ` aria-labelledby="${headingId}"` : ''}>
${pad}  <h2${headingId ? ` id="${headingId}"` : ''} data-i18n="${escapeAttr(titleKey)}">${escapeHtml(d[titleKey])}</h2>${inner}
${pad}</section>`;
}

function buildBrandBlocksHtml(content, d) {
  if (!content || !content.blocks || !content.blocks.length) return '';
  const html = content.blocks.map((block) => renderBrandBlock(block, d)).filter(Boolean).join('\n');
  if (!html) return '';
  return html + '\n';
}

function buildBrandContentFaqAfterHtml(content, d) {
  if (!content) return '';
  const parts = [];
  for (const item of content.faqAfter || []) {
    const q = d[item.q];
    const a = d[item.a];
    if (!q || !a) continue;
    parts.push(`        <div class="faq-item">
          <h3 data-i18n="${escapeAttr(item.q)}">${escapeHtml(q)}</h3>
          <p data-i18n="${escapeAttr(item.a)}">${escapeHtml(a)}</p>
        </div>`);
  }
  if (content.faqNoteKey && d[content.faqNoteKey]) {
    parts.push(`        <p class="brand-note" data-i18n="${escapeAttr(content.faqNoteKey)}">${d[content.faqNoteKey]}</p>`);
  }
  if (!parts.length) return '';
  return parts.join('\n') + '\n';
}

function buildHtml(brand, slug, translations, relatedRows, brandParts, mvpIndex, brandContent) {
  const pagePath = `marche/${slug}.html`;
  const pageUrl = `${BASE}/${pagePath}`;
  const tEn = translations.en;
  const d = translations.de;
  const suppliedParts = brandParts?.parts || [];
  const listino = brandParts?.listino || null;
  const hasSuppliedParts = suppliedParts.length > 0 || !!(listino && listino.count);
  const ld = buildLdJson(brand, slug, d, suppliedParts, listino, brandContent && brandContent.faq, brandContent);
  const brandContentIntroHtml = buildBrandContentIntroHtml(brandContent);
  const brandContentListsHtml = buildBrandContentListsHtml(brandContent);
  const brandContentBlocksHtml = buildBrandBlocksHtml(brandContent, d);
  const brandContentFaqHtml = buildBrandContentFaqHtml(brandContent);
  const brandContentFaqAfterHtml = buildBrandContentFaqAfterHtml(brandContent, d);
  const brandRichCss = brandContent && brandContent.blocks && brandContent.blocks.length ? BRAND_RICH_CSS : '';
  const translationsJson = JSON.stringify(translations);
  const brandJson = JSON.stringify(brand);
  const partHrefMap = partHrefMapForBrand(slug, brandParts, mvpIndex);
  const suppliedPartsHtml = buildSuppliedPartsHtml(brandParts, slug, mvpIndex, partHrefMap);
  const quoteModalHtml = hasSuppliedParts ? buildQuoteModalHtml() : '';
  const suppliedPartsExtraCss = hasSuppliedParts ? `
    .part-quote-btn { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 0.92rem; font-weight: 700; color: #1e3a5f; background: #fff; border: 2px solid #e67e22; border-radius: 8px; padding: 0.35rem 0.65rem; cursor: pointer; text-decoration: none; display: inline-block; }
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
  const relatedLabels = (brandContent && brandContent.relatedLabels) || {};
  const relatedLinks = (relatedRows || [])
    .map(({ brand: relatedBrand, slug: relatedSlug }) => {
      const label = relatedLabels[relatedSlug] || relatedBrand;
      return `<li><a href="../marche/${relatedSlug}.html">${escapeHtml(label)}</a></li>`;
    })
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
  ${ICON_LINKS}
  <link rel="alternate" type="text/plain" href="${BASE}/llms.txt" title="Site summary for AI assistants">
  <link rel="alternate" hreflang="x-default" href="${pageUrl}">
  <link rel="alternate" hreflang="de" href="${pageUrl}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:title" content="${escapeAttr(d.meta_title)}">
  <meta property="og:description" content="${escapeAttr(d.meta_description)}">
  <meta property="og:image" content="${BASE}/logo.png">
  <meta property="og:image:width" content="760">
  <meta property="og:image:height" content="200">
  <meta property="og:site_name" content="ABCspareparts">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeAttr(d.meta_title)}">
  <meta name="twitter:description" content="${escapeAttr(d.meta_description)}">
  <meta name="twitter:image" content="${BASE}/logo.png">
  <script type="application/ld+json">${ld}</script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 820px; margin: 0 auto; padding: 0 1.5rem; }
    .section-contact > .container { max-width: 1100px; }
    .legal-header { background: #1e3a5f; color: #fff; padding: 1rem 0; position: sticky; top: 0; z-index: 100; }
    .legal-header .container { display: flex; align-items: center; gap: 1rem; position: relative; padding-right: 9.5rem; }
    .legal-header .logo { font-size: 1.5rem; font-weight: 700; color: #fff; text-decoration: none; }
    .legal-header .logo:hover { opacity: 0.9; }
    .legal-nav { display: flex; gap: 0.85rem; flex-wrap: wrap; align-items: center; }
    .legal-nav a { color: rgba(255,255,255,0.9); text-decoration: none; font-size: 0.9rem; }
    .legal-nav a:hover { color: #fff; text-decoration: underline; }
    .language-selector { position: absolute; right: 1.5rem; top: 50%; transform: translateY(-50%); }
    .language-selector select { padding: 0.5rem 2rem 0.5rem 0.75rem; font-size: 0.9rem; border: 1px solid #ddd; border-radius: 6px; background: #fff; cursor: pointer; }
    @media (max-width: 640px) {
      .legal-header .container { padding-right: 1.5rem; padding-top: 0.25rem; }
      .language-selector { position: static; transform: none; margin-left: auto; }
    }
    .page-hero { background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); color: #fff; padding: 2.5rem 0 2rem; }
    .breadcrumb { font-size: 0.9rem; opacity: 0.95; margin-bottom: 1rem; }
    .breadcrumb a { color: #e67e22; text-decoration: none; font-weight: 600; }
    .breadcrumb a:hover { text-decoration: underline; }
    .page-hero h1 { font-size: clamp(1.35rem, 4vw, 2rem); line-height: 1.3; margin-bottom: 0.75rem; word-wrap: break-word; }
    .page-hero .lead { max-width: none; font-size: 1.05rem; opacity: 0.95; }
    .page-hero .lead.lead-extra { margin-top: 0.7rem; font-size: 0.98rem; line-height: 1.6; }
    .page-hero .lead a { color: #e67e22; font-weight: 600; text-decoration: none; border-bottom: 1px solid rgba(230, 126, 34, 0.5); }
    .page-hero .lead a:hover { text-decoration: underline; border-bottom-color: #fff; }
    .page-hero .lead.lead-top-brand { margin-top: 0.9rem; padding: 0.75rem 0.9rem; max-width: none; font-size: 0.95rem; line-height: 1.55; background: rgba(0,0,0,0.12); border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); }
    .brand-body { padding: 2rem 0 1rem; }
    .brand-form-hint { max-width: none; margin: 0 0 1rem; color: #555; font-size: 0.98rem; text-align: left; }
    .brand-email-alt { max-width: none; margin: 0 0 2rem; text-align: left; font-size: 0.95rem; color: #444; }
    .brand-email-alt a { color: #1e3a5f; font-weight: 600; }
    .quick-box { margin: 1.5rem 0 1rem; padding: 1.5rem 1.3rem; border: 2px solid rgba(255, 255, 255, 0.3); border-radius: 12px; background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(10px); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); }
    .quick-box h2 { font-size: 1.25rem; color: #fff; margin: 0 0 0.5rem; }
    .quick-box-intro { font-size: 0.95rem; color: rgba(255, 255, 255, 0.95); margin: 0 0 1.2rem; }
    .quick-box-form { display: flex; flex-direction: column; gap: 1rem; }
    .quick-box-input-group { display: flex; flex-direction: column; gap: 0.35rem; }
    .quick-box-input-group label { font-size: 0.9rem; font-weight: 600; color: #fff; }
    .quick-box-input { padding: 0.65rem 0.85rem; border: 1px solid rgba(255, 255, 255, 0.4); border-radius: 8px; font-size: 1rem; background: rgba(255, 255, 255, 0.95); }
    .quick-box-input:focus { outline: 2px solid #e67e22; border-color: #e67e22; background: #fff; }
    .quick-box-buttons { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 0.5rem; }
    .quick-box-btn { flex: 1; min-width: 140px; padding: 0.75rem 1rem; border: none; border-radius: 8px; font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .quick-box-btn-form { background: #e67e22; color: #fff; }
    .quick-box-btn-form:hover { background: #d35400; transform: translateY(-1px); box-shadow: 0 4px 8px rgba(230, 126, 34, 0.3); }
    .quick-box-btn-whatsapp { background: #25D366; color: #fff; }
    .quick-box-btn-whatsapp:hover { background: #1ea952; transform: translateY(-1px); box-shadow: 0 4px 8px rgba(37, 211, 102, 0.3); }
    .quick-box-btn-email { background: #1e3a5f; color: #fff; }
    .quick-box-btn-email:hover { background: #152d47; transform: translateY(-1px); box-shadow: 0 4px 8px rgba(30, 58, 95, 0.3); }
    @media (max-width: 640px) {
      .quick-box-buttons { flex-direction: column; }
      .quick-box-btn { min-width: 100%; }
    }
    .brand-success-story { margin: 0 0 2rem; padding: 1.2rem 1.15rem; border: 1px solid #dce8f4; border-radius: 10px; background: #fff8f0; }
    .brand-success-story h2 { font-size: 1.2rem; color: #1e3a5f; margin-bottom: 0.45rem; }
    .brand-success-story p { font-size: 0.92rem; color: #445; line-height: 1.55; margin: 0; }
    .brand-success-story a { color: #1e3a5f; font-weight: 600; text-decoration: none; border-bottom: 1px solid #c5d4e3; }
    .brand-success-story a:hover { color: #e67e22; border-bottom-color: #e67e22; }
    .related-brands { margin: 0 0 2rem; padding: 1rem 1.1rem; border: 1px solid #e6eaf0; border-radius: 10px; background: #f9fbfe; }
    .related-brands h2 { font-size: 1.15rem; color: #1e3a5f; margin-bottom: 0.35rem; }
    .related-brands p { font-size: 0.92rem; color: #556; margin-bottom: 0.7rem; }
    .related-brands ul { list-style: none; display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 0.4rem 1rem; }
    .related-brands a { color: #1e3a5f; text-decoration: none; font-weight: 600; border-bottom: 1px solid #c5d4e3; }
    .related-brands a:hover { color: #e67e22; border-bottom-color: #e67e22; }
    .brand-faq { margin: 0 0 2.25rem; padding: 1.2rem 1.15rem; border: 1px solid #e3eaf1; border-radius: 10px; background: #f6f9fc; }
    .brand-faq h2 { font-size: 1.2rem; color: #1e3a5f; margin-bottom: 0.9rem; }
    .brand-faq .faq-item { margin-bottom: 0.95rem; }
    .brand-faq h3 { font-size: 0.98rem; color: #1e3a5f; margin: 0 0 0.3rem; font-weight: 600; }
    .brand-faq p { margin: 0; font-size: 0.92rem; color: #444; line-height: 1.55; }
    .brand-supplied-parts { margin: 0 0 2rem; padding: 1.2rem 1.15rem; border: 1px solid #dce8f4; border-radius: 10px; background: #f0f6fb; }
    .brand-supplied-parts h2 { font-size: 1.2rem; color: #1e3a5f; margin-bottom: 0.5rem; }
    .brand-supplied-parts .parts-intro { font-size: 0.92rem; color: #445; margin-bottom: 1rem; line-height: 1.55; }
    .brand-parts-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.65rem; }
    .brand-parts-list li { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 0.35rem 0.75rem; padding: 0.55rem 0.65rem; background: #fff; border: 1px solid #e3eaf1; border-radius: 8px; }
    @media (max-width: 640px) {
      .brand-parts-list li { grid-template-columns: auto 1fr; }
      .part-case-link { grid-column: 2; }
    }
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
    .section-contact { padding: 1rem 0 3rem; }
    .section-contact > .container > h2 { text-align: center; margin-bottom: 1rem; font-size: 1.75rem; color: #1e3a5f; }
    .contact-form-wrap h3 { font-size: 1.15rem; color: #1e3a5f; margin-bottom: 1rem; text-align: center; }
    .contact-iframe-wrap { max-width: 700px; margin: 0 auto; border-radius: 8px; overflow: hidden; border: 1px solid #e0e0e0; }
    .contact-iframe-wrap iframe { width: 100%; height: 1050px; border: none; display: block; }
${FOOTER_CSS}
${brandRichCss}  </style>
</head>
<body>
  <header class="legal-header">
    <div class="container">
      <a href="/" class="logo">ABCspareparts</a>
      <nav class="legal-nav">
        <a href="/" data-i18n="nav_home">Home</a>
        <a href="../marche.html" data-i18n="footer_brands">Marken</a>
        <a href="../casi.html" data-i18n="footer_cases">Erfolgsgeschichten</a>
        <a href="#contact" data-i18n="footer_contact">Kontakt</a>
      </nav>
      <div class="language-selector">
        <select id="languageSelect">
          <option value="de">🇩🇪 Deutsch</option>
          <option value="en">🇬🇧 English</option>
          <option value="it">🇮🇹 Italiano</option>
          <option value="es">🇪🇸 Español</option>
          <option value="fr">🇫🇷 Français</option>
        </select>
      </div>
    </div>
  </header>

  <header class="page-hero">
    <div class="container">
      <nav class="breadcrumb" data-i18n="brand_breadcrumb" aria-label="Breadcrumb">${d.brand_breadcrumb}</nav>
      <h1 data-i18n="brand_h1">${d.brand_h1}</h1>
${buildQuickBoxHtml(brand)}      <p class="lead" data-i18n="brand_intro">${d.brand_intro}</p>
      <p class="lead lead-extra" data-i18n="brand_intro_p2">${d.brand_intro_p2}</p>
${d.brand_top_extra ? `      <p class="lead lead-top-brand" data-i18n="brand_top_extra">${escapeHtml(d.brand_top_extra)}</p>
` : ''}${brandContentIntroHtml}    </div>
  </header>

  <main id="main-content">
  <div class="brand-body">
    <div class="container">
      <p class="brand-form-hint" data-i18n="brand_form_hint">${d.brand_form_hint}</p>
      <p class="brand-email-alt" data-i18n="brand_email_alt">${d.brand_email_alt}</p>

${suppliedPartsHtml}
${brandContentListsHtml}${brandContentBlocksHtml}      <section class="related-brands" aria-label="Related brands">
        <h2 data-i18n="related_title">${escapeHtml(d.related_title)}</h2>
        <p data-i18n="related_intro">${escapeHtml(d.related_intro)}</p>
        <ul>
          ${relatedLinks}
        </ul>
      </section>
      <section class="brand-faq" id="marken-faq" aria-labelledby="brand-faq-heading">
        <h2 id="brand-faq-heading" data-i18n="brand_faq_title">${escapeHtml(d.brand_faq_title)}</h2>
${brandContentFaqHtml}        <div class="faq-item">
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
${brandContentFaqAfterHtml}      </section>
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
          <div class="contact-iframe-wrap" id="iframeContainer">
            <div id="iframePlaceholder" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 500px; background: linear-gradient(135deg, #f0f6fb 0%, #e8f2f9 100%); border: 2px solid #dce8f4; border-radius: 10px; text-align: center; padding: 2rem;">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#1e3a5f" stroke-width="2" style="margin-bottom: 1rem;">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="9" x2="15" y2="9"></line>
                <line x1="9" y1="13" x2="15" y2="13"></line>
                <line x1="9" y1="17" x2="13" y2="17"></line>
              </svg>
              <h4 style="color: #1e3a5f; margin-bottom: 0.5rem; font-size: 1.1rem;" data-i18n="load_form_heading">Anfrageformular laden</h4>
              <p style="color: #555; margin-bottom: 1.5rem; max-width: 500px;" data-i18n="load_form_description">Klicken Sie hier, um das Kontaktformular zu laden. Das Formular ist auf einem externen Server gehostet und setzt Session-Cookies.</p>
              <button id="loadIframeBtn" style="background: #e67e22; color: #fff; border: none; padding: 0.85rem 1.75rem; border-radius: 8px; font-weight: 600; font-size: 1rem; cursor: pointer; transition: background 0.3s ease;" data-i18n="load_form_button">
                Formular laden
              </button>
            </div>
            <iframe id="contactFormIframe" data-src="https://erp.abcspareparts.eu/lead-request/new" data-i18n-title="contact_iframe_title" title="${escapeAttr(d.contact_iframe_title)}" style="display: none; border: none; width: 100%; height: 1000px;"></iframe>
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
    var PART_HREFS = ${JSON.stringify(partHrefMap)};
    var SELECTED_PART = '';

    var pages = ['index.html', '', 'marche.html', 'casi.html', 'impressum.html', 'datenschutz.html', 'agb.html', 'versand.html', 'cookies.html'];

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
    function storedLang() {
      try {
        var s = localStorage.getItem('lang');
        return s && ['de', 'en', 'it', 'es', 'fr'].indexOf(s) !== -1 ? s : null;
      } catch (e) { return null; }
    }
    function browserLang() {
      var list = [];
      try {
        if (navigator.languages && navigator.languages.length) {
          for (var bi = 0; bi < navigator.languages.length; bi++) list.push(navigator.languages[bi]);
        }
      } catch (e2) {}
      if (!list.length) list.push(navigator.language || navigator.userLanguage || '');
      for (var bj = 0; bj < list.length; bj++) {
        var c = String(list[bj] || '').split('-')[0].toLowerCase();
        if (['de', 'en', 'it', 'es', 'fr'].indexOf(c) !== -1) return c;
      }
      return 'de';
    }
    function getCurrentLang() {
      return getLangFromUrl() || storedLang() || browserLang();
    }
    function updateLinksWithLang(lang) {
      // Language stays in localStorage — do not append ?lang= (GSC alternate noise).
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
        if (base === 'index.html') base = '';
        if (isLangInternalPage(base) || base === '') {
          var path = base === '' ? (relPrefix || '../') : (relPrefix + base);
          a.href = path + (parts[1] ? '#' + parts[1] : '');
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
      if (iframe.src) {
        iframe.src = buildIframeSrc(langCode, partNumber);
      }
    }
    
    function loadContactIframe(partNumber) {
      var placeholder = document.getElementById('iframePlaceholder');
      var iframe = document.getElementById('contactFormIframe');
      if (iframe && placeholder) {
        var lang = getCurrentLang();
        iframe.src = buildIframeSrc(lang, partNumber);
        iframe.style.display = 'block';
        placeholder.style.display = 'none';
      }
    }
    
    var loadBtn = document.getElementById('loadIframeBtn');
    if (loadBtn) {
      loadBtn.addEventListener('click', function() {
        loadContactIframe(SELECTED_PART || getUrlPart());
      });
      loadBtn.addEventListener('mouseover', function() {
        this.style.background = '#d35400';
      });
      loadBtn.addEventListener('mouseout', function() {
        this.style.background = '#e67e22';
      });
    }
    
    function initQuickBox() {
      var form = document.getElementById('quickBoxForm');
      if (!form) return;
      var partInput = document.getElementById('quickBoxPart');
      var qtyInput = document.getElementById('quickBoxQty');
      var buttons = form.querySelectorAll('.quick-box-btn');
      
      buttons.forEach(function(btn) {
        btn.addEventListener('click', function() {
          var action = btn.getAttribute('data-action');
          var part = (partInput.value || '').trim();
          if (!part) {
            partInput.focus();
            return;
          }
          var qty = (qtyInput.value || '').trim();
          var langSel = document.getElementById('languageSelect');
          var lang = langSel ? langSel.value : 'de';
          
          if (action === 'form') {
            SELECTED_PART = part;
            var iframePlaceholder = document.getElementById('iframePlaceholder');
            var iframe = document.getElementById('contactFormIframe');
            if (iframe && iframePlaceholder) {
              iframe.src = buildIframeSrc(lang, part + (qty ? ' Qty: ' + qty : ''));
              iframe.style.display = 'block';
              iframePlaceholder.style.display = 'none';
            }
            document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
          } else if (action === 'whatsapp') {
            var msg = encodeURIComponent('Anfrage ' + BRAND + ' Ersatzteil\\nTeilenummer: ' + part + (qty ? '\\nMenge: ' + qty : ''));
            window.open('https://wa.me/4915222466077?text=' + msg, '_blank', 'noopener');
          } else if (action === 'email') {
            var subject = encodeURIComponent('Anfrage ' + BRAND + ' Ersatzteile');
            var body = encodeURIComponent('Teilenummer: ' + part + (qty ? '\\nMenge: ' + qty : '') + '\\n\\nBitte senden Sie mir ein Angebot.');
            window.location.href = 'mailto:info@abcspareparts.eu?subject=' + subject + '&body=' + body;
          }
        });
      });
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
        if (btn.tagName === 'A' && btn.getAttribute('href')) return;
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
      var hrefSrc = box.getAttribute('data-part-hrefs-src');
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
          var href = PART_HREFS[String(code).toLowerCase()] || '';
          if (href) {
            var a = document.createElement('a');
            a.className = 'part-quote-btn part-page-link';
            a.href = href;
            a.setAttribute('data-part', code);
            a.title = code;
            a.textContent = code;
            li.appendChild(a);
          } else {
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
          }
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
      function mergeHrefs(extra) {
        if (!extra) return;
        Object.keys(extra).forEach(function (k) {
          if (extra[k]) PART_HREFS[k] = extra[k];
        });
      }
      var pendingCbs = [];
      function flushPending() {
        var run = pendingCbs.slice();
        pendingCbs = [];
        for (var i = 0; i < run.length; i++) run[i]();
        if (!run.length && input && (input.value || '').trim().length >= 3) searchNow();
      }
      function ensureLoaded(cb) {
        if (typeof cb === 'function') pendingCbs.push(cb);
        if (codes) { flushPending(); return; }
        if (loading) return;
        loading = true;
        var listinoP = fetch(src).then(function (r) { return r.json(); });
        var hrefP = hrefSrc
          ? fetch(hrefSrc).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; })
          : Promise.resolve({});
        Promise.all([listinoP, hrefP]).then(function (pair) {
          var data = pair[0] || {};
          codes = data.codes || [];
          total = data.count || codes.length;
          mergeHrefs(pair[1]);
          loading = false;
          flushPending();
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
        input.addEventListener('focus', function () { ensureLoaded(); });
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
      var ogTitle = document.querySelector('meta[property="og:title"]');
      if (t.meta_title && ogTitle) ogTitle.setAttribute('content', t.meta_title);
      var twTitle = document.querySelector('meta[name="twitter:title"]');
      if (t.meta_title && twTitle) twTitle.setAttribute('content', t.meta_title);
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
      initQuickBox();
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

function writeSitemapBrands(_rows, partsBySlug) {
  // Always scan on-disk marche/*.html so a full or partial rebuild cannot
  // shrink the public brand sitemap back to a "index-worthy" subset.
  return writeBrandSitemaps({ partsBySlug });
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
  const partsOnly = process.argv.includes('--parts-only');
  const brands = readBrandsFromIndex();
  const rows = assignUniqueSlugs(brands);
  
  // Filter out excluded brands (exact name/slug match after normalization).
  // Substring matching is avoided so plain AXIOMTEK is not treated as the
  // excluded combined brand AXIOMTEK / MARKEM-IMAJE (or as Markem).
  const filteredRows = rows.filter((r) => !isExcludedBrand(r.brand || r.name, r.slug));
  
  const partsBySlug = loadPartsBySlug();
  const worthySet = collectIndexWorthySlugs([...partsBySlug.keys()], TOP_BRAND_BY_SLUG);
  const mvpIndex = loadMvpPartsIndex();
  let targetRows = onlySlugs.length
    ? filteredRows.filter((r) => onlySlugs.includes(r.slug))
    : filteredRows;
  if (partsOnly) {
    targetRows = targetRows.filter((r) => partsBySlug.has(r.slug));
  }
  const partial = onlySlugs.length > 0 || partsOnly;

  if (onlySlugs.length && !targetRows.length) {
    throw new Error(`No matching brand slugs for --only=${onlySlugs.join(',')}`);
  }
  if (partsOnly && !targetRows.length) {
    throw new Error('No brand slugs with parts/listino for --parts-only');
  }

  fs.mkdirSync(MARCHE_DIR, { recursive: true });
  if (!partial && fs.existsSync(MARCHE_DIR)) {
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
    if (isExcludedBrand(brand, slug)) continue;
    if (partial && !targetRows.some((r) => r.slug === slug)) continue;

    const relatedRows = relatedRowsFor(slug, rows, i, worthySet)
      .filter((r) => !isExcludedBrand(r.brand, r.slug));
    const translations = buildTranslations(brand);
    mergeTopBrandContent(translations, slug);
    const brandParts = partsBySlug.get(slug) || null;
    if (brandParts?.listino?.count) {
      applyListinoMeta(translations, brand, brandParts.listino);
    } else if (brandParts?.parts?.length) {
      enrichMetaWithParts(translations, brandParts.parts);
    }
    for (const lang of ['de', 'en', 'it', 'es', 'fr']) {
      translations[lang].meta_description = clipMeta(translations[lang].meta_description);
    }
    mergeBrandContentI18n(translations, slug);
    for (const lang of ['de', 'en', 'it', 'es', 'fr']) {
      translations[lang].meta_title = fitBrandTitle(translations[lang].meta_title, brand, lang);
    }
    if (brandParts?.listino?.file) {
      const listinoPath = path.join(ROOT, brandParts.listino.file);
      if (fs.existsSync(listinoPath)) {
        try {
          const catalog = JSON.parse(fs.readFileSync(listinoPath, 'utf8'));
          const hrefOut = listinoPath.replace(/\.json$/i, '-part-hrefs.json');
          const hits = writePartHrefIndex(hrefOut, slug, catalog.codes || []);
          console.log('part href index', slug, hits, '/', (catalog.codes || []).length);
        } catch (e) {
          console.warn('part href index', slug, e.message);
        }
      }
    }
    const html = buildHtml(brand, slug, translations, relatedRows, brandParts, mvpIndex, brandContentForSlug(slug));
    fs.writeFileSync(path.join(MARCHE_DIR, slug + '.html'), html, 'utf8');
    n++;
    if (n % 500 === 0) console.log('Written', n, '/', targetRows.length);
  }

  // Refresh brand sitemaps from on-disk pages even on --only / --parts-only
  // so nightly ERP syncs cannot drop indexable URLs from the sitemap.
  writeSitemapBrands(filteredRows, partsBySlug);
  writeSitemapIndex();
  if (!partial) {
    fs.writeFileSync(
      path.join(ROOT, 'brand-slugs.json'),
      JSON.stringify(filteredRows.reduce((acc, { brand, slug }) => {
        acc[brand] = slug;
        return acc;
      }, {}), null, 0),
      'utf8'
    );
    console.log('sitemap-brands.xml, sitemap-index.xml and brand-slugs.json updated.');
  } else {
    console.log('Partial rebuild: refreshed sitemap-brands / sitemap-index from on-disk brand pages.');
  }

  console.log('Brand pages:', n, onlySlugs.length ? `(only: ${onlySlugs.join(',')})` : partsOnly ? '(parts-only)' : '', 'in', path.relative(ROOT, MARCHE_DIR));
}

if (require.main === module) {
  main();
}

module.exports = {
  writeSitemapBrands,
  loadPartsBySlug,
  partHrefMapForBrand,
  partCodeControlHtml,
  existingPartHref
};
