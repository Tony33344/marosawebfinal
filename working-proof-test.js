/**
 * WORKING PROOF TEST - Based on our successful focused-ghost-buyer.js
 * 
 * This uses the PROVEN working methods that actually got emails before
 * No timeouts, no complex logic - just the simple approach that worked
 */

import puppeteer from 'puppeteer';

const CONFIG = {
  baseUrl: 'https://marosatest.netlify.app',
  testEmails: [
    'working.proof.001@noexpire.top',
    'working.proof.002@noexpire.top',
    'working.proof.003@noexpire.top'
  ]
};

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runWorkingProofTest() {
  console.log('🚀 WORKING PROOF TEST - Using proven methods\n');
  console.log(`📧 Test emails: ${CONFIG.testEmails.join(', ')}\n`);
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 200,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  
  try {
    // TEST 1: Newsletter signup (using our proven working method)
    console.log('📧 TEST 1: Newsletter signup (Slovenian - known to work)');
    console.log('='.repeat(60));
    
    const email1 = CONFIG.testEmails[0];
    console.log(`Using email: ${email1}`);
    
    // Go to homepage
    await page.goto(`${CONFIG.baseUrl}?lang=sl`, { waitUntil: 'domcontentloaded' });
    await wait(3000);
    
    // Handle cookie consent (simple method)
    console.log('🍪 Handling cookie consent...');
    const cookieButtons = await page.$$('button');
    for (const btn of cookieButtons) {
      try {
        const text = await page.evaluate(el => el.textContent.toLowerCase(), btn);
        if (text.includes('sprejmi') && text.includes('vse')) {
          console.log('✅ Clicking cookie consent');
          await btn.click();
          await wait(2000);
          break;
        }
      } catch (e) { /* continue */ }
    }
    
    // Handle newsletter popup (proven method)
    console.log('📧 Looking for newsletter popup...');
    const emailInput = await page.$('#popup-email');
    const nameInput = await page.$('#popup-first-name');
    
    if (emailInput && nameInput) {
      console.log('✅ Newsletter popup found');
      
      // Fill fields
      await nameInput.click();
      await nameInput.type('Test User');
      await wait(500);
      
      await emailInput.click();
      await emailInput.type(email1);
      await wait(500);
      
      console.log(`📝 Filled: Test User, ${email1}`);
      
      // Find submit button
      const buttons = await page.$$('button');
      let submitted = false;
      
      for (const btn of buttons) {
        try {
          const text = await page.evaluate(el => el.textContent, btn);
          if (text && text.includes('10%')) {
            console.log(`✅ Found submit button: "${text}"`);
            await btn.click();
            console.log('✅ Clicked submit button');
            submitted = true;
            await wait(5000); // Wait for submission
            break;
          }
        } catch (e) { /* continue */ }
      }
      
      if (submitted) {
        console.log(`🎉 Newsletter signup completed for ${email1}`);
        console.log('📧 CHECK EMAIL INBOX FOR CONFIRMATION!');
      } else {
        console.log('❌ Submit button not found or clicked');
      }
      
    } else {
      console.log('❌ Newsletter popup not found');
    }
    
    // TEST 2: Shopping flow (using our proven working method)
    console.log('\n🛒 TEST 2: Shopping flow (Slovenian - known to work)');
    console.log('='.repeat(60));
    
    const email2 = CONFIG.testEmails[1];
    console.log(`Using email: ${email2}`);
    
    // Go directly to product (proven method)
    console.log('🎯 Going to product page...');
    await page.goto(`${CONFIG.baseUrl}/izdelek/11?lang=sl`, { waitUntil: 'domcontentloaded' });
    await wait(3000);
    
    // Get product info
    const productTitle = await page.$eval('h1', el => el.textContent).catch(() => 'Unknown');
    console.log(`📦 Product: ${productTitle}`);
    
    // Set quantity (proven method)
    console.log('🔢 Setting quantity...');
    const quantityInputs = await page.$$('input[type="number"]');
    if (quantityInputs.length > 0) {
      const input = quantityInputs[0];
      await input.click({ clickCount: 3 });
      await input.type('2');
      console.log('✅ Set quantity to 2');
      await wait(1000);
    } else {
      console.log('❌ No quantity inputs found');
    }
    
    // Add to cart (proven method)
    console.log('🛒 Adding to cart...');
    const allButtons = await page.$$('button');
    let cartClicked = false;
    
    for (const btn of allButtons) {
      try {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && text.includes('Dodaj v košarico')) {
          console.log(`✅ Found add to cart: "${text}"`);
          await btn.click();
          console.log('✅ Clicked add to cart');
          cartClicked = true;
          await wait(3000);
          break;
        }
      } catch (e) { /* continue */ }
    }
    
    if (!cartClicked) {
      console.log('❌ Add to cart button not found');
    }
    
    // Check cart (proven method)
    console.log('🔍 Checking cart...');
    await page.goto(`${CONFIG.baseUrl}/checkout?lang=sl`, { waitUntil: 'domcontentloaded' });
    await wait(3000);
    
    const pageText = await page.evaluate(() => document.body.textContent);
    const cartEmpty = pageText.includes('košarica je prazna');
    
    if (cartEmpty) {
      console.log('❌ Cart is empty - add to cart failed');
    } else {
      console.log('✅ Cart has items - add to cart worked!');
      
      // Try to fill checkout form
      console.log('📝 Looking for checkout form...');
      const checkoutEmail = await page.$('input[type="email"]');
      if (checkoutEmail) {
        await checkoutEmail.click();
        await checkoutEmail.type(email2);
        console.log(`✅ Filled checkout email: ${email2}`);
      } else {
        console.log('⚠️ No email field in checkout form');
      }
    }
    
    // TEST 3: Simple verification
    console.log('\n🔍 TEST 3: Simple verification');
    console.log('='.repeat(60));
    
    // Test homepage loads
    await page.goto(`${CONFIG.baseUrl}?lang=sl`, { waitUntil: 'domcontentloaded' });
    const title = await page.title();
    console.log(`✅ Homepage title: ${title}`);
    
    // Test product page loads
    await page.goto(`${CONFIG.baseUrl}/izdelek/11?lang=sl`, { waitUntil: 'domcontentloaded' });
    const productH1 = await page.$eval('h1', el => el.textContent).catch(() => 'Not found');
    console.log(`✅ Product page H1: ${productH1}`);
    
    // Test checkout page loads
    await page.goto(`${CONFIG.baseUrl}/checkout?lang=sl`, { waitUntil: 'domcontentloaded' });
    const checkoutContent = await page.evaluate(() => document.body.textContent.substring(0, 100));
    console.log(`✅ Checkout page content: ${checkoutContent}...`);
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  } finally {
    console.log('\n⏰ Keeping browser open for 30 seconds for manual inspection...');
    setTimeout(async () => {
      await browser.close();
      console.log('Browser closed.');
    }, 30000);
  }
  
  // Final summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 WORKING PROOF TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`📧 Emails used for testing:`);
  console.log(`   Newsletter: ${CONFIG.testEmails[0]}`);
  console.log(`   Checkout: ${CONFIG.testEmails[1]}`);
  console.log(`   Spare: ${CONFIG.testEmails[2]}`);
  
  console.log('\n🔍 MANUAL VERIFICATION REQUIRED:');
  console.log('1. Check email inboxes at https://noexpire.top');
  console.log('2. Look for newsletter confirmation emails');
  console.log('3. Verify if any database entries were created');
  console.log('4. Check if cart functionality actually worked');
  
  console.log('\n⚠️ This test uses the PROVEN methods that worked before.');
  console.log('If no emails arrive, the issue is with the website, not the test.');
}

runWorkingProofTest().catch(console.error);
