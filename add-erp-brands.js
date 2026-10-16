#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const NEW_BRANDS = {
  'scheuerle': {
    brand: 'Scheuerle',
    intro: '',
    products: ['Hydraulic hoses'],
    applications: ['Hydraulic systems', 'Industrial machinery'],
    faq: [],
    related_slugs: ['hydac', 'rexroth', 'parker'],
    related_labels: {},
    faq_after: [],
    blocks: []
  },
  'brovind': {
    brand: 'BROVIND',
    intro: '',
    products: ['Connectors', 'Vibration equipment'],
    applications: ['Industrial automation', 'Manufacturing'],
    faq: [],
    related_slugs: ['harting', 'phoenix-contact'],
    related_labels: {},
    faq_after: [],
    blocks: []
  },
  'gorter': {
    brand: 'Gorter',
    intro: '',
    products: ['Valve components', 'Regulating valve parts'],
    applications: ['Process control', 'Industrial valves'],
    faq: [],
    related_slugs: ['burkert', 'imi-norgren'],
    related_labels: {},
    faq_after: [],
    blocks: []
  },
  'sepatron': {
    brand: 'SEPATRON',
    intro: '',
    products: ['HPLC columns', 'Chromatography equipment'],
    applications: ['Laboratory equipment', 'Analytical chemistry'],
    faq: [],
    related_slugs: ['agilent', 'thermo-fisher'],
    related_labels: {},
    faq_after: [],
    blocks: []
  },
  'madatec': {
    brand: 'MADATEC',
    intro: '',
    products: ['Laboratory vials', 'Septa', 'Sample containers'],
    applications: ['Laboratory equipment', 'Sample analysis'],
    faq: [],
    related_slugs: ['thermo-fisher'],
    related_labels: {},
    faq_after: [],
    blocks: []
  },
  'omec': {
    brand: 'Omec',
    intro: '',
    products: ['Electric motors'],
    applications: ['Industrial drives', 'Machine automation'],
    faq: [],
    related_slugs: ['siemens', 'abb', 'sew-eurodrive'],
    related_labels: {},
    faq_after: [],
    blocks: []
  },
  'steimel': {
    brand: 'Steimel',
    intro: '',
    products: ['Pump units', 'Industrial pumps'],
    applications: ['Hydraulic systems', 'Fluid handling'],
    faq: [],
    related_slugs: ['grundfos', 'hydac'],
    related_labels: {},
    faq_after: [],
    blocks: []
  },
  'auo': {
    brand: 'AUO',
    intro: '',
    products: ['LCD displays', 'Display panels'],
    applications: ['Industrial displays', 'HMI panels'],
    faq: [],
    related_slugs: ['siemens', 'schneider-electric'],
    related_labels: {},
    faq_after: [],
    blocks: []
  },
  'roemheld': {
    brand: 'Römheld',
    intro: '',
    products: ['Hydraulic cylinders', 'Clamping technology'],
    applications: ['Machine tools', 'Hydraulic systems'],
    faq: [],
    related_slugs: ['hydac', 'rexroth', 'parker'],
    related_labels: {},
    faq_after: [],
    blocks: []
  },
  'matrix-elektronik': {
    brand: 'Matrix Elektronik',
    intro: '',
    products: ['Industrial sensors', 'Electronic components'],
    applications: ['Industrial automation', 'Sensor technology'],
    faq: [],
    related_slugs: ['sick', 'ifm', 'pepperl-plus-fuchs'],
    related_labels: {},
    faq_after: [],
    blocks: []
  },
  'walterscheid': {
    brand: 'Walterscheid',
    intro: '',
    products: ['Hydraulic couplings', 'Drive components'],
    applications: ['Hydraulic systems', 'Power transmission'],
    faq: [],
    related_slugs: ['hydac', 'rexroth', 'parker'],
    related_labels: {},
    faq_after: [],
    blocks: []
  },
  'newhaven-display': {
    brand: 'NEWHAVEN DISPLAY',
    intro: '',
    products: ['LCD displays', 'LED displays'],
    applications: ['Industrial HMI', 'Display solutions'],
    faq: [],
    related_slugs: ['siemens', 'schneider-electric'],
    related_labels: {},
    faq_after: [],
    blocks: []
  },
  'intercable-tools': {
    brand: 'Intercable tools',
    intro: '',
    products: ['Pressing tools', 'Cable tools'],
    applications: ['Cable assembly', 'Industrial tools'],
    faq: [],
    related_slugs: ['phoenix-contact', 'harting'],
    related_labels: {},
    faq_after: [],
    blocks: []
  },
  'kpm': {
    brand: 'KPM',
    intro: '',
    products: ['Hydraulic splitters', 'Hydraulic tools'],
    applications: ['Hydraulic systems', 'Industrial maintenance'],
    faq: [],
    related_slugs: ['hydac', 'rexroth'],
    related_labels: {},
    faq_after: [],
    blocks: []
  },
  'wayne': {
    brand: 'Wayne',
    intro: '',
    products: ['Electronic boards', 'Control systems'],
    applications: ['Industrial automation', 'Control electronics'],
    faq: [],
    related_slugs: ['siemens', 'schneider-electric', 'rockwell'],
    related_labels: {},
    faq_after: [],
    blocks: []
  }
};

const ROOT = __dirname;
const contentPath = path.join(ROOT, 'brand-content.json');
const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));

console.log('Adding 15 ERP brands...\n');
let added = 0;
for (const [slug, data] of Object.entries(NEW_BRANDS)) {
  if (!content[slug]) {
    content[slug] = data;
    added++;
    console.log(`  ✓ ${slug} (${data.brand})`);
  }
}

fs.writeFileSync(contentPath, JSON.stringify(content, null, 2) + '\n', 'utf8');
console.log(`\n✅ Added ${added} brands (total: ${Object.keys(content).length})`);
