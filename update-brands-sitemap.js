#!/usr/bin/env node
'use strict';

const fs = require('fs');
const { execSync } = require('child_process');

const BASE_URL = 'https://abcspareparts.eu';

// Load brand content
const brandContent = JSON.parse(fs.readFileSync('brand-content.json', 'utf8'));
const brandSlugs = Object.keys(brandContent).sort();

console.log(`Found ${brandSlugs.length} enriched brands in brand-content.json`);

// Function to get last commit date for a file
function getLastCommitDate(filePath) {
  try {
    const result = execSync(
      `git log -1 --format=%ci -- "${filePath}" 2>/dev/null`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
    ).trim();
    
    if (result) {
      // Convert to YYYY-MM-DD format
      return result.split(' ')[0];
    }
  } catch (err) {
    // File not tracked or error
  }
  
  // Fallback: check if file exists and use current date
  if (fs.existsSync(filePath)) {
    const stat = fs.statSync(filePath);
    return stat.mtime.toISOString().slice(0, 10);
  }
  
  return null;
}

// Generate sitemap entries
const entries = [];

for (const slug of brandSlugs) {
  const filePath = `marche/${slug}.html`;
  const lastmod = getLastCommitDate(filePath);
  
  if (lastmod) {
    entries.push({
      slug,
      url: `${BASE_URL}/marche/${slug}.html`,
      lastmod
    });
  } else {
    console.warn(`⚠️  No commit date found for ${slug}, skipping`);
  }
}

console.log(`Generated ${entries.length} sitemap entries`);

// Generate XML
const xmlHeader = `---
layout: none
---
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

const xmlFooter = `</urlset>`;

const xmlEntries = entries.map(entry => `  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n');

const sitemap = `${xmlHeader}\n${xmlEntries}\n${xmlFooter}`;

fs.writeFileSync('sitemap-brands.xml', sitemap, 'utf8');
console.log('✅ Updated sitemap-brands.xml');
console.log(`   ${entries.length} brand URLs included`);
