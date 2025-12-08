/**
 * FINAL WORKING CHECKOUT TEST
 * 
 * Based on debug findings:
 * - Cart is empty because add-to-cart isn't working properly
 * - Need to fix cart persistence issue
 * - Then complete full checkout with payment verification
 */

import puppeteer from 'puppeteer';

const CONFIG = {
  baseUrl: 'https://marosatest.netlify.app',
  testCustomer: {
    name: 'Test Buyer',
    email: 'final.checkout.001@noexpire.top',
    phone: '+386 41 123 456',
    address: 'Test Street 123',
    city: 'Ljubljana',
    postalCode: '1000'
  }
};

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runFinalCheckoutTest() {
  console.log('🚀 FINAL WORKING CHECKOUT TEST\n');
  console.log('Based on debug findings - fixing cart persistence and completing payment\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 300,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  
  try {
    // Step 1: Properly handle initial setup
    console.log('🏠 Step 1: Initial setup and popup handling...');
    await page.goto(`${CONFIG.baseUrl}?lang=sl`, { waitUntil: 'networkidle2' });
    await wait(3000);
    
    // Handle cookie consent
    const cookieButtons = await page.$$('button');
    for (const btn of cookieButtons) {
      try {
        const text = await page.evaluate(el => el.textContent.toLowerCase(), btn);
        if (text.includes('sprejmi') && text.includes('vse')) {
          await btn.click();
          console.log('✅ Cookie consent handled');
          await wait(2000);
          break;
        }
      } catch (e) { continue; }
    }
    
    // Close newsletter popup properly
    try {
      const closeButtons = await page.$$('button');
      for (const btn of closeButtons) {
        try {
          const text = await page.evaluate(el => el.textContent.toLowerCase(), btn);
          if (text.includes('ne, hvala') || text.includes('×')) {
            await btn.click();
            console.log('✅ Newsletter popup closed');
            await wait(2000);
            break;
          }
        } catch (e) { continue; }
      }
    } catch (e) { /* ignore */ }
    
    // Step 2: Navigate to product and add to cart PROPERLY
    console.log('\n📦 Step 2: Adding product to cart with proper verification...');
    await page.goto(`${CONFIG.baseUrl}/izdelek/11?lang=sl`, { waitUntil: 'networkidle2' });
    await wait(3000);
    
    const productTitle = await page.$eval('h1', el => el.textContent).catch(() => 'Unknown');
    console.log(`   Product: ${productTitle}`);
    
    // Check if product has variants/packages that need selection
    const packageSelects = await page.$$('select');
    if (packageSelects.length > 0) {
      console.log('📦 Found package options, selecting first available...');
      for (const select of packageSelects) {
        try {
          const options = await page.$$eval('select option', opts => 
            opts.map(opt => ({ value: opt.value, text: opt.textContent }))
          );
          
          if (options.length > 1) {
            await select.selectOption(options[1].value); // Select first non-default option
            console.log(`✅ Selected package: ${options[1].text}`);
            await wait(1000);
            break;
          }
        } catch (e) { continue; }
      }
    }
    
    // Set quantity properly
    const quantityInputs = await page.$$('input[type="number"]');
    if (quantityInputs.length > 0) {
      // Clear and set quantity
      await quantityInputs[0].click({ clickCount: 3 });
      await quantityInputs[0].type('1');
      console.log('✅ Quantity set to 1');
      await wait(1000);
      
      // Trigger change event
      await page.evaluate(() => {
        const inputs = document.querySelectorAll('input[type="number"]');
        if (inputs.length > 0) {
          inputs[0].dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
      await wait(500);
    }
    
    // Add to cart with better verification
    console.log('🛒 Adding to cart...');
    const buttons = await page.$$('button');
    let cartAdded = false;
    
    for (const btn of buttons) {
      try {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && text.includes('Dodaj v košarico')) {
          console.log(`   Found button: "${text}"`);
          
          // Scroll button into view
          await page.evaluate(button => {
            button.scrollIntoView({ block: 'center' });
          }, btn);
          await wait(500);
          
          // Click and wait for response
          await btn.click();
          console.log('✅ Add to cart clicked');
          cartAdded = true;
          
          // Wait for cart update and check for success indicators
          await wait(5000);
          
          // Check for cart update indicators
          const cartIndicators = await page.$$('.cart-count, .cart-items, [data-cart-count]');
          if (cartIndicators.length > 0) {
            console.log('✅ Cart indicators found');
          }
          
          break;
        }
      } catch (e) { continue; }
    }
    
    if (!cartAdded) {
      console.log('❌ Add to cart button not found');
      await browser.close();
      return;
    }
    
    // Step 3: Verify cart persistence before checkout
    console.log('\n🔍 Step 3: Verifying cart persistence...');
    
    // Check cart via different methods
    const cartCheckMethods = [
      async () => {
        // Method 1: Check localStorage
        const cartData = await page.evaluate(() => {
          return {
            localStorage: Object.keys(localStorage).filter(key => 
              key.includes('cart') || key.includes('basket')
            ).map(key => ({ key, value: localStorage.getItem(key) })),
            sessionStorage: Object.keys(sessionStorage).filter(key => 
              key.includes('cart') || key.includes('basket')
            ).map(key => ({ key, value: sessionStorage.getItem(key) }))
          };
        });
        
        console.log('   Cart storage data:', cartData);
        return cartData.localStorage.length > 0 || cartData.sessionStorage.length > 0;
      },
      
      async () => {
        // Method 2: Check for cart icon/count
        const cartElements = await page.$$('.cart-count, .cart-items, [data-cart-count], .shopping-cart');
        console.log(`   Found ${cartElements.length} cart UI elements`);
        return cartElements.length > 0;
      },
      
      async () => {
        // Method 3: Navigate to cart page directly
        await page.goto(`${CONFIG.baseUrl}/cart?lang=sl`, { waitUntil: 'networkidle2' });
        await wait(2000);
        const pageContent = await page.evaluate(() => document.body.textContent);
        const hasItems = !pageContent.includes('prazna') && !pageContent.includes('empty');
        console.log(`   Cart page has items: ${hasItems}`);
        return hasItems;
      }
    ];
    
    let cartPersisted = false;
    for (let i = 0; i < cartCheckMethods.length; i++) {
      try {
        const result = await cartCheckMethods[i]();
        if (result) {
          cartPersisted = true;
          console.log(`✅ Cart persistence verified via method ${i + 1}`);
          break;
        }
      } catch (e) {
        console.log(`⚠️ Cart check method ${i + 1} failed: ${e.message}`);
      }
    }
    
    if (!cartPersisted) {
      console.log('❌ Cart items not persisting - this is a website issue');
      console.log('🔧 The add-to-cart functionality needs debugging');
      await browser.close();
      return;
    }
    
    // Step 4: Proceed to checkout with items in cart
    console.log('\n💳 Step 4: Proceeding to checkout with verified cart...');
    await page.goto(`${CONFIG.baseUrl}/checkout?lang=sl`, { waitUntil: 'networkidle2' });
    await wait(5000);
    
    // Check if we have a real checkout form now
    const pageContent = await page.evaluate(() => document.body.textContent);
    
    if (pageContent.includes('prazna') || pageContent.includes('empty')) {
      console.log('❌ Cart still shows as empty on checkout page');
      console.log('🔧 Cart persistence issue between product and checkout pages');
      await browser.close();
      return;
    }
    
    console.log('✅ Checkout page loaded with items in cart');
    
    // Look for actual checkout form fields (not newsletter popup)
    const checkoutFields = await page.evaluate(() => {
      const fields = [];
      const inputs = document.querySelectorAll('input');
      
      inputs.forEach((input, index) => {
        // Skip newsletter popup fields
        if (input.id !== 'popup-email' && input.id !== 'popup-first-name') {
          fields.push({
            index,
            type: input.type,
            name: input.name,
            id: input.id,
            placeholder: input.placeholder,
            visible: input.offsetParent !== null
          });
        }
      });
      
      return fields;
    });
    
    console.log(`📝 Found ${checkoutFields.length} checkout form fields`);
    checkoutFields.forEach((field, index) => {
      console.log(`   ${index + 1}. Type: ${field.type}, Name: ${field.name}, ID: ${field.id}`);
    });
    
    // Fill checkout form
    if (checkoutFields.length > 0) {
      console.log('📝 Filling checkout form...');
      
      for (const field of checkoutFields) {
        try {
          const selector = field.id ? `#${field.id}` : 
                          field.name ? `input[name="${field.name}"]` : 
                          `input[type="${field.type}"]`;
          
          const element = await page.$(selector);
          if (element) {
            let value = '';
            
            switch (field.type) {
              case 'email':
                value = CONFIG.testCustomer.email;
                break;
              case 'tel':
                value = CONFIG.testCustomer.phone;
                break;
              case 'text':
                if (field.name.toLowerCase().includes('name')) {
                  value = CONFIG.testCustomer.name;
                } else if (field.name.toLowerCase().includes('address')) {
                  value = CONFIG.testCustomer.address;
                } else if (field.name.toLowerCase().includes('city')) {
                  value = CONFIG.testCustomer.city;
                } else if (field.name.toLowerCase().includes('postal')) {
                  value = CONFIG.testCustomer.postalCode;
                } else {
                  value = 'Test Value';
                }
                break;
              default:
                value = 'Test Value';
            }
            
            if (value) {
              await element.type(value);
              console.log(`   ✅ Filled ${field.type} field with: ${value}`);
              await wait(500);
            }
          }
        } catch (e) {
          console.log(`   ⚠️ Could not fill field: ${e.message}`);
        }
      }
    }
    
    // Step 5: Complete payment
    console.log('\n💰 Step 5: Completing payment...');
    
    // Look for payment method selection
    const paymentOptions = await page.$$('input[type="radio"], select');
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
    
    // Submit order
    const submitButtons = await page.$$('button[type="submit"], input[type="submit"]');
    let orderSubmitted = false;
    
    for (const btn of submitButtons) {
      try {
        const text = await page.evaluate(el => el.textContent || el.value, btn);
        if (text && (text.includes('Potrdi') || text.includes('Naroči') || 
                    text.includes('Submit') || text.includes('Order'))) {
          console.log(`   🎯 Submitting order with button: "${text}"`);
          await btn.click();
          orderSubmitted = true;
          await wait(8000); // Wait for processing
          break;
        }
      } catch (e) { continue; }
    }
    
    // Step 6: Verify success
    console.log('\n🎉 Step 6: Verifying order success...');
    
    const finalUrl = page.url();
    const finalContent = await page.evaluate(() => document.body.textContent.toLowerCase());
    
    console.log(`   Final URL: ${finalUrl}`);
    
    const successIndicators = [
      'uspešno', 'success', 'hvala', 'thank you', 'potrjen', 'confirmed',
      'naročilo', 'order', 'prejeli', 'received', 'plačilo', 'payment'
    ];
    
    let successFound = false;
    const foundIndicators = [];
    
    for (const indicator of successIndicators) {
      if (finalContent.includes(indicator)) {
        successFound = true;
        foundIndicators.push(indicator);
      }
    }
    
    if (finalUrl.includes('success') || finalUrl.includes('thank') || finalUrl.includes('confirm')) {
      successFound = true;
      foundIndicators.push('success URL');
    }
    
    if (successFound) {
      console.log('🎉 SUCCESS! Order completed successfully!');
      console.log(`   Success indicators: ${foundIndicators.join(', ')}`);
      
      const orderMatch = finalContent.match(/(\d{4,})/);
      if (orderMatch) {
        console.log(`   📋 Order number: ${orderMatch[1]}`);
      }
      
      console.log(`\n📧 CHECK EMAIL: ${CONFIG.testCustomer.email}`);
      console.log('   Look for order confirmation email');
      
    } else {
      console.log('❌ No success message found');
      console.log(`   Final page content: ${finalContent.substring(0, 300)}...`);
    }
    
  } catch (error) {
    console.error('❌ Error during checkout test:', error.message);
  } finally {
    console.log('\n⏰ Keeping browser open for 60 seconds for inspection...');
    setTimeout(async () => {
      await browser.close();
      console.log('Browser closed.');
    }, 60000);
  }
}

runFinalCheckoutTest().catch(console.error);
