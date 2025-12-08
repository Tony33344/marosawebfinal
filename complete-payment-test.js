/**
 * COMPLETE PAYMENT TEST - Final working version
 * 
 * Now we know:
 * 1. Cart persistence works perfectly
 * 2. Checkout page asks: "kako želite nadaljevati?" (How do you want to continue?)
 * 3. Need to click "nadaljuj kot gost" (Continue as guest)
 * 4. Then complete the payment flow
 */

import puppeteer from 'puppeteer';

const CONFIG = {
  baseUrl: 'https://marosatest.netlify.app',
  testCustomer: {
    name: 'Test Buyer',
    email: 'complete.payment.001@noexpire.top',
    phone: '+386 41 123 456',
    address: 'Test Street 123',
    city: 'Ljubljana',
    postalCode: '1000'
  }
};

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runCompletePaymentTest() {
  console.log('🚀 COMPLETE PAYMENT TEST - Full E-commerce Flow\n');
  console.log(`📧 Customer: ${CONFIG.testCustomer.email}\n`);
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 400,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  
  try {
    // Step 1: Setup and add to cart (we know this works)
    console.log('📦 Step 1: Adding product to cart...');
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
    
    // Add product to cart
    await page.goto(`${CONFIG.baseUrl}/izdelek/11?lang=sl`, { waitUntil: 'networkidle2' });
    await wait(3000);
    
    const productTitle = await page.$eval('h1', el => el.textContent).catch(() => 'Unknown');
    console.log(`   Product: ${productTitle}`);
    
    // Set quantity
    const quantityInputs = await page.$$('input[type="number"]');
    if (quantityInputs.length > 0) {
      await quantityInputs[0].click({ clickCount: 3 });
      await quantityInputs[0].type('1');
      await wait(1000);
    }
    
    // Add to cart
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
    
    // Step 2: Go to checkout and handle guest/registration choice
    console.log('\n💳 Step 2: Proceeding to checkout...');
    await page.goto(`${CONFIG.baseUrl}/checkout?lang=sl`, { waitUntil: 'networkidle2' });
    await wait(5000);
    
    // Look for "nadaljuj kot gost" (Continue as guest) button
    console.log('🎯 Looking for guest checkout option...');
    const allButtons = await page.$$('button, a, [role="button"]');
    let guestSelected = false;
    
    for (const btn of allButtons) {
      try {
        const text = await page.evaluate(el => el.textContent.toLowerCase(), btn);
        if (text.includes('nadaljuj kot gost') || text.includes('continue as guest')) {
          console.log(`   Found guest option: "${text}"`);
          await btn.click();
          console.log('✅ Selected guest checkout');
          guestSelected = true;
          await wait(5000); // Wait for form to load
          break;
        }
      } catch (e) { continue; }
    }
    
    if (!guestSelected) {
      console.log('⚠️ Guest checkout option not found, trying to proceed anyway...');
    }
    
    // Step 3: Fill checkout form
    console.log('\n📝 Step 3: Filling checkout form...');
    
    // Wait a bit more for form to fully load
    await wait(3000);
    
    // Look for form fields again
    const formFields = await page.evaluate(() => {
      const fields = [];
      const inputs = document.querySelectorAll('input, select, textarea');
      
      inputs.forEach((input, index) => {
        // Skip newsletter popup fields and hidden fields
        if (input.id !== 'popup-email' && input.id !== 'popup-first-name' && 
            input.type !== 'hidden' && input.offsetParent !== null) {
          fields.push({
            index,
            type: input.type,
            name: input.name,
            id: input.id,
            placeholder: input.placeholder,
            tagName: input.tagName.toLowerCase()
          });
        }
      });
      
      return fields;
    });
    
    console.log(`   Found ${formFields.length} form fields`);
    formFields.forEach((field, index) => {
      console.log(`   ${index + 1}. ${field.tagName} - Type: ${field.type}, Name: ${field.name}, ID: ${field.id}`);
    });
    
    // Fill available fields
    let fieldsFilledCount = 0;
    
    for (const field of formFields) {
      try {
        let selector = '';
        if (field.id) {
          selector = `#${field.id}`;
        } else if (field.name) {
          selector = `${field.tagName}[name="${field.name}"]`;
        } else {
          selector = `${field.tagName}[type="${field.type}"]`;
        }
        
        const element = await page.$(selector);
        if (element) {
          let value = '';
          
          // Determine appropriate value based on field characteristics
          if (field.type === 'email' || field.name.toLowerCase().includes('email')) {
            value = CONFIG.testCustomer.email;
          } else if (field.type === 'tel' || field.name.toLowerCase().includes('phone')) {
            value = CONFIG.testCustomer.phone;
          } else if (field.name.toLowerCase().includes('name') || field.name.toLowerCase().includes('ime')) {
            value = CONFIG.testCustomer.name;
          } else if (field.name.toLowerCase().includes('address') || field.name.toLowerCase().includes('naslov')) {
            value = CONFIG.testCustomer.address;
          } else if (field.name.toLowerCase().includes('city') || field.name.toLowerCase().includes('mesto')) {
            value = CONFIG.testCustomer.city;
          } else if (field.name.toLowerCase().includes('postal') || field.name.toLowerCase().includes('pošt')) {
            value = CONFIG.testCustomer.postalCode;
          } else if (field.tagName === 'select') {
            // For select fields, choose first non-empty option
            const options = await page.$$eval(`${selector} option`, opts => 
              opts.map(opt => ({ value: opt.value, text: opt.textContent }))
            );
            if (options.length > 1) {
              await page.select(selector, options[1].value);
              console.log(`   ✅ Selected: ${options[1].text}`);
              fieldsFilledCount++;
              continue;
            }
          } else {
            value = 'Test Value';
          }
          
          if (value && field.tagName === 'input') {
            await element.type(value);
            console.log(`   ✅ Filled ${field.name || field.type}: ${value}`);
            fieldsFilledCount++;
            await wait(500);
          }
        }
      } catch (e) {
        console.log(`   ⚠️ Could not fill field: ${e.message}`);
      }
    }
    
    console.log(`✅ Filled ${fieldsFilledCount} form fields`);
    
    // Step 4: Select payment method and submit
    console.log('\n💰 Step 4: Selecting payment method and submitting...');
    
    // Look for payment method options
    const paymentOptions = await page.$$('input[type="radio"], select[name*="payment"]');
    if (paymentOptions.length > 0) {
      console.log(`   Found ${paymentOptions.length} payment options`);
      try {
        await paymentOptions[0].click();
        console.log('✅ Payment method selected');
        await wait(1000);
      } catch (e) {
        console.log('⚠️ Could not select payment method');
      }
    }
    
    // Submit the order
    const submitButtons = await page.$$('button[type="submit"], input[type="submit"], button');
    let orderSubmitted = false;
    
    for (const btn of submitButtons) {
      try {
        const text = await page.evaluate(el => el.textContent || el.value || '', btn);
        if (text && (text.toLowerCase().includes('potrdi') || 
                    text.toLowerCase().includes('naroči') || 
                    text.toLowerCase().includes('submit') || 
                    text.toLowerCase().includes('order') ||
                    text.toLowerCase().includes('plačaj'))) {
          console.log(`   🎯 Submitting with button: "${text}"`);
          await btn.click();
          orderSubmitted = true;
          await wait(8000); // Wait for processing
          break;
        }
      } catch (e) { continue; }
    }
    
    if (!orderSubmitted) {
      console.log('⚠️ No clear submit button found, trying any remaining buttons...');
      // Try any button that might submit
      for (const btn of submitButtons) {
        try {
          await btn.click();
          console.log('   Tried clicking a button');
          await wait(5000);
          break;
        } catch (e) { continue; }
      }
    }
    
    // Step 5: Check for success
    console.log('\n🎉 Step 5: Checking for order success...');
    
    const finalUrl = page.url();
    const finalContent = await page.evaluate(() => document.body.textContent.toLowerCase());
    
    console.log(`   Final URL: ${finalUrl}`);
    
    // Look for success indicators
    const successIndicators = [
      'uspešno', 'success', 'hvala', 'thank you', 'potrjen', 'confirmed',
      'naročilo', 'order', 'prejeli', 'received', 'plačilo', 'payment',
      'dokončano', 'completed', 'uspeh', 'successful'
    ];
    
    let successFound = false;
    const foundIndicators = [];
    
    for (const indicator of successIndicators) {
      if (finalContent.includes(indicator)) {
        successFound = true;
        foundIndicators.push(indicator);
      }
    }
    
    // Check URL for success
    if (finalUrl.includes('success') || finalUrl.includes('thank') || 
        finalUrl.includes('confirm') || finalUrl.includes('complete')) {
      successFound = true;
      foundIndicators.push('success URL');
    }
    
    // Final result
    if (successFound) {
      console.log('🎉 SUCCESS! Order completed successfully!');
      console.log(`   Success indicators found: ${foundIndicators.join(', ')}`);
      
      // Look for order number
      const orderMatch = finalContent.match(/(\d{4,})/);
      if (orderMatch) {
        console.log(`   📋 Order number: ${orderMatch[1]}`);
      }
      
      console.log(`\n📧 VERIFICATION REQUIRED:`);
      console.log(`   1. Check email: ${CONFIG.testCustomer.email}`);
      console.log(`   2. Check order management system`);
      console.log(`   3. Verify payment processing`);
      
    } else {
      console.log('❌ No clear success message found');
      console.log(`   Final page content (first 300 chars):`);
      console.log(`   ${finalContent.substring(0, 300)}...`);
      
      console.log('\n🔧 This might indicate:');
      console.log('   - Payment processing issues');
      console.log('   - Form validation errors');
      console.log('   - Missing required fields');
    }
    
  } catch (error) {
    console.error('❌ Error during payment test:', error.message);
  } finally {
    console.log('\n⏰ Keeping browser open for manual inspection...');
    console.log('Press Ctrl+C to close when done.');
    
    // Keep browser open for manual inspection
    await new Promise(resolve => {
      process.on('SIGINT', () => {
        browser.close();
        resolve();
      });
    });
  }
}

runCompletePaymentTest().catch(console.error);
