/**
 * HUMAN-LIKE CHECKOUT TEST
 * 
 * This test mimics human behavior more closely:
 * - Slower interactions
 * - Proper form validation triggers
 * - Careful field filling with events
 * - Proper payment method selection
 * - Waiting for all validations
 */

import puppeteer from 'puppeteer';

const CONFIG = {
  baseUrl: 'https://marosatest.netlify.app',
  testEmail: 'human.like.001@noexpire.top'
};

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function humanLikeType(page, selector, text) {
  const element = await page.$(selector);
  if (element) {
    // Click to focus
    await element.click();
    await wait(200);
    
    // Clear existing content
    await element.click({ clickCount: 3 });
    await wait(100);
    
    // Type slowly like a human
    await element.type(text, { delay: 50 });
    await wait(200);
    
    // Trigger blur event for validation
    await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (el) {
        el.dispatchEvent(new Event('blur', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, selector);
    
    await wait(300);
    console.log(`✅ Filled ${selector}: ${text}`);
    return true;
  }
  return false;
}

async function runHumanLikeCheckout() {
  console.log('🚀 HUMAN-LIKE CHECKOUT TEST');
  console.log('Mimicking exact human behavior to trigger email confirmation\n');
  console.log(`📧 Test email: ${CONFIG.testEmail}\n`);
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 500, // Slower interactions
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  
  try {
    // Step 1: Navigate and handle popups carefully
    console.log('🏠 Step 1: Loading homepage...');
    await page.goto(`${CONFIG.baseUrl}?lang=sl`, { waitUntil: 'networkidle2' });
    await wait(4000); // Wait for all scripts to load
    
    // Handle cookie consent
    console.log('🍪 Handling cookie consent...');
    const cookieButtons = await page.$$('button');
    for (const btn of cookieButtons) {
      try {
        const text = await page.evaluate(el => el.textContent.toLowerCase(), btn);
        if (text.includes('sprejmi') && text.includes('vse')) {
          await btn.click();
          console.log('✅ Cookie consent accepted');
          await wait(3000);
          break;
        }
      } catch (e) { continue; }
    }
    
    // Handle newsletter popup
    console.log('📧 Handling newsletter popup...');
    try {
      const closeButtons = await page.$$('button');
      for (const btn of closeButtons) {
        const text = await page.evaluate(el => el.textContent.toLowerCase(), btn);
        if (text.includes('ne, hvala')) {
          await btn.click();
          console.log('✅ Newsletter popup closed');
          await wait(2000);
          break;
        }
      }
    } catch (e) { /* ignore */ }
    
    // Step 2: Navigate to product and add to cart
    console.log('\n📦 Step 2: Adding product to cart...');
    await page.goto(`${CONFIG.baseUrl}/izdelek/11?lang=sl`, { waitUntil: 'networkidle2' });
    await wait(4000);
    
    const productTitle = await page.$eval('h1', el => el.textContent).catch(() => 'Unknown');
    console.log(`   Product: ${productTitle}`);
    
    // Set quantity with proper events
    console.log('🔢 Setting quantity...');
    const quantityInputs = await page.$$('input[type="number"]');
    if (quantityInputs.length > 0) {
      const input = quantityInputs[0];
      await input.click({ clickCount: 3 });
      await wait(200);
      await input.type('1', { delay: 100 });
      await wait(500);
      
      // Trigger change event
      await page.evaluate(() => {
        const inputs = document.querySelectorAll('input[type="number"]');
        if (inputs.length > 0) {
          inputs[0].dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
      await wait(1000);
      console.log('✅ Quantity set to 1');
    }
    
    // Add to cart with careful clicking
    console.log('🛒 Adding to cart...');
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      try {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && text.includes('Dodaj v košarico')) {
          // Scroll into view
          await page.evaluate(button => {
            button.scrollIntoView({ block: 'center' });
          }, btn);
          await wait(500);
          
          await btn.click();
          console.log('✅ Add to cart clicked');
          await wait(6000); // Wait for cart update
          break;
        }
      } catch (e) { continue; }
    }
    
    // Step 3: Go to checkout
    console.log('\n💳 Step 3: Proceeding to checkout...');
    await page.goto(`${CONFIG.baseUrl}/checkout?lang=sl`, { waitUntil: 'networkidle2' });
    await wait(5000);
    
    // Select guest checkout
    console.log('🎯 Selecting guest checkout...');
    const allButtons = await page.$$('button, a, [role="button"]');
    for (const btn of allButtons) {
      try {
        const text = await page.evaluate(el => el.textContent.toLowerCase(), btn);
        if (text.includes('nadaljuj kot gost')) {
          await btn.click();
          console.log('✅ Guest checkout selected');
          await wait(5000); // Wait for form to load
          break;
        }
      } catch (e) { continue; }
    }
    
    // Step 4: Fill form with human-like behavior
    console.log('\n📝 Step 4: Filling checkout form carefully...');
    
    // Fill each field with proper validation
    await humanLikeType(page, '#email', CONFIG.testEmail);
    await humanLikeType(page, '#name', 'Human Like Buyer');
    await humanLikeType(page, '#phone', '+386 41 333 333');
    await humanLikeType(page, '#address', 'Human Street 789');
    await humanLikeType(page, '#city', 'Ljubljana');
    await humanLikeType(page, '#postalCode', '1000');
    
    // Select country if needed
    try {
      const countrySelect = await page.$('#country');
      if (countrySelect) {
        await countrySelect.click();
        await wait(500);
        await countrySelect.selectOption('SI'); // Slovenia
        console.log('✅ Country selected: Slovenia');
        await wait(1000);
      }
    } catch (e) {
      console.log('⚠️ Country selection not available');
    }
    
    // Fill notes if available
    try {
      const notesField = await page.$('#notes');
      if (notesField) {
        await notesField.click();
        await notesField.type('Test order from automated test');
        console.log('✅ Notes filled');
        await wait(500);
      }
    } catch (e) { /* ignore */ }
    
    // Step 5: Select payment method carefully
    console.log('\n💰 Step 5: Selecting payment method...');
    
    const paymentMethods = await page.$$('input[type="radio"][name="paymentMethod"]');
    if (paymentMethods.length > 0) {
      console.log(`   Found ${paymentMethods.length} payment methods`);
      
      // Select first payment method (usually cash on delivery)
      const firstMethod = paymentMethods[0];
      await firstMethod.click();
      await wait(1000);
      
      // Get the selected method name
      const methodId = await page.evaluate(el => el.id, firstMethod);
      console.log(`✅ Payment method selected: ${methodId}`);
      
      // Trigger change event
      await page.evaluate(() => {
        const radios = document.querySelectorAll('input[type="radio"][name="paymentMethod"]');
        radios.forEach(radio => {
          if (radio.checked) {
            radio.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
      });
      await wait(1000);
    }
    
    // Step 6: Final validation check
    console.log('\n🔍 Step 6: Final validation check...');
    
    // Check if all required fields are filled
    const formValidation = await page.evaluate(() => {
      const requiredFields = document.querySelectorAll('input[required], select[required]');
      const validation = {
        totalRequired: requiredFields.length,
        filled: 0,
        empty: []
      };
      
      requiredFields.forEach(field => {
        if (field.value && field.value.trim() !== '') {
          validation.filled++;
        } else {
          validation.empty.push(field.name || field.id || field.type);
        }
      });
      
      return validation;
    });
    
    console.log(`   Required fields: ${formValidation.filled}/${formValidation.totalRequired} filled`);
    if (formValidation.empty.length > 0) {
      console.log(`   Empty required fields: ${formValidation.empty.join(', ')}`);
    }
    
    // Step 7: Submit order
    console.log('\n🚀 Step 7: Submitting order...');
    
    const submitButtons = await page.$$('button');
    let orderSubmitted = false;
    
    for (const btn of submitButtons) {
      try {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && text.includes('Oddaj naročilo')) {
          console.log(`   🎯 Submitting with button: "${text}"`);
          
          // Scroll into view
          await page.evaluate(button => {
            button.scrollIntoView({ block: 'center' });
          }, btn);
          await wait(500);
          
          await btn.click();
          orderSubmitted = true;
          console.log('✅ Order submitted');
          await wait(10000); // Wait longer for processing
          break;
        }
      } catch (e) { continue; }
    }
    
    if (!orderSubmitted) {
      console.log('❌ Could not find submit button');
      return;
    }
    
    // Step 8: Verify success and check for email triggers
    console.log('\n🎉 Step 8: Verifying order success...');
    
    const finalUrl = page.url();
    const finalContent = await page.evaluate(() => document.body.textContent.toLowerCase());
    
    console.log(`   Final URL: ${finalUrl}`);
    
    const success = finalUrl.includes('order-success');
    const orderMatch = finalContent.match(/(\d{4,})/);
    const orderNumber = orderMatch ? orderMatch[1] : 'Unknown';
    
    if (success) {
      console.log('🎉 SUCCESS! Order completed successfully!');
      console.log(`   📋 Order number: ${orderNumber}`);
      console.log(`   📧 Email: ${CONFIG.testEmail}`);
      
      // Check for any JavaScript errors that might prevent email sending
      const jsErrors = await page.evaluate(() => {
        return window.jsErrors || [];
      });
      
      if (jsErrors.length > 0) {
        console.log('⚠️ JavaScript errors detected:');
        jsErrors.forEach(error => console.log(`   - ${error}`));
      } else {
        console.log('✅ No JavaScript errors detected');
      }
      
      console.log('\n📧 EMAIL VERIFICATION:');
      console.log(`   Check ${CONFIG.testEmail} for order confirmation`);
      console.log('   If no email arrives, there may be a timing or validation issue');
      
    } else {
      console.log('❌ Order submission failed');
      console.log(`   Current page content: ${finalContent.substring(0, 200)}...`);
    }
    
  } catch (error) {
    console.error('❌ Error during human-like checkout:', error.message);
  } finally {
    console.log('\n⏰ Keeping browser open for manual inspection...');
    setTimeout(async () => {
      await browser.close();
      console.log('Browser closed.');
    }, 60000);
  }
}

runHumanLikeCheckout().catch(console.error);
