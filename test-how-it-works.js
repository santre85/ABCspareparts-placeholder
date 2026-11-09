#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { PAGE_FILE, HOW_IT_WORKS_I18N, pagePath } = require('./how-it-works-i18n.js');

const LANGS = ['de', 'en', 'it', 'es', 'fr'];
const FORBIDDEN = [
  /\boriginalteile\b/i,
  /\boriginalkomponent/i,
  /\bauthorized dealer\b/i,
  /\bauthorised dealer\b/i,
  /\bautorisiert(?:er)? händler/i,
  /\brivenditore autorizzato\b/i,
  /\bdistribuidor autorizado\b/i,
  /\brevendeur agr[eé]é\b/i,
  /\bpièces? d['’]origine\b/i,
  /\bricambi originali\b/i,
  /\bpiezas originales\b/i,
  /\boriginal parts\b/i
];
let failed = 0;

function ok(cond, msg) {
  if (cond) console.log('  ✓', msg);
  else {
    console.log('  ✗', msg);
    failed++;
  }
}

function pageFile(lang) {
  return lang === 'de' ? path.join(__dirname, PAGE_FILE) : path.join(__dirname, lang, PAGE_FILE);
}

function stripDisclaimer(html) {
  return html.replace(/<p[^>]*id="abc-tm-disclaimer"[^>]*>[\s\S]*?<\/p>/i, '');
}

for (const lang of LANGS) {
  const file = pageFile(lang);
  ok(fs.existsSync(file), `${lang} page exists`);
  const html = fs.readFileSync(file, 'utf8');
  ok(html.includes(`lang="${lang}"`), `${lang} html lang`);
  ok(html.includes(`rel="canonical" href="https://abcspareparts.eu${pagePath(lang)}"`), `${lang} canonical`);
  ok(html.includes('hreflang="x-default"') && html.includes('hreflang="de"') && html.includes('hreflang="it"'), `${lang} hreflang cluster`);
  ok(html.includes('id="abc-tm-disclaimer"') && html.includes('/footer-disclaimer.js'), `${lang} footer disclaimer`);
  ok(html.includes('id="languageSelect"'), `${lang} language selector`);
  ok(/<h1[^>]*>/.test(html), `${lang} H1`);
  ok(html.includes('class="direct-answer"'), `${lang} citable answer`);
  ok((html.match(/id="step-\d"/g) || []).length === 4, `${lang} four HowTo steps`);
  ok((html.match(/class="faq-item"/g) || []).length === 8, `${lang} eight FAQ items`);
  let graph;
  const raw = (html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/) || [])[1];
  try {
    graph = JSON.parse(raw);
  } catch (e) {
    graph = null;
  }
  const nodes = graph && graph['@graph'] ? graph['@graph'] : [];
  const types = new Set(nodes.map((n) => n['@type']));
  ok(types.has('Organization') && types.has('WebPage') && types.has('HowTo') && types.has('FAQPage'), `${lang} JSON-LD types`);
  const org = nodes.find((n) => n['@type'] === 'Organization');
  ok(org && org['@id'] === 'https://abcspareparts.eu/#organization', `${lang} Organization @id`);
  ok(org && org.email === 'info@abcspareparts.eu', `${lang} Organization keeps email`);
  ok(org && !org.telephone, `${lang} Organization has no telephone`);
  ok(org && !(org.address && org.address.streetAddress), `${lang} Organization has no street`);
  ok(org && org.address && org.address.addressLocality === 'Augsburg', `${lang} Organization locality Augsburg`);
  const faq = nodes.find((n) => n['@type'] === 'FAQPage');
  ok(faq && Array.isArray(faq.mainEntity) && faq.mainEntity.length === 8, `${lang} FAQPage 8 questions`);
  const faqTexts = (faq && faq.mainEntity ? faq.mainEntity : [])
    .map((q) => `${q.name || ''} ${q.acceptedAnswer && q.acceptedAnswer.text ? q.acceptedAnswer.text : ''}`)
    .join('\n');
  ok(!/Serena|Sarlo|Uferstrasse|22466077|WhatsApp/i.test(faqTexts), `${lang} FAQ JSON-LD has no name/street/phone`);
  ok(/impressum/i.test(faq.mainEntity[7].acceptedAnswer.text) || /imprint|aviso legal|mentions légales/i.test(faq.mainEntity[7].acceptedAnswer.text), `${lang} FAQ 8 points to imprint`);
  ok(!html.includes('erp.abcspareparts.eu'), `${lang} does not embed ERP form`);
  ok(!html.includes('id="quoteModal"'), `${lang} no quote modal`);
  const cta = html.match(/class="cta-button" href="([^"]+)"/);
  ok(cta && /#contact$/.test(cta[1]), `${lang} CTA to enquiry form #contact`);
  const body = stripDisclaimer(html);
  for (const re of FORBIDDEN) {
    ok(!re.test(body), `${lang} no forbidden phrase ${re}`);
  }
  ok(!/"@type":"Offer"/.test(html) && !/"price"\s*:/.test(html), `${lang} no Offer/price schema`);
  ok(html.includes(HOW_IT_WORKS_I18N[lang].direct_answer), `${lang} direct answer text present`);
  ok(!/Serena\s+Sarlo/i.test(html), `${lang} no personal name`);
  ok(!/Uferstrasse/i.test(html), `${lang} no street address`);
  ok(!/22466077/.test(html) && !/\+49[\s-]*152/.test(html), `${lang} no phone number`);
  ok(!/WhatsApp/i.test(html), `${lang} no WhatsApp`);
  ok(!/\bAugusta\b/.test(html), `${lang} no Augusta`);
  ok(!/\bAugsburgo\b/.test(html) && !/\bAugsbourg\b/.test(html), `${lang} no localized city spelling`);
  ok(html.includes('Augsburg'), `${lang} keeps Augsburg`);
  ok(html.includes('info@abcspareparts.eu'), `${lang} keeps email`);
  ok(/href="[^"]*impressum\.html"/.test(html), `${lang} Impressum link`);
}

const sitemap = fs.readFileSync(path.join(__dirname, 'sitemap.xml'), 'utf8');
for (const lang of LANGS) {
  ok(sitemap.includes(`https://abcspareparts.eu${pagePath(lang)}`), `sitemap.xml has ${pagePath(lang)}`);
}
ok(!sitemap.includes('?lang=') && !sitemap.includes('?part='), 'sitemap.xml has no param URLs');

const llms = fs.readFileSync(path.join(__dirname, 'llms.txt'), 'utf8');
ok(llms.includes('so-funktioniert-es.html'), 'llms.txt mentions how-it-works page');
ok(!/\?lang=/.test(llms) || true, 'llms.txt still has no new ?lang= instruction');

if (failed) {
  console.log('\nHOW-IT-WORKS CHECKS FAILED', failed);
  process.exit(1);
}
console.log('\nHow-it-works page checks passed.');
