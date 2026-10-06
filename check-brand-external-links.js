#!/usr/bin/env node
'use strict';

/**
 * Business rule validator: brand pages must NEVER contain external manufacturer links.
 * 
 * This script checks:
 * 1. brand-content.json for external URLs (manufacturer domains, wikipedia)
 * 2. Generated /marche/*.html pages for external URLs in brand-content-derived sections
 * 
 * Allowed domains:
 * - abcspareparts.eu (site's own domain)
 * - schema.org (JSON-LD vocabulary)
 * - Known third-party assets (fonts, analytics) already present on all pages
 */

const fs = require('fs');
const path = require('path');

const BRAND_CONTENT_PATH = path.join(__dirname, 'brand-content.json');
const MARCHE_DIR = path.join(__dirname, 'marche');

// Domains that are allowed (site's own and schema.org)
const ALLOWED_DOMAINS = [
  'abcspareparts.eu',
  'schema.org',
  'wa.me', // WhatsApp (site-wide contact)
  'erp.abcspareparts.eu' // Contact form iframe
];

// Known external manufacturer domains that should NOT appear
const FORBIDDEN_DOMAINS = [
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

function extractDomain(url) {
  try {
    const match = url.match(/https?:\/\/([^/]+)/i);
    return match ? match[1].toLowerCase() : null;
  } catch (e) {
    return null;
  }
}

function isAllowedUrl(url) {
  if (!url || typeof url !== 'string') return true;
  const lower = url.toLowerCase();
  if (!lower.startsWith('http://') && !lower.startsWith('https://')) return true;
  
  const domain = extractDomain(url);
  if (!domain) return true;
  
  // Check if domain is allowed
  for (const allowed of ALLOWED_DOMAINS) {
    if (domain === allowed || domain.endsWith('.' + allowed)) {
      return true;
    }
  }
  
  return false;
}

function isForbiddenUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const lower = url.toLowerCase();
  if (!lower.startsWith('http://') && !lower.startsWith('https://')) return false;
  
  const domain = extractDomain(url);
  if (!domain) return false;
  
  // Check if domain is forbidden
  for (const forbidden of FORBIDDEN_DOMAINS) {
    if (domain === forbidden || domain.endsWith('.' + forbidden)) {
      return true;
    }
  }
  
  return false;
}

function findUrlsInObject(obj, path = '', results = []) {
  if (typeof obj === 'string') {
    // Check for URLs in string
    const urlPattern = /https?:\/\/[^\s"'<>]+/gi;
    const matches = obj.match(urlPattern);
    if (matches) {
      for (const url of matches) {
        if (!isAllowedUrl(url)) {
          results.push({ path, url });
        }
      }
    }
  } else if (Array.isArray(obj)) {
    obj.forEach((item, i) => {
      findUrlsInObject(item, `${path}[${i}]`, results);
    });
  } else if (obj && typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      findUrlsInObject(value, path ? `${path}.${key}` : key, results);
    }
  }
  
  return results;
}

function checkBrandContentJson() {
  console.log('📄 Checking brand-content.json...\n');
  
  const content = JSON.parse(fs.readFileSync(BRAND_CONTENT_PATH, 'utf8'));
  const errors = [];
  
  for (const [slug, brandData] of Object.entries(content)) {
    const urls = findUrlsInObject(brandData, slug);
    if (urls.length > 0) {
      errors.push({ brand: slug, urls });
    }
  }
  
  if (errors.length === 0) {
    console.log('  ✅ No external URLs found in brand-content.json\n');
    return true;
  } else {
    console.log(`  ❌ Found external URLs in ${errors.length} brand(s):\n`);
    for (const { brand, urls } of errors) {
      console.log(`  Brand: ${brand}`);
      for (const { path, url } of urls) {
        console.log(`    ${path}: ${url}`);
      }
      console.log('');
    }
    return false;
  }
}

function checkGeneratedPages() {
  console.log('📄 Checking generated /marche/*.html pages...\n');
  
  if (!fs.existsSync(MARCHE_DIR)) {
    console.log('  ⚠️  marche/ directory not found. Run generate-brand-pages.js first.\n');
    return true;
  }
  
  const files = fs.readdirSync(MARCHE_DIR).filter(f => f.endsWith('.html'));
  const errors = [];
  let checked = 0;
  
  for (const file of files) {
    const filePath = path.join(MARCHE_DIR, file);
    const html = fs.readFileSync(filePath, 'utf8');
    
    // Extract JSON-LD script content
    const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (jsonLdMatch) {
      const jsonContent = jsonLdMatch[1];
      
      // Check for forbidden URLs in JSON-LD
      const urlPattern = /https?:\/\/[^\s"'<>]+/gi;
      const urls = jsonContent.match(urlPattern) || [];
      
      for (const url of urls) {
        if (isForbiddenUrl(url)) {
          errors.push({ file, section: 'JSON-LD', url });
        }
      }
    }
    
    // Check HTML content (exclude scripts)
    const htmlWithoutScripts = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
    
    // Look for forbidden domains in href and src attributes
    const attrPattern = /(?:href|src)=["']([^"']+)["']/gi;
    let match;
    while ((match = attrPattern.exec(htmlWithoutScripts)) !== null) {
      const url = match[1];
      if (isForbiddenUrl(url)) {
        errors.push({ file, section: 'HTML attributes', url });
      }
    }
    
    // Look for forbidden URLs in visible text (brand notes, etc.)
    const textUrlPattern = /https?:\/\/[^\s<>"']+/gi;
    const textMatches = htmlWithoutScripts.match(textUrlPattern) || [];
    for (const url of textMatches) {
      if (isForbiddenUrl(url)) {
        errors.push({ file, section: 'visible text', url });
      }
    }
    
    checked++;
  }
  
  if (errors.length === 0) {
    console.log(`  ✅ Checked ${checked} pages, no forbidden URLs found\n`);
    return true;
  } else {
    console.log(`  ❌ Found forbidden URLs in ${errors.length} location(s):\n`);
    for (const { file, section, url } of errors) {
      console.log(`  ${file} (${section}): ${url}`);
    }
    console.log('');
    return false;
  }
}

function main() {
  console.log('🔍 Brand External Links Validator');
  console.log('Business rule: /marche/<slug>.html pages must contain NO external manufacturer links\n');
  console.log('='.repeat(70) + '\n');
  
  const jsonOk = checkBrandContentJson();
  const pagesOk = checkGeneratedPages();
  
  console.log('='.repeat(70));
  if (jsonOk && pagesOk) {
    console.log('✅ All checks passed!\n');
    process.exit(0);
  } else {
    console.log('❌ Validation failed. See errors above.\n');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkBrandContentJson, checkGeneratedPages };
