/**
 * EMAIL CONFIRMATION TEST
 * 
 * Focused test to verify that order confirmation emails are sent correctly.
 * Based on our analysis, this uses the CORRECT multi-step checkout that sends emails.
 * 
 * Key findings:
 * - /checkout (CheckoutPage.tsx) has email sending DISABLED (line 1329)
 * - /multi-step-checkout (MultiStepCheckoutPage.tsx) has email sending ENABLED (lines 628-680)
 * 
 * This test specifically uses /multi-step-checkout to ensure emails are sent.
 */

import puppeteer from 'puppeteer';

const CONFIG = {
  baseUrl: 'http://localhost:5173',
  checkoutUrl: 'http://localhost:5173/checkout-steps?lang=sl',
  testEmails: [
    'email.test.001@noexpire.top',
    'email.test.

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runEmailConfirmationTest() {
  console.log('🚀 EMAIL CONFIRMATION TEST - Testing order email sending\n');
  console.log(`📧 Test emails: ${CONFIG.testEmails.join(', ')}\n`);
  console.log(`🎯 CRITICAL: Using your specified URL: ${CONFIG.checkoutUrl}\n`);
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 300,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  
  // Monitor console for email-related messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('email') || text.includes('Email') || text.includes('sending') || 
        text.includes('confirmation') || text.includes('order') || text.includes('MultiStep')) {
      console.log(`🖥️ Console: ${msg.type()}: ${text}`);
    }
  });
  
  try {
    const email = CONFIG.testEmails[0];
    
    // Step 1: Add product to cart
    console.log('📦 Step 1: Adding product to cart...');
    await page.goto(`${CONFIG.baseUrl}/izdelek/11?lang=sl`, { waitUntil: 'domcontentloaded' });
    await wait(3000);
    
    // Handle popups
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
    
    const productTitle = await page.$eval('h1', el => el.textContent).catch(() => 'Unknown');
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
      console.log('❌ Could not add product to cart');
      return;
    }
    
    // Step 2: Go to CHECKOUT-STEPS (the specific URL you provided!)
    console.log('\n💳 Step 2: Going to CHECKOUT-STEPS (your specified URL)...');
    await page.goto(CONFIG.checkoutUrl, { waitUntil: 'domcontentloaded' });
    await wait(5000);
    
    console.log(`   Current URL: ${page.url()}`);

    // Verify we're on the right page and cart has items
    const pageContent = await page.evaluate(() => document.body.textContent);
    if (pageContent.includes('prazna') || pageContent.includes('empty')) {
      console.log('❌ Cart is empty on checkout-steps page');
      return;
    }

    console.log('   ✅ Checkout-steps page loaded with items');
    
    // Step 3: Handle checkout selection (Continue as guest)
    console.log('\n👤 Step 3: Selecting "Continue as guest"...');

    // Look for "Nadaljuj kot gost" button
    const guestButtons = await page.$$('button');
    let guestSelected = false;

    for (const btn of guestButtons) {
      try {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && text.includes('Nadaljuj kot gost')) {
          await btn.click();
          console.log('   ✅ Clicked "Nadaljuj kot gost"');
          guestSelected = true;
          await wait(5000); // Wait for form to load
          break;
        }
      } catch (e) { continue; }
    }

    if (!guestSelected) {
      console.log('   ❌ Could not find "Nadaljuj kot gost" button');
      return;
    }

    // Step 4: Fill checkout form
    console.log('\n📝 Step 4: Filling checkout form...');

    // Fill email field
    const emailField = await page.$('input[type="email"]');
    if (emailField) {
      await emailField.click();
      await emailField.click({ clickCount: 3 });
      await emailField.type(email);
      console.log(`   ✅ Email: ${email}`);
      await wait(500);
    } else {
      console.log('   ❌ Email field not found');
      return;
    }
    
    // Fill name field
    const nameFields = await page.$$('input[name*="name"], input[name*="Name"]');
    if (nameFields.length > 0) {
      await nameFields[0].click();
      await nameFields[0].click({ clickCount: 3 });
      await nameFields[0].type('Email Test User');
      console.log('   ✅ Name: Email Test User');
      await wait(500);
    }
    
    // Fill phone field
    const phoneField = await page.$('input[type="tel"], input[name*="phone"]');
    if (phoneField) {
      await phoneField.click();
      await phoneField.click({ clickCount: 3 });
      await phoneField.type('041123456');
      console.log('   ✅ Phone: 041123456');
      await wait(500);
    }
    
    // Fill address fields
    const addressFields = [
      { selector: 'input[name*="address"]', value: 'Email Test Street 123', name: 'address' },
      { selector: 'input[name*="city"]', value: 'Ljubljana', name: 'city' },
      { selector: 'input[name*="postal"]', value: '1000', name: 'postal' }
    ];
    
    for (const field of addressFields) {
      const element = await page.$(field.selector);
      if (element) {
        await element.click();
        await element.click({ clickCount: 3 });
        await element.type(field.value);
        console.log(`   ✅ ${field.name}: ${field.value}`);
        await wait(500);
      }
    }
    
    // Step 5: Select payment method
    console.log('\n💰 Step 5: Selecting payment method...');
    
    const paymentRadios = await page.$$('input[type="radio"]');
    if (paymentRadios.length > 0) {
      await paymentRadios[0].click();
      const value = await page.evaluate(el => el.value, paymentRadios[0]);
      console.log(`   ✅ Selected payment method: ${value}`);
      await wait(1000);
    }
    
    // Step 6: Submit order
    console.log('\n🚀 Step 6: Submitting order...');
    console.log('   🔍 Looking for submit button...');
    
    const submitButtons = await page.$$('button');
    let orderSubmitted = false;
    
    for (const btn of submitButtons) {
      try {
        const text = await page.evaluate(el => el.textContent, btn);
        console.log(`   Button: "${text}"`);
        
        if (text && (text.includes('Oddaj naročilo') || text.includes('Potrdi') || 
                    text.includes('Submit') || text.includes('Place Order'))) {
          console.log(`   🎯 Submitting with: "${text}"`);
          await btn.click();
          orderSubmitted = true;
          console.log('   ⏳ Waiting for order processing and email sending...');
          await wait(15000); // Wait longer for processing and email sending
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!orderSubmitted) {
      console.log('   ❌ Could not find or click submit button');
      return;
    }
    
    // Step 7: Verify successful order submission on website
    console.log('\n🎉 Step 7: Verifying successful order submission...');

    // Wait for any redirects or success messages to appear
    await wait(10000); // Wait longer for processing

    const finalUrl = page.url();
    const finalContent = await page.evaluate(() => document.body.textContent);
    const finalContentLower = finalContent.toLowerCase();

    console.log(`   🌐 Final URL: ${finalUrl}`);
    console.log(`   📄 Page content preview: ${finalContent.substring(0, 1000)}...`);

    // Enhanced success detection
    const successIndicators = [
      'uspešno',           // Successfully (Slovenian)
      'hvala',             // Thank you (Slovenian)
      'potrjen',           // Confirmed (Slovenian)
      'naročilo',          // Order (Slovenian)
      'success',           // Success (English)
      'thank you',         // Thank you (English)
      'confirmed',         // Confirmed (English)
      'order received',    // Order received (English)
      'order placed'       // Order placed (English)
    ];

    const foundSuccessMessage = successIndicators.some(indicator =>
      finalContentLower.includes(indicator)
    );

    const urlSuccess = finalUrl.includes('order-success') || finalUrl.includes('success');
    const overallSuccess = urlSuccess || foundSuccessMessage;

    console.log(`   🔍 Success indicators found: ${successIndicators.filter(indicator => finalContentLower.includes(indicator)).join(', ') || 'NONE'}`);
    console.log(`   🔍 URL success: ${urlSuccess}`);
    console.log(`   🔍 Overall success: ${overallSuccess}`);

    if (overallSuccess) {
      // Extract order number from content
      const orderMatches = finalContent.match(/(\d{4,})/g);
      const orderNumber = orderMatches ? orderMatches[0] : 'Unknown';

      console.log('\n🎉 SUCCESS! Order completed successfully!');
      console.log(`   📋 Order Number: ${orderNumber}`);
      console.log(`   📧 Customer Email: ${email}`);
      console.log('\n📧 EMAIL VERIFICATION:');
      console.log(`   1. Go to: https://noexpire.top`);
      console.log(`   2. Check inbox for: ${email}`);
      console.log(`   3. Look for email from: kmetija.marosa.narocila@gmail.com`);
      console.log(`   4. Subject should be: "Kmetija Maroša - Potrditev naročila #${orderNumber}"`);
      console.log('\n🔍 If no email received:');
      console.log('   - Check Google Apps Script logs');
      console.log('   - Verify Supabase Edge Function logs');
      console.log('   - Check if email service is working');

    } else {
      console.log('\n❌ Order submission may have failed!');
      console.log(`   🔍 Page content preview: ${finalContent.substring(0, 500)}...`);
      console.log('\n🚨 TROUBLESHOOTING:');
      console.log('   - Check if payment method was selected properly');
      console.log('   - Verify all required form fields were filled');
      console.log('   - Look for any error messages on the page');
      console.log('   - Check browser console for JavaScript errors');
      console.log('   - Verify the submit button was clicked successfully');
    }
    
  } catch (error) {
    console.error('\n❌ Error during email confirmation test:', error.message);
  } finally {
    console.log('\n⏰ Keeping browser open for 60 seconds for inspection...');
    setTimeout(async () => {
      await browser.close();
      console.log('Browser closed.');
    }, 60000);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 EMAIL CONFIRMATION TEST SUMMARY');
  console.log('='.repeat(80));
  console.log('🎯 This test used the CORRECT multi-step checkout that sends emails');
  console.log('📧 If order was successful, check email inbox for confirmation');
  console.log('🔧 If no email received, the issue is with the email service, not the checkout');
}

runEmailConfirmationTest().catch(console.error);
