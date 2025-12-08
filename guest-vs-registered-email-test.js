/**
 * GUEST VS REGISTERED EMAIL TEST
 * 
 * Tests both guest checkout and registered user checkout flows
 * to verify email confirmations are sent in both cases.
 * 
 * Uses the CORRECT multi-step checkout that sends emails.
 */

import puppeteer from 'puppeteer';

const CONFIG = {
  baseUrl: 'https://marosatest.netlify.app',
  testEmails: {
    guest: 'guest.email.test@noexpire.top',
    registered: 'registered.email.test@noexpire.top'
  },
  testPassword: 'TestPassword123!'
};

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testGuestCheckout(page) {
  console.log('\n🛒 TESTING GUEST CHECKOUT...');
  
  const email = CONFIG.testEmails.guest;
  
  try {
    // Add product to cart
    console.log('📦 Adding product to cart...');
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
    
    // Set quantity and add to cart
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
          console.log('   ✅ Added to cart');
          await wait(3000);
          break;
        }
      } catch (e) { continue; }
    }
    
    // Go to multi-step checkout
    console.log('💳 Going to multi-step checkout...');
    await page.goto(`${CONFIG.baseUrl}/multi-step-checkout?lang=sl`, { waitUntil: 'domcontentloaded' });
    await wait(5000);
    
    // Check if we should proceed as guest
    const pageContent = await page.evaluate(() => document.body.textContent);
    if (pageContent.includes('Kako želite nadaljevati')) {
      console.log('🔄 Selecting guest checkout...');
      const guestButtons = await page.$$('button');
      for (const btn of guestButtons) {
        try {
          const text = await page.evaluate(el => el.textContent, btn);
          if (text && text.includes('Nadaljuj kot gost')) {
            await btn.click();
            console.log('   ✅ Selected guest checkout');
            await wait(3000);
            break;
          }
        } catch (e) { continue; }
      }
    }
    
    // Fill guest information
    console.log('📝 Filling guest information...');
    
    const emailField = await page.$('input[type="email"]');
    if (emailField) {
      await emailField.click();
      await emailField.click({ clickCount: 3 });
      await emailField.type(email);
      console.log(`   ✅ Email: ${email}`);
      await wait(500);
    }
    
    const nameFields = await page.$$('input[name*="name"], input[name*="Name"]');
    if (nameFields.length > 0) {
      await nameFields[0].click();
      await nameFields[0].click({ clickCount: 3 });
      await nameFields[0].type('Guest Test User');
      console.log('   ✅ Name: Guest Test User');
      await wait(500);
    }
    
    const phoneField = await page.$('input[type="tel"], input[name*="phone"]');
    if (phoneField) {
      await phoneField.click();
      await phoneField.click({ clickCount: 3 });
      await phoneField.type('041111222');
      console.log('   ✅ Phone: 041111222');
      await wait(500);
    }
    
    const addressFields = [
      { selector: 'input[name*="address"]', value: 'Guest Street 123', name: 'address' },
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
    
    // Select payment method
    const paymentRadios = await page.$$('input[type="radio"]');
    if (paymentRadios.length > 0) {
      await paymentRadios[0].click();
      console.log('   ✅ Payment method selected');
      await wait(1000);
    }
    
    // Submit order
    console.log('🚀 Submitting guest order...');
    const submitButtons = await page.$$('button');
    
    for (const btn of submitButtons) {
      try {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && (text.includes('Oddaj naročilo') || text.includes('Potrdi'))) {
          await btn.click();
          console.log('   ✅ Order submitted');
          await wait(15000);
          break;
        }
      } catch (e) { continue; }
    }
    
    // Check results
    const finalUrl = page.url();
    const finalContent = await page.evaluate(() => document.body.textContent.toLowerCase());
    
    const success = finalUrl.includes('order-success') || finalContent.includes('uspešno');
    
    if (success) {
      const orderMatch = finalContent.match(/(\d{4,})/);
      const orderNumber = orderMatch ? orderMatch[1] : 'Unknown';
      
      console.log('🎉 GUEST ORDER SUCCESS!');
      console.log(`   📋 Order: ${orderNumber}`);
      console.log(`   📧 Email: ${email}`);
      
      return { success: true, orderNumber, email, type: 'guest' };
    } else {
      console.log('❌ Guest order failed');
      return { success: false, type: 'guest' };
    }
    
  } catch (error) {
    console.error('❌ Guest checkout error:', error.message);
    return { success: false, error: error.message, type: 'guest' };
  }
}

