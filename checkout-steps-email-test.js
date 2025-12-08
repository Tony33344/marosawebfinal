/**
 * CHECKOUT-STEPS EMAIL TEST
 * 
 * Using the EXACT URL you specified: https://marosatest.netlify.app/checkout-steps?lang=sl
 * This is the final test to verify email confirmations work with your specific checkout flow.
 */

import puppeteer from 'puppeteer';

const CONFIG = {
  checkoutUrl: 'https://marosatest.netlify.app/checkout-steps?lang=sl',
  baseUrl: 'https://marosatest.netlify.app',
  testEmails: [
    'checkout.steps.001@noexpire.top',
    'checkout.steps.002@noexpire.top',
    'checkout.steps.003@noexpire.top'
  ]
};

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runCheckoutStepsEmailTest() {
  console.log('🚀 CHECKOUT-STEPS EMAIL TEST\n');
  console.log(`🎯 Using your specified URL: ${CONFIG.checkoutUrl}`);
  console.log(`📧 Test email: ${CONFIG.testEmails[0]}\n`);
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 400,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  
  // Monitor console for email-related messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('email') || text.includes('Email') || text.includes('sending') || 
        text.includes('confirmation') || text.includes('order') || text.includes('checkout')) {
      console.log(`🖥️ Console: ${msg.type()}: ${text}`);
    }
  });
  
  try {
    const email = CONFIG.testEmails[0];
    
    // Step 1: Add product to cart first
    console.log('📦 Step 1: Adding product to cart...');
    await page.goto(`${CONFIG.baseUrl}/izdelek/11?lang=sl`, { waitUntil: 'domcontentloaded' });
    await wait(3000);
    
    // Handle popups quickly
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
    
    // Step 2: Go to YOUR SPECIFIC checkout-steps URL
    console.log('\n💳 Step 2: Going to YOUR checkout-steps URL...');
    await page.goto(CONFIG.checkoutUrl, { waitUntil: 'domcontentloaded' });
    await wait(5000);
    
    console.log(`   Current URL: ${page.url()}`);
    
    // Check what's on the page
    const pageContent = await page.evaluate(() => document.body.textContent);
    console.log(`   Page content preview: ${pageContent.substring(0, 200)}...`);
    
    if (pageContent.includes('prazna') || pageContent.includes('empty')) {
      console.log('❌ Cart appears to be empty on checkout-steps page');
      console.log('   This might be normal - continuing with the flow...');
    } else {
      console.log('   ✅ Checkout-steps page loaded');
    }
    
    // Step 3: Navigate through the checkout steps
    console.log('\n📝 Step 3: Navigating checkout steps...');
    
    // Look for step indicators or forms
    const forms = await page.$$('form');
    const inputs = await page.$$('input');
    const stepElements = await page.$$('.step, [data-step], .checkout-step');
    
    console.log(`   Found: ${forms.length} forms, ${inputs.length} inputs, ${stepElements.length} step elements`);
    
    // Try to fill customer information
    console.log('👤 Filling customer information...');
    
    // Fill email field
    const emailField = await page.$('input[type="email"]');
    if (emailField) {
      await emailField.click();
      await emailField.click({ clickCount: 3 });
      await emailField.type(email);
      console.log(`   ✅ Email: ${email}`);
      await wait(500);
    } else {
      console.log('   ⚠️ Email field not found');
    }
    
    // Fill name field
    const nameFields = await page.$$('input[name*="name"], input[name*="Name"], input[placeholder*="ime"], input[placeholder*="name"]');
    if (nameFields.length > 0) {
      await nameFields[0].click();
      await nameFields[0].click({ clickCount: 3 });
      await nameFields[0].type('Checkout Steps User');
      console.log('   ✅ Name: Checkout Steps User');
      await wait(500);
    } else {
      console.log('   ⚠️ Name field not found');
    }
    
    // Fill phone field
    const phoneField = await page.$('input[type="tel"], input[name*="phone"], input[name*="telefon"]');
    if (phoneField) {
      await phoneField.click();
      await phoneField.click({ clickCount: 3 });
      await phoneField.type('041987654');
      console.log('   ✅ Phone: 041987654');
      await wait(500);
    } else {
      console.log('   ⚠️ Phone field not found');
    }
    
    // Fill address fields
    const addressFields = [
      { selector: 'input[name*="address"], input[name*="naslov"]', value: 'Checkout Steps Street 789', name: 'address' },
      { selector: 'input[name*="city"], input[name*="mesto"]', value: 'Ljubljana', name: 'city' },
      { selector: 'input[name*="postal"], input[name*="posta"]', value: '1000', name: 'postal' }
    ];
    
    for (const field of addressFields) {
      const element = await page.$(field.selector);
      if (element) {
        await element.click();
        await element.click({ clickCount: 3 });
        await element.type(field.value);
        console.log(`   ✅ ${field.name}: ${field.value}`);
        await wait(500);
      } else {
        console.log(`   ⚠️ ${field.name} field not found`);
      }
    }
    
    // Step 4: Look for next/continue buttons
    console.log('\n🔄 Step 4: Looking for navigation buttons...');
    
    const allButtons = await page.$$('button');
    console.log(`   Found ${allButtons.length} buttons on page`);
    
    // Try to find and click next/continue buttons
    for (let i = 0; i < 3; i++) { // Try up to 3 steps
      console.log(`   Attempting step ${i + 1}...`);
      
      const buttons = await page.$$('button');
      let buttonClicked = false;
      
      for (const btn of buttons) {
        try {
          const text = await page.evaluate(el => el.textContent.toLowerCase(), btn);
          console.log(`     Button: "${text}"`);
          
          if (text.includes('naprej') || text.includes('next') || text.includes('continue') || 
              text.includes('nadaljuj') || text.includes('potrdi') || text.includes('oddaj')) {
            console.log(`   🎯 Clicking: "${text}"`);
            await btn.click();
            buttonClicked = true;
            await wait(5000);
            break;
          }
        } catch (e) { continue; }
      }
      
      if (!buttonClicked) {
        console.log(`   ⚠️ No navigation button found in step ${i + 1}`);
        break;
      }
      
      // Check if we've moved to a new step or completed
      const currentUrl = page.url();
      const currentContent = await page.evaluate(() => document.body.textContent.toLowerCase());
      
      if (currentUrl.includes('success') || currentContent.includes('uspešno') || currentContent.includes('hvala')) {
        console.log('   🎉 Reached success page!');
        break;
      }
    }
    
    // Step 5: Try final submission if not already done
    console.log('\n🚀 Step 5: Final submission attempt...');
    
    const finalButtons = await page.$$('button');
    let finalSubmitted = false;
    
    for (const btn of finalButtons) {
      try {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && (text.includes('Oddaj naročilo') || text.includes('Potrdi naročilo') || 
                    text.includes('Submit') || text.includes('Place Order') || text.includes('Končaj'))) {
          console.log(`   🎯 Final submission with: "${text}"`);
          await btn.click();
          finalSubmitted = true;
          await wait(15000); // Wait longer for processing and email sending
          break;
        }
      } catch (e) { continue; }
    }
    
    // Step 6: Check final results
    console.log('\n🎉 Step 6: Checking final results...');
    
    const finalUrl = page.url();
    const finalContent = await page.evaluate(() => document.body.textContent.toLowerCase());
    
    console.log(`   Final URL: ${finalUrl}`);
    console.log(`   Content preview: ${finalContent.substring(0, 300)}...`);
    
    const success = finalUrl.includes('order-success') || finalUrl.includes('success') || 
                   finalContent.includes('uspešno') || finalContent.includes('hvala') ||
                   finalContent.includes('naročilo') && finalContent.includes('prejeto');
    
    if (success) {
      const orderMatch = finalContent.match(/(\d{4,})/);
      const orderNumber = orderMatch ? orderMatch[1] : 'Unknown';
      
      console.log('\n🎉 SUCCESS! Order completed with checkout-steps!');
      console.log(`   📋 Order Number: ${orderNumber}`);
      console.log(`   📧 Customer Email: ${email}`);
      console.log('\n📧 EMAIL VERIFICATION:');
      console.log(`   1. Go to: https://noexpire.top`);
      console.log(`   2. Check inbox for: ${email}`);
      console.log(`   3. Look for email from: kmetija.marosa.narocila@gmail.com`);
      console.log(`   4. Subject should be: "Kmetija Maroša - Potrditev naročila #${orderNumber}"`);
      console.log('\n🎯 This used YOUR SPECIFIC checkout-steps URL!');
      
    } else {
      console.log('\n❌ Order may not have completed successfully');
      console.log('   Check the page content above for clues');
      console.log('   The checkout-steps flow might need manual completion');
    }
    
  } catch (error) {
    console.error('\n❌ Error during checkout-steps test:', error.message);
  } finally {
    console.log('\n⏰ Keeping browser open for 90 seconds for manual inspection...');
    console.log('   You can manually complete the checkout if needed');
    setTimeout(async () => {
      await browser.close();
      console.log('Browser closed.');
    }, 90000);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 CHECKOUT-STEPS EMAIL TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`🎯 Used your specified URL: ${CONFIG.checkoutUrl}`);
  console.log(`📧 Test email: ${CONFIG.testEmails[0]}`);
  console.log('🔍 Check email inbox to verify if confirmation was sent');
  console.log('💡 If order completed, email should be sent automatically');
}

runCheckoutStepsEmailTest().catch(console.error);
