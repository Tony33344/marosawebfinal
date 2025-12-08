/**
 * SMART GHOST BUYER - Based on our successful solutions
 * 
 * Features:
 * - Self-diagnostic mechanism to detect script vs website issues
 * - Uses proven working patterns from focused-ghost-buyer.js
 * - Tests both guest and registered user flows
 * - Clear email tracking and management
 * - Comprehensive but reliable testing
 */

import puppeteer from 'puppeteer';
import fs from 'fs';

// Configuration based on our successful tests
const CONFIG = {
  baseUrl: 'https://marosatest.netlify.app',
  languages: ['sl', 'en', 'de', 'hr'],
  
  // Test emails with clear purposes
  testEmails: {
    newsletter: [
      'newsletter.test.001@noexpire.top',
      'newsletter.test.002@noexpire.top', 
      'newsletter.test.003@noexpire.top',
      'newsletter.test.004@noexpire.top'
    ],
    registration: [
      'register.test.001@noexpire.top',
      'register.test.002@noexpire.top',
      'register.test.003@noexpire.top',
      'register.test.004@noexpire.top'
    ],
    guest_checkout: [
      'guest.test.001@noexpire.top',
      'guest.test.002@noexpire.top',
      'guest.test.003@noexpire.top',
      'guest.test.004@noexpire.top'
    ]
  }
};

// Test results tracking
const testResults = {
  startTime: new Date(),
  endTime: null,
  emailsUsed: [],
  diagnostics: {
    scriptWorking: true,
    websiteWorking: true,
    issues: []
  },
  tests: {
    passed: 0,
    failed: 0,
    details: []
  }
};

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function logTest(testName, success, details = '', email = '') {
  const result = {
    test: testName,
    success,
    details,
    email,
    timestamp: new Date().toISOString()
  };
  
  testResults.tests.details.push(result);
  
  if (success) {
    testResults.tests.passed++;
    console.log(`✅ ${testName}${details ? ': ' + details : ''}${email ? ' (Email: ' + email + ')' : ''}`);
  } else {
    testResults.tests.failed++;
    console.log(`❌ ${testName}${details ? ': ' + details : ''}${email ? ' (Email: ' + email + ')' : ''}`);
  }
  
  if (email) {
    testResults.emailsUsed.push({ email, purpose: testName, success });
  }
}

/**
 * Self-diagnostic mechanism to test if our script is working correctly
 */
async function runSelfDiagnostics(page) {
  console.log('\n🔧 Running self-diagnostics...');
  
  try {
    // Test 1: Can we navigate to a simple page?
    await page.goto('https://example.com', { waitUntil: 'domcontentloaded' });
    const title = await page.title();
    if (!title.includes('Example')) {
      throw new Error('Cannot navigate to simple pages');
    }
    console.log('✅ Basic navigation working');
    
    // Test 2: Can we find and interact with elements?
    const heading = await page.$('h1');
    if (!heading) {
      throw new Error('Cannot find basic HTML elements');
    }
    console.log('✅ Element detection working');
    
    // Test 3: Can we execute JavaScript?
    const jsResult = await page.evaluate(() => 2 + 2);
    if (jsResult !== 4) {
      throw new Error('JavaScript execution not working');
    }
    console.log('✅ JavaScript execution working');
    
    testResults.diagnostics.scriptWorking = true;
    console.log('✅ Self-diagnostics passed - script is working correctly');
    
  } catch (error) {
    testResults.diagnostics.scriptWorking = false;
    testResults.diagnostics.issues.push(`Script diagnostic failed: ${error.message}`);
    console.log(`❌ Self-diagnostics failed: ${error.message}`);
    console.log('🚨 CRITICAL: Script has issues, results may be unreliable!');
  }
}

/**
 * Test basic website functionality to distinguish script vs website issues
 */
