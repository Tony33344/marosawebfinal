/**
 * EXACT FLOW TEST - Following the screenshots exactly
 * 
 * Flow from screenshots:
 * 1. Product → "Dodaj v košarico" 
 * 2. Cart → "Na blagajno"
 * 3. Choice → "Nadaljuj kot gost"
 * 4. Form → "Nadaljuj na plačilo" 
 * 5. Payment → "Oddaj naročilo"
 */

import puppeteer from 'puppeteer';

const CONFIG = {
  baseUrl: 'https://marosatest.netlify.app',
  testEmail: 'exact.flow.001@noexpire.top'
};

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runExactFlowTest() {
  console.log('🚀 EXACT FLOW TEST - Following screenshots exactly\n');
  console.log(`📧 Test email: ${CONFIG.testEmail}\n`);
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 500,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  
  // Monitor email-related console messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('email') || text.includes('Email') || text.includes('order') || 
        text.includes('sending') || text.includes('MultiStep')) {
      console.log(`🖥️ Console: ${text}`);
    }
  });
  
  try {
    // Step 1: Navigate to product and add to cart
    console.log('📦 Step 1: Adding product to cart...');
    await page.goto(`${CONFIG.baseUrl}?lang=sl`, { waitUntil: 'networkidle2' });
    await wait(3000);
    
    // Handle popups
    const cookieButtons = await page.$$('button');
    for (const btn of cookieButtons) {
      try {
        const text = await page.evaluate(el => el.textContent.toLowerCase(), btn);
        if (text.includes('sprejmi') && text.includes('vse')) {
          await btn.click();
          await wait(2000);
          break;
        }
      } catch (e) { continue; }
    }
    
    try {
      const closeButtons = await page.$$('button');
      for (const btn of closeButtons) {
        const text = await page.evaluate(el => el.textContent.toLowerCase(), btn);
        if (text.includes('ne, hvala')) {
          await btn.click();
          await wait(2000);
          break;
        }
      }
    } catch (e) { /* ignore */ }
    
    // Go to product page
    await page.goto(`${CONFIG.baseUrl}/izdelek/11?lang=sl`, { waitUntil: 'networkidle2' });
    await wait(3000);
    
    // Select 500g package and add to cart
    console.log('📦 Selecting 500g package...');
    const addToCartButtons = await page.$$('button');
    for (const btn of addToCartButtons) {
      try {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && text.includes('Dodaj v košarico')) {
          // Check if this is the 500g option
          const parentText = await page.evaluate(el => {
            const parent = el.closest('.package-option, .product-option, div');
            return parent ? parent.textContent : '';
          }, btn);
          
          if (parentText.includes('500g') || parentText.includes('2.50')) {
            await btn.click();
            console.log('✅ Added 500g package to cart');
            await wait(5000);
            break;
          }
        }
      } catch (e) { continue; }
    }
    
    // Step 2: Go to cart and proceed to checkout
    console.log('\n🛒 Step 2: Going to cart...');
    await page.goto(`${CONFIG.baseUrl}/cart`, { waitUntil: 'networkidle2' });
    await wait(3000);
    
    console.log(`   Current URL: ${page.url()}`);
    
    // Click "Na blagajno" (To checkout) - this should navigate to /checkout-steps
    console.log('🔍 Looking for "Na blagajno" button...');
    const checkoutButtons = await page.$$('button, a');
    let checkoutClicked = false;

    for (const btn of checkoutButtons) {
      try {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && text.includes('Na blagajno')) {
          await btn.click();
          console.log('✅ Clicked "Na blagajno"');
          checkoutClicked = true;
          await wait(5000);
          break;
        }
      } catch (e) { continue; }
    }

    if (!checkoutClicked) {
      console.log('❌ Could not find "Na blagajno" button');
      // List available buttons for debugging
      console.log('Available buttons:');
      for (const btn of checkoutButtons) {
        try {
          const text = await page.evaluate(el => el.textContent, btn);
          if (text && text.trim()) {
            console.log(`   - "${text.trim()}"`);
          }
        } catch (e) { continue; }
      }
      throw new Error('Checkout button not found');
    }
    
    // Step 3: Select "Nadaljuj kot gost" (Continue as guest)
    console.log('\n👤 Step 3: Selecting guest checkout...');
    console.log(`   Current URL: ${page.url()}`);

    // Verify we're on the checkout-steps page
    if (!page.url().includes('checkout-steps')) {
      console.log('❌ Not on checkout-steps page, trying to navigate directly');
      await page.goto(`${CONFIG.baseUrl}/checkout-steps?lang=sl`, { waitUntil: 'networkidle2' });
      await wait(3000);
    }

    const guestButtons = await page.$$('button');
    let guestSelected = false;

    for (const btn of guestButtons) {
      try {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && text.includes('Nadaljuj kot gost')) {
          await btn.click();
          console.log('✅ Selected "Nadaljuj kot gost"');
          guestSelected = true;
          await wait(5000);
          break;
        }
      } catch (e) { continue; }
    }

    if (!guestSelected) {
      console.log('❌ Could not find "Nadaljuj kot gost" button');
      // List available buttons
      console.log('Available buttons:');
      for (const btn of guestButtons) {
        try {
          const text = await page.evaluate(el => el.textContent, btn);
          if (text && text.trim()) {
            console.log(`   - "${text.trim()}"`);
          }
        } catch (e) { continue; }
      }
    }
    
    // Step 4: Fill delivery information form
    console.log('\n📝 Step 4: Filling delivery information...');
    console.log(`   Current URL: ${page.url()}`);
    
    // Fill form fields based on screenshot
    const formFields = [
      { selector: 'input[name*="name"], input[placeholder*="ime"]', value: 'Exact Flow Buyer', name: 'Full name' },
      { selector: 'input[type="email"], input[name*="email"]', value: CONFIG.testEmail, name: 'Email' },
      { selector: 'input[type="tel"], input[name*="phone"]', value: '5644324', name: 'Phone' },
      { selector: 'input[name*="address"], input[placeholder*="naslov"]', value: 'markovska 44', name: 'Address' },
      { selector: 'input[name*="postal"], input[placeholder*="poštna"]', value: '2323', name: 'Postal code' },
      { selector: 'input[name*="city"], input[placeholder*="mesto"]', value: 'markovsko', name: 'City' }
    ];
    
    let fieldsFound = 0;
    for (const field of formFields) {
      try {
        const element = await page.$(field.selector);
        if (element) {
          await element.click();
          await element.click({ clickCount: 3 });
          await element.type(field.value, { delay: 50 });
          console.log(`   ✅ Filled ${field.name}: ${field.value}`);
          fieldsFound++;
          await wait(500);
        }
      } catch (e) {
        console.log(`   ⚠️ Could not fill ${field.name}`);
      }
    }
    
    // Select country (Slovenia)
    try {
      const countrySelect = await page.$('select');
      if (countrySelect) {
        await countrySelect.selectOption('Slovenija');
        console.log('   ✅ Selected country: Slovenija');
        await wait(500);
      }
    } catch (e) {
      console.log('   ⚠️ Could not select country');
    }
    
    console.log(`✅ Filled ${fieldsFound} form fields`);
    
    // Click "Nadaljuj na plačilo" (Continue to payment)
    console.log('\n💳 Step 5: Continuing to payment...');
    const continueButtons = await page.$$('button');
    let continueClicked = false;

    for (const btn of continueButtons) {
      try {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && text.includes('Nadaljuj na plačilo')) {
          await btn.click();
          console.log('✅ Clicked "Nadaljuj na plačilo"');
          continueClicked = true;
          await wait(5000);
          break;
        }
      } catch (e) { continue; }
    }

    if (!continueClicked) {
      console.log('❌ Could not find "Nadaljuj na plačilo" button');
      // List available buttons
      console.log('Available buttons:');
      for (const btn of continueButtons) {
        try {
          const text = await page.evaluate(el => el.textContent, btn);
          if (text && text.trim()) {
            console.log(`   - "${text.trim()}"`);
          }
        } catch (e) { continue; }
      }
    }
    
    // Step 6: Select payment method and submit order
    console.log('\n💰 Step 6: Payment method and order submission...');
    console.log(`   Current URL: ${page.url()}`);
    
    // Select payment method (default to first available)
    const paymentRadios = await page.$$('input[type="radio"]');
    if (paymentRadios.length > 0) {
      await paymentRadios[0].click();
      const paymentText = await page.evaluate(el => {
        const label = el.closest('label') || el.nextElementSibling;
        return label ? label.textContent : el.value;
      }, paymentRadios[0]);
      console.log(`✅ Selected payment method: ${paymentText}`);
      await wait(2000);
    }
    
    // Click "Oddaj naročilo" (Submit order)
    console.log('🚀 Submitting order...');
    const submitButtons = await page.$$('button');
    let orderSubmitted = false;
    
    for (const btn of submitButtons) {
      try {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && text.includes('Oddaj naročilo')) {
          await btn.click();
          console.log('✅ Clicked "Oddaj naročilo"');
          orderSubmitted = true;
          await wait(10000); // Wait for processing
          break;
        }
      } catch (e) { continue; }
    }
    
    if (!orderSubmitted) {
      console.log('❌ Could not find "Oddaj naročilo" button');
      // List available buttons
      const allButtons = await page.$$('button');
      console.log('Available buttons:');
      for (const btn of allButtons) {
        try {
          const text = await page.evaluate(el => el.textContent, btn);
          console.log(`   - "${text}"`);
        } catch (e) { continue; }
      }
    }
    
    // Step 7: Check final results
    console.log('\n🎉 Step 7: Checking final results...');
    
    const finalUrl = page.url();
    const finalContent = await page.evaluate(() => document.body.textContent.toLowerCase());
    
    console.log(`   Final URL: ${finalUrl}`);
    
    const success = finalUrl.includes('success') || finalContent.includes('uspešno') || 
                   finalContent.includes('hvala') || finalContent.includes('potrjen');
    
    if (success) {
      const orderMatch = finalContent.match(/(\d{4,})/);
      const orderNumber = orderMatch ? orderMatch[1] : 'Unknown';
      
      console.log('🎉 SUCCESS! Order completed following exact flow!');
      console.log(`   📋 Order number: ${orderNumber}`);
      console.log(`   📧 Email: ${CONFIG.testEmail}`);
      console.log('\n📧 EMAIL VERIFICATION:');
      console.log(`   Check ${CONFIG.testEmail} for order confirmation`);
      console.log('   This should work since we followed the exact manual flow!');
      
    } else {
      console.log('❌ Order may not have completed successfully');
      console.log(`   Page content preview: ${finalContent.substring(0, 300)}...`);
    }
    
  } catch (error) {
    console.error('❌ Error during exact flow test:', error.message);
  } finally {
    console.log('\n⏰ Keeping browser open for inspection...');
    setTimeout(async () => {
      await browser.close();
      console.log('Browser closed.');
    }, 60000);
  }
}

runExactFlowTest().catch(console.error);
