'use strict';

const LINKEDIN_COMPANY_URL = 'https://www.linkedin.com/company/abcspareparts';
const { COPY: FOOTER_TRADEMARK_COPY, CSS: FOOTER_TRADEMARK_CSS } = require('./footer-disclaimer.js');

function escFooter(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const FOOTER_CSS = `
    .footer { background: #1e3a5f; color: #fff; padding: 2rem 1.5rem; text-align: center; }
    .footer-content { max-width: 800px; margin: 0 auto; }
    .footer-links { margin-bottom: 1rem; }
    .footer-links a { color: #fff; text-decoration: none; }
    .footer-links a:hover { text-decoration: underline; }
    .separator { margin: 0 0.5rem; opacity: 0.7; }
    .footer-info { font-size: 0.9rem; opacity: 0.9; }
    ${FOOTER_TRADEMARK_CSS}`;

const FOOTER_I18N = {
  de: {
    footer_brands: 'Marken',
    footer_how: 'So funktioniert es',
    footer_cases: 'Erfolgsgeschichten',
    footer_contact: 'Kontakt',
    footer_imprint: 'Impressum',
    footer_privacy: 'Datenschutz',
    footer_terms: 'AGB',
    footer_shipping: 'Versand',
    footer_cookies: 'Cookies',
    footer_linkedin: 'LinkedIn',
    footer_rights: 'Alle Rechte vorbehalten.',
    footer_trademark: FOOTER_TRADEMARK_COPY.de
  },
  en: {
    footer_brands: 'Brands',
    footer_how: 'How it works',
    footer_cases: 'Success stories',
    footer_contact: 'Contact',
    footer_imprint: 'Imprint',
    footer_privacy: 'Privacy',
    footer_terms: 'Terms',
    footer_shipping: 'Shipping',
    footer_cookies: 'Cookies',
    footer_linkedin: 'LinkedIn',
    footer_rights: 'All rights reserved.',
    footer_trademark: FOOTER_TRADEMARK_COPY.en
  },
  it: {
    footer_brands: 'Marche',
    footer_how: 'Come funziona',
    footer_cases: 'Casi di successo',
    footer_contact: 'Contatti',
    footer_imprint: 'Impressum',
    footer_privacy: 'Privacy',
    footer_terms: 'Condizioni',
    footer_shipping: 'Spedizione',
    footer_cookies: 'Cookie',
    footer_linkedin: 'LinkedIn',
    footer_rights: 'Tutti i diritti riservati.',
    footer_trademark: FOOTER_TRADEMARK_COPY.it
  },
  es: {
    footer_brands: 'Marcas',
    footer_how: 'Cómo funciona',
    footer_cases: 'Casos de éxito',
    footer_contact: 'Contacto',
    footer_imprint: 'Aviso legal',
    footer_privacy: 'Privacidad',
    footer_terms: 'Términos',
    footer_shipping: 'Envío',
    footer_cookies: 'Cookies',
    footer_linkedin: 'LinkedIn',
    footer_rights: 'Todos los derechos reservados.',
    footer_trademark: FOOTER_TRADEMARK_COPY.es
  },
  fr: {
    footer_brands: 'Marques',
    footer_how: 'Comment ça marche',
    footer_cases: 'Histoires de réussite',
    footer_contact: 'Contact',
    footer_imprint: 'Mentions légales',
    footer_privacy: 'Confidentialité',
    footer_terms: 'CGV',
    footer_shipping: 'Livraison',
    footer_cookies: 'Cookies',
    footer_linkedin: 'LinkedIn',
    footer_rights: 'Tous droits réservés.',
    footer_trademark: FOOTER_TRADEMARK_COPY.fr
  }
};

const FOOTER_LANGS = ['de', 'en', 'it', 'es', 'fr'];

function withFooterI18n(pageI18n) {
  const out = {};
  for (const lang of FOOTER_LANGS) {
    out[lang] = { ...(pageI18n[lang] || {}), ...FOOTER_I18N[lang] };
  }
  return out;
}

/** Discrete text link for the company LinkedIn page (no new graphic block). */
function buildLinkedInFooterAnchor() {
  return `<a href="${LINKEDIN_COMPANY_URL}" target="_blank" rel="noopener noreferrer" aria-label="Segui ABCspareparts su LinkedIn" data-i18n="footer_linkedin">LinkedIn</a>`;
}

function howItWorksHref(lang) {
  const file = 'so-funktioniert-es.html';
  if (!lang || lang === 'de') return `/${file}`;
  return `/${lang}/${file}`;
}

function buildFooterHtml(linkPrefix, options) {
  const p = linkPrefix || '';
  const casesHub = (options && options.casesHub) || 'casi.html';
  const lang = (options && options.lang && FOOTER_TRADEMARK_COPY[options.lang]) ? options.lang : 'de';
  const labels = FOOTER_I18N[lang];
  const tm = escFooter(labels.footer_trademark);
  const howHref = howItWorksHref(lang);
  const contactHref = (options && options.contactHref) || '/#contact';
  return `<footer class="footer">
  <div class="container">
    <div class="footer-content">
      <div class="footer-links">
        <a href="${p}marche.html" data-i18n="footer_brands">${escFooter(labels.footer_brands)}</a>
        <span class="separator">|</span>
        <a href="${howHref}" data-i18n="footer_how">${escFooter(labels.footer_how)}</a>
        <span class="separator">|</span>
        <a href="${p}${casesHub}" data-i18n="footer_cases">${escFooter(labels.footer_cases)}</a>
        <span class="separator">|</span>
        <a href="${contactHref}" data-i18n="footer_contact">${escFooter(labels.footer_contact)}</a>
        <span class="separator">|</span>
        <a href="${p}impressum.html" target="_blank" rel="noopener" data-i18n="footer_imprint">${escFooter(labels.footer_imprint)}</a>
        <span class="separator">|</span>
        <a href="${p}datenschutz.html" target="_blank" rel="noopener" data-i18n="footer_privacy">${escFooter(labels.footer_privacy)}</a>
        <span class="separator">|</span>
        <a href="${p}agb.html" target="_blank" rel="noopener" data-i18n="footer_terms">${escFooter(labels.footer_terms)}</a>
        <span class="separator">|</span>
        <a href="${p}versand.html" target="_blank" rel="noopener" data-i18n="footer_shipping">${escFooter(labels.footer_shipping)}</a>
        <span class="separator">|</span>
        <a href="${p}cookies.html" target="_blank" rel="noopener" data-i18n="footer_cookies">${escFooter(labels.footer_cookies)}</a>
        <span class="separator">|</span>
        ${buildLinkedInFooterAnchor()}
      </div>
      <div class="footer-info">
        <p>&copy; 2026 ABCspareparts. <span data-i18n="footer_rights">${escFooter(labels.footer_rights)}</span></p>
        <p id="abc-tm-disclaimer" class="footer-trademark" data-i18n="footer_trademark" data-abc-tm-disclaimer="1" role="note">${tm}</p>
      </div>
    </div>
  </div>
</footer>
<script src="/footer-disclaimer.js" defer></script>`;
}

module.exports = {
  LINKEDIN_COMPANY_URL,
  FOOTER_CSS,
  FOOTER_I18N,
  FOOTER_LANGS,
  FOOTER_TRADEMARK_COPY,
  withFooterI18n,
  buildLinkedInFooterAnchor,
  howItWorksHref,
  buildFooterHtml
};
