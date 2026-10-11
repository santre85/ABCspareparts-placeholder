#!/usr/bin/env node
// Brand page screenshot tool
const puppeteer = require('puppeteer');
const fs = require('fs');

const url = process.argv[2] || 'https://abcspareparts.eu/marche/noske-kaeser.html';
const brand = process.argv[3] || 'brand';

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

(async () => {
  console.log(`📸 Taking screenshots for: ${url}`);
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Mobile DE screenshot
  await page.setViewport(VIEWPORT_MOBILE);
  await page.goto(url, {waitUntil: 'networkidle2'});
  await page.waitForSelector('h1', {timeout: 5000});
  
  // Scroll to hero section
  await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    if (h1) h1.scrollIntoView({behavior: 'auto', block: 'start'});
  });
  
  const outDir = '/opt/cursor/artifacts/screenshots';
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, {recursive: true});
  }
  
  const mobileFile = `${outDir}/${brand}-de-mobile-hero.png`;
  await page.screenshot({path: mobileFile, fullPage: false});
  console.log(`✅ Mobile screenshot: ${mobileFile}`);
  
  // Desktop DE screenshot (optional)
  await page.setViewport(VIEWPORT_DESKTOP);
  await page.reload({waitUntil: 'networkidle2'});
  await page.waitForSelector('h1', {timeout: 5000});
  
  const desktopFile = `${outDir}/${brand}-de-desktop-hero.png`;
  await page.screenshot({path: desktopFile, fullPage: false});
  console.log(`✅ Desktop screenshot: ${desktopFile}`);
  
  await browser.close();
  console.log(`\n✅ Screenshots saved to ${outDir}/`);
})();