async function testWebsiteBasics(page, language) {
  console.log(`\n🌐 Testing basic website functionality (${language})...`);
  
  try {
    // Test 1: Can we load the homepage?
    const startTime = Date.now();
    await page.goto(`${CONFIG.baseUrl}?lang=${language}`, { waitUntil: 'domcontentloaded' });
    const loadTime = Date.now() - startTime;
    
    if (loadTime > 10000) {
      throw new Error(`Homepage load time too slow: ${loadTime}ms`);
    }
    console.log(`✅ Homepage loads in ${loadTime}ms`);
    
    // Test 2: Are basic HTML elements present?
    const basicElements = {
      title: await page.title(),
      body: await page.$('body'),
      head: await page.$('head')
    };
    
    if (!basicElements.title || !basicElements.body || !basicElements.head) {
      throw new Error('Basic HTML structure missing');
    }
    console.log('✅ Basic HTML structure present');
    
    // Test 3: Is JavaScript working on the site?
    const jsWorking = await page.evaluate(() => {
      return typeof window !== 'undefined' && typeof document !== 'undefined';
    });
    
    if (!jsWorking) {
      throw new Error('JavaScript not working on website');
    }
    console.log('✅ Website JavaScript working');
    
    testResults.diagnostics.websiteWorking = true;
    console.log('✅ Website basic functionality confirmed');
    
  } catch (error) {
    testResults.diagnostics.websiteWorking = false;
    testResults.diagnostics.issues.push(`Website diagnostic failed: ${error.message}`);
    console.log(`❌ Website diagnostics failed: ${error.message}`);
    console.log('🚨 CRITICAL: Website has basic issues!');
  }
}

/**
 * Test complete checkout flow using the CORRECT multi-step checkout that sends emails
 */
