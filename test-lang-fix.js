#!/usr/bin/env node
'use strict';

const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8082;
const BASE_URL = `http://localhost:${PORT}`;

// Language expectations
const EXPECTED = {
  de: { selector: 'Deutsch', cookieBanner: 'Wir verwenden Cookies' },
  en: { selector: 'English', cookieBanner: 'We use cookies' },
  it: { selector: 'Italiano', cookieBanner: 'Utilizziamo i cookie' },
  es: { selector: 'Español', cookieBanner: 'Utilizamos cookies' },
  fr: { selector: 'Français', cookieBanner: 'Nous utilisons des cookies' }
};

// Start a simple HTTP server
function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let filePath = path.join(__dirname, req.url);
      
      if (filePath.endsWith('/')) {
        filePath = path.join(filePath, 'index.html');
      }
      
      filePath = filePath.split('?')[0];
      
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('Not Found');
          return;
        }
        
        const ext = path.extname(filePath);
        const contentTypes = {
          '.html': 'text/html',
          '.js': 'application/javascript',
          '.css': 'text/css',
          '.svg': 'image/svg+xml',
          '.png': 'image/png',
          '.jpg': 'image/jpeg'
        };
        
        res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/html' });
        res.end(data);
      });
    });
    
    server.listen(PORT, () => {
      console.log(`✓ Server started on port ${PORT}`);
      resolve(server);
    });
  });
}

async function clearConsentStorage(page) {
  // Navigate to a page first if not already on one
  try {
    await page.evaluate(() => {
      localStorage.removeItem('silktide_consent');
      sessionStorage.removeItem('silktide_consent');
      // Clear all cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
    });
  } catch (err) {
    // Ignore errors if not on a page yet
  }
}

async function setGermanPreference(page) {
  await page.evaluate(() => {
    localStorage.setItem('lang', 'de');
    // Also set any cookie-based preference if the site uses cookies
    document.cookie = 'lang=de; path=/';
  });
}

async function testPageLanguage(page, url, expectedLang, testName) {
  console.log(`\n${testName}`);
  console.log(`Testing: ${url}`);
  
  const results = { url, testName, passed: [], failed: [] };
  
  try {
    await page.goto(url, { waitUntil: 'networkidle' });
    
    // Clear consent storage after page load
    await clearConsentStorage(page);
    
    // Reload to ensure cookie banner shows
    await page.reload({ waitUntil: 'networkidle' });
    
    // Wait a bit for any JS to execute
    await page.waitForTimeout(1500);
    
    // Check language selector value
    const selectorValue = await page.evaluate(() => {
      const select = document.getElementById('languageSelect');
      if (!select) return null;
      const option = select.options[select.selectedIndex];
      return option ? option.text : null;
    });
    
    const expectedSelector = EXPECTED[expectedLang].selector;
    if (selectorValue && selectorValue.includes(expectedSelector)) {
      console.log(`  ✓ Language selector shows: ${selectorValue}`);
      results.passed.push(`Selector: ${selectorValue}`);
    } else {
      console.log(`  ❌ Language selector shows: ${selectorValue}, expected: ${expectedSelector}`);
      results.failed.push(`Selector: got ${selectorValue}, expected ${expectedSelector}`);
    }
    
    // Check cookie banner text
    const cookieBannerText = await page.evaluate(() => {
      // Look for silktide consent banner
      const banner = document.querySelector('#stcm-wrapper, [class*="consent"], [class*="cookie-banner"]');
      return banner ? banner.textContent : null;
    });
    
    const expectedBanner = EXPECTED[expectedLang].cookieBanner;
    if (cookieBannerText && cookieBannerText.includes(expectedBanner)) {
      console.log(`  ✓ Cookie banner shows correct language`);
      results.passed.push('Cookie banner language correct');
    } else {
      console.log(`  ❌ Cookie banner text: ${cookieBannerText ? cookieBannerText.substring(0, 100) : 'not found'}`);
      results.failed.push(`Cookie banner: expected "${expectedBanner}" in text`);
    }
    
  } catch (err) {
    console.log(`  ❌ Error: ${err.message}`);
    results.failed.push(`Error: ${err.message}`);
  }
  
  return results;
}

