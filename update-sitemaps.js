'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BASE_URL = 'https://abcspareparts.eu';
const TODAY = new Date().toISOString().slice(0, 10);

function updateMainSitemap() {
  // Update sitemap.xml to include language versions of homepage
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <!-- Homepage - German (default) with language alternates -->
  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="de" href="${BASE_URL}/"/>
    <xhtml:link rel="alternate" hreflang="en" href="${BASE_URL}/en/"/>
    <xhtml:link rel="alternate" hreflang="it" href="${BASE_URL}/it/"/>
    <xhtml:link rel="alternate" hreflang="es" href="${BASE_URL}/es/"/>
    <xhtml:link rel="alternate" hreflang="fr" href="${BASE_URL}/fr/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}/"/>
  </url>
  <!-- Homepage - English -->
  <url>
    <loc>${BASE_URL}/en/</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="de" href="${BASE_URL}/"/>
    <xhtml:link rel="alternate" hreflang="en" href="${BASE_URL}/en/"/>
    <xhtml:link rel="alternate" hreflang="it" href="${BASE_URL}/it/"/>
    <xhtml:link rel="alternate" hreflang="es" href="${BASE_URL}/es/"/>
    <xhtml:link rel="alternate" hreflang="fr" href="${BASE_URL}/fr/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}/"/>
  </url>
  <!-- Homepage - Italian -->
  <url>
    <loc>${BASE_URL}/it/</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="de" href="${BASE_URL}/"/>
    <xhtml:link rel="alternate" hreflang="en" href="${BASE_URL}/en/"/>
    <xhtml:link rel="alternate" hreflang="it" href="${BASE_URL}/it/"/>
    <xhtml:link rel="alternate" hreflang="es" href="${BASE_URL}/es/"/>
    <xhtml:link rel="alternate" hreflang="fr" href="${BASE_URL}/fr/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}/"/>
  </url>
  <!-- Marche directory - German with language alternates -->
  <url>
    <loc>${BASE_URL}/marche.html</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="de" href="${BASE_URL}/marche.html"/>
    <xhtml:link rel="alternate" hreflang="en" href="${BASE_URL}/en/marche.html"/>
    <xhtml:link rel="alternate" hreflang="it" href="${BASE_URL}/it/marche.html"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}/marche.html"/>
  </url>
  <!-- Marche directory - English -->
  <url>
    <loc>${BASE_URL}/en/marche.html</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
    <xhtml:link rel="alternate" hreflang="de" href="${BASE_URL}/marche.html"/>
    <xhtml:link rel="alternate" hreflang="en" href="${BASE_URL}/en/marche.html"/>
    <xhtml:link rel="alternate" hreflang="it" href="${BASE_URL}/it/marche.html"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}/marche.html"/>
  </url>
  <!-- Marche directory - Italian -->
  <url>
    <loc>${BASE_URL}/it/marche.html</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
    <xhtml:link rel="alternate" hreflang="de" href="${BASE_URL}/marche.html"/>
    <xhtml:link rel="alternate" hreflang="en" href="${BASE_URL}/en/marche.html"/>
    <xhtml:link rel="alternate" hreflang="it" href="${BASE_URL}/it/marche.html"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}/marche.html"/>
  </url>
  <!-- Success stories hub -->
  <url>
    <loc>${BASE_URL}/casi.html</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;
  
  fs.writeFileSync('sitemap.xml', sitemap, 'utf8');
  console.log('✓ Updated sitemap.xml');
}

function createLegalSitemap() {
  const legalPages = ['impressum', 'datenschutz', 'agb', 'versand', 'cookies'];
  const languages = ['de', 'en', 'it', 'es', 'fr'];
  
  let urls = '';
  
  for (const page of legalPages) {
    // German version
    urls += `  <url>
    <loc>${BASE_URL}/${page}.html</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
    <xhtml:link rel="alternate" hreflang="de" href="${BASE_URL}/${page}.html"/>
    <xhtml:link rel="alternate" hreflang="en" href="${BASE_URL}/en/${page}.html"/>
    <xhtml:link rel="alternate" hreflang="it" href="${BASE_URL}/it/${page}.html"/>
    <xhtml:link rel="alternate" hreflang="es" href="${BASE_URL}/es/${page}.html"/>
    <xhtml:link rel="alternate" hreflang="fr" href="${BASE_URL}/fr/${page}.html"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}/${page}.html"/>
  </url>
`;
    
    // Other language versions
    for (const lang of ['en', 'it', 'es', 'fr']) {
      urls += `  <url>
    <loc>${BASE_URL}/${lang}/${page}.html</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
    <xhtml:link rel="alternate" hreflang="de" href="${BASE_URL}/${page}.html"/>
    <xhtml:link rel="alternate" hreflang="en" href="${BASE_URL}/en/${page}.html"/>
    <xhtml:link rel="alternate" hreflang="it" href="${BASE_URL}/it/${page}.html"/>
    <xhtml:link rel="alternate" hreflang="es" href="${BASE_URL}/es/${page}.html"/>
    <xhtml:link rel="alternate" hreflang="fr" href="${BASE_URL}/fr/${page}.html"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}/${page}.html"/>
  </url>
`;
    }
  }
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}</urlset>`;
  
  fs.writeFileSync('sitemap-legal.xml', sitemap, 'utf8');
  console.log('✓ Created sitemap-legal.xml');
}

function getLastCommitDate(filePath) {
  try {
    const result = execSync(
      `git log -1 --format=%ci -- "${filePath}" 2>/dev/null`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
    ).trim();
    
    if (result) {
      return result.split(' ')[0];
    }
  } catch (err) {
    // File not tracked or error
  }
  
  if (fs.existsSync(filePath)) {
    const stat = fs.statSync(filePath);
    return stat.mtime.toISOString().slice(0, 10);
  }
  
  return null;
}

function updateBrandsSitemap() {
  const brandContent = JSON.parse(fs.readFileSync('brand-content.json', 'utf8'));
  const brandSlugs = Object.keys(brandContent).sort();
  
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
    }
  }
  
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
  console.log(`✓ Updated sitemap-brands.xml (${entries.length} brands)`);
}

function getFileLastMod(filePath) {
  const lastmod = getLastCommitDate(filePath);
  return lastmod || TODAY;
}

function updateSitemapIndex() {
  const brandsLastmod = getFileLastMod('sitemap-brands.xml');
  const partsLastmod = getFileLastMod('sitemap-parts.xml');
  const brandPartsLastmod = getFileLastMod('sitemap-brand-parts.xml');
  const casesLastmod = getFileLastMod('sitemap-cases.xml');
  
  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${BASE_URL}/sitemap.xml</loc>
    <lastmod>${TODAY}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-legal.xml</loc>
    <lastmod>${TODAY}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-brands.xml</loc>
    <lastmod>${brandsLastmod}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-parts.xml</loc>
    <lastmod>${partsLastmod}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-brand-parts.xml</loc>
    <lastmod>${brandPartsLastmod}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-cases.xml</loc>
    <lastmod>${casesLastmod}</lastmod>
  </sitemap>
</sitemapindex>`;
  
  fs.writeFileSync('sitemap-index.xml', sitemapIndex, 'utf8');
  console.log('✓ Updated sitemap-index.xml');
}

console.log('📄 Updating sitemaps with language alternates...\n');
updateMainSitemap();
createLegalSitemap();
updateBrandsSitemap();
updateSitemapIndex();
console.log('\n✅ Sitemaps updated successfully!');