async function testRegisteredCheckout(page) {
  console.log('\n👤 TESTING REGISTERED USER CHECKOUT...');
  
  const email = CONFIG.testEmails.registered;
  
  try {
    // First, try to register or login
    console.log('🔐 Handling user registration/login...');
    await page.goto(`${CONFIG.baseUrl}?lang=sl`, { waitUntil: 'domcontentloaded' });
    await wait(3000);
    
    // Look for login/register links
    const authLinks = await page.$$('a, button');
    let authClicked = false;
    
    for (const link of authLinks) {
      try {
        const text = await page.evaluate(el => el.textContent.toLowerCase(), link);
        if (text.includes('prijava') || text.includes('registracija') || text.includes('login')) {
          await link.click();
          console.log(`   ✅ Clicked: ${text}`);
          authClicked = true;
          await wait(3000);
          break;
        }
      } catch (e) { continue; }
    }
    
    if (!authClicked) {
      console.log('   ⚠️ No auth links found, proceeding with checkout');
    }
    
    // Add product to cart
    console.log('📦 Adding product to cart...');
    await page.goto(`${CONFIG.baseUrl}/izdelek/11?lang=sl`, { waitUntil: 'domcontentloaded' });
    await wait(3000);
    
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
          console.log('   ✅ Added to cart');
          await wait(3000);
          break;
        }
      } catch (e) { continue; }
    }
    
    // Go to multi-step checkout
    console.log('💳 Going to multi-step checkout...');
    await page.goto(`${CONFIG.baseUrl}/multi-step-checkout?lang=sl`, { waitUntil: 'domcontentloaded' });
    await wait(5000);
    
    // Check if we need to register/login
    const pageContent = await page.evaluate(() => document.body.textContent);
    if (pageContent.includes('Kako želite nadaljevati')) {
      console.log('🔄 Selecting registration...');
      const regButtons = await page.$$('button');
      for (const btn of regButtons) {
        try {
          const text = await page.evaluate(el => el.textContent, btn);
          if (text && text.includes('Registracija')) {
            await btn.click();
            console.log('   ✅ Selected registration');
            await wait(3000);
            break;
          }
        } catch (e) { continue; }
      }
      
      // Fill registration form
      console.log('📝 Filling registration form...');
      
      const emailField = await page.$('input[type="email"]');
      if (emailField) {
        await emailField.click();
        await emailField.click({ clickCount: 3 });
        await emailField.type(email);
        console.log(`   ✅ Email: ${email}`);
        await wait(500);
      }
      
      const passwordField = await page.$('input[type="password"]');
      if (passwordField) {
        await passwordField.click();
        await passwordField.type(CONFIG.testPassword);
        console.log('   ✅ Password entered');
        await wait(500);
      }
      
      // Submit registration
      const submitButtons = await page.$$('button');
      for (const btn of submitButtons) {
        try {
          const text = await page.evaluate(el => el.textContent, btn);
          if (text && text.includes('Registracija')) {
            await btn.click();
            console.log('   ✅ Registration submitted');
            await wait(5000);
            break;
          }
        } catch (e) { continue; }
      }
    }
    
    // Continue with checkout (similar to guest but as registered user)
    console.log('📝 Completing checkout as registered user...');
    
    // Fill any remaining required fields
    const nameFields = await page.$$('input[name*="name"], input[name*="Name"]');
    if (nameFields.length > 0) {
      await nameFields[0].click();
      await nameFields[0].click({ clickCount: 3 });
      await nameFields[0].type('Registered Test User');
      console.log('   ✅ Name: Registered Test User');
      await wait(500);
    }
    
    const phoneField = await page.$('input[type="tel"], input[name*="phone"]');
    if (phoneField) {
      await phoneField.click();
      await phoneField.click({ clickCount: 3 });
      await phoneField.type('041333444');
      console.log('   ✅ Phone: 041333444');
      await wait(500);
    }
    
    const addressFields = [
      { selector: 'input[name*="address"]', value: 'Registered Street 456', name: 'address' },
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
    
    // Select payment method
    const paymentRadios = await page.$$('input[type="radio"]');
    if (paymentRadios.length > 0) {
      await paymentRadios[0].click();
      console.log('   ✅ Payment method selected');
      await wait(1000);
    }
    
    // Submit order
    console.log('🚀 Submitting registered user order...');
    const submitButtons = await page.$$('button');
    
    for (const btn of submitButtons) {
      try {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && (text.includes('Oddaj naročilo') || text.includes('Potrdi'))) {
          await btn.click();
          console.log('   ✅ Order submitted');
          await wait(15000);
          break;
        }
      } catch (e) { continue; }
    }
    
    // Check results
    const finalUrl = page.url();
    const finalContent = await page.evaluate(() => document.body.textContent.toLowerCase());
    
    const success = finalUrl.includes('order-success') || finalContent.includes('uspešno');
    
    if (success) {
      const orderMatch = finalContent.match(/(\d{4,})/);
      const orderNumber = orderMatch ? orderMatch[1] : 'Unknown';
      
      console.log('🎉 REGISTERED USER ORDER SUCCESS!');
      console.log(`   📋 Order: ${orderNumber}`);
      console.log(`   📧 Email: ${email}`);
      
      return { success: true, orderNumber, email, type: 'registered' };
    } else {
      console.log('❌ Registered user order failed');
      return { success: false, type: 'registered' };
    }
    
  } catch (error) {
    console.error('❌ Registered checkout error:', error.message);
    return { success: false, error: error.message, type: 'registered' };
  }
}

