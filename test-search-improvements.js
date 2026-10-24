#!/usr/bin/env node
'use strict';

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:8080';
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots-search-test');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testSearchImprovements() {
  console.log('Testing search improvements...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  // Test 1: Dropdown with found code (desktop)
  console.log('Test 1: Dropdown with found code (desktop 1280px)...');
  const page1 = await context.newPage();
  await page1.setViewportSize({ width: 1280, height: 800 });
  await page1.goto(BASE_URL + '/');
  await page1.waitForLoadState('networkidle');
  
  await page1.locator('#homeBrandSearchInput').click();
  await page1.locator('#homeBrandSearchInput').fill('1SDA038324R0001');
  await delay(500);
  
  await page1.screenshot({ 
    path: path.join(SCREENSHOTS_DIR, '01-dropdown-found-code-desktop-1280.png'),
    fullPage: false
  });
  console.log('  Saved: 01-dropdown-found-code-desktop-1280.png\n');
  await page1.close();

  // Test 2: Dropdown with found code (mobile)
  console.log('Test 2: Dropdown with found code (mobile 390px)...');
  const page2 = await context.newPage();
  await page2.setViewportSize({ width: 390, height: 844 });
  await page2.goto(BASE_URL + '/');
  await page2.waitForLoadState('networkidle');
  
  await page2.locator('#homeBrandSearchInput').click();
  await page2.locator('#homeBrandSearchInput').fill('1SDA038324R0001');
  await delay(500);
  
  await page2.screenshot({ 
    path: path.join(SCREENSHOTS_DIR, '02-dropdown-found-code-mobile-390.png'),
    fullPage: false
  });
  console.log('  Saved: 02-dropdown-found-code-mobile-390.png\n');
  await page2.close();

  // Test 3: Dropdown with not-found code (desktop)
  console.log('Test 3: Dropdown with not-found code (desktop 1280px)...');
  const page3 = await context.newPage();
  await page3.setViewportSize({ width: 1280, height: 800 });
  await page3.goto(BASE_URL + '/');
  await page3.waitForLoadState('networkidle');
  
  await page3.locator('#homeBrandSearchInput').click();
  await page3.locator('#homeBrandSearchInput').fill('XYZ999-NOTFOUND');
  await delay(500);
  
  await page3.screenshot({ 
    path: path.join(SCREENSHOTS_DIR, '03-dropdown-not-found-desktop-1280.png'),
    fullPage: false
  });
  console.log('  Saved: 03-dropdown-not-found-desktop-1280.png\n');
  await page3.close();

  // Test 4: Dropdown with not-found code (mobile)
  console.log('Test 4: Dropdown with not-found code (mobile 390px)...');
  const page4 = await context.newPage();
  await page4.setViewportSize({ width: 390, height: 844 });
  await page4.goto(BASE_URL + '/');
  await page4.waitForLoadState('networkidle');
  
  await page4.locator('#homeBrandSearchInput').click();
  await page4.locator('#homeBrandSearchInput').fill('XYZ999-NOTFOUND');
  await delay(500);
  
  await page4.screenshot({ 
    path: path.join(SCREENSHOTS_DIR, '04-dropdown-not-found-mobile-390.png'),
    fullPage: false
  });
  console.log('  Saved: 04-dropdown-not-found-mobile-390.png\n');
  await page4.close();

  // Test 5: Part page (desktop)
  console.log('Test 5: Part page (desktop 1280px)...');
  const page5 = await context.newPage();
  await page5.setViewportSize({ width: 1280, height: 800 });
  await page5.goto(BASE_URL + '/parts/abb/1sda038324r0001.html');
  await page5.waitForLoadState('networkidle');
  
  await page5.screenshot({ 
    path: path.join(SCREENSHOTS_DIR, '05-part-page-desktop-1280.png'),
    fullPage: true
  });
  console.log('  Saved: 05-part-page-desktop-1280.png\n');
  await page5.close();

  // Test 6: Part page (mobile)
  console.log('Test 6: Part page (mobile 390px)...');
  const page6 = await context.newPage();
  await page6.setViewportSize({ width: 390, height: 844 });
  await page6.goto(BASE_URL + '/parts/abb/1sda038324r0001.html');
  await page6.waitForLoadState('networkidle');
  
  await page6.screenshot({ 
    path: path.join(SCREENSHOTS_DIR, '06-part-page-mobile-390.png'),
    fullPage: true
  });
  console.log('  Saved: 06-part-page-mobile-390.png\n');
  await page6.close();

  // Test 7: Check console errors
  console.log('Test 7: Checking for console errors...');
  const page7 = await context.newPage();
  const errors = [];
  page7.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  await page7.setViewportSize({ width: 1280, height: 800 });
  await page7.goto(BASE_URL + '/');
  await page7.waitForLoadState('networkidle');
  
  await page7.locator('#homeBrandSearchInput').click();
  await page7.locator('#homeBrandSearchInput').fill('1SDA038324R0001');
  await delay(500);
  
  if (errors.length > 0) {
    console.log('  Console errors found:');
    errors.forEach(err => console.log('    - ' + err));
  } else {
    console.log('  No console errors\n');
  }
  await page7.close();

  await browser.close();

  console.log('All tests completed!');
  console.log(`Screenshots saved to: ${SCREENSHOTS_DIR}\n`);
}

testSearchImprovements().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
