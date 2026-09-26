#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');

const PORT = 8081;
const BASE_URL = `http://localhost:${PORT}`;
const LANGUAGES = ['en', 'it', 'es', 'fr'];
const PAGES_TO_CHECK = [
  'index.html',
  'impressum.html',
  'datenschutz.html',
  'agb.html',
  'versand.html',
  'cookies.html',
  'marche.html'
];

// Extract all src/href/srcset from HTML
function extractLinks(html, pageUrl) {
  const links = new Set();
  
  // Remove <script> blocks to avoid matching strings in JavaScript code
  const htmlWithoutScripts = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  
  // Match src="..." and href="..."
  const srcRegex = /(?:src|href|srcset)="([^"]+)"/g;
  let match;
  
  while ((match = srcRegex.exec(htmlWithoutScripts)) !== null) {
    const url = match[1];
    
    // Skip external URLs, mailto, tel, and pure anchors
    if (url.startsWith('http://') || 
        url.startsWith('https://') || 
        url.startsWith('mailto:') ||
        url.startsWith('tel:') ||
        url.startsWith('#') ||
        url.startsWith('data:')) {
      continue;
    }
    
    // For srcset, split by comma and extract URLs
    if (match[0].startsWith('srcset=')) {
      const srcsetUrls = url.split(',').map(s => s.trim().split(' ')[0]);
      srcsetUrls.forEach(u => links.add(u));
    } else {
      links.add(url);
    }
  }
  
  // Also check CSS url() in style tags and attributes (but not in script tags, already removed)
  const cssUrlRegex = /url\(['"]?([^'"()]+)['"]?\)/g;
  while ((match = cssUrlRegex.exec(htmlWithoutScripts)) !== null) {
    const url = match[1];
    if (!url.startsWith('http://') && 
        !url.startsWith('https://') && 
        !url.startsWith('data:')) {
      links.add(url);
    }
  }
  
  return Array.from(links);
}

// Check if URL returns 200
function checkUrl(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      resolve({ url, status: res.statusCode, ok: res.statusCode === 200 });
    }).on('error', (err) => {
      resolve({ url, status: 'ERROR', ok: false, error: err.message });
    });
  });
}

async function checkPage(langPath) {
  const pageUrl = `${BASE_URL}${langPath}`;
  console.log(`\n📄 Checking: ${pageUrl}`);
  
  try {
    const response = await fetch(pageUrl);
    if (!response.ok) {
      console.error(`  ❌ Page itself returned ${response.status}`);
      return { page: langPath, errors: [`Page returned ${response.status}`] };
    }
    
    const html = await response.text();
    const links = extractLinks(html, pageUrl);
    
    console.log(`  Found ${links.length} links to check`);
    
    const errors = [];
    const checks = [];
    
    for (const link of links) {
      // Resolve relative URLs
      let checkUrl;
      if (link.startsWith('/')) {
        checkUrl = `${BASE_URL}${link}`;
      } else {
        // Relative to page
        const pagePath = langPath.substring(0, langPath.lastIndexOf('/') + 1);
        const resolvedPath = path.posix.normalize(pagePath + link);
        checkUrl = `${BASE_URL}${resolvedPath}`;
      }
      
      checks.push(
        fetch(checkUrl, { method: 'HEAD' })
          .then(res => {
            if (!res.ok) {
              const error = `  ❌ ${link} → ${res.status}`;
              console.error(error);
              errors.push(error);
            } else {
              console.log(`  ✓ ${link}`);
            }
          })
          .catch(err => {
            const error = `  ❌ ${link} → ERROR: ${err.message}`;
            console.error(error);
            errors.push(error);
          })
      );
    }
    
    await Promise.all(checks);
    
    return { page: langPath, errors };
  } catch (err) {
    console.error(`  ❌ Failed to fetch page: ${err.message}`);
    return { page: langPath, errors: [`Failed to fetch: ${err.message}`] };
  }
}

async function main() {
  console.log('🔍 Language Pages Link Checker\n');
  console.log(`Starting HTTP server on port ${PORT}...`);
  
  // Start a simple HTTP server
  const server = http.createServer((req, res) => {
    let filePath = path.join(__dirname, req.url);
    
    // Default to index.html for directories
    if (filePath.endsWith('/')) {
      filePath = path.join(filePath, 'index.html');
    }
    
    // Remove query strings
    filePath = filePath.split('?')[0];
    
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not Found');
        return;
      }
      
      const ext = path.extname(filePath);
      const contentTypes = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.svg': 'image/svg+xml',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.txt': 'text/plain'
      };
      
      res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'application/octet-stream' });
      res.end(data);
    });
  });
  
  server.listen(PORT);
  
  // Wait for server to be ready
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const allResults = [];
  
  // Check all language pages
  for (const lang of LANGUAGES) {
    for (const page of PAGES_TO_CHECK) {
      const langPath = `/${lang}/${page}`;
      const result = await checkPage(langPath);
      allResults.push(result);
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  
  const failedPages = allResults.filter(r => r.errors.length > 0);
  
  if (failedPages.length === 0) {
    console.log('\n✅ All checks passed! No broken links found.\n');
    server.close();
    process.exit(0);
  } else {
    console.log(`\n❌ Found issues in ${failedPages.length} page(s):\n`);
    failedPages.forEach(result => {
      console.log(`${result.page}:`);
      result.errors.forEach(err => console.log(`  ${err}`));
      console.log('');
    });
    server.close();
    process.exit(1);
  }
}

// Use native fetch (Node 18+)
const fetch = globalThis.fetch || require('node-fetch');

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