async function runGuestVsRegisteredTest() {
  console.log('🚀 GUEST VS REGISTERED EMAIL TEST\n');
  console.log(`📧 Guest email: ${CONFIG.testEmails.guest}`);
  console.log(`📧 Registered email: ${CONFIG.testEmails.registered}\n`);
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 300,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const results = [];
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    // Test guest checkout
    const guestResult = await testGuestCheckout(page);
    results.push(guestResult);
    
    await wait(5000);
    
    // Test registered checkout
    const registeredResult = await testRegisteredCheckout(page);
    results.push(registeredResult);
    
  } catch (error) {
    console.error('❌ Critical error:', error.message);
  } finally {
    console.log('\n⏰ Keeping browser open for 60 seconds...');
    setTimeout(async () => {
      await browser.close();
      console.log('Browser closed.');
    }, 60000);
  }
  
  // Generate report
  console.log('\n' + '='.repeat(80));
  console.log('📊 GUEST VS REGISTERED TEST RESULTS');
  console.log('='.repeat(80));
  
  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${index + 1}. ${status} ${result.type.toUpperCase()} CHECKOUT`);
    if (result.success) {
      console.log(`   📋 Order: ${result.orderNumber}`);
      console.log(`   📧 Email: ${result.email}`);
    } else {
      console.log(`   ❌ Failed: ${result.error || 'Unknown error'}`);
    }
  });
  
  const successfulOrders = results.filter(r => r.success);
  
  if (successfulOrders.length > 0) {
    console.log('\n📧 EMAIL VERIFICATION:');
    console.log('   Go to: https://noexpire.top');
    console.log('   Check these email inboxes:');
    successfulOrders.forEach((order, index) => {
      console.log(`   ${index + 1}. ${order.email} - Order #${order.orderNumber} (${order.type})`);
    });
    console.log('\n   Look for emails from: kmetija.marosa.narocila@gmail.com');
  }
  
  console.log('\n✅ Guest vs Registered test complete!');
}

runGuestVsRegisteredTest().catch(console.error);
