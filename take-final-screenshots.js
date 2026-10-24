#!/usr/bin/env node
'use strict';

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:8087';
const ARTIFACTS_DIR = path.join(__dirname, 'artifacts-code-prefill-final');

if (!fs.existsSync(ARTIFACTS_DIR)) {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function takeFinalScreenshots() {
  console.log('\n=== Taking Final Code Prefill Screenshots ===\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  // Test 1: Desktop - Code notice visible
  console.log('1. Desktop (1280): Code notice with XYZ999-TEST');
  const page1 = await context.newPage();
  await page1.setViewportSize({ width: 1280, height: 900 });
  await page1.goto(BASE_URL + '/?code=XYZ999-TEST#contact');
  await page1.waitForLoadState('networkidle');
  await delay(1000);
  
  try {
    const acceptBtn = page1.locator('button:has-text("Alle akzeptieren")');
    if (await acceptBtn.isVisible({ timeout: 2000 })) {
      await acceptBtn.click();
      await delay(500);
    }
  } catch(e) {}
  
  await page1.evaluate(() => {
    document.querySelector('#contact')?.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await delay(500);
  
  // Screenshot of contact section showing code notice
  await page1.locator('#contact').screenshot({
    path: path.join(ARTIFACTS_DIR, '01-code-notice-desktop-1280.png')
  });
  console.log('   ✓ Saved: 01-code-notice-desktop-1280.png\n');
  
  // Click to load iframe
  const loadBtn1 = page1.locator('#loadIframeBtn');
  if (await loadBtn1.isVisible()) {
    await loadBtn1.click();
    console.log('   Loading iframe...');
    await delay(5000);
  }
  
  // Full contact section with iframe
  await page1.locator('#contact').screenshot({
    path: path.join(ARTIFACTS_DIR, '02-contact-with-iframe-desktop-1280.png')
  });
  console.log('   ✓ Saved: 02-contact-with-iframe-desktop-1280.png\n');
  await page1.close();

  // Test 2: Mobile - Code notice
  console.log('2. Mobile (390): Code notice with XYZ999-TEST');
  const page2 = await context.newPage();
  await page2.setViewportSize({ width: 390, height: 844 });
  await page2.goto(BASE_URL + '/?code=XYZ999-TEST#contact');
  await page2.waitForLoadState('networkidle');
  await delay(1000);
  
  try {
    const acceptBtn = page2.locator('button:has-text("Alle akzeptieren")');
    if (await acceptBtn.isVisible({ timeout: 1500 })) {
      await acceptBtn.click();
      await delay(400);
    }
  } catch(e) {}
  
  await page2.evaluate(() => {
    document.querySelector('#contact')?.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await delay(500);
  
  await page2.locator('#contact').screenshot({
    path: path.join(ARTIFACTS_DIR, '03-code-notice-mobile-390.png')
  });
  console.log('   ✓ Saved: 03-code-notice-mobile-390.png\n');
  
  const loadBtn2 = page2.locator('#loadIframeBtn');
  if (await loadBtn2.isVisible()) {
    await loadBtn2.click();
    console.log('   Loading iframe...');
    await delay(5000);
  }
  
  await page2.locator('#contact').screenshot({
    path: path.join(ARTIFACTS_DIR, '04-contact-with-iframe-mobile-390.png')
  });
  console.log('   ✓ Saved: 04-contact-with-iframe-mobile-390.png\n');
  await page2.close();

  // Test 3: XSS protection verification
  console.log('3. XSS Protection Test');
  const page3 = await context.newPage();
  await page3.setViewportSize({ width: 1280, height: 800 });
  await page3.goto(BASE_URL + '/?code=%3Cscript%3Ealert(1)%3C/script%3E#contact');
  await page3.waitForLoadState('networkidle');
  await delay(800);
  
  try {
    const acceptBtn = page3.locator('button:has-text("Alle akzeptieren")');
    if (await acceptBtn.isVisible({ timeout: 1500 })) {
      await acceptBtn.click();
      await delay(300);
    }
  } catch(e) {}
  
  await page3.evaluate(() => {
    document.querySelector('#contact')?.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await delay(500);
  
  const sanitizedText = await page3.locator('#partCodeDisplay').textContent();
  const sanitizedInner = await page3.locator('#partCodeDisplay').innerHTML();
  
  console.log('   Input: <script>alert(1)</script>');
  console.log('   Output text:', sanitizedText);
  console.log('   Output HTML:', sanitizedInner);
  
  if (!sanitizedText.includes('<script>') || sanitizedInner.includes('&lt;script&gt;')) {
    console.log('   ✓ XSS protection working\n');
  } else {
    console.log('   ✗ WARNING: XSS protection may not be working!\n');
  }
  
  await page3.locator('#contact').screenshot({
    path: path.join(ARTIFACTS_DIR, '05-xss-test-sanitized.png')
  });
  console.log('   ✓ Saved: 05-xss-test-sanitized.png\n');
  await page3.close();

  await browser.close();
  console.log('=== All screenshots completed ===\n');
}

takeFinalScreenshots().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
