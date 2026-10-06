#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const BRAND_CONTENT_PATH = path.join(__dirname, 'brand-content.json');

// List of manufacturer domains to remove
const EXTERNAL_DOMAINS = [
  'adata.com',
  'apoelmos.com',
  'apoelmos.cz',
  '3m.com',
  'aaeon.com',
  'wikipedia.org',
  'multimedia.3m.com',
  'investors.3m.com',
  'industrial.adata.com',
  'abbalinear.com',
  'abb.com',
  'striebelundjohn.com',
  'abelpumps.com',
  'binzel-abicor.com',
  'abtrasmissioni.it',
  'aalborg.com'
];

function isExternalUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const lower = url.toLowerCase();
  if (!lower.startsWith('http://') && !lower.startsWith('https://')) return false;
  
  // Allow abcspareparts.eu and schema.org
  if (lower.includes('abcspareparts.eu') || lower.includes('schema.org')) return false;
  
  return true;
}

function removeLinksFromText(text) {
  if (!text || typeof text !== 'string') return text;
  
  // Remove <a href="...external...">text</a> tags with external URLs
  let cleaned = text;
  
  // Pattern: <a href="https://..." ...>...</a>
  const linkPattern = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi;
  
  cleaned = cleaned.replace(linkPattern, (match, url, linkText) => {
    if (isExternalUrl(url)) {
      // Remove the link but keep the text context natural
      // If it's in a citation context, just remove it entirely
      return '';
    }
    return match;
  });
  
  // Clean up sentences that reference external sources
  // Pattern: "basieren auf öffentlichen Herstellerinformationen (link)."
  // -> "basieren auf öffentlich zugänglichen Herstellerinformationen."
  cleaned = cleaned.replace(
    /basieren auf öffentlichen Herstellerinformationen[^.]*\./gi,
    'basieren auf öffentlich zugänglichen Herstellerinformationen.'
  );
  cleaned = cleaned.replace(
    /is based on public manufacturer information[^.]*\./gi,
    'is based on publicly available manufacturer information.'
  );
  cleaned = cleaned.replace(
    /si basano su dati pubblici del costruttore[^.]*\./gi,
    'si basano su dati pubblici del costruttore.'
  );
  cleaned = cleaned.replace(
    /se basa en datos públicos del fabricante[^.]*\./gi,
    'se basa en datos públicos del fabricante.'
  );
  cleaned = cleaned.replace(
    /reposent sur des données publiques du fabricant[^.]*\./gi,
    'reposent sur des données publiques du fabricant.'
  );
  
  // Clean up "Angaben basieren auf öffentlichen Informationen (link)."
  cleaned = cleaned.replace(
    /Angaben basieren auf öffentlichen Informationen[^.]*\./gi,
    'Angaben basieren auf öffentlich zugänglichen Informationen.'
  );
  cleaned = cleaned.replace(
    /Information is based on public sources[^.]*\./gi,
    'Information is based on publicly available sources.'
  );
  cleaned = cleaned.replace(
    /Le informazioni si basano su fonti pubbliche[^.]*\./gi,
    'Le informazioni si basano su fonti pubbliche.'
  );
  cleaned = cleaned.replace(
    /La información se basa en fuentes públicas[^.]*\./gi,
    'La información se basa en fuentes públicas.'
  );
  cleaned = cleaned.replace(
    /Les informations reposent sur des sources publiques[^.]*\./gi,
    'Les informations reposent sur des sources publiques.'
  );
  
  // Remove multiple spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

function cleanSchemaObject(schema) {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
    return schema;
  }
  
  const cleaned = { ...schema };
  
  // Remove URL fields
  delete cleaned.url;
  delete cleaned.sameAs;
  delete cleaned.address;
  delete cleaned.telephone;
  delete cleaned.email;
  delete cleaned.contactPoint;
  
  // Recursively clean nested objects
  if (Array.isArray(cleaned.extra)) {
    cleaned.extra = cleaned.extra.map(item => {
      if (typeof item === 'object' && item !== null) {
        const cleanedItem = { ...item };
        delete cleanedItem.url;
        delete cleanedItem.sameAs;
        delete cleanedItem.address;
        delete cleanedItem.telephone;
        delete cleanedItem.email;
        delete cleanedItem.contactPoint;
        return cleanedItem;
      }
      return item;
    });
  }
  
  return cleaned;
}

function cleanBrandContent(brandData) {
  const cleaned = { ...brandData };
  
  // Clean schema
  if (cleaned.schema) {
    cleaned.schema = cleanSchemaObject(cleaned.schema);
  }
  
  // Clean i18n text fields
  if (cleaned.i18n && typeof cleaned.i18n === 'object') {
    const cleanedI18n = {};
    for (const [lang, translations] of Object.entries(cleaned.i18n)) {
      if (typeof translations === 'object' && !Array.isArray(translations)) {
        const cleanedTranslations = {};
        for (const [key, value] of Object.entries(translations)) {
          if (typeof value === 'string') {
            cleanedTranslations[key] = removeLinksFromText(value);
          } else {
            cleanedTranslations[key] = value;
          }
        }
        cleanedI18n[lang] = cleanedTranslations;
      } else {
        cleanedI18n[lang] = translations;
      }
    }
    cleaned.i18n = cleanedI18n;
  }
  
  return cleaned;
}

function main() {
  console.log('Reading brand-content.json...');
  const content = JSON.parse(fs.readFileSync(BRAND_CONTENT_PATH, 'utf8'));
  
  let totalBrands = 0;
  let brandsWithChanges = 0;
  const changedBrands = [];
  
  const cleaned = {};
  
  for (const [slug, brandData] of Object.entries(content)) {
    totalBrands++;
    
    const originalJson = JSON.stringify(brandData);
    const cleanedBrand = cleanBrandContent(brandData);
    const cleanedJson = JSON.stringify(cleanedBrand);
    
    if (originalJson !== cleanedJson) {
      brandsWithChanges++;
      changedBrands.push(slug);
      console.log(`  ✓ Cleaned: ${slug}`);
    }
    
    cleaned[slug] = cleanedBrand;
  }
  
  console.log('\nWriting cleaned brand-content.json...');
  fs.writeFileSync(
    BRAND_CONTENT_PATH,
    JSON.stringify(cleaned, null, 2) + '\n',
    'utf8'
  );
  
  console.log('\n' + '='.repeat(60));
  console.log('Summary:');
  console.log(`  Total brands: ${totalBrands}`);
  console.log(`  Brands with external links removed: ${brandsWithChanges}`);
  console.log('\nBrands cleaned:');
  console.log(changedBrands.join(', '));
  console.log('='.repeat(60));
}

if (require.main === module) {
  main();
}
