'use strict';

const FOOTER_CSS = `
    .footer { background: #1e3a5f; color: #fff; padding: 2rem 1.5rem; text-align: center; }
    .footer-content { max-width: 800px; margin: 0 auto; }
    .footer-links { margin-bottom: 1rem; }
    .footer-links a { color: #fff; text-decoration: none; }
    .footer-links a:hover { text-decoration: underline; }
    .separator { margin: 0 0.5rem; opacity: 0.7; }
    .footer-info { font-size: 0.9rem; opacity: 0.9; }`;

const FOOTER_I18N = {
  de: {
    footer_brands: 'Marken',
    footer_cases: 'Erfolgsgeschichten',
    footer_contact: 'Kontakt',
    footer_imprint: 'Impressum',
    footer_privacy: 'Datenschutz',
    footer_terms: 'AGB',
    footer_shipping: 'Versand',
    footer_cookies: 'Cookies',
    footer_rights: 'Alle Rechte vorbehalten.'
  },
  en: {
    footer_brands: 'Brands',
    footer_cases: 'Success stories',
    footer_contact: 'Contact',
    footer_imprint: 'Imprint',
    footer_privacy: 'Privacy',
    footer_terms: 'Terms',
    footer_shipping: 'Shipping',
    footer_cookies: 'Cookies',
    footer_rights: 'All rights reserved.'
  },
  it: {
    footer_brands: 'Marche',
    footer_cases: 'Casi di successo',
    footer_contact: 'Contatti',
    footer_imprint: 'Impressum',
    footer_privacy: 'Privacy',
    footer_terms: 'Condizioni',
    footer_shipping: 'Spedizione',
    footer_cookies: 'Cookie',
    footer_rights: 'Tutti i diritti riservati.'
  },
  es: {
    footer_brands: 'Marcas',
    footer_cases: 'Casos de éxito',
    footer_contact: 'Contacto',
    footer_imprint: 'Aviso legal',
    footer_privacy: 'Privacidad',
    footer_terms: 'Términos',
    footer_shipping: 'Envío',
    footer_cookies: 'Cookies',
    footer_rights: 'Todos los derechos reservados.'
  },
  fr: {
    footer_brands: 'Marques',
    footer_cases: 'Histoires de réussite',
    footer_contact: 'Contact',
    footer_imprint: 'Mentions légales',
    footer_privacy: 'Confidentialité',
    footer_terms: 'CGV',
    footer_shipping: 'Livraison',
    footer_cookies: 'Cookies',
    footer_rights: 'Tous droits réservés.'
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

function buildFooterHtml(linkPrefix, options) {
  const p = linkPrefix || '';
  const casesHub = (options && options.casesHub) || 'casi.html';
  return `<footer class="footer">
  <div class="container">
    <div class="footer-content">
      <div class="footer-links">
        <a href="${p}marche.html" data-i18n="footer_brands">Marche</a>
        <span class="separator">|</span>
        <a href="${p}${casesHub}" data-i18n="footer_cases">Erfolgsgeschichten</a>
        <span class="separator">|</span>
        <a href="${p}index.html#contact" data-i18n="footer_contact">Kontakt</a>
        <span class="separator">|</span>
        <a href="${p}impressum.html" target="_blank" rel="noopener" data-i18n="footer_imprint">Impressum</a>
        <span class="separator">|</span>
        <a href="${p}datenschutz.html" target="_blank" rel="noopener" data-i18n="footer_privacy">Datenschutz</a>
        <span class="separator">|</span>
        <a href="${p}agb.html" target="_blank" rel="noopener" data-i18n="footer_terms">AGB</a>
        <span class="separator">|</span>
        <a href="${p}versand.html" target="_blank" rel="noopener" data-i18n="footer_shipping">Versand</a>
        <span class="separator">|</span>
        <a href="${p}cookies.html" target="_blank" rel="noopener" data-i18n="footer_cookies">Cookies</a>
      </div>
      <div class="footer-info">
        <p>&copy; 2026 ABCspareparts. <span data-i18n="footer_rights">Alle Rechte vorbehalten.</span></p>
      </div>
    </div>
  </div>
</footer>`;
}

module.exports = {
  FOOTER_CSS,
  FOOTER_I18N,
  FOOTER_LANGS,
  withFooterI18n,
  buildFooterHtml
};
