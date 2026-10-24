#!/usr/bin/env node
'use strict';

const { chromium } = require('playwright');

async function testProperUrl() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Test with proper query-before-hash format
  await page.goto('http://localhost:8087/?code=XYZ999-TEST#contact');
  await page.waitForLoadState('networkidle');
  await new Promise(r => setTimeout(r, 800));
  
  // Dismiss cookie
  try {
    const acceptBtn = page.locator('button:has-text("Alle akzeptieren")');
    if (await acceptBtn.isVisible({ timeout: 2000 })) {
      await acceptBtn.click();
      await new Promise(r => setTimeout(r, 500));
    }
  } catch(e) {}
  
  const info = await page.evaluate(() => {
    return {
      href: window.location.href,
      search: window.location.search,
      hash: window.location.hash,
      codeParam: new URLSearchParams(window.location.search).get('code'),
      noticeVisible: document.getElementById('partCodeNotice')?.style?.display,
      codeText: document.getElementById('partCodeDisplay')?.textContent
    };
  });
  
  console.log('\nProper URL format test:');
  console.log('URL:', info.href);
  console.log('Search:', info.search);
  console.log('Hash:', info.hash);
  console.log('Code param:', info.codeParam);
  console.log('Notice display:', info.noticeVisible);
  console.log('Code text:', info.codeText);
  console.log('Success:', info.codeText === 'XYZ999-TEST' && info.noticeVisible !== 'none' ? '✓' : '✗');
  
  await browser.close();
}

testProperUrl().catch(console.error);