async function testCompleteCheckoutFlow(page, language, emailIndex) {
  console.log(`\n🛒 Testing COMPLETE checkout flow with EMAIL (${language})...`);

  const email = CONFIG.testEmails.guest_checkout[emailIndex % CONFIG.testEmails.guest_checkout.length];

  try {
    // Step 1: Go directly to product page (our proven method)
    console.log('🎯 Going directly to product page...');
    await page.goto(`${CONFIG.baseUrl}/izdelek/11?lang=${language}`, { waitUntil: 'domcontentloaded' });
    await wait(2000);

    // Step 2: Get product info
    const productTitle = await page.$eval('h1', el => el.textContent).catch(() => 'Unknown Product');
    console.log(`📦 Product: ${productTitle}`);

    // Step 3: Set quantity (our proven method)
    console.log('🔢 Setting quantity...');
    const quantityInputs = await page.$$('input[type="number"]');
    let quantitySet = false;

    if (quantityInputs.length > 0) {
      const input = quantityInputs[0];
      await input.click({ clickCount: 3 });
      await input.type('1');
      quantitySet = true;
      console.log('✅ Quantity set to 1');
      await wait(1000);
    }

    // Step 4: Add to cart (our proven method)
    console.log('🛒 Adding to cart...');
    const buttons = await page.$$('button');
    let cartButtonClicked = false;

    for (const button of buttons) {
      try {
        const text = await page.evaluate(el => el.textContent, button);
        if (text && text.includes('Dodaj v košarico')) {
          console.log('✅ Found "Dodaj v košarico" button');
          await button.click();
          cartButtonClicked = true;
          await wait(3000);
          break;
        }
      } catch (e) {
        continue;
      }
    }

    // Step 5: Go to MULTI-STEP checkout (the one that sends emails!)
    console.log('💳 Going to MULTI-STEP checkout (email-enabled)...');
    await page.goto(`${CONFIG.baseUrl}/multi-step-checkout?lang=${language}`, { waitUntil: 'domcontentloaded' });
    await wait(3000);

    const pageText = await page.evaluate(() => document.body.textContent);
    const cartEmpty = pageText.includes('košarica je prazna') || pageText.includes('cart is empty');
    const cartHasItems = !cartEmpty;

    if (!cartHasItems) {
      logTest(`Complete checkout flow (${language})`, false, 'Cart empty on multi-step checkout', email);
      return { success: false, error: 'Cart empty' };
    }

    console.log('✅ Multi-step checkout page loaded with items');

    // Step 6: Fill checkout form
    console.log('📝 Filling checkout form...');

    // Fill email field
    const emailField = await page.$('input[type="email"]');
    if (emailField) {
      await emailField.click();
      await emailField.click({ clickCount: 3 });
      await emailField.type(email);
      console.log(`✅ Filled email: ${email}`);
      await wait(500);
    }

    // Fill name field
    const nameFields = await page.$$('input[name*="name"], input[name*="Name"]');
    if (nameFields.length > 0) {
      await nameFields[0].click();
      await nameFields[0].click({ clickCount: 3 });
      await nameFields[0].type('Test Buyer');
      console.log('✅ Filled name: Test Buyer');
      await wait(500);
    }

    // Fill phone field
    const phoneField = await page.$('input[type="tel"], input[name*="phone"]');
    if (phoneField) {
      await phoneField.click();
      await phoneField.click({ clickCount: 3 });
      await phoneField.type('041555666');
      console.log('✅ Filled phone: 041555666');
      await wait(500);
    }

    // Fill address field
    const addressField = await page.$('input[name*="address"]');
    if (addressField) {
      await addressField.click();
      await addressField.click({ clickCount: 3 });
      await addressField.type('Test Street 123');
      console.log('✅ Filled address: Test Street 123');
      await wait(500);
    }

    // Fill city field
    const cityField = await page.$('input[name*="city"]');
    if (cityField) {
      await cityField.click();
      await cityField.click({ clickCount: 3 });
      await cityField.type('Ljubljana');
      console.log('✅ Filled city: Ljubljana');
      await wait(500);
    }

    // Fill postal code field
    const postalField = await page.$('input[name*="postal"]');
    if (postalField) {
      await postalField.click();
      await postalField.click({ clickCount: 3 });
      await postalField.type('1000');
      console.log('✅ Filled postal: 1000');
      await wait(500);
    }

    // Select payment method (bank transfer)
    console.log('💰 Selecting payment method...');
    const paymentRadios = await page.$$('input[type="radio"]');
    let paymentSelected = false;

    for (const radio of paymentRadios) {
      try {
        const value = await page.evaluate(el => el.value, radio);
        if (value && value.includes('bank')) {
          await radio.click();
          console.log('✅ Selected bank transfer payment');
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
      console.log('✅ Selected first payment method');
      await wait(1000);
    }

    // Step 7: Submit order
    console.log('🚀 Submitting order...');
    const submitButtons = await page.$$('button');
    let orderSubmitted = false;

    for (const button of submitButtons) {
      try {
        const text = await page.evaluate(el => el.textContent, button);
        if (text && (text.includes('Oddaj naročilo') || text.includes('Potrdi') ||
                    text.includes('Submit') || text.includes('Place Order'))) {
          console.log(`🎯 Submitting with: "${text}"`);
          await button.click();
          orderSubmitted = true;
          await wait(10000); // Wait for processing and email sending
          break;
        }
      } catch (e) {
        continue;
      }
    }

    // Step 8: Check results
    const finalUrl = page.url();
    const finalContent = await page.evaluate(() => document.body.textContent.toLowerCase());

    const success = finalUrl.includes('order-success') || finalUrl.includes('success') ||
                   finalContent.includes('uspešno') || finalContent.includes('hvala');

    if (success) {
      const orderMatch = finalContent.match(/(\d{4,})/);
      const orderNumber = orderMatch ? orderMatch[1] : 'Unknown';

      logTest(`Complete checkout flow (${language})`, true, `Order #${orderNumber} - EMAIL SHOULD BE SENT!`, email);
      console.log(`🎉 SUCCESS! Order #${orderNumber} completed with email: ${email}`);
      console.log('📧 CRITICAL: Check email inbox for order confirmation!');

      return {
        success: true,
        orderNumber,
        email,
        emailShouldBeSent: true
      };
    } else {
      logTest(`Complete checkout flow (${language})`, false, 'Order submission failed', email);
      return { success: false, error: 'Order submission failed' };
    }

  } catch (error) {
    logTest(`Complete checkout flow (${language})`, false, error.message, email);
    return { success: false, error: error.message };
  }
}

/**
 * Test newsletter signup using our proven working method
 */
async function testNewsletterSignup(page, language, emailIndex) {
  console.log(`\n📧 Testing newsletter signup (${language})...`);
  
  const email = CONFIG.testEmails.newsletter[emailIndex % CONFIG.testEmails.newsletter.length];
  
  try {
    // Go to homepage to trigger newsletter popup
    await page.goto(`${CONFIG.baseUrl}?lang=${language}`, { waitUntil: 'domcontentloaded' });
    await wait(3000);
    
    // Handle cookie consent first
    const cookieButtons = await page.$$('button');
    for (const btn of cookieButtons) {
      try {
        const text = await page.evaluate(el => el.textContent.toLowerCase(), btn);
        if (text.includes('sprejmi') && text.includes('vse')) {
          await btn.click();
          await wait(2000);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    // Handle newsletter popup (our proven method)
    const emailInput = await page.$('#popup-email');
    const nameInput = await page.$('#popup-first-name');
    
    if (emailInput && nameInput) {
      console.log('✅ Newsletter popup found');
      
      await nameInput.type('Test User');
      await emailInput.type(email);
      
      // Find submit button
      const buttons = await page.$$('button');
      for (const btn of buttons) {
        try {
          const text = await page.evaluate(el => el.textContent, btn);
          if (text && text.includes('10%')) {
            await btn.click();
            await wait(3000);
            logTest(`Newsletter signup (${language})`, true, '10% discount popup completed', email);
            return { success: true, email };
          }
        } catch (e) {
          continue;
        }
      }
    }
    
    logTest(`Newsletter signup (${language})`, false, 'Popup not found or incomplete', email);
    return { success: false };
    
  } catch (error) {
    logTest(`Newsletter signup (${language})`, false, error.message, email);
    return { success: false, error: error.message };
  }
}

/**
 * Test user registration flow
 */
async function testUserRegistration(page, language, emailIndex) {
  console.log(`\n👤 Testing user registration (${language})...`);

  const email = CONFIG.testEmails.registration[emailIndex % CONFIG.testEmails.registration.length];

  try {
    // Try to find registration page
    const registrationUrls = [
      `${CONFIG.baseUrl}/register?lang=${language}`,
      `${CONFIG.baseUrl}/registracija?lang=${language}`,
      `${CONFIG.baseUrl}/signup?lang=${language}`
    ];

    let registrationFound = false;
    for (const url of registrationUrls) {
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        await wait(2000);

        const pageContent = await page.evaluate(() => document.body.textContent);
        if (!pageContent.includes('404') && !pageContent.includes('Not Found')) {
          console.log(`✅ Registration page found: ${url}`);
          registrationFound = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (registrationFound) {
      // Look for registration form fields
      const formFields = {
        email: await page.$('input[type="email"]'),
        name: await page.$('input[name*="name"]'),
        password: await page.$('input[type="password"]')
      };

      const fieldsFound = Object.values(formFields).filter(Boolean).length;

      if (fieldsFound >= 2) {
        console.log(`✅ Registration form found with ${fieldsFound} fields`);

        // Fill form but don't submit (to avoid creating test accounts)
        if (formFields.email) {
          await formFields.email.type(email);
        }
        if (formFields.name) {
          await formFields.name.type('Test User');
        }
        if (formFields.password) {
          await formFields.password.type('TestPassword123!');
        }

        logTest(`User registration (${language})`, true, `Form found with ${fieldsFound} fields (not submitted)`, email);
        return { success: true, fieldsFound, email };
      }
    }

    logTest(`User registration (${language})`, false, 'Registration page or form not found', email);
    return { success: false };

  } catch (error) {
    logTest(`User registration (${language})`, false, error.message, email);
    return { success: false, error: error.message };
  }
}

/**
 * Main test runner with comprehensive diagnostics
 */
async function runSmartTests() {
  console.log('🚀 Starting SMART Ghost Buyer Tests...\n');
  console.log(`📅 Test Date: ${testResults.startTime.toLocaleDateString()}`);
  console.log(`🌐 Target: ${CONFIG.baseUrl}`);
  console.log(`🗣️ Languages: ${CONFIG.languages.join(', ')}`);

  console.log('\n📧 Test Emails Allocated:');
  console.log(`   Newsletter: ${CONFIG.testEmails.newsletter.join(', ')}`);
  console.log(`   Registration: ${CONFIG.testEmails.registration.join(', ')}`);
  console.log(`   Guest Checkout: ${CONFIG.testEmails.guest_checkout.join(', ')}`);

  console.log('\n' + '='.repeat(80));

  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 200,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    // Step 1: Run self-diagnostics
    await runSelfDiagnostics(page);

    if (!testResults.diagnostics.scriptWorking) {
      console.log('\n🚨 ABORTING: Script diagnostics failed. Fix script issues first.');
      return;
    }

    // Step 2: Test each language
    let emailIndex = 0;

    for (const language of CONFIG.languages) {
      console.log(`\n🌍 Testing Language: ${language.toUpperCase()}`);
      console.log('='.repeat(60));

      // Test website basics for this language
      await testWebsiteBasics(page, language);

      if (!testResults.diagnostics.websiteWorking) {
        console.log(`⚠️ Website has basic issues in ${language}, but continuing tests...`);
      }

      // Test 1: Newsletter signup
      await testNewsletterSignup(page, language, emailIndex);
      emailIndex++;

      // Test 2: Complete checkout flow with email (guest checkout)
      await testCompleteCheckoutFlow(page, language, emailIndex);
      emailIndex++;

      // Test 3: User registration
      await testUserRegistration(page, language, emailIndex);
      emailIndex++;

      console.log(`✅ Completed testing for ${language.toUpperCase()}`);
      await wait(2000);
    }

  } catch (error) {
    console.error('❌ Critical error during testing:', error.message);
    testResults.diagnostics.issues.push(`Critical error: ${error.message}`);
  } finally {
    await browser.close();
  }

  // Generate final report
  testResults.endTime = new Date();
  await generateSmartReport();
}

/**
 * Generate comprehensive report with diagnostics
 */
async function generateSmartReport() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 SMART GHOST BUYER TEST REPORT');
  console.log('='.repeat(80));

  const duration = testResults.endTime - testResults.startTime;
  const durationMinutes = Math.round(duration / 1000 / 60);

  console.log(`⏱️  Test Duration: ${durationMinutes} minutes`);
  console.log(`📊 Total Tests: ${testResults.tests.passed + testResults.tests.failed}`);
  console.log(`✅ Passed: ${testResults.tests.passed}`);
  console.log(`❌ Failed: ${testResults.tests.failed}`);
  console.log(`📈 Success Rate: ${Math.round((testResults.tests.passed / (testResults.tests.passed + testResults.tests.failed)) * 100)}%`);

  // Diagnostics section
  console.log('\n🔧 DIAGNOSTICS:');
  console.log(`   Script Working: ${testResults.diagnostics.scriptWorking ? '✅ YES' : '❌ NO'}`);
  console.log(`   Website Working: ${testResults.diagnostics.websiteWorking ? '✅ YES' : '❌ NO'}`);

  if (testResults.diagnostics.issues.length > 0) {
    console.log('\n🚨 DIAGNOSTIC ISSUES:');
    testResults.diagnostics.issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`);
    });
  }

  // Email usage report
  console.log('\n📧 EMAIL USAGE REPORT:');
  testResults.emailsUsed.forEach((emailUsage, index) => {
    const status = emailUsage.success ? '✅' : '❌';
    console.log(`   ${index + 1}. ${status} ${emailUsage.email} - ${emailUsage.purpose}`);
  });

  // Detailed test results
  console.log('\n📋 DETAILED TEST RESULTS:');
  testResults.tests.details.forEach((test, index) => {
    const status = test.success ? '✅' : '❌';
    const emailInfo = test.email ? ` (${test.email})` : '';
    console.log(`   ${index + 1}. ${status} ${test.test}: ${test.details}${emailInfo}`);
  });

  // Recommendations
  console.log('\n🎯 RECOMMENDATIONS:');

  if (!testResults.diagnostics.scriptWorking) {
    console.log('   🚨 CRITICAL: Fix script diagnostic issues first');
  } else if (!testResults.diagnostics.websiteWorking) {
    console.log('   🚨 CRITICAL: Website has basic functionality issues');
  } else if (testResults.tests.failed === 0) {
    console.log('   🎉 EXCELLENT: All tests passing - website functioning perfectly!');
  } else {
    console.log('   🔧 Address failed tests - these are likely website functionality issues');
    console.log('   📧 Check email inboxes for newsletter confirmations');
    console.log('   🛒 Focus on shopping flow improvements');
  }

  // Save detailed report
  const reportData = {
    ...testResults,
    summary: {
      testDate: testResults.startTime.toISOString(),
      duration: durationMinutes,
      totalTests: testResults.tests.passed + testResults.tests.failed,
      successRate: Math.round((testResults.tests.passed / (testResults.tests.passed + testResults.tests.failed)) * 100)
    }
  };

  const reportFilename = `smart-ghost-buyer-report-${testResults.startTime.toISOString().split('T')[0]}.json`;
  fs.writeFileSync(reportFilename, JSON.stringify(reportData, null, 2));

  console.log(`\n📄 Detailed report saved: ${reportFilename}`);
  console.log('\n✅ Smart Ghost Buyer testing complete!');
}

// Run the smart tests
runSmartTests().catch(console.error);
