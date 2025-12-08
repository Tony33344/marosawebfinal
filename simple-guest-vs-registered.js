/**
 * SIMPLE GUEST VS REGISTERED TEST
 * 
 * Based on our successful complete-payment-test.js, but testing both flows:
 * 1. Guest checkout (we know works but no email)
 * 2. Registered user checkout (should send email)
 */

import puppeteer from 'puppeteer';

const CONFIG = {
  baseUrl: 'https://marosatest.netlify.app',
  
  guestEmail: 'simple.guest.001@noexpire.top',
  registeredEmail: 'simple.registered.001@noexpire.top',
  password: 'TestPassword123!'
};

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testGuestCheckout() {
  console.log('🛒 TESTING GUEST CHECKOUT');
  console.log('='.repeat(50));
  console.log(`📧 Guest email: ${CONFIG.guestEmail}`);
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 300,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  
  try {
    // Use the exact same successful flow from complete-payment-test.js
    
    // Step 1: Add to cart
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
    
    // Step 2: Checkout as guest
    await page.goto(`${CONFIG.baseUrl}/checkout?lang=sl`, { waitUntil: 'networkidle2' });
    await wait(5000);
    
    // Select guest checkout
    const allButtons = await page.$$('button, a, [role="button"]');
    for (const btn of allButtons) {
      try {
        const text = await page.evaluate(el => el.textContent.toLowerCase(), btn);
        if (text.includes('nadaljuj kot gost')) {
          await btn.click();
          console.log('✅ Selected guest checkout');
          await wait(5000);
          break;
        }
      } catch (e) { continue; }
    }
    
    // Fill form
    await page.type('#email', CONFIG.guestEmail);
    await page.type('#name', 'Guest Buyer');
    await page.type('#phone', '+386 41 111 111');
    await page.type('#address', 'Guest Street 123');
    await page.type('#city', 'Ljubljana');
    await page.type('#postalCode', '1000');
    console.log('✅ Form filled');
    
    // Select payment and submit
    const paymentOptions = await page.$$('input[type="radio"][name="paymentMethod"]');
    if (paymentOptions.length > 0) {
      await paymentOptions[0].click();
      await wait(1000);
    }
    
    const submitButtons = await page.$$('button');
    for (const btn of submitButtons) {
      try {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && text.includes('Oddaj naročilo')) {
          await btn.click();
          console.log('✅ Order submitted');
          await wait(8000);
          break;
        }
      } catch (e) { continue; }
    }
    
    // Check result
    const finalUrl = page.url();
    const success = finalUrl.includes('order-success');
    const orderMatch = await page.evaluate(() => document.body.textContent.match(/(\d{4,})/));
    const orderNumber = orderMatch ? orderMatch[1] : 'Unknown';
    
    console.log(`${success ? '✅' : '❌'} Guest result: ${success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   Order: ${orderNumber}`);
    console.log(`   Email: ${CONFIG.guestEmail}`);
    
    return { success, orderNumber, email: CONFIG.guestEmail, type: 'guest' };
    
  } finally {
    await browser.close();
  }
}

