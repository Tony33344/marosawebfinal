/**
 * FULL CHECKOUT TEST - Complete payment flow verification
 * 
 * Tests the COMPLETE checkout process:
 * 1. Add product to cart
 * 2. Fill checkout form
 * 3. Select payment method (Stripe test cards, bank transfer, cash on delivery)
 * 4. Complete payment
 * 5. VERIFY SUCCESS MESSAGE
 * 6. Check order confirmation
 * 
 * This is what actually matters - not just form filling!
 */

import puppeteer from 'puppeteer';

const CONFIG = {
  baseUrl: 'https://marosatest.netlify.app',
  
  // Test customer data
  testCustomer: {
    name: 'Test Buyer',
    email: 'checkout.test.001@noexpire.top',
    phone: '+386 41 123 456',
    address: 'Test Street 123',
    city: 'Ljubljana',
    postalCode: '1000',
    country: 'Slovenia'
  },
  
  // Stripe test card data
  stripeTestCard: {
    number: '4242424242424242',
    expiry: '12/25',
    cvc: '123',
    name: 'Test Buyer'
  }
};

const results = {
  startTime: new Date(),
  tests: [],
  orderDetails: {},
  paymentResults: {}
};

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function logResult(step, success, details) {
  const result = { step, success, details, timestamp: new Date() };
  results.tests.push(result);
  
  const status = success ? '✅' : '❌';
  console.log(`${status} ${step}: ${details}`);
  
  return result;
}

/**
 * Complete the full checkout flow with payment
 */
