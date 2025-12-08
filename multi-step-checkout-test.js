/**
 * MULTI-STEP CHECKOUT TEST
 * 
 * Using the CORRECT multi-step checkout flow where emails actually work!
 * URL: /multi-step-checkout instead of /checkout
 */

import puppeteer from 'puppeteer';

const CONFIG = {
  baseUrl: 'https://marosatest.netlify.app',
  testEmail: 'multistep.test.001@noexpire.top'
};

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runMultiStepCheckoutTest() {
  console.log('🚀 MULTI-STEP CHECKOUT TEST - Using correct email-enabled flow\n');
  console.log(`📧 Test email: ${CONFIG.testEmail}\n`);
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 400,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled'
    ]
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  
  // Monitor console for email-related messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('email') || text.includes('Email') || text.includes('order') || 
        text.includes('MultiStep') || text.includes('sending')) {
      console.log(`🖥️ Console: ${msg.type()}: ${text}`);
    }
  });
  
  try {
    // Step 1: Add product to cart
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
    
    // Add product
    await page.goto(`${CONFIG.baseUrl}/izdelek/11?lang=sl`, { waitUntil: 'networkidle2' });
    await wait(3000);
    
    const productTitle = await page.$eval('h1', el => el.textContent).catch(() => 'Unknown');
    console.log(`   Product: ${productTitle}`);
    
    const quantityInputs = await page.$$('input[type="number"]');
    if (quantityInputs.length > 0) {
      await quantityInputs[0].click({ clickCount: 3 });
      await quantityInputs[0].type('1');
      await wait(1000);
    }
    
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      try {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && text.includes('Dodaj v košarico')) {
          await btn.click();
          console.log('✅ Added to cart');
          await wait(5000);
          break;
        }
      } catch (e) { continue; }
    }
    
    // Step 2: Go to MULTI-STEP checkout (the correct one!)
    console.log('\n💳 Step 2: Going to MULTI-STEP checkout...');
    await page.goto(`${CONFIG.baseUrl}/multi-step-checkout?lang=sl`, { waitUntil: 'networkidle2' });
    await wait(5000);
    
    console.log(`   Current URL: ${page.url()}`);
    
    // Check if we're on the right page
    const pageContent = await page.evaluate(() => document.body.textContent);
    if (pageContent.includes('prazna') || pageContent.includes('empty')) {
      console.log('❌ Cart is empty on multi-step checkout page');
      return;
    }
    
    console.log('✅ Multi-step checkout page loaded with items');
    
    // Step 3: Navigate through multi-step process
    console.log('\n📝 Step 3: Navigating multi-step checkout process...');
    
    // Look for step indicators or navigation
    const stepElements = await page.$$('.step, .checkout-step, [data-step]');
    console.log(`   Found ${stepElements.length} step elements`);
    
    // Fill customer information (first step)
    console.log('👤 Filling customer information...');
    
    const customerFields = [
      { selector: 'input[type="email"]', value: CONFIG.testEmail, name: 'email' },
      { selector: 'input[name*="name"], input[name*="Name"]', value: 'MultiStep Buyer', name: 'name' },
      { selector: 'input[type="tel"], input[name*="phone"]', value: '+386 41 555 555', name: 'phone' }
    ];
    
    for (const field of customerFields) {
      try {
        const element = await page.$(field.selector);
        if (element) {
          await element.click();
          await element.click({ clickCount: 3 });
          await element.type(field.value, { delay: 50 });
          console.log(`   ✅ Filled ${field.name}: ${field.value}`);
          await wait(500);
        }
      } catch (e) {
        console.log(`   ⚠️ Could not fill ${field.name}`);
      }
    }
    
    // Look for "Next" or "Continue" button
    console.log('🔄 Looking for next step button...');
    const nextButtons = await page.$$('button');
    let nextClicked = false;
    
    for (const btn of nextButtons) {
      try {
        const text = await page.evaluate(el => el.textContent.toLowerCase(), btn);
        if (text.includes('naprej') || text.includes('next') || text.includes('continue') || 
            text.includes('nadaljuj')) {
          await btn.click();
          console.log(`✅ Clicked next: "${text}"`);
          nextClicked = true;
          await wait(3000);
          break;
        }
      } catch (e) { continue; }
    }
    
    if (!nextClicked) {
      console.log('⚠️ No next button found, continuing with current step');
    }
    
    // Fill shipping/billing information (second step)
    console.log('\n🏠 Filling shipping information...');
    
    const shippingFields = [
      { selector: 'input[name*="address"]', value: 'MultiStep Street 123', name: 'address' },
      { selector: 'input[name*="city"]', value: 'Ljubljana', name: 'city' },
      { selector: 'input[name*="postal"]', value: '1000', name: 'postal' }
    ];
    
    for (const field of shippingFields) {
      try {
        const element = await page.$(field.selector);
        if (element) {
          await element.click();
          await element.click({ clickCount: 3 });
          await element.type(field.value, { delay: 50 });
          console.log(`   ✅ Filled ${field.name}: ${field.value}`);
          await wait(500);
        }
      } catch (e) {
        console.log(`   ⚠️ Could not fill ${field.name}`);
      }
    }
    
    // Look for next button again
    const nextButtons2 = await page.$$('button');
    for (const btn of nextButtons2) {
      try {
        const text = await page.evaluate(el => el.textContent.toLowerCase(), btn);
        if (text.includes('naprej') || text.includes('next') || text.includes('continue') || 
            text.includes('nadaljuj')) {
          await btn.click();
          console.log(`✅ Clicked next: "${text}"`);
          await wait(3000);
          break;
        }
      } catch (e) { continue; }
    }
    
    // Payment method selection (final step)
    console.log('\n💰 Selecting payment method...');
    
    const paymentMethods = await page.$$('input[type="radio"]');
    if (paymentMethods.length > 0) {
      await paymentMethods[0].click();
      const methodId = await page.evaluate(el => el.id || el.value, paymentMethods[0]);
      console.log(`✅ Payment method selected: ${methodId}`);
      await wait(2000);
    }
    
    // Final order submission
    console.log('\n🚀 Submitting final order...');
    
    const submitButtons = await page.$$('button');
    let orderSubmitted = false;
    
    for (const btn of submitButtons) {
      try {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && (text.includes('Oddaj naročilo') || text.includes('Potrdi') || 
                    text.includes('Submit') || text.includes('Place Order'))) {
          console.log(`   🎯 Submitting with: "${text}"`);
          await btn.click();
          orderSubmitted = true;
          await wait(10000); // Wait for processing
          break;
        }
      } catch (e) { continue; }
    }
    
    if (!orderSubmitted) {
      console.log('❌ Could not find final submit button');
      return;
    }
    
    // Check results
    console.log('\n🎉 Checking order results...');
    
    const finalUrl = page.url();
    const finalContent = await page.evaluate(() => document.body.textContent.toLowerCase());
    
    console.log(`   Final URL: ${finalUrl}`);
    
    const success = finalUrl.includes('order-success') || finalUrl.includes('success') || 
                   finalContent.includes('uspešno') || finalContent.includes('hvala');
    
    if (success) {
      const orderMatch = finalContent.match(/(\d{4,})/);
      const orderNumber = orderMatch ? orderMatch[1] : 'Unknown';
      
      console.log('🎉 SUCCESS! Multi-step checkout completed!');
      console.log(`   📋 Order number: ${orderNumber}`);
      console.log(`   📧 Email: ${CONFIG.testEmail}`);
      console.log('\n📧 CRITICAL TEST:');
      console.log(`   Check ${CONFIG.testEmail} for order confirmation`);
      console.log('   This should work since we used the correct multi-step checkout!');
      
    } else {
      console.log('❌ Order submission may have failed');
      console.log(`   Page content: ${finalContent.substring(0, 200)}...`);
    }
    
  } catch (error) {
    console.error('❌ Error during multi-step checkout:', error.message);
  } finally {
    console.log('\n⏰ Keeping browser open for inspection...');
    setTimeout(async () => {
      await browser.close();
      console.log('Browser closed.');
    }, 60000);
  }
}

runMultiStepCheckoutTest().catch(console.error);
