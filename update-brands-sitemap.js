#!/usr/bin/env node
'use strict';

/**
 * Compatibility wrapper. Brand sitemaps are generated from on-disk
 * indexable marche/*.html pages (not brand-content.json).
 */
const { writeBrandSitemaps } = require('./write-brand-sitemaps.js');
const { writeSitemapIndex } = require('./build-brand-parts.js');

const result = writeBrandSitemaps();
writeSitemapIndex();
console.log('✅ Updated brand sitemaps + sitemap-index.xml');
console.log(`   ${result.urlCount} brand URLs in ${result.files.join(', ')}`);
