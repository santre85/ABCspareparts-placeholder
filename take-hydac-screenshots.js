#!/usr/bin/env node
// Take screenshots of HYDAC page with ERP codes
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:8080';

const VIEWPORT_MOBILE = {
  width: 390,
  height: 1200,
  deviceScaleFactor: 2
};

const VIEWPORT_DESKTOP = {
  width: 1280,
  height: 1200,
  deviceScaleFactor: 1
};

const outDir = path.join(__dirname, 'artifacts', 'screenshots');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, {recursive: true});
}

(async () => {
  console.log('📸 Taking screenshots of HYDAC page with new ERP codes\n');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  // Desktop DE
  console.log('1. Desktop DE screenshot...');
  let page = await browser.newPage();
  await page.setViewport(VIEWPORT_DESKTOP);
  await page.goto(`${BASE_URL}/marche/hydac.html`, {waitUntil: 'networkidle2'});
  await page.waitForSelector('.brand-supplied-parts', {timeout: 5000});
  
  // Scroll to the parts section
  await page.evaluate(() => {
    const section = document.querySelector('.brand-supplied-parts');
    if (section) section.scrollIntoView({behavior: 'auto', block: 'start'});
  });
  
  // Wait a moment for scrolling
  await new Promise(r => setTimeout(r, 500));
  
  // Take screenshot of the parts section
  const partsSection = await page.$('.brand-supplied-parts');
  if (partsSection) {
    await partsSection.screenshot({path: path.join(outDir, 'hydac-de-desktop-parts.png')});
    console.log('   ✅ hydac-de-desktop-parts.png');
  }
  await page.close();
  
  // Mobile DE
  console.log('2. Mobile DE screenshot...');
  page = await browser.newPage();
  await page.setViewport(VIEWPORT_MOBILE);
  await page.goto(`${BASE_URL}/marche/hydac.html`, {waitUntil: 'networkidle2'});
  await page.waitForSelector('.brand-supplied-parts', {timeout: 5000});
  
  await page.evaluate(() => {
    const section = document.querySelector('.brand-supplied-parts');
    if (section) section.scrollIntoView({behavior: 'auto', block: 'start'});
  });
  
  await new Promise(r => setTimeout(r, 500));
  
  const partsSectionMobile = await page.$('.brand-supplied-parts');
  if (partsSectionMobile) {
    await partsSectionMobile.screenshot({path: path.join(outDir, 'hydac-de-mobile-parts.png')});
    console.log('   ✅ hydac-de-mobile-parts.png');
  }
  await page.close();
  
  // Desktop EN
  console.log('3. Desktop EN screenshot...');
  page = await browser.newPage();
  await page.setViewport(VIEWPORT_DESKTOP);
  await page.goto(`${BASE_URL}/marche/hydac.html`, {waitUntil: 'networkidle2'});
  await page.waitForSelector('.brand-supplied-parts', {timeout: 5000});
  
  // Switch to English
  await page.select('#languageSelect', 'en');
  await new Promise(r => setTimeout(r, 500));
  
  await page.evaluate(() => {
    const section = document.querySelector('.brand-supplied-parts');
    if (section) section.scrollIntoView({behavior: 'auto', block: 'start'});
  });
  
  await new Promise(r => setTimeout(r, 500));
  
  const partsSectionEN = await page.$('.brand-supplied-parts');
  if (partsSectionEN) {
    await partsSectionEN.screenshot({path: path.join(outDir, 'hydac-en-desktop-parts.png')});
    console.log('   ✅ hydac-en-desktop-parts.png');
  }
  await page.close();
  
  // Mobile EN
  console.log('4. Mobile EN screenshot...');
  page = await browser.newPage();
  await page.setViewport(VIEWPORT_MOBILE);
  await page.goto(`${BASE_URL}/marche/hydac.html`, {waitUntil: 'networkidle2'});
  await page.waitForSelector('.brand-supplied-parts', {timeout: 5000});
  
  // Switch to English
  await page.select('#languageSelect', 'en');
  await new Promise(r => setTimeout(r, 500));
  
  await page.evaluate(() => {
    const section = document.querySelector('.brand-supplied-parts');
    if (section) section.scrollIntoView({behavior: 'auto', block: 'start'});
  });
  
  await new Promise(r => setTimeout(r, 500));
  
  const partsSectionENMobile = await page.$('.brand-supplied-parts');
  if (partsSectionENMobile) {
    await partsSectionENMobile.screenshot({path: path.join(outDir, 'hydac-en-mobile-parts.png')});
    console.log('   ✅ hydac-en-mobile-parts.png');
  }
  await page.close();
  
  await browser.close();
  
  console.log('\n✅ All screenshots saved to:', outDir);
  console.log('\nFiles:');
  console.log('  - hydac-de-desktop-parts.png (1280px)');
  console.log('  - hydac-de-mobile-parts.png (390px)');
  console.log('  - hydac-en-desktop-parts.png (1280px)');
  console.log('  - hydac-en-mobile-parts.png (390px)');
})();