async function testRegisteredCheckout() {
  console.log('\n👤 TESTING REGISTERED USER CHECKOUT');
  console.log('='.repeat(50));
  console.log(`📧 Registered email: ${CONFIG.registeredEmail}`);
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 300,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  
  try {
    // Step 1: Register user first
    console.log('📝 Registering user...');
    await page.goto(`${CONFIG.baseUrl}/register?lang=sl`, { waitUntil: 'networkidle2' });
    await wait(3000);
    
    // Try to fill registration form
    try {
      await page.type('input[type="email"]', CONFIG.registeredEmail);
      await page.type('input[name*="name"]', 'Registered Buyer');
      await page.type('input[type="password"]', CONFIG.password);
      
      const regButtons = await page.$$('button[type="submit"]');
      if (regButtons.length > 0) {
        await regButtons[0].click();
        console.log('✅ Registration attempted');
        await wait(5000);
      }
    } catch (e) {
      console.log('⚠️ Registration failed, will try login');
    }
    
    // Step 2: Login
    console.log('🔑 Logging in...');
    await page.goto(`${CONFIG.baseUrl}/login?lang=sl`, { waitUntil: 'networkidle2' });
    await wait(3000);
    
    try {
      await page.type('input[type="email"]', CONFIG.registeredEmail);
      await page.type('input[type="password"]', CONFIG.password);
      
      const loginButtons = await page.$$('button[type="submit"]');
      if (loginButtons.length > 0) {
        await loginButtons[0].click();
        console.log('✅ Login attempted');
        await wait(5000);
      }
    } catch (e) {
      console.log('⚠️ Login failed, proceeding anyway');
    }
    
    // Step 3: Add to cart (same as guest)
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
    
    // Step 4: Checkout as registered user
    await page.goto(`${CONFIG.baseUrl}/checkout?lang=sl`, { waitUntil: 'networkidle2' });
    await wait(5000);
    
    // For registered users, might skip guest/register choice
    // Fill any visible form fields
    try {
      const emailField = await page.$('#email');
      if (emailField) {
        await emailField.click({ clickCount: 3 });
        await emailField.type(CONFIG.registeredEmail);
      }
      
      await page.type('#address', 'Registered Street 456');
      await page.type('#city', 'Maribor');
      await page.type('#postalCode', '2000');
      console.log('✅ Form filled');
    } catch (e) {
      console.log('⚠️ Some form fields not filled');
    }
    
    // Select payment and submit
    const paymentOptions = await page.$$('input[type="radio"][name="paymentMethod"]');
    if (paymentOptions.length > 0) {
      await paymentOptions[0].click();
      await wait(1000);
    }
    
    const submitButtons = await page.$$('button');
    for (const btn of submitButtons) {
      try {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && text.includes('Oddaj naročilo')) {
          await btn.click();
          console.log('✅ Order submitted');
          await wait(8000);
          break;
        }
      } catch (e) { continue; }
    }
    
    // Check result
    const finalUrl = page.url();
    const success = finalUrl.includes('order-success');
    const orderMatch = await page.evaluate(() => document.body.textContent.match(/(\d{4,})/));
    const orderNumber = orderMatch ? orderMatch[1] : 'Unknown';
    
    console.log(`${success ? '✅' : '❌'} Registered result: ${success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   Order: ${orderNumber}`);
    console.log(`   Email: ${CONFIG.registeredEmail}`);
    
    return { success, orderNumber, email: CONFIG.registeredEmail, type: 'registered' };
    
  } finally {
    await browser.close();
  }
}

async function runComparison() {
  console.log('🚀 GUEST VS REGISTERED CHECKOUT COMPARISON\n');
  
  const guestResult = await testGuestCheckout();
  await wait(3000);
  const registeredResult = await testRegisteredCheckout();
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 FINAL COMPARISON RESULTS');
  console.log('='.repeat(80));
  
  console.log(`\n1. GUEST CHECKOUT:`);
  console.log(`   Success: ${guestResult.success ? '✅ YES' : '❌ NO'}`);
  console.log(`   Order: ${guestResult.orderNumber}`);
  console.log(`   Email: ${guestResult.email}`);
  
  console.log(`\n2. REGISTERED CHECKOUT:`);
  console.log(`   Success: ${registeredResult.success ? '✅ YES' : '❌ NO'}`);
  console.log(`   Order: ${registeredResult.orderNumber}`);
  console.log(`   Email: ${registeredResult.email}`);
  
  console.log('\n📧 EMAIL VERIFICATION:');
  console.log(`   Check ${CONFIG.guestEmail} for guest order confirmation`);
  console.log(`   Check ${CONFIG.registeredEmail} for registered order confirmation`);
  
  console.log('\n🎯 HYPOTHESIS:');
  console.log('   - Guest orders: Created but NO email sent');
  console.log('   - Registered orders: Created AND email sent');
  
  console.log('\n✅ Test complete! Check both email inboxes to confirm the difference.');
}

runComparison().catch(console.error);
