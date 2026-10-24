#!/usr/bin/env node
'use strict';

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:8086';
const ARTIFACTS_DIR = path.join(__dirname, 'artifacts-code-prefill');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function verifyCodeNotice() {
  console.log('Verifying code notice visibility...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  
  await page.goto(BASE_URL + '/#contact?code=XYZ999-TEST');
  await page.waitForLoadState('networkidle');
  await delay(1000);
  
  // Dismiss cookie
  try {
    const acceptBtn = page.locator('button:has-text("Alle akzeptieren")');
    if (await acceptBtn.isVisible({ timeout: 2000 })) {
      await acceptBtn.click();
      await delay(500);
    }
  } catch(e) {}
  
  // Scroll to contact
  await page.evaluate(() => {
    const contact = document.querySelector('#contact');
    if (contact) contact.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  await delay(1000);
  
  // Check if notice is visible
  const noticeVisible = await page.locator('#partCodeNotice').isVisible();
  console.log('Code notice visible:', noticeVisible);
  
  const displayText = await page.locator('#partCodeDisplay').textContent();
  console.log('Code display text:', displayText);
  
  const noticeStyle = await page.locator('#partCodeNotice').evaluate(el => window.getComputedStyle(el).display);
  console.log('Notice display style:', noticeStyle);
  
  // Get the bounding box of the notice
  if (noticeVisible) {
    const bbox = await page.locator('#partCodeNotice').boundingBox();
    console.log('Notice position:', bbox);
    
    // Screenshot just the contact section
    await page.locator('#contact').screenshot({
      path: path.join(ARTIFACTS_DIR, 'contact-section-with-code.png')
    });
    console.log('\nSaved: contact-section-with-code.png');
  } else {
    console.log('\nERROR: Code notice not visible!');
  }
  
  await browser.close();
}

verifyCodeNotice().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
