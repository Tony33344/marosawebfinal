/**
 * COMPREHENSIVE CHECKOUT EMAIL TEST
 * 
 * This script tests the complete checkout flow using the CORRECT multi-step checkout
 * that actually sends confirmation emails. Based on our analysis:
 * 
 * - /checkout (CheckoutPage.tsx) - Email sending is DISABLED
 * - /multi-step-checkout (MultiStepCheckoutPage.tsx) - Email sending is ENABLED
 * 
 * This test uses /multi-step-checkout to ensure emails are sent.
 */

import puppeteer from 'puppeteer';
import fs from 'fs';

// Configuration with test emails using noexpire.top domain
const CONFIG = {
  baseUrl: 'https://marosatest.netlify.app',
  languages: ['sl'], // Focus on Slovenian first since it's the primary language
  
  // Test emails for different purposes
  testEmails: {
    guest_checkout: [
      'guest.checkout.001@noexpire.top',
      'guest.checkout.002@noexpire.top',
      'guest.checkout.003@noexpire.top',
      'guest.checkout.004@noexpire.top'
    ],
    registered_checkout: [
      'registered.checkout.001@noexpire.top',
      'registered.checkout.002@noexpire.top',
      'registered.checkout.003@noexpire.top',
      'registered.checkout.004@noexpire.top'
    ]
  }
};

// Test results tracking
const testResults = {
  startTime: new Date(),
  endTime: null,
  emailsUsed: [],
  orders: [],
  tests: {
    passed: 0,
    failed: 0,
    details: []
  }
};

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function logTest(testName, success, details = '', email = '', orderNumber = '') {
  const result = {
    test: testName,
    success,
    details,
    email,
    orderNumber,
    timestamp: new Date().toISOString()
  };
  
  testResults.tests.details.push(result);
  
  if (success) {
    testResults.tests.passed++;
    console.log(`✅ ${testName}${details ? ': ' + details : ''}${email ? ' (Email: ' + email + ')' : ''}${orderNumber ? ' (Order: ' + orderNumber + ')' : ''}`);
  } else {
    testResults.tests.failed++;
    console.log(`❌ ${testName}${details ? ': ' + details : ''}${email ? ' (Email: ' + email + ')' : ''}${orderNumber ? ' (Order: ' + orderNumber + ')' : ''}`);
  }
  
  if (email) {
    testResults.emailsUsed.push({ email, purpose: testName, success, orderNumber });
  }
}

/**
 * Test complete guest checkout flow with email confirmation
 */
