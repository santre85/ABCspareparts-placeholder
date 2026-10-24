#!/usr/bin/env node
'use strict';

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:8085';
const ARTIFACTS_DIR = path.join(__dirname, 'artifacts-code-prefill');

if (!fs.existsSync(ARTIFACTS_DIR)) {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testCodePrefill() {
  console.log('Testing code prefill functionality...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  // Test 1: Desktop with code=XYZ999-TEST
  console.log('1. Desktop: Contact form with code=XYZ999-TEST...');
  const page1 = await context.newPage();
  await page1.setViewportSize({ width: 1280, height: 800 });
  await page1.goto(BASE_URL + '/#contact?code=XYZ999-TEST');
  await page1.waitForLoadState('networkidle');
  
  // Scroll to contact section
  await page1.evaluate(() => {
    document.querySelector('#contact')?.scrollIntoView();
  });
  await delay(800);
  
  // Dismiss cookie consent
  try {
    const acceptBtn = page1.locator('button:has-text("Alle akzeptieren")');
    if (await acceptBtn.isVisible({ timeout: 2000 })) {
      await acceptBtn.click();
      await delay(500);
    }
  } catch(e) {}
  
  // Take screenshot showing the code notice
  await page1.screenshot({ 
    path: path.join(ARTIFACTS_DIR, 'contact-code-notice-desktop-1280.png'),
    fullPage: false,
    clip: { x: 400, y: 200, width: 880, height: 600 }
  });
  console.log('   Saved: contact-code-notice-desktop-1280.png');
  
  // Load the iframe
  const loadBtn = page1.locator('#loadIframeBtn');
  if (await loadBtn.isVisible()) {
    await loadBtn.click();
    await delay(4000); // Wait for iframe to load
  }
  
  // Take screenshot of the full contact section with iframe loaded
  await page1.screenshot({ 
    path: path.join(ARTIFACTS_DIR, 'contact-with-iframe-desktop-1280.png'),
    fullPage: true
  });
  console.log('   Saved: contact-with-iframe-desktop-1280.png\n');
  await page1.close();

  // Test 2: Mobile with code
  console.log('2. Mobile: Contact form with code=XYZ999-TEST...');
  const page2 = await context.newPage();
  await page2.setViewportSize({ width: 390, height: 844 });
  await page2.goto(BASE_URL + '/#contact?code=XYZ999-TEST');
  await page2.waitForLoadState('networkidle');
  
  await page2.evaluate(() => {
    document.querySelector('#contact')?.scrollIntoView();
  });
  await delay(800);
  
  try {
    const acceptBtn = page2.locator('button:has-text("Alle akzeptieren")');
    if (await acceptBtn.isVisible({ timeout: 1000 })) {
      await acceptBtn.click();
      await delay(300);
    }
  } catch(e) {}
  
  await page2.screenshot({ 
    path: path.join(ARTIFACTS_DIR, 'contact-code-notice-mobile-390.png'),
    fullPage: false,
    clip: { x: 0, y: 300, width: 390, height: 500 }
  });
  console.log('   Saved: contact-code-notice-mobile-390.png');
  
  const loadBtn2 = page2.locator('#loadIframeBtn');
  if (await loadBtn2.isVisible()) {
    await loadBtn2.click();
    await delay(4000);
  }
  
  await page2.screenshot({ 
    path: path.join(ARTIFACTS_DIR, 'contact-with-iframe-mobile-390.png'),
    fullPage: true
  });
  console.log('   Saved: contact-with-iframe-mobile-390.png\n');
  await page2.close();

  // Test 3: Verify sanitization with dangerous input
  console.log('3. Testing XSS protection with <script>alert(1)</script>...');
  const page3 = await context.newPage();
  await page3.setViewportSize({ width: 1280, height: 800 });
  await page3.goto(BASE_URL + '/#contact?code=<script>alert(1)</script>');
  await page3.waitForLoadState('networkidle');
  
  await page3.evaluate(() => {
    document.querySelector('#contact')?.scrollIntoView();
  });
  await delay(500);
  
  try {
    const acceptBtn = page3.locator('button:has-text("Alle akzeptieren")');
    if (await acceptBtn.isVisible({ timeout: 1000 })) {
      await acceptBtn.click();
      await delay(300);
    }
  } catch(e) {}
  
  const codeDisplay = await page3.locator('#partCodeDisplay').textContent();
  console.log('   Sanitized output:', codeDisplay);
  
  if (codeDisplay === '<script>alert(1)</script>') {
    console.error('   FAILED: Code not sanitized!');
  } else if (codeDisplay.includes('&lt;script&gt;') || !codeDisplay.includes('<script>')) {
    console.log('   PASSED: Code properly sanitized\n');
  }
  await page3.close();

  await browser.close();
  console.log('All tests completed!\n');
}

testCodePrefill().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
