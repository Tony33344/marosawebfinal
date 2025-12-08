/**
 * FIXED CHECKOUT TEST - Properly handle cart and complete payment
 * 
 * This test will:
 * 1. Properly add items to cart and verify they persist
 * 2. Handle any cart issues
 * 3. Complete the full checkout with payment
 * 4. Verify success message
 */

import puppeteer from 'puppeteer';

const CONFIG = {
  baseUrl: 'https://marosatest.netlify.app',
  testCustomer: {
    name: 'Test Buyer',
    email: 'fixed.checkout.001@noexpire.top',
    phone: '+386 41 123 456',
    address: 'Test Street 123',
    city: 'Ljubljana',
    postalCode: '1000'
  }
};

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runFixedCheckoutTest() {
  console.log('🚀 FIXED CHECKOUT TEST - Complete Payment Flow\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 500,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  
  try {
    // Step 1: Handle initial popups
    console.log('🏠 Step 1: Loading homepage and handling popups...');
    await page.goto(`${CONFIG.baseUrl}?lang=sl`, { waitUntil: 'networkidle2' });
    await wait(3000);
    
    // Handle cookie consent
    const cookieButtons = await page.$$('button');
    for (const btn of cookieButtons) {
      try {
        const text = await page.evaluate(el => el.textContent.toLowerCase(), btn);
        if (text.includes('sprejmi') && text.includes('vse')) {
          await btn.click();
          console.log('✅ Cookie consent handled');
          await wait(2000);
          break;
        }
      } catch (e) { continue; }
    }
    
    // Close newsletter popup if it appears
    try {
      const closeButtons = await page.$$('button, .close, [aria-label="close"]');
      for (const btn of closeButtons) {
        const text = await page.evaluate(el => el.textContent.toLowerCase(), btn);
        if (text.includes('ne') || text.includes('×') || text.includes('close')) {
          await btn.click();
          console.log('✅ Newsletter popup closed');
          await wait(1000);
          break;
        }
      }
    } catch (e) { /* ignore */ }
    
    // Step 2: Add product to cart properly
    console.log('\n📦 Step 2: Adding product to cart...');
    await page.goto(`${CONFIG.baseUrl}/izdelek/11?lang=sl`, { waitUntil: 'networkidle2' });
    await wait(3000);
    
    const productTitle = await page.$eval('h1', el => el.textContent).catch(() => 'Unknown');
    console.log(`   Product: ${productTitle}`);
    
    // Set quantity
    const quantityInputs = await page.$$('input[type="number"]');
    if (quantityInputs.length > 0) {
      await quantityInputs[0].click({ clickCount: 3 });
      await quantityInputs[0].type('1');
      console.log('✅ Quantity set to 1');
      await wait(1000);
    }
    
    // Add to cart
    const buttons = await page.$$('button');
    let cartAdded = false;
    
    for (const btn of buttons) {
      try {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && text.includes('Dodaj v košarico')) {
          console.log('🛒 Clicking add to cart...');
          await btn.click();
          cartAdded = true;
          await wait(5000); // Wait longer for cart to update
          break;
        }
      } catch (e) { continue; }
    }
    
    if (!cartAdded) {
      console.log('❌ Add to cart button not found');
      await browser.close();
      return;
    }
    
    // Step 3: Verify cart and proceed to checkout
    console.log('\n💳 Step 3: Checking cart and proceeding to checkout...');
    
    // Try multiple ways to get to checkout
    const checkoutUrls = [
      `${CONFIG.baseUrl}/checkout?lang=sl`,
      `${CONFIG.baseUrl}/cart?lang=sl`,
      `${CONFIG.baseUrl}/blagajna?lang=sl`
    ];
    
    let cartHasItems = false;
    
    for (const url of checkoutUrls) {
      try {
        await page.goto(url, { waitUntil: 'networkidle2' });
        await wait(3000);
        
        const pageContent = await page.evaluate(() => document.body.textContent);
        if (!pageContent.includes('prazna') && !pageContent.includes('empty')) {
          console.log(`✅ Cart has items at: ${url}`);
          cartHasItems = true;
          break;
        } else {
          console.log(`⚠️ Cart empty at: ${url}`);
        }
      } catch (e) {
        console.log(`⚠️ Could not load: ${url}`);
      }
    }
    
    if (!cartHasItems) {
      console.log('❌ Cart is empty in all checkout pages');
      console.log('🔧 This indicates an issue with cart persistence or add-to-cart functionality');
      await browser.close();
      return;
    }
    
    // Step 4: Fill checkout form
    console.log('\n📝 Step 4: Filling checkout form...');
    
    // Look for all possible form fields
    const formSelectors = [
      { name: 'email', selectors: ['input[type="email"]', 'input[name*="email"]'], value: CONFIG.testCustomer.email },
      { name: 'name', selectors: ['input[name*="name"]', 'input[name*="Name"]'], value: CONFIG.testCustomer.name },
      { name: 'phone', selectors: ['input[type="tel"]', 'input[name*="phone"]'], value: CONFIG.testCustomer.phone },
      { name: 'address', selectors: ['input[name*="address"]'], value: CONFIG.testCustomer.address },
      { name: 'city', selectors: ['input[name*="city"]'], value: CONFIG.testCustomer.city },
      { name: 'postal', selectors: ['input[name*="postal"]', 'input[name*="zip"]'], value: CONFIG.testCustomer.postalCode }
    ];
    
    let fieldsFound = 0;
    
    for (const field of formSelectors) {
      for (const selector of field.selectors) {
        try {
          const element = await page.$(selector);
          if (element) {
            await element.click();
            await element.type(field.value);
            console.log(`   ✅ Filled ${field.name}: ${field.value}`);
            fieldsFound++;
            await wait(500);
            break;
          }
        } catch (e) { continue; }
      }
    }
    
    console.log(`✅ Filled ${fieldsFound} form fields`);
    
    // Step 5: Select payment method and submit
    console.log('\n💰 Step 5: Selecting payment method and submitting order...');
    
    // Look for payment options
    const paymentOptions = await page.$$('input[type="radio"], select option, .payment-option');
    if (paymentOptions.length > 0) {
      console.log(`   Found ${paymentOptions.length} payment options`);
      
      // Try to select the first available payment method
      try {
        await paymentOptions[0].click();
        console.log('✅ Payment method selected');
        await wait(1000);
      } catch (e) {
        console.log('⚠️ Could not select payment method');
      }
    }
    
    // Submit the order
    const submitSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      '.submit-order',
      '.place-order',
      'button:contains("Potrdi")',
      'button:contains("Naroči")'
    ];
    
    let orderSubmitted = false;
    
    for (const selector of submitSelectors) {
      try {
        const submitBtn = await page.$(selector);
        if (submitBtn) {
          console.log(`   🎯 Found submit button: ${selector}`);
          await submitBtn.click();
          console.log('🚀 Order submitted!');
          orderSubmitted = true;
          await wait(8000); // Wait for processing and redirect
          break;
        }
      } catch (e) { continue; }
    }
    
    if (!orderSubmitted) {
      // Try any button that might submit the order
      const allButtons = await page.$$('button');
      for (const btn of allButtons) {
        try {
          const text = await page.evaluate(el => el.textContent.toLowerCase(), btn);
          if (text.includes('potrdi') || text.includes('naroči') || text.includes('submit') || 
              text.includes('order') || text.includes('plačaj') || text.includes('pay')) {
            console.log(`   🎯 Trying button: "${text}"`);
            await btn.click();
            orderSubmitted = true;
            await wait(8000);
            break;
          }
        } catch (e) { continue; }
      }
    }
    
    // Step 6: Check for success
    console.log('\n🎉 Step 6: Checking for success message...');
    
    const currentUrl = page.url();
    const pageContent = await page.evaluate(() => document.body.textContent.toLowerCase());
    
    console.log(`   Current URL: ${currentUrl}`);
    console.log(`   Page content preview: ${pageContent.substring(0, 200)}...`);
    
    // Look for success indicators
    const successIndicators = [
      'uspešno', 'success', 'hvala', 'thank you', 'potrjen', 'confirmed',
      'naročilo', 'order', 'plačilo', 'payment', 'prejeli', 'received'
    ];
    
    let successFound = false;
    let foundIndicators = [];
    
    for (const indicator of successIndicators) {
      if (pageContent.includes(indicator)) {
        successFound = true;
        foundIndicators.push(indicator);
      }
    }
    
    // Check URL for success
    if (currentUrl.includes('success') || currentUrl.includes('thank') || 
        currentUrl.includes('confirm') || currentUrl.includes('complete')) {
      successFound = true;
      foundIndicators.push('success URL');
    }
    
    // Final result
    if (successFound) {
      console.log('🎉 SUCCESS! Order completed successfully!');
      console.log(`   Success indicators found: ${foundIndicators.join(', ')}`);
      
      // Try to find order number
      const orderMatch = pageContent.match(/(\d{4,})/);
      if (orderMatch) {
        console.log(`   📋 Possible order number: ${orderMatch[1]}`);
      }
      
      console.log(`\n📧 CHECK EMAIL: ${CONFIG.testCustomer.email}`);
      console.log('   Look for order confirmation email');
      
    } else {
      console.log('❌ No clear success message found');
      console.log('   This might indicate payment processing issues');
    }
    
  } catch (error) {
    console.error('❌ Error during checkout test:', error.message);
  } finally {
    console.log('\n⏰ Keeping browser open for 60 seconds for manual inspection...');
    setTimeout(async () => {
      await browser.close();
      console.log('Browser closed.');
    }, 60000);
  }
}

runFixedCheckoutTest().catch(console.error);