async function testGuestCheckoutWithEmail(page, language, emailIndex) {
  console.log(`\n🛒 Testing GUEST checkout with EMAIL confirmation (${language})...`);
  
  const email = CONFIG.testEmails.guest_checkout[emailIndex % CONFIG.testEmails.guest_checkout.length];
  
  try {
    // Step 1: Add product to cart
    console.log('📦 Step 1: Adding product to cart...');
    await page.goto(`${CONFIG.baseUrl}/izdelek/11?lang=${language}`, { waitUntil: 'domcontentloaded' });
    await wait(3000);
    
    // Handle any popups first
    try {
      const cookieButtons = await page.$$('button');
      for (const btn of cookieButtons) {
        const text = await page.evaluate(el => el.textContent.toLowerCase(), btn);
        if (text.includes('sprejmi') && text.includes('vse')) {
          await btn.click();
          await wait(2000);
          break;
        }
      }
    } catch (e) { /* ignore */ }
    
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
    
    const productTitle = await page.$eval('h1', el => el.textContent).catch(() => 'Unknown Product');
    console.log(`   Product: ${productTitle}`);
    
    // Set quantity
    const quantityInputs = await page.$$('input[type="number"]');
    if (quantityInputs.length > 0) {
      await quantityInputs[0].click({ clickCount: 3 });
      await quantityInputs[0].type('1');
      console.log('   ✅ Set quantity to 1');
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
          console.log('   ✅ Added to cart');
          cartAdded = true;
          await wait(3000);
          break;
        }
      } catch (e) { continue; }
    }
    
    if (!cartAdded) {
      logTest(`Guest checkout (${language})`, false, 'Could not add to cart', email);
      return { success: false, error: 'Could not add to cart' };
    }
    
    // Step 2: Go to MULTI-STEP checkout (the one that sends emails!)
    console.log('💳 Step 2: Going to MULTI-STEP checkout...');
    await page.goto(`${CONFIG.baseUrl}/multi-step-checkout?lang=${language}`, { waitUntil: 'domcontentloaded' });
    await wait(5000);
    
    console.log(`   Current URL: ${page.url()}`);
    
    // Check if cart has items
    const pageContent = await page.evaluate(() => document.body.textContent);
    if (pageContent.includes('prazna') || pageContent.includes('empty')) {
      logTest(`Guest checkout (${language})`, false, 'Cart empty on multi-step checkout', email);
      return { success: false, error: 'Cart empty' };
    }
    
    console.log('   ✅ Multi-step checkout loaded with items');
    
    // Step 3: Fill customer information
    console.log('📝 Step 3: Filling customer information...');
    
    const customerFields = [
      { selector: 'input[type="email"]', value: email, name: 'email' },
      { selector: 'input[name*="name"], input[name*="Name"]', value: 'Test Guest Buyer', name: 'name' },
      { selector: 'input[type="tel"], input[name*="phone"]', value: '041555777', name: 'phone' },
      { selector: 'input[name*="address"]', value: 'Test Street 123', name: 'address' },
      { selector: 'input[name*="city"]', value: 'Ljubljana', name: 'city' },
      { selector: 'input[name*="postal"]', value: '1000', name: 'postal' }
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
        } else {
          console.log(`   ⚠️ Field not found: ${field.name}`);
        }
      } catch (e) {
        console.log(`   ❌ Error filling ${field.name}: ${e.message}`);
      }
    }
    
    // Step 4: Select payment method
    console.log('💰 Step 4: Selecting payment method...');
    
    const paymentRadios = await page.$$('input[type="radio"]');
    let paymentSelected = false;
    
    for (const radio of paymentRadios) {
      try {
        const value = await page.evaluate(el => el.value, radio);
        const label = await page.evaluate(el => {
          const labelEl = document.querySelector(`label[for="${el.id}"]`);
          return labelEl ? labelEl.textContent : el.value;
        }, radio);
        
        console.log(`   Payment option: ${value} - ${label}`);
        
        if (value && (value.includes('bank') || value.includes('transfer'))) {
          await radio.click();
          console.log(`   ✅ Selected: ${label}`);
          paymentSelected = true;
          await wait(1000);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!paymentSelected && paymentRadios.length > 0) {
      await paymentRadios[0].click();
      console.log('   ✅ Selected first payment method');
      await wait(1000);
    }
    
    // Step 5: Submit order
    console.log('🚀 Step 5: Submitting order...');
    
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
          await wait(15000); // Wait longer for processing and email sending
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!orderSubmitted) {
      logTest(`Guest checkout (${language})`, false, 'Could not submit order', email);
      return { success: false, error: 'Could not submit order' };
    }
    
    // Step 6: Check results
    console.log('🎉 Step 6: Checking order results...');
    
    const finalUrl = page.url();
    const finalContent = await page.evaluate(() => document.body.textContent.toLowerCase());
    
    console.log(`   Final URL: ${finalUrl}`);
    
    const success = finalUrl.includes('order-success') || finalUrl.includes('success') || 
                   finalContent.includes('uspešno') || finalContent.includes('hvala');
    
    if (success) {
      const orderMatch = finalContent.match(/(\d{4,})/);
      const orderNumber = orderMatch ? orderMatch[1] : 'Unknown';
      
      testResults.orders.push({
        orderNumber,
        email,
        type: 'guest',
        language,
        timestamp: new Date().toISOString()
      });
      
      logTest(`Guest checkout (${language})`, true, `Order completed - EMAIL SHOULD BE SENT!`, email, orderNumber);
      
      console.log(`🎉 SUCCESS! Guest order #${orderNumber} completed!`);
      console.log(`📧 CRITICAL: Check ${email} for order confirmation email!`);
      console.log(`📧 Email should be sent from: kmetija.marosa.narocila@gmail.com`);
      
      return {
        success: true,
        orderNumber,
        email,
        emailShouldBeSent: true
      };
    } else {
      logTest(`Guest checkout (${language})`, false, 'Order submission failed', email);
      console.log(`❌ Order submission failed. Page content: ${finalContent.substring(0, 200)}...`);
      return { success: false, error: 'Order submission failed' };
    }
    
  } catch (error) {
    logTest(`Guest checkout (${language})`, false, error.message, email);
    return { success: false, error: error.message };
  }
}

/**
 * Main test runner
 */
async function runComprehensiveCheckoutEmailTest() {
  console.log('🚀 Starting COMPREHENSIVE CHECKOUT EMAIL TEST...\n');
  console.log(`📅 Test Date: ${testResults.startTime.toLocaleDateString()}`);
  console.log(`🌐 Target: ${CONFIG.baseUrl}`);
  console.log(`🗣️ Languages: ${CONFIG.languages.join(', ')}`);

  console.log('\n📧 Test Emails Allocated:');
  console.log(`   Guest Checkout: ${CONFIG.testEmails.guest_checkout.join(', ')}`);
  console.log(`   Registered Checkout: ${CONFIG.testEmails.registered_checkout.join(', ')}`);

  console.log('\n🎯 CRITICAL: This test uses /multi-step-checkout (email-enabled)');
  console.log('   NOT /checkout (email-disabled)');

  console.log('\n' + '='.repeat(80));

  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 300,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    // Monitor console for email-related messages
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('email') || text.includes('Email') || text.includes('order') ||
          text.includes('sending') || text.includes('confirmation')) {
        console.log(`🖥️ Console: ${msg.type()}: ${text}`);
      }
    });

    let emailIndex = 0;

    for (const language of CONFIG.languages) {
      console.log(`\n🌍 Testing Language: ${language.toUpperCase()}`);
      console.log('='.repeat(60));

      // Test 1: Guest checkout with email
      await testGuestCheckoutWithEmail(page, language, emailIndex);
      emailIndex++;

      console.log(`✅ Completed testing for ${language.toUpperCase()}`);
      await wait(3000);
    }

  } catch (error) {
    console.error('❌ Critical error during testing:', error.message);
  } finally {
    console.log('\n⏰ Keeping browser open for 60 seconds for inspection...');
    setTimeout(async () => {
      await browser.close();
      console.log('Browser closed.');
    }, 60000);
  }

  // Generate final report
  testResults.endTime = new Date();
  await generateComprehensiveReport();
}

