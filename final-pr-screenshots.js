#!/usr/bin/env node
'use strict';

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:8084';
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots-search-test');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function takePRScreenshots() {
  console.log('Taking PR screenshots...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  // 1. Kolbus part page (desktop)
  console.log('1. Kolbus part page (desktop)...');
  const page1 = await context.newPage();
  await page1.setViewportSize({ width: 1280, height: 800 });
  await page1.goto(BASE_URL + '/parts/kolbus/00017135.html');
  await page1.waitForLoadState('networkidle');
  
  await page1.screenshot({ 
    path: path.join(SCREENSHOTS_DIR, '07-kolbus-part-page-desktop-1280.png'),
    fullPage: true
  });
  console.log('   Saved.\n');
  await page1.close();

  // 2. Kolbus part page (mobile)
  console.log('2. Kolbus part page (mobile)...');
  const page2 = await context.newPage();
  await page2.setViewportSize({ width: 390, height: 844 });
  await page2.goto(BASE_URL + '/parts/kolbus/00017135.html');
  await page2.waitForLoadState('networkidle');
  
  await page2.screenshot({ 
    path: path.join(SCREENSHOTS_DIR, '08-kolbus-part-page-mobile-390.png'),
    fullPage: true
  });
  console.log('   Saved.\n');
  await page2.close();

  // 3. Contact form with code prefilled (desktop)
  console.log('3. Contact form with code prefilled (desktop)...');
  const page3 = await context.newPage();
  await page3.setViewportSize({ width: 1280, height: 800 });
  await page3.goto(BASE_URL + '/#contact?code=XYZ999-TEST');
  await page3.waitForLoadState('networkidle');
  
  // Scroll to contact section
  await page3.evaluate(() => {
    document.querySelector('#contact')?.scrollIntoView();
  });
  await delay(500);
  
  // Dismiss cookie consent
  try {
    const acceptBtn = page3.locator('button:has-text("Alle akzeptieren")');
    if (await acceptBtn.isVisible({ timeout: 2000 })) {
      await acceptBtn.click();
      await delay(500);
    }
  } catch(e) {}
  
  // Load iframe
  const loadBtn = page3.locator('#loadIframeBtn');
  if (await loadBtn.isVisible()) {
    await loadBtn.click();
    await delay(3000); // Wait for iframe
  }
  
  await page3.screenshot({ 
    path: path.join(SCREENSHOTS_DIR, '09-contact-form-code-prefilled-desktop-1280.png'),
    fullPage: true
  });
  console.log('   Saved.\n');
  await page3.close();

  // 4. Contact form mobile
  console.log('4. Contact form with code prefilled (mobile)...');
  const page4 = await context.newPage();
  await page4.setViewportSize({ width: 390, height: 844 });
  await page4.goto(BASE_URL + '/#contact?code=XYZ999-TEST');
  await page4.waitForLoadState('networkidle');
  
  await page4.evaluate(() => {
    document.querySelector('#contact')?.scrollIntoView();
  });
  await delay(500);
  
  try {
    const acceptBtn = page4.locator('button:has-text("Alle akzeptieren")');
    if (await acceptBtn.isVisible({ timeout: 1000 })) {
      await acceptBtn.click();
      await delay(300);
    }
  } catch(e) {}
  
  const loadBtn2 = page4.locator('#loadIframeBtn');
  if (await loadBtn2.isVisible()) {
    await loadBtn2.click();
    await delay(3000);
  }
  
  await page4.screenshot({ 
    path: path.join(SCREENSHOTS_DIR, '10-contact-form-code-prefilled-mobile-390.png'),
    fullPage: true
  });
  console.log('   Saved.\n');
  await page4.close();

  await browser.close();
  console.log('All PR screenshots completed!\n');
}

takePRScreenshots().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
