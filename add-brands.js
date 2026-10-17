#!/usr/bin/env node
'use strict';

const fs = require('fs');

// Read current brand-slugs.json
const slugs = JSON.parse(fs.readFileSync('brand-slugs.json', 'utf8'));

// Add new brands
slugs['MULAG'] = 'mulag';
slugs['SIGLOCH'] = 'sigloch';
slugs['MTU'] = 'mtu';

// Add aliases
slugs['Mtu'] = 'mtu';
slugs['Radio energie'] = 'radio-energie';
slugs['Kolbus'] = 'kolbus';

// Write back
fs.writeFileSync('brand-slugs.json', JSON.stringify(slugs, null, 2) + '\n', 'utf8');

console.log('✅ Added MULAG, SIGLOCH, MTU and aliases to brand-slugs.json');
console.log('Total brands:', Object.keys(slugs).length);