/**
 * Generate comprehensive report
 */
async function generateComprehensiveReport() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 COMPREHENSIVE CHECKOUT EMAIL TEST REPORT');
  console.log('='.repeat(80));

  const duration = testResults.endTime - testResults.startTime;
  const durationMinutes = Math.round(duration / 1000 / 60);

  console.log(`⏱️  Test Duration: ${durationMinutes} minutes`);
  console.log(`📊 Total Tests: ${testResults.tests.passed + testResults.tests.failed}`);
  console.log(`✅ Passed: ${testResults.tests.passed}`);
  console.log(`❌ Failed: ${testResults.tests.failed}`);
  console.log(`📈 Success Rate: ${Math.round((testResults.tests.passed / (testResults.tests.passed + testResults.tests.failed)) * 100)}%`);

  // Orders created
  console.log('\n📋 ORDERS CREATED:');
  if (testResults.orders.length > 0) {
    testResults.orders.forEach((order, index) => {
      console.log(`   ${index + 1}. Order #${order.orderNumber} - ${order.email} (${order.type}, ${order.language})`);
    });
  } else {
    console.log('   No orders were successfully created');
  }

  // Email usage report
  console.log('\n📧 EMAIL USAGE REPORT:');
  testResults.emailsUsed.forEach((emailUsage, index) => {
    const status = emailUsage.success ? '✅' : '❌';
    const orderInfo = emailUsage.orderNumber ? ` - Order #${emailUsage.orderNumber}` : '';
    console.log(`   ${index + 1}. ${status} ${emailUsage.email} - ${emailUsage.purpose}${orderInfo}`);
  });

  // Detailed test results
  console.log('\n📋 DETAILED TEST RESULTS:');
  testResults.tests.details.forEach((test, index) => {
    const status = test.success ? '✅' : '❌';
    const emailInfo = test.email ? ` (${test.email})` : '';
    const orderInfo = test.orderNumber ? ` [Order #${test.orderNumber}]` : '';
    console.log(`   ${index + 1}. ${status} ${test.test}: ${test.details}${emailInfo}${orderInfo}`);
  });

  // Email verification instructions
  console.log('\n📧 EMAIL VERIFICATION INSTRUCTIONS:');
  console.log('   1. Go to https://noexpire.top');
  console.log('   2. Check each test email inbox for order confirmation emails');
  console.log('   3. Emails should be sent from: kmetija.marosa.narocila@gmail.com');
  console.log('   4. Subject should be: "Kmetija Maroša - Potrditev naročila #[ORDER_NUMBER]"');

  if (testResults.orders.length > 0) {
    console.log('\n🎯 SPECIFIC EMAILS TO CHECK:');
    testResults.orders.forEach((order, index) => {
      console.log(`   ${index + 1}. ${order.email} - Should have confirmation for Order #${order.orderNumber}`);
    });
  }

  // Recommendations
  console.log('\n🎯 RECOMMENDATIONS:');
  if (testResults.tests.failed === 0 && testResults.orders.length > 0) {
    console.log('   🎉 EXCELLENT: All tests passed and orders created!');
    console.log('   📧 Check email inboxes to verify confirmation emails were sent');
    console.log('   🔍 If no emails received, check Google Apps Script logs');
  } else if (testResults.orders.length === 0) {
    console.log('   🚨 CRITICAL: No orders were created - checkout flow has issues');
    console.log('   🔧 Debug the multi-step checkout form and submission process');
  } else {
    console.log('   🔧 Some tests failed - review detailed results above');
    console.log('   📧 Check email inboxes for successful orders');
  }

  // Save detailed report
  const reportData = {
    ...testResults,
    summary: {
      testDate: testResults.startTime.toISOString(),
      duration: durationMinutes,
      totalTests: testResults.tests.passed + testResults.tests.failed,
      successRate: Math.round((testResults.tests.passed / (testResults.tests.passed + testResults.tests.failed)) * 100),
      ordersCreated: testResults.orders.length
    }
  };

  const reportFilename = `comprehensive-checkout-email-test-${testResults.startTime.toISOString().split('T')[0]}.json`;
  fs.writeFileSync(reportFilename, JSON.stringify(reportData, null, 2));

  console.log(`\n📄 Detailed report saved: ${reportFilename}`);
  console.log('\n✅ Comprehensive checkout email test complete!');
}

// Run the comprehensive test
runComprehensiveCheckoutEmailTest().catch(console.error);
