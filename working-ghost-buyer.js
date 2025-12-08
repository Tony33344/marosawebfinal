/**
 * WORKING Ghost Buyer - Based on real website structure analysis
 */

import puppeteer from 'puppeteer';

const CONFIG = {
  baseUrl: 'https://marosatest.netlify.app',
  languages: ['sl', 'en', 'de', 'hr'],
  testEmails: [
    'test300@noexpire.top', 'test301@noexpire.top', 'test302@noexpire.top',
    'test303@noexpire.top', 'test304@noexpire.top', 'test305@noexpire.top'
  ]
};

const testResults = {
  passed: 0,
  failed: 0,
  details: []
};

function logResult(test, success, details = '') {
  const status = success ? '✅' : '❌';
  console.log(`${status} ${test}${details ? ': ' + details : ''}`);
  if (success) testResults.passed++;
  else testResults.failed++;
  testResults.details.push({ test, success, details });
}

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Handle cookie consent properly
 */
async function handleCookieConsent(page) {
  console.log('🍪 Handling cookie consent...');
  await wait(2000);
  
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent.toLowerCase(), btn);
    if (text.includes('sprejmi') && text.includes('vse')) {
      console.log('✅ Clicking cookie consent');
      await btn.click();
      await wait(2000);
      return true;
    }
  }
  return false;
}

/**
 * Handle newsletter popup properly
 */
async function handleNewsletterPopup(page, email) {
  console.log('📧 Handling newsletter popup...');
  await wait(3000);
  
  // Look for newsletter popup fields
  const emailInput = await page.$('#popup-email');
  const nameInput = await page.$('#popup-first-name');
  
  if (emailInput && nameInput) {
    console.log('✅ Found newsletter popup fields');
    
    // Fill name
    await nameInput.click();
    await nameInput.type('Test User');
    await wait(500);
    
    // Fill email
    await emailInput.click();
    await emailInput.type(email);
    await wait(500);
    
    // Find and click submit button
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent.toLowerCase(), btn);
      if (text.includes('pridobi') && text.includes('10%')) {
        console.log('✅ Clicking newsletter submit button');
        await btn.click();
        await wait(3000);
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Test complete shopping flow - WORKING VERSION
 */
async function testShoppingFlow(page, language, email) {
  console.log(`\n🛒 Testing REAL shopping flow (${language.toUpperCase()})...`);
  
  // 1. Go to homepage
  await page.goto(`${CONFIG.baseUrl}?lang=${language}`, { waitUntil: 'networkidle2' });
  await wait(3000);
  
  // 2. Handle popups
  await handleCookieConsent(page);
  await handleNewsletterPopup(page, email);
  
  // 3. Find and click on a product
  console.log('🔍 Looking for products...');
  const productLinks = await page.$$('a[href*="/izdelek/"]');
  logResult(`Product links found (${language})`, productLinks.length > 0, `Found ${productLinks.length} products`);
  
  if (productLinks.length === 0) {
    console.log('❌ No products found, skipping shopping flow');
    return false;
  }
  
  // 4. Navigate to first product
  console.log('🎯 Navigating to product page...');
  const firstProductUrl = await page.evaluate(el => el.href, productLinks[0]);
  await page.goto(firstProductUrl, { waitUntil: 'networkidle2' });
  await wait(3000);
  
  // 5. Get product title
  const productTitle = await page.$eval('h1', el => el.textContent).catch(() => 'Unknown Product');
  console.log(`📦 Product: ${productTitle}`);
  
  // 6. Set quantity (CRITICAL - this was missing!)
  console.log('🔢 Setting product quantity...');
  const quantityInputs = await page.$$('input[type="number"]');
  let quantitySet = false;
  
  for (const input of quantityInputs) {
    const name = await page.evaluate(el => el.name, input);
    if (name && name.includes('quantity')) {
      console.log(`✅ Setting quantity for ${name}`);
      await input.click({ clickCount: 3 });
      await input.type('2');
      quantitySet = true;
      await wait(500);
      break;
    }
  }
  
  logResult(`Quantity selection (${language})`, quantitySet);
  
  // 7. Add to cart (WORKING VERSION)
  console.log('🛒 Adding to cart...');
  const buttons = await page.$$('button');
  let addedToCart = false;
  
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent.toLowerCase(), btn);
    if (text.includes('dodaj') && text.includes('košarico')) {
      console.log('✅ Clicking "Dodaj v košarico" button');
      await btn.click();
      await wait(3000);
      addedToCart = true;
      break;
    }
  }
  
  logResult(`Add to cart (${language})`, addedToCart);
  
  // 8. Check if cart was updated
  console.log('🔍 Checking cart status...');
  await page.goto(`${CONFIG.baseUrl}/checkout?lang=${language}`, { waitUntil: 'networkidle2' });
  await wait(3000);
  
  const pageContent = await page.evaluate(() => document.body.textContent);
  const cartEmpty = pageContent.includes('košarica je prazna') || pageContent.includes('cart is empty');
  const cartHasItems = !cartEmpty;
  
  logResult(`Cart has items (${language})`, cartHasItems);
  
  if (cartHasItems) {
    console.log('🎉 SUCCESS: Complete shopping flow working!');
    return true;
  } else {
    console.log('⚠️ Cart is still empty after adding items');
    return false;
  }
}

/**
 * Test newsletter signup
 */
async function testNewsletterSignup(page, language, email) {
  console.log(`\n📧 Testing newsletter signup (${language.toUpperCase()})...`);
  
  await page.goto(`${CONFIG.baseUrl}?lang=${language}`, { waitUntil: 'networkidle2' });
  await wait(2000);
  
  const success = await handleNewsletterPopup(page, email);
  logResult(`Newsletter signup (${language})`, success);
  
  return success;
}

/**
 * Main test runner
 */
async function runWorkingTests() {
  console.log('🚀 Starting WORKING Ghost Buyer Tests...\n');
  console.log(`Testing: ${CONFIG.baseUrl}`);
  console.log(`Languages: ${CONFIG.languages.join(', ')}\n`);
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 500,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    protocolTimeout: 60000,
    timeout: 60000
  });
  
  try {
    let emailIndex = 0;
    
    for (const language of CONFIG.languages) {
      console.log(`\n🌍 Testing language: ${language.toUpperCase()}`);
      console.log('='.repeat(50));
      
      const email = CONFIG.testEmails[emailIndex % CONFIG.testEmails.length];
      emailIndex++;
      
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 720 });
      await page.setDefaultTimeout(30000);
      await page.setDefaultNavigationTimeout(30000);
      
      try {
        // Test 1: Complete shopping flow
        await testShoppingFlow(page, language, email);
        
        // Test 2: Newsletter signup
        await testNewsletterSignup(page, language, email);
        
        console.log(`✅ Completed testing for ${language.toUpperCase()}`);
        
      } catch (error) {
        console.error(`❌ Error testing ${language}:`, error.message);
        logResult(`Language ${language} testing`, false, error.message);
      }
      
      await page.close();
      await wait(2000);
    }
    
    // Generate final report
    console.log('\n' + '='.repeat(60));
    console.log('📊 WORKING GHOST BUYER TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📊 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);
    
    console.log('\n📋 DETAILED RESULTS:');
    testResults.details.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${result.test}${result.details ? ': ' + result.details : ''}`);
    });
    
    console.log('\n🎯 This version should work correctly with your website!');
    
  } finally {
    await browser.close();
  }
}

runWorkingTests().catch(console.error);
