/**
 * GUEST VS REGISTERED USER TEST
 * 
 * Tests both checkout flows to compare email confirmation behavior:
 * 1. Guest checkout (we know this doesn't send emails)
 * 2. Registered user checkout (should send emails)
 * 
 * This will help identify the email confirmation bug
 */

import puppeteer from 'puppeteer';

const CONFIG = {
  baseUrl: 'https://marosatest.netlify.app',
  
  guestCustomer: {
    name: 'Guest Buyer',
    email: 'guest.test.001@noexpire.top',
    phone: '+386 41 111 111',
    address: 'Guest Street 123',
    city: 'Ljubljana',
    postalCode: '1000'
  },
  
  registeredCustomer: {
    name: 'Registered Buyer',
    email: 'registered.test.001@noexpire.top',
    phone: '+386 41 222 222',
    address: 'Registered Street 456',
    city: 'Maribor',
    postalCode: '2000',
    password: 'TestPassword123!'
  }
};

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function addProductToCart(page) {
  console.log('📦 Adding product to cart...');
  
  // Handle popups first
  await page.goto(`${CONFIG.baseUrl}?lang=sl`, { waitUntil: 'networkidle2' });
  await wait(3000);
  
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
  
  // Close newsletter popup
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
        await wait(5000);
        break;
      }
    } catch (e) { continue; }
  }
  
  console.log(`✅ Added ${productTitle} to cart`);
  return productTitle;
}

async function testGuestCheckout(page) {
  console.log('\n🛒 TESTING GUEST CHECKOUT');
  console.log('='.repeat(50));
  
  const customer = CONFIG.guestCustomer;
  console.log(`📧 Guest email: ${customer.email}`);
  
  // Add product to cart
  const product = await addProductToCart(page);
  
  // Go to checkout
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
  const formData = [
    { selector: '#email', value: customer.email },
    { selector: '#name', value: customer.name },
    { selector: '#phone', value: customer.phone },
    { selector: '#address', value: customer.address },
    { selector: '#city', value: customer.city },
    { selector: '#postalCode', value: customer.postalCode }
  ];
  
  for (const field of formData) {
    try {
      const element = await page.$(field.selector);
      if (element) {
        await element.type(field.value);
        console.log(`✅ Filled ${field.selector}: ${field.value}`);
        await wait(500);
      }
    } catch (e) {
      console.log(`⚠️ Could not fill ${field.selector}`);
    }
  }
  
  // Select payment method
  const paymentOptions = await page.$$('input[type="radio"][name="paymentMethod"]');
  if (paymentOptions.length > 0) {
    await paymentOptions[0].click();
    console.log('✅ Payment method selected');
    await wait(1000);
  }
  
  // Submit order
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
  const finalContent = await page.evaluate(() => document.body.textContent.toLowerCase());
  
  const success = finalUrl.includes('order-success') || finalContent.includes('uspešno');
  const orderMatch = finalContent.match(/(\d{4,})/);
  const orderNumber = orderMatch ? orderMatch[1] : 'Unknown';
  
  console.log(`${success ? '✅' : '❌'} Guest checkout result:`);
  console.log(`   URL: ${finalUrl}`);
  console.log(`   Order number: ${orderNumber}`);
  console.log(`   Email: ${customer.email} (check for confirmation)`);
  
  return {
    success,
    orderNumber,
    email: customer.email,
    type: 'guest'
  };
}