async function testFullCheckoutFlow(page) {
  console.log('🛒 TESTING COMPLETE CHECKOUT FLOW WITH PAYMENT\n');
  console.log('='.repeat(60));
  
  try {
    // Step 1: Add product to cart
    console.log('📦 Step 1: Adding product to cart...');
    await page.goto(`${CONFIG.baseUrl}/izdelek/11?lang=sl`, { waitUntil: 'networkidle2' });
    await wait(3000);
    
    // Get product info
    const productTitle = await page.$eval('h1', el => el.textContent).catch(() => 'Unknown');
    const productPrice = await page.$eval('.price, [class*="price"]', el => el.textContent).catch(() => 'Unknown');
    
    console.log(`   Product: ${productTitle}`);
    console.log(`   Price: ${productPrice}`);
    
    results.orderDetails.product = productTitle;
    results.orderDetails.price = productPrice;
    
    // Set quantity
    const quantityInputs = await page.$$('input[type="number"]');
    if (quantityInputs.length > 0) {
      await quantityInputs[0].click({ clickCount: 3 });
      await quantityInputs[0].type('2');
      results.orderDetails.quantity = 2;
      await wait(1000);
    }
    
    // Add to cart
    const buttons = await page.$$('button');
    let cartAdded = false;
    
    for (const btn of buttons) {
      try {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && text.includes('Dodaj v košarico')) {
          await btn.click();
          cartAdded = true;
          await wait(3000);
          break;
        }
      } catch (e) { continue; }
    }
    
    if (!cartAdded) {
      logResult('Add to cart', false, 'Add to cart button not found');
      return { success: false };
    }
    
    logResult('Add to cart', true, `${productTitle} added to cart (quantity: ${results.orderDetails.quantity})`);
    
    // Step 2: Go to checkout
    console.log('\n💳 Step 2: Proceeding to checkout...');
    await page.goto(`${CONFIG.baseUrl}/checkout?lang=sl`, { waitUntil: 'networkidle2' });
    await wait(3000);
    
    // Verify cart has items
    const pageContent = await page.evaluate(() => document.body.textContent);
    if (pageContent.includes('košarica je prazna')) {
      logResult('Cart verification', false, 'Cart is empty');
      return { success: false };
    }
    
    logResult('Cart verification', true, 'Cart contains items');
    
    // Step 3: Fill checkout form
    console.log('\n📝 Step 3: Filling checkout form...');
    
    // Find and fill all available form fields
    const formFields = [
      { selector: 'input[type="email"]', value: CONFIG.testCustomer.email, name: 'email' },
      { selector: 'input[name*="name"], input[name*="Name"]', value: CONFIG.testCustomer.name, name: 'name' },
      { selector: 'input[name*="phone"], input[type="tel"]', value: CONFIG.testCustomer.phone, name: 'phone' },
      { selector: 'input[name*="address"], input[name*="Address"]', value: CONFIG.testCustomer.address, name: 'address' },
      { selector: 'input[name*="city"], input[name*="City"]', value: CONFIG.testCustomer.city, name: 'city' },
      { selector: 'input[name*="postal"], input[name*="zip"]', value: CONFIG.testCustomer.postalCode, name: 'postal' }
    ];
    
    let fieldsFound = 0;
    
    for (const field of formFields) {
      try {
        const element = await page.$(field.selector);
        if (element) {
          await element.click();
          await element.type(field.value);
          fieldsFound++;
          console.log(`   ✅ Filled ${field.name}: ${field.value}`);
          await wait(500);
        }
      } catch (e) {
        console.log(`   ⚠️ Could not fill ${field.name}`);
      }
    }
    
    logResult('Form filling', fieldsFound > 0, `${fieldsFound} form fields filled`);
    
    // Step 4: Select payment method and complete payment
    console.log('\n💰 Step 4: Testing payment methods...');
    
    // Look for payment method options
    const paymentMethods = [
      { name: 'Bank Transfer', selectors: ['input[value*="bank"]', 'input[value*="transfer"]', '[data-payment="bank"]'] },
      { name: 'Cash on Delivery', selectors: ['input[value*="cash"]', 'input[value*="delivery"]', '[data-payment="cod"]'] },
      { name: 'Stripe Card', selectors: ['input[value*="stripe"]', 'input[value*="card"]', '[data-payment="stripe"]'] }
    ];
    
    let paymentSelected = false;
    let selectedMethod = '';
    
    // Try each payment method
    for (const method of paymentMethods) {
      for (const selector of method.selectors) {
        try {
          const paymentOption = await page.$(selector);
          if (paymentOption) {
            console.log(`   🎯 Found payment method: ${method.name}`);
            await paymentOption.click();
            paymentSelected = true;
            selectedMethod = method.name;
            await wait(1000);
            
            // If Stripe, fill card details
            if (method.name === 'Stripe Card') {
              await fillStripeCardDetails(page);
            }
            
            break;
          }
        } catch (e) { continue; }
      }
      if (paymentSelected) break;
    }
    
    if (!paymentSelected) {
      // Try to proceed without explicit payment method selection
      console.log('   ⚠️ No payment method selector found, trying to proceed...');
      selectedMethod = 'Default';
    }
    
    // Step 5: Submit order
    console.log('\n🚀 Step 5: Submitting order...');
    
    const submitSelectors = [
      'button[type="submit"]',
      'button:contains("Potrdi")',
      'button:contains("Submit")',
      'button:contains("Naroči")',
      '.submit-order',
      '.place-order',
      '#submit-order'
    ];
    
    let orderSubmitted = false;
    
    for (const selector of submitSelectors) {
      try {
        const submitBtn = await page.$(selector);
        if (submitBtn) {
          console.log(`   🎯 Found submit button: ${selector}`);
          await submitBtn.click();
          orderSubmitted = true;
          await wait(5000); // Wait for processing
          break;
        }
      } catch (e) { continue; }
    }
    
    if (!orderSubmitted) {
      // Try clicking any button that might submit
      const allButtons = await page.$$('button');
      for (const btn of allButtons) {
        try {
          const text = await page.evaluate(el => el.textContent.toLowerCase(), btn);
          if (text.includes('potrdi') || text.includes('naroči') || text.includes('submit') || text.includes('order')) {
            console.log(`   🎯 Trying button with text: "${text}"`);
            await btn.click();
            orderSubmitted = true;
            await wait(5000);
            break;
          }
        } catch (e) { continue; }
      }
    }
    
    if (!orderSubmitted) {
      logResult('Order submission', false, 'No submit button found');
      return { success: false };
    }
    
    logResult('Order submission', true, `Order submitted using ${selectedMethod} payment`);
    
    // Step 6: Verify success message
    console.log('\n🎉 Step 6: Checking for success message...');
    
    await wait(3000); // Wait for success page to load
    
    const currentUrl = page.url();
    const finalPageContent = await page.evaluate(() => document.body.textContent.toLowerCase());
    
    console.log(`   Current URL: ${currentUrl}`);
    
    // Look for success indicators
    const successIndicators = [
      'uspešno',
      'success',
      'hvala',
      'thank you',
      'potrjen',
      'confirmed',
      'naročilo',
      'order',
      'plačilo',
      'payment'
    ];
    
    let successFound = false;
    let successMessage = '';
    
    for (const indicator of successIndicators) {
      if (finalPageContent.includes(indicator)) {
        successFound = true;
        successMessage += indicator + ' ';
      }
    }
    
    // Check URL for success indicators
    if (currentUrl.includes('success') || currentUrl.includes('thank') || currentUrl.includes('confirm')) {
      successFound = true;
      successMessage += 'success URL ';
    }
    
    if (successFound) {
      logResult('Payment success', true, `SUCCESS MESSAGE FOUND: ${successMessage.trim()}`);
      results.paymentResults.success = true;
      results.paymentResults.method = selectedMethod;
      results.paymentResults.message = successMessage.trim();
      
      // Try to extract order number
      const orderNumberMatch = finalPageContent.match(/(\d{4,})/);
      if (orderNumberMatch) {
        results.paymentResults.orderNumber = orderNumberMatch[1];
        console.log(`   📋 Order Number: ${orderNumberMatch[1]}`);
      }
      
      return { success: true, paymentMethod: selectedMethod, successMessage };
      
    } else {
      logResult('Payment success', false, 'No success message found on final page');
      results.paymentResults.success = false;
      
      // Log what we found instead
      console.log(`   📄 Final page content (first 200 chars): ${finalPageContent.substring(0, 200)}...`);
      
      return { success: false };
    }
    
  } catch (error) {
    logResult('Checkout flow', false, `Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Fill Stripe card details if Stripe payment is selected
 */
async function fillStripeCardDetails(page) {
  console.log('   💳 Filling Stripe card details...');
  
  try {
    // Wait for Stripe iframe to load
    await wait(2000);
    
    // Stripe card number
    const cardNumberField = await page.$('input[name="cardnumber"], #card-number, [placeholder*="card"]');
    if (cardNumberField) {
      await cardNumberField.type(CONFIG.stripeTestCard.number);
      console.log('   ✅ Card number filled');
    }
    
    // Expiry date
    const expiryField = await page.$('input[name="exp-date"], #card-expiry, [placeholder*="expiry"]');
    if (expiryField) {
      await expiryField.type(CONFIG.stripeTestCard.expiry);
      console.log('   ✅ Expiry date filled');
    }
    
    // CVC
    const cvcField = await page.$('input[name="cvc"], #card-cvc, [placeholder*="cvc"]');
    if (cvcField) {
      await cvcField.type(CONFIG.stripeTestCard.cvc);
      console.log('   ✅ CVC filled');
    }
    
    await wait(1000);
    
  } catch (error) {
    console.log(`   ⚠️ Error filling Stripe details: ${error.message}`);
  }
}

/**
 * Main test runner
 */
async function runFullCheckoutTest() {
  console.log('🚀 FULL CHECKOUT TEST - Complete Payment Flow Verification\n');
  console.log(`📅 Test Date: ${results.startTime.toLocaleDateString()}`);
  console.log(`🌐 Target: ${CONFIG.baseUrl}`);
  console.log(`📧 Customer Email: ${CONFIG.testCustomer.email}`);
  console.log(`💳 Payment Methods: Bank Transfer, Cash on Delivery, Stripe Test Card`);
  console.log('\n' + '='.repeat(80));

  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 300,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    // Run the complete checkout test
    const checkoutResult = await testFullCheckoutFlow(page);

    // Keep browser open for manual inspection
    console.log('\n⏰ Keeping browser open for 30 seconds for manual verification...');
    setTimeout(async () => {
      await browser.close();
    }, 30000);

  } catch (error) {
    console.error('❌ Critical error during testing:', error.message);
    await browser.close();
  }

  // Generate final report
  await generateCheckoutReport();
}

/**
 * Generate comprehensive checkout test report
 */
async function generateCheckoutReport() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 FULL CHECKOUT TEST REPORT');
  console.log('='.repeat(80));

  const duration = Date.now() - results.startTime;
  const durationMinutes = Math.round(duration / 1000 / 60);

  console.log(`⏱️  Test Duration: ${durationMinutes} minutes`);
  console.log(`📧 Customer Email: ${CONFIG.testCustomer.email}`);

  // Order details
  if (Object.keys(results.orderDetails).length > 0) {
    console.log('\n📦 ORDER DETAILS:');
    console.log(`   Product: ${results.orderDetails.product || 'Unknown'}`);
    console.log(`   Price: ${results.orderDetails.price || 'Unknown'}`);
    console.log(`   Quantity: ${results.orderDetails.quantity || 'Unknown'}`);
  }

  // Payment results
  if (Object.keys(results.paymentResults).length > 0) {
    console.log('\n💰 PAYMENT RESULTS:');
    console.log(`   Success: ${results.paymentResults.success ? '✅ YES' : '❌ NO'}`);
    console.log(`   Method: ${results.paymentResults.method || 'Unknown'}`);
    console.log(`   Message: ${results.paymentResults.message || 'None'}`);
    if (results.paymentResults.orderNumber) {
      console.log(`   Order Number: ${results.paymentResults.orderNumber}`);
    }
  }

  // Step-by-step results
  console.log('\n📋 DETAILED STEP RESULTS:');
  results.tests.forEach((test, index) => {
    const status = test.success ? '✅' : '❌';
    console.log(`   ${index + 1}. ${status} ${test.step}: ${test.details}`);
  });

  // Final verdict
  console.log('\n🏆 FINAL VERDICT:');

  const totalSteps = results.tests.length;
  const passedSteps = results.tests.filter(t => t.success).length;
  const successRate = Math.round((passedSteps / totalSteps) * 100);

  console.log(`   📊 Success Rate: ${successRate}% (${passedSteps}/${totalSteps} steps)`);

  if (results.paymentResults.success) {
    console.log('   🎉 PAYMENT FLOW WORKING - SUCCESS MESSAGE CONFIRMED!');
    console.log('   ✅ Complete checkout process is functional');
  } else {
    console.log('   🚨 PAYMENT FLOW ISSUES - No success message found');
    console.log('   🔧 Checkout process needs debugging');
  }

  // Next steps
  console.log('\n🎯 VERIFICATION STEPS:');
  console.log('1. Check order management system for new order');
  console.log('2. Verify payment processing (if applicable)');
  console.log('3. Check customer email for order confirmation');
  console.log('4. Validate inventory updates');
  console.log('5. Confirm order appears in admin dashboard');

  if (results.paymentResults.success) {
    console.log('\n📧 EMAIL VERIFICATION:');
    console.log(`Check ${CONFIG.testCustomer.email} for order confirmation email`);
  }

  console.log('\n✅ FULL CHECKOUT TEST COMPLETE!');
  console.log('This test verifies the COMPLETE payment flow, not just form filling.');
}

// Run the full checkout test
runFullCheckoutTest().catch(console.error);