async function takeScreenshot(page, url, outputPath, testName) {
  console.log(`\nTaking screenshot: ${outputPath}`);
  
  try {
    await page.goto(url, { waitUntil: 'networkidle' });
    
    // Clear consent to make banner show again
    await clearConsentStorage(page);
    await page.reload({ waitUntil: 'networkidle' });
    
    await page.waitForTimeout(1500); // Wait for cookie banner to appear
    
    await page.screenshot({
      path: outputPath,
      fullPage: false
    });
    
    console.log(`  ✓ Screenshot saved: ${outputPath}`);
    return true;
  } catch (err) {
    console.log(`  ❌ Screenshot failed: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('🧪 Language Preference Override Fix - Playwright Test\n');
  
  const server = await startServer();
  const browser = await chromium.launch({ headless: true });
  
  const allResults = [];
  
  // Test 1: Fresh browser context (no stored preferences)
  console.log('\n' + '='.repeat(60));
  console.log('TEST 1: Fresh Browser Context (No Stored Preferences)');
  console.log('='.repeat(60));
  
  const freshContext = await browser.newContext();
  const freshPage = await freshContext.newPage();
  
  allResults.push(await testPageLanguage(freshPage, `${BASE_URL}/it/`, 'it', 'Italian page - fresh context'));
  allResults.push(await testPageLanguage(freshPage, `${BASE_URL}/en/`, 'en', 'English page - fresh context'));
  allResults.push(await testPageLanguage(freshPage, `${BASE_URL}/es/`, 'es', 'Spanish page - fresh context'));
  allResults.push(await testPageLanguage(freshPage, `${BASE_URL}/fr/`, 'fr', 'French page - fresh context'));
  allResults.push(await testPageLanguage(freshPage, `${BASE_URL}/`, 'de', 'German root - fresh context'));
  
  await freshContext.close();
  
  // Test 2: Browser context with German preference preset
  console.log('\n' + '='.repeat(60));
  console.log('TEST 2: Browser Context with German Preference Preset');
  console.log('='.repeat(60));
  
  const germanContext = await browser.newContext();
  const germanPage = await germanContext.newPage();
  
  // Set German preference
  await germanPage.goto(`${BASE_URL}/`);
  await setGermanPreference(germanPage);
  
  allResults.push(await testPageLanguage(germanPage, `${BASE_URL}/it/`, 'it', 'Italian page - German pref preset'));
  allResults.push(await testPageLanguage(germanPage, `${BASE_URL}/en/`, 'en', 'English page - German pref preset'));
  allResults.push(await testPageLanguage(germanPage, `${BASE_URL}/es/`, 'es', 'Spanish page - German pref preset'));
  allResults.push(await testPageLanguage(germanPage, `${BASE_URL}/fr/`, 'fr', 'French page - German pref preset'));
  allResults.push(await testPageLanguage(germanPage, `${BASE_URL}/`, 'de', 'German root - German pref preset'));
  
  // Test 3: Screenshots with cookie banner visible
  console.log('\n' + '='.repeat(60));
  console.log('TEST 3: Screenshots with Cookie Banner (German Preference Preset)');
  console.log('='.repeat(60));
  
  // Create artifacts directory
  const screenshotDir = '/opt/cursor/artifacts/fix-lang';
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
  
  // Desktop screenshots (1366x900)
  await germanPage.setViewportSize({ width: 1366, height: 900 });
  await takeScreenshot(germanPage, `${BASE_URL}/it/`, path.join(screenshotDir, 'italian-desktop-1366x900.png'), 'Italian desktop');
  await takeScreenshot(germanPage, `${BASE_URL}/en/`, path.join(screenshotDir, 'english-desktop-1366x900.png'), 'English desktop');
  
  // Mobile screenshots (390x844)
  await germanPage.setViewportSize({ width: 390, height: 844 });
  await takeScreenshot(germanPage, `${BASE_URL}/it/`, path.join(screenshotDir, 'italian-mobile-390x844.png'), 'Italian mobile');
  await takeScreenshot(germanPage, `${BASE_URL}/en/`, path.join(screenshotDir, 'english-mobile-390x844.png'), 'English mobile');
  await takeScreenshot(germanPage, `${BASE_URL}/`, path.join(screenshotDir, 'german-root-mobile-390x844.png'), 'German root mobile');
  
  await germanContext.close();
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  
  const failedTests = allResults.filter(r => r.failed.length > 0);
  
  if (failedTests.length === 0) {
    console.log('\n✅ All tests passed! Language preferences are correctly overridden.\n');
  } else {
    console.log(`\n❌ ${failedTests.length} test(s) failed:\n`);
    failedTests.forEach(result => {
      console.log(`${result.testName}:`);
      result.failed.forEach(fail => console.log(`  - ${fail}`));
      console.log('');
    });
  }
  
  console.log('\n📸 Screenshots saved to:');
  console.log(`  ${screenshotDir}/`);
  console.log('');
  
  // List all screenshot files
  const screenshots = fs.readdirSync(screenshotDir).filter(f => f.endsWith('.png'));
  screenshots.forEach(file => {
    console.log(`  - ${path.join(screenshotDir, file)}`);
  });
  
  await browser.close();
  server.close();
  
  process.exit(failedTests.length > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
