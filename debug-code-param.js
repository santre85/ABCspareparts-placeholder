#!/usr/bin/env node
'use strict';

const { chromium } = require('playwright');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function debugCodeParam() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:8086/#contact?code=XYZ999-TEST');
  await page.waitForLoadState('networkidle');
  await delay(500);
  
  // Dismiss cookie
  try {
    const acceptBtn = page.locator('button:has-text("Alle akzeptieren")');
    if (await acceptBtn.isVisible({ timeout: 2000 })) {
      await acceptBtn.click();
      await delay(500);
    }
  } catch(e) {}
  
  const debugInfo = await page.evaluate(() => {
    return {
      href: window.location.href,
      search: window.location.search,
      hash: window.location.hash,
      pathname: window.location.pathname,
      params: new URLSearchParams(window.location.search).get('code'),
      noticeDisplay: document.getElementById('partCodeNotice')?.style?.display,
      codeText: document.getElementById('partCodeDisplay')?.textContent
    };
  });
  
  console.log('Debug info:', JSON.stringify(debugInfo, null, 2));
  
  await browser.close();
}

debugCodeParam().catch(console.error);
