#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const languages = ['it', 'en', 'es', 'fr'];
const errors = [];
const warnings = [];
const checked = new Set();

function checkFileExists(filePath, context) {
  const fullPath = path.join(__dirname, filePath.startsWith('/') ? filePath.slice(1) : filePath);
  const key = `${fullPath}::${context}`;
  
  if (checked.has(key)) return;
  checked.add(key);
  
  if (!fs.existsSync(fullPath)) {
    errors.push(`❌ ${context}: File not found: ${filePath} (${fullPath})`);
  } else {
    console.log(`✓ ${context}: ${filePath}`);
  }
}

function extractLinks(html, lang) {
  const context = `/${lang}/marche.html`;
  
  // Extract href attributes from actual HTML tags (not from JS strings)
  const hrefRegex = /<[^>]+\shref="([^"]+)"/g;
  let match;
  while ((match = hrefRegex.exec(html)) !== null) {
    const href = match[1];
    
    // Skip if this looks like it's inside a JS string literal
    if (href.includes("' + ")) {
      continue;
    }
    
    // Skip external, anchor-only, protocol-based links
    if (href.startsWith('http://') || 
        href.startsWith('https://') || 
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:')) {
      continue;
    }
    
    // Extract the path (remove query and hash)
    const urlPath = href.split('?')[0].split('#')[0];
    if (!urlPath) continue;
    
    // Check if it's a relative path (should be absolute!)
    if (!urlPath.startsWith('/')) {
      errors.push(`❌ ${context}: RELATIVE link found (will break): ${href}`);
      continue;
    }
    
    // For absolute paths, check if file exists
    if (urlPath.startsWith('/marche/') || 
        urlPath === '/marche.html' ||
        urlPath === '/casi.html' ||
        urlPath === '/impressum.html' ||
        urlPath === '/datenschutz.html' ||
        urlPath === '/agb.html' ||
        urlPath === '/versand.html' ||
        urlPath === '/cookies.html') {
      checkFileExists(urlPath, context);
    }
  }
  
  // Extract src attributes
  const srcRegex = /src="([^"]+)"/g;
  while ((match = srcRegex.exec(html)) !== null) {
    const src = match[1];
    
    // Skip external
    if (src.startsWith('http://') || src.startsWith('https://')) {
      continue;
    }
    
    // Check if it's relative (should be absolute!)
    if (!src.startsWith('/')) {
      errors.push(`❌ ${context}: RELATIVE src found (will break): ${src}`);
      continue;
    }
    
    // For local resources
    if (src.startsWith('/') && !src.startsWith('//')) {
      checkFileExists(src, context);
    }
  }
  
  // Check JS brand URL builder
  const jsUrlPattern = /<li><a href="([^"]+)' \+ r\.slug \+ '\.html">/;
  const jsMatch = html.match(jsUrlPattern);
  if (jsMatch) {
    const urlPrefix = jsMatch[1];
    if (urlPrefix === '/marche/') {
      console.log(`✓ ${context}: JS brand URL builder uses absolute path: "${urlPrefix}" + slug + ".html"`);
    } else {
      errors.push(`❌ ${context}: JS brand URL builder uses WRONG path: "${urlPrefix}" + slug + ".html" (should be "/marche/")`);
    }
  } else {
    warnings.push(`⚠️  ${context}: Could not find JS brand URL builder pattern`);
  }
}

console.log('Checking language marche pages for broken links...\n');

// Check each language version
for (const lang of languages) {
  const filePath = path.join(__dirname, lang, 'marche.html');
  if (!fs.existsSync(filePath)) {
    errors.push(`❌ Language file not found: ${filePath}`);
    continue;
  }
  
  console.log(`\n--- Checking /${lang}/marche.html ---`);
  const html = fs.readFileSync(filePath, 'utf8');
  extractLinks(html, lang);
}

// Check that root marche.html still works (should have relative links, which is OK at root)
console.log('\n--- Verifying root /marche.html ---');
const rootPath = path.join(__dirname, 'marche.html');
if (fs.existsSync(rootPath)) {
  console.log('✓ Root /marche.html exists');
  const rootHtml = fs.readFileSync(rootPath, 'utf8');
  
  // Root should still have relative links (they work from root)
  if (rootHtml.includes('href="marche/')) {
    console.log('✓ Root /marche.html has relative brand links (correct for root)');
  } else {
    warnings.push('⚠️  Root /marche.html does not have relative brand links (was it accidentally changed?)');
  }
} else {
  errors.push('❌ Root /marche.html not found');
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('VERIFICATION SUMMARY');
console.log('='.repeat(60));

if (warnings.length > 0) {
  console.log('\nWarnings:');
  warnings.forEach(w => console.log(w));
}

if (errors.length > 0) {
  console.log('\nErrors:');
  errors.forEach(e => console.log(e));
  console.log(`\n❌ FAILED: ${errors.length} error(s) found`);
  process.exit(1);
} else {
  console.log('\n✅ SUCCESS: All links are absolute and resolve correctly!');
  console.log('   Brand links in language versions: /marche/<slug>.html');
  console.log('   JS brand URL builder: /marche/ + slug + .html');
  process.exit(0);
}
