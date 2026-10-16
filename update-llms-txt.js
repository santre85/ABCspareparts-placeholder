#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://abcspareparts.eu';

// Load brand content
const brandContent = JSON.parse(fs.readFileSync('brand-content.json', 'utf8'));
const brandSlugs = Object.keys(brandContent).sort();

console.log(`Found ${brandSlugs.length} enriched brands`);

// Extract brand information from HTML files
const brandDescriptions = {};

for (const slug of brandSlugs) {
  const htmlPath = `marche/${slug}.html`;
  
  if (!fs.existsSync(htmlPath)) {
    console.warn(`⚠️  ${slug}: HTML file not found`);
    continue;
  }
  
  const html = fs.readFileSync(htmlPath, 'utf8');
  
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/);
  if (!titleMatch) {
    console.warn(`⚠️  ${slug}: No title found`);
    continue;
  }
  
  const title = titleMatch[1];
  
  // Extract the brand name and specialization from the title
  // Format: "Brand Name Products/Specialization – Ersatzteile | ABCspareparts"
  const parts = title.split('–')[0].trim();
  
  // Try to find a better description from meta description
  const descMatch = html.match(/<meta[^>]+name="description"[^>]+content="([^"]+)"/);
  let description = parts;
  
  if (descMatch) {
    const metaDesc = descMatch[1];
    // Use meta description if it's more informative
    if (metaDesc && metaDesc.length > 20 && !metaDesc.includes('Ersatzteile beschaffen')) {
      description = metaDesc.split('.')[0].trim();
    }
  }
  
  // Clean up the description - remove common suffixes
  description = description
    .replace(/\s*–\s*Ersatzteile.*$/i, '')
    .replace(/\s*\|\s*ABC.*$/i, '')
    .trim();
  
  brandDescriptions[slug] = {
    name: getBrandDisplayName(slug),
    description,
    url: `${BASE_URL}/marche/${slug}.html`
  };
}

function getBrandDisplayName(slug) {
  // Convert slug to display name
  return slug
    .split('-')
    .map(word => {
      // Keep certain words lowercase
      if (['and', 'plus', 'of', 'de', 'di'].includes(word)) return word;
      // Uppercase known acronyms
      if (word.length <= 3 && word === word.toLowerCase()) {
        return word.toUpperCase();
      }
      // Title case
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ')
    .replace(/\bPlus\b/g, '+')
    .replace(/\bAnd\b/g, '&');
}

console.log(`Extracted descriptions for ${Object.keys(brandDescriptions).length} brands`);

// Read current llms.txt
const llmsTxt = fs.readFileSync('llms.txt', 'utf8');

// Remove outdated claims
let updated = llmsTxt
  .replace(/Brand pages are German-only\./g, '')
  .replace(/only ~47 are actively indexed/g, '105+ enriched brands are detailed below')
  .replace(/\(many thousands of brand pages exist, but only ~47 are actively indexed\)/g, '(105+ enriched brand pages with detailed content are listed below)')
  .replace(/many thousands of brand pages exist, but [^)]+\)/g, '105+ enriched brand pages with detailed multilingual content)')
  .trim();

// Find where to insert the brand section (after the main brand directory description)
const insertAfter = '## Brand pages with quotable part numbers';

if (!updated.includes(insertAfter)) {
  console.error('Could not find insertion point in llms.txt');
  process.exit(1);
}

// Generate brand listing section
let brandSection = '\n\n## Brand pages with detailed content\n\n';
brandSection += `ABCspareparts maintains ${brandSlugs.length} enriched brand pages with detailed product information, applications, and technical specifications. Each page is available in multiple languages (DE/EN/IT/ES/FR) via an on-page language selector. No manufacturer contact details or price lists are published.\n\n`;

for (const slug of brandSlugs) {
  if (!brandDescriptions[slug]) continue;
  
  const brand = brandDescriptions[slug];
  brandSection += `- [${brand.name}](${brand.url}): ${brand.description}\n`;
}

// Insert the brand section before "## Full part number catalog"
const catalogSection = '## Full part number catalog';
if (updated.includes(catalogSection)) {
  updated = updated.replace(catalogSection, brandSection + '\n' + catalogSection);
} else {
  // Fallback: add at the end of part numbers section
  const successSection = '## Success story pages';
  if (updated.includes(successSection)) {
    updated = updated.replace(successSection, brandSection + '\n' + successSection);
  } else {
    updated += brandSection;
  }
}

// Write updated llms.txt
fs.writeFileSync('llms.txt', updated, 'utf8');
console.log('✅ Updated llms.txt');
console.log(`   Added ${Object.keys(brandDescriptions).length} enriched brand descriptions`);
