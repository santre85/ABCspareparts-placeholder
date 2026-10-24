#!/usr/bin/env node
'use strict';

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:8088';
const ARTIFACTS_DIR = path.join(__dirname, 'artifacts-iframe-test');

if (!fs.existsSync(ARTIFACTS_DIR)) {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testIframePrefill() {
  console.log('\n=== Testing ERPNext Form Prefill via iframe src ===\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  // Test 1: Verify iframe src with code parameter
  console.log('1. Desktop: Testing iframe src parameters');
  const page1 = await context.newPage();
  await page1.setViewportSize({ width: 1280, height: 900 });
  await page1.goto(BASE_URL + '/?code=TEST-XYZ-123#contact');
  await page1.waitForLoadState('networkidle');
  await delay(1000);
  
  try {
    const acceptBtn = page1.locator('button:has-text("Alle akzeptieren")');
    if (await acceptBtn.isVisible({ timeout: 2000 })) {
      await acceptBtn.click();
      await delay(500);
    }
  } catch(e) {}
  
  // Check code notice is visible
  const noticeVisible = await page1.locator('#partCodeNotice').isVisible();
  const codeText = await page1.locator('#partCodeDisplay').textContent();
  console.log('   ✓ Code notice visible:', noticeVisible);
  console.log('   ✓ Code display text:', codeText);
  
  // Click to load iframe
  const loadBtn = page1.locator('#loadIframeBtn');
  if (await loadBtn.isVisible()) {
    await loadBtn.click();
    console.log('   ✓ Clicked load iframe button');
    await delay(2000);
  }
  
  // Get iframe src
  const iframeSrc = await page1.locator('#contactFormIframe').getAttribute('src');
  console.log('   ✓ Iframe src:', iframeSrc);
  
  // Parse iframe URL params
  if (iframeSrc) {
    const url = new URL(iframeSrc);
    const params = {
      _lang: url.searchParams.get('_lang'),
      custom_part_numbers: url.searchParams.get('custom_part_numbers'),
      custom_message: url.searchParams.get('custom_message')
    };
    console.log('   ✓ Iframe params:', JSON.stringify(params, null, 6));
    
    if (params.custom_part_numbers === 'TEST-XYZ-123') {
      console.log('   ✅ Part number parameter correct!');
    } else {
      console.log('   ❌ Part number parameter missing or wrong!');
    }
    
    if (params.custom_message && params.custom_message.includes('TEST-XYZ-123')) {
      console.log('   ✅ Message parameter includes code!');
    } else {
      console.log('   ❌ Message parameter missing or wrong!');
    }
  }
  
  // Try to wait for iframe content (may fail due to external domain)
  console.log('\n   Waiting for iframe to load (may timeout if external)...');
  try {
    const iframe = page1.frameLocator('#contactFormIframe');
    await iframe.locator('body').waitFor({ timeout: 8000 });
    console.log('   ✓ Iframe loaded successfully');
    
    // Try to read field values
    try {
      const partField = await iframe.locator('[data-fieldname="custom_part_numbers"]').inputValue({ timeout: 3000 });
      console.log('   ✓ Part number field value:', partField);
    } catch(e) {
      console.log('   ⚠ Could not read part number field:', e.message);
    }
    
    try {
      const msgField = await iframe.locator('[data-fieldname="custom_message"]').inputValue({ timeout: 3000 });
      console.log('   ✓ Message field value:', msgField);
    } catch(e) {
      console.log('   ⚠ Could not read message field:', e.message);
    }
  } catch(e) {
    console.log('   ⚠ Iframe did not load (external domain/CORS):', e.message.split('\n')[0]);
  }
  
  // Screenshot
  await page1.locator('#contact').screenshot({
    path: path.join(ARTIFACTS_DIR, '01-contact-with-code-desktop.png')
  });
  console.log('   ✓ Saved screenshot\n');
  await page1.close();

  // Test 2: Mobile
  console.log('2. Mobile: Testing iframe src parameters');
  const page2 = await context.newPage();
  await page2.setViewportSize({ width: 390, height: 844 });
  await page2.goto(BASE_URL + '/?code=ABC-123-TEST#contact');
  await page2.waitForLoadState('networkidle');
  await delay(1000);
  
  try {
    const acceptBtn = page2.locator('button:has-text("Alle akzeptieren")');
    if (await acceptBtn.isVisible({ timeout: 1500 })) {
      await acceptBtn.click();
      await delay(400);
    }
  } catch(e) {}
  
  const loadBtn2 = page2.locator('#loadIframeBtn');
  if (await loadBtn2.isVisible()) {
    await loadBtn2.click();
    await delay(2000);
  }
  
  const iframeSrc2 = await page2.locator('#contactFormIframe').getAttribute('src');
  console.log('   ✓ Iframe src:', iframeSrc2);
  
  await page2.locator('#contact').screenshot({
    path: path.join(ARTIFACTS_DIR, '02-contact-with-code-mobile.png')
  });
  console.log('   ✓ Saved screenshot\n');
  await page2.close();

  // Test 3: Code validation (invalid chars)
  console.log('3. Testing code validation (invalid characters)');
  const page3 = await context.newPage();
  await page3.setViewportSize({ width: 1280, height: 800 });
  await page3.goto(BASE_URL + '/?code=TEST<script>alert(1)</script>ABC#contact');
  await page3.waitForLoadState('networkidle');
  await delay(800);
  
  try {
    const acceptBtn = page3.locator('button:has-text("Alle akzeptieren")');
    if (await acceptBtn.isVisible({ timeout: 1500 })) {
      await acceptBtn.click();
      await delay(300);
    }
  } catch(e) {}
  
  const loadBtn3 = page3.locator('#loadIframeBtn');
  if (await loadBtn3.isVisible()) {
    await loadBtn3.click();
    await delay(2000);
  }
  
  const codeDisplay3 = await page3.locator('#partCodeDisplay').textContent();
  const iframeSrc3 = await page3.locator('#contactFormIframe').getAttribute('src');
  
  console.log('   Input: TEST<script>alert(1)</script>ABC');
  console.log('   Sanitized display:', codeDisplay3);
  console.log('   Iframe src snippet:', iframeSrc3.substring(0, 150) + '...');
  
  if (!codeDisplay3.includes('<script>') && !iframeSrc3.includes('<script>')) {
    console.log('   ✅ XSS protection working!\n');
  } else {
    console.log('   ❌ XSS protection failed!\n');
  }
  await page3.close();

  // Test 4: Part page link
  console.log('4. Testing part page "Jetzt Angebot anfragen" link');
  const page4 = await context.newPage();
  await page4.setViewportSize({ width: 1280, height: 800 });
  await page4.goto(BASE_URL + '/parts/abb/1sda038324r0001.html');
  await page4.waitForLoadState('networkidle');
  await delay(500);
  
  const ctaLink = await page4.locator('.cta-primary').getAttribute('href');
  console.log('   ✓ CTA button href:', ctaLink);
  
  if (ctaLink && ctaLink.includes('?code=') && ctaLink.includes('#contact')) {
    console.log('   ✅ Part page links to home contact with code!\n');
  } else {
    console.log('   ❌ Part page link format wrong!\n');
  }
  await page4.close();

  await browser.close();
  console.log('=== All tests completed ===\n');
}

testIframePrefill().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