async function testRegisteredUserCheckout(page) {
  console.log('\n👤 TESTING REGISTERED USER CHECKOUT');
  console.log('='.repeat(50));
  
  const customer = CONFIG.registeredCustomer;
  console.log(`📧 Registered email: ${customer.email}`);
  
  // First, register the user
  console.log('📝 Step 1: Registering new user...');
  await page.goto(`${CONFIG.baseUrl}/register?lang=sl`, { waitUntil: 'networkidle2' });
  await wait(3000);
  
  // Fill registration form
  const regFormData = [
    { selector: 'input[type="email"]', value: customer.email },
    { selector: 'input[name*="name"]', value: customer.name },
    { selector: 'input[type="password"]', value: customer.password },
    { selector: 'input[name*="phone"]', value: customer.phone }
  ];
  
  let registrationFilled = 0;
  for (const field of regFormData) {
    try {
      const element = await page.$(field.selector);
      if (element) {
        await element.type(field.value);
        console.log(`✅ Registration field filled: ${field.selector}`);
        registrationFilled++;
        await wait(500);
      }
    } catch (e) {
      console.log(`⚠️ Could not fill registration field: ${field.selector}`);
    }
  }
  
  if (registrationFilled >= 3) {
    // Submit registration
    const regSubmitButtons = await page.$$('button[type="submit"], input[type="submit"]');
    for (const btn of regSubmitButtons) {
      try {
        await btn.click();
        console.log('✅ Registration submitted');
        await wait(5000);
        break;
      } catch (e) { continue; }
    }
  } else {
    console.log('⚠️ Registration form incomplete, proceeding with login...');
  }
  
  // Login (in case registration didn't work or user already exists)
  console.log('🔑 Step 2: Logging in...');
  await page.goto(`${CONFIG.baseUrl}/login?lang=sl`, { waitUntil: 'networkidle2' });
  await wait(3000);
  
  try {
    const emailField = await page.$('input[type="email"]');
    const passwordField = await page.$('input[type="password"]');
    
    if (emailField && passwordField) {
      await emailField.type(customer.email);
      await passwordField.type(customer.password);
      
      const loginButtons = await page.$$('button[type="submit"]');
      if (loginButtons.length > 0) {
        await loginButtons[0].click();
        console.log('✅ Login attempted');
        await wait(5000);
      }
    }
  } catch (e) {
    console.log('⚠️ Login form not found or failed');
  }
  
  // Add product to cart
  console.log('📦 Step 3: Adding product as registered user...');
  const product = await addProductToCart(page);
  
  // Go to checkout
  await page.goto(`${CONFIG.baseUrl}/checkout?lang=sl`, { waitUntil: 'networkidle2' });
  await wait(5000);
  
  // For registered users, might go directly to checkout form
  console.log('💳 Step 4: Proceeding with registered user checkout...');
  
  // Fill any additional checkout fields
  const checkoutFormData = [
    { selector: '#address', value: customer.address },
    { selector: '#city', value: customer.city },
    { selector: '#postalCode', value: customer.postalCode }
  ];
  
  for (const field of checkoutFormData) {
    try {
      const element = await page.$(field.selector);
      if (element) {
        await element.click({ clickCount: 3 }); // Clear existing
        await element.type(field.value);
        console.log(`✅ Filled ${field.selector}: ${field.value}`);
        await wait(500);
      }
    } catch (e) {
      console.log(`⚠️ Could not fill ${field.selector}`);
    }
  }
  
  // Select payment method
  const paymentOptions = await page.$$('input[type="radio"][name="paymentMethod"]');
  if (paymentOptions.length > 0) {
    await paymentOptions[0].click();
    console.log('✅ Payment method selected');
    await wait(1000);
  }
  
  // Submit order
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
  const finalContent = await page.evaluate(() => document.body.textContent.toLowerCase());
  
  const success = finalUrl.includes('order-success') || finalContent.includes('uspešno');
  const orderMatch = finalContent.match(/(\d{4,})/);
  const orderNumber = orderMatch ? orderMatch[1] : 'Unknown';
  
  console.log(`${success ? '✅' : '❌'} Registered user checkout result:`);
  console.log(`   URL: ${finalUrl}`);
  console.log(`   Order number: ${orderNumber}`);
  console.log(`   Email: ${customer.email} (check for confirmation)`);
  
  return {
    success,
    orderNumber,
    email: customer.email,
    type: 'registered'
  };
}

async function runGuestVsRegisteredTest() {
  console.log('🚀 GUEST VS REGISTERED USER CHECKOUT TEST\n');
  console.log('Testing both flows to identify email confirmation differences\n');
  console.log('='.repeat(80));

  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 400,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const results = [];

  try {
    // Test 1: Guest checkout
    const page1 = await browser.newPage();
    await page1.setViewport({ width: 1280, height: 720 });

    const guestResult = await testGuestCheckout(page1);
    results.push(guestResult);

    await page1.close();
    await wait(3000);

    // Test 2: Registered user checkout
    const page2 = await browser.newPage();
    await page2.setViewport({ width: 1280, height: 720 });

    const registeredResult = await testRegisteredUserCheckout(page2);
    results.push(registeredResult);

    await page2.close();

  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  } finally {
    await browser.close();
  }

  // Generate comparison report
  console.log('\n' + '='.repeat(80));
  console.log('📊 GUEST VS REGISTERED CHECKOUT COMPARISON');
  console.log('='.repeat(80));

  results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.type.toUpperCase()} CHECKOUT:`);
    console.log(`   Success: ${result.success ? '✅ YES' : '❌ NO'}`);
    console.log(`   Order Number: ${result.orderNumber}`);
    console.log(`   Email: ${result.email}`);
  });

  console.log('\n📧 EMAIL VERIFICATION REQUIRED:');
  console.log('Check these inboxes for order confirmation emails:');
  results.forEach((result, index) => {
    console.log(`   ${index + 1}. ${result.email} (${result.type} checkout)`);
  });

  console.log('\n🎯 EXPECTED RESULTS:');
  console.log('   - Guest checkout: Order created but NO email (current bug)');
  console.log('   - Registered checkout: Order created AND email sent (working)');

  console.log('\n🔧 IF BOTH WORK:');
  console.log('   - Guest email system was fixed');
  console.log('   - Both checkout flows are functional');

  console.log('\n🔧 IF ONLY REGISTERED WORKS:');
  console.log('   - Confirms guest checkout email bug');
  console.log('   - Need to fix guest email confirmation system');

  console.log('\n✅ Test complete! Check email inboxes to confirm results.');
}

runGuestVsRegisteredTest().catch(console.error);
