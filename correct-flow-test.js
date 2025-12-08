/**
 * CORRECT FLOW TEST
 * 
 * Using the actual manual flow:
 * 1. Add to cart
 * 2. Go to /cart
 * 3. Proceed to /checkout-steps?lang=sl
 * 4. Complete multi-step checkout with email confirmation
 */

import puppeteer from 'puppeteer';

const CONFIG = {
  baseUrl: 'https://marosatest.netlify.app',
  testEmail: 'correct.flow.001@noexpire.top'
};

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runCorrectFlowTest() {
  console.log('🚀 CORRECT FLOW TEST - Using actual manual URLs\n');
  console.log(`📧 Test email: ${CONFIG.testEmail}\n`);
  console.log('Flow: Add to cart → /cart → /checkout-steps\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 400,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  
  // Monitor email-related console messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('email') || text.includes('Email') || text.includes('order') || 
        text.includes('sending') || text.includes('confirmation')) {
      console.log(`🖥️ Console: ${text}`);
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
    
    // Step 2: Go to cart page
    console.log('\n🛒 Step 2: Going to cart page...');
    await page.goto(`${CONFIG.baseUrl}/cart`, { waitUntil: 'networkidle2' });
    await wait(3000);
    
    console.log(`   Current URL: ${page.url()}`);
    
    const cartContent = await page.evaluate(() => document.body.textContent);
    if (cartContent.includes('prazna') || cartContent.includes('empty')) {
      console.log('❌ Cart is empty');
      return;
    }
    
    console.log('✅ Cart page loaded with items');
    
    // Look for checkout button on cart page
    console.log('🔍 Looking for checkout button...');
    const cartButtons = await page.$$('button, a');
    let checkoutClicked = false;
    
    for (const btn of cartButtons) {
      try {
        const text = await page.evaluate(el => el.textContent.toLowerCase(), btn);
        if (text.includes('blagajna') || text.includes('checkout') || text.includes('naroči')) {
          await btn.click();
          console.log(`✅ Clicked checkout: "${text}"`);
          checkoutClicked = true;
          await wait(5000);
          break;
        }
      } catch (e) { continue; }
    }
    
    if (!checkoutClicked) {
      // Manually navigate to checkout-steps
      console.log('⚠️ No checkout button found, navigating directly...');
      await page.goto(`${CONFIG.baseUrl}/checkout-steps?lang=sl`, { waitUntil: 'networkidle2' });
      await wait(5000);
    }
    
    // Step 3: Multi-step checkout process
    console.log('\n📝 Step 3: Multi-step checkout process...');
    console.log(`   Current URL: ${page.url()}`);
    
    // Check if we're on checkout-steps
    if (!page.url().includes('checkout-steps')) {
      console.log('❌ Not on checkout-steps page, navigating...');
      await page.goto(`${CONFIG.baseUrl}/checkout-steps?lang=sl`, { waitUntil: 'networkidle2' });
      await wait(5000);
    }
    
    console.log('✅ On checkout-steps page');
    
    // Fill customer information
    console.log('👤 Filling customer information...');
    
    const formFields = [
      { selector: 'input[type="email"]', value: CONFIG.testEmail, name: 'email' },
      { selector: 'input[name*="name"], input[name*="Name"]', value: 'Correct Flow Buyer', name: 'name' },
      { selector: 'input[type="tel"], input[name*="phone"]', value: '+386 41 666 666', name: 'phone' },
      { selector: 'input[name*="address"]', value: 'Correct Flow Street 456', name: 'address' },
      { selector: 'input[name*="city"]', value: 'Ljubljana', name: 'city' },
      { selector: 'input[name*="postal"]', value: '1000', name: 'postal' }
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
    
    console.log(`✅ Filled ${fieldsFound} form fields`);
    
    // Look for step navigation or continue buttons
    console.log('\n🔄 Looking for step navigation...');
    
    const stepButtons = await page.$$('button');
    for (const btn of stepButtons) {
      try {
        const text = await page.evaluate(el => el.textContent.toLowerCase(), btn);
        if (text.includes('naprej') || text.includes('next') || text.includes('continue') || 
            text.includes('nadaljuj') || text.includes('korak')) {
          await btn.click();
          console.log(`✅ Clicked step button: "${text}"`);
          await wait(3000);
          break;
        }
      } catch (e) { continue; }
    }
    
    // Select payment method
    console.log('\n💰 Selecting payment method...');
    
    const paymentMethods = await page.$$('input[type="radio"]');
    if (paymentMethods.length > 0) {
      await paymentMethods[0].click();
      const methodValue = await page.evaluate(el => el.value || el.id, paymentMethods[0]);
      console.log(`✅ Payment method selected: ${methodValue}`);
      await wait(2000);
    }
    
    // Final submission
    console.log('\n🚀 Final order submission...');
    
    const submitButtons = await page.$$('button');
    let orderSubmitted = false;
    
    for (const btn of submitButtons) {
      try {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && (text.includes('Oddaj naročilo') || text.includes('Potrdi naročilo') || 
                    text.includes('Submit') || text.includes('Place Order') || 
                    text.includes('Dokončaj'))) {
          console.log(`   🎯 Submitting with: "${text}"`);
          await btn.click();
          orderSubmitted = true;
          await wait(10000);
          break;
        }
      } catch (e) { continue; }
    }
    
    if (!orderSubmitted) {
      console.log('❌ Could not find submit button');
      // Try any button that might submit
      const allButtons = await page.$$('button');
      for (const btn of allButtons) {
        try {
          const text = await page.evaluate(el => el.textContent, btn);
          console.log(`   Available button: "${text}"`);
        } catch (e) { continue; }
      }
    }
    
    // Check final results
    console.log('\n🎉 Checking final results...');
    
    const finalUrl = page.url();
    const finalContent = await page.evaluate(() => document.body.textContent.toLowerCase());
    
    console.log(`   Final URL: ${finalUrl}`);
    
    const success = finalUrl.includes('success') || finalContent.includes('uspešno') || 
                   finalContent.includes('hvala') || finalContent.includes('potrjen');
    
    if (success) {
      const orderMatch = finalContent.match(/(\d{4,})/);
      const orderNumber = orderMatch ? orderMatch[1] : 'Unknown';
      
      console.log('🎉 SUCCESS! Correct flow completed!');
      console.log(`   📋 Order number: ${orderNumber}`);
      console.log(`   📧 Email: ${CONFIG.testEmail}`);
      console.log('\n📧 EMAIL VERIFICATION:');
      console.log(`   Check ${CONFIG.testEmail} for order confirmation`);
      console.log('   This should work with the correct checkout-steps flow!');
      
    } else {
      console.log('❌ Order may not have completed successfully');
      console.log(`   Page content preview: ${finalContent.substring(0, 300)}...`);
    }
    
  } catch (error) {
    console.error('❌ Error during correct flow test:', error.message);
  } finally {
    console.log('\n⏰ Keeping browser open for inspection...');
    setTimeout(async () => {
      await browser.close();
      console.log('Browser closed.');
    }, 60000);
  }
}

runCorrectFlowTest().catch(console.error);
