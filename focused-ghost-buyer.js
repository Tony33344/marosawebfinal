/**
 * Focused Ghost Buyer - Test core shopping functionality
 */

import puppeteer from 'puppeteer';

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testCoreShoppingFlow() {
  console.log('🚀 Testing CORE Shopping Flow...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 200,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  
  try {
    // Skip popups and go directly to a product
    console.log('🎯 Step 1: Go directly to product page...');
    await page.goto('https://marosatest.netlify.app/izdelek/11?lang=sl', { waitUntil: 'domcontentloaded' });
    await wait(2000);
    
    // Close any popups quickly
    console.log('❌ Step 2: Close popups...');
    try {
      const closeButtons = await page.$$('button');
      for (const btn of closeButtons) {
        const text = await page.evaluate(el => el.textContent, btn).catch(() => '');
        if (text.includes('Ne, hvala') || text.includes('×') || text === '') {
          try {
            await btn.click();
            await wait(500);
          } catch (e) { /* ignore */ }
        }
      }
    } catch (e) { /* ignore */ }
    
    console.log('📦 Step 3: Analyze product page...');
    const productTitle = await page.$eval('h1', el => el.textContent).catch(() => 'Unknown Product');
    console.log(`✅ Product: ${productTitle}`);
    
    console.log('🔢 Step 4: Find and set quantity...');
    const quantityInputs = await page.$$('input[type="number"]');
    console.log(`Found ${quantityInputs.length} quantity inputs`);
    
    let quantitySet = false;
    if (quantityInputs.length > 0) {
      try {
        const input = quantityInputs[0];
        await input.click({ clickCount: 3 });
        await input.type('2');
        console.log('✅ Set quantity to 2');
        quantitySet = true;
        await wait(1000);
      } catch (e) {
        console.log('⚠️ Could not set quantity:', e.message);
      }
    }
    
    console.log('🛒 Step 5: Find add to cart button...');
    const buttons = await page.$$('button');
    console.log(`Found ${buttons.length} buttons total`);
    
    let addToCartButton = null;
    for (let i = 0; i < buttons.length; i++) {
      try {
        const text = await page.evaluate(el => el.textContent, buttons[i]);
        console.log(`Button ${i + 1}: "${text}"`);
        
        if (text && text.includes('Dodaj v košarico')) {
          console.log(`✅ Found add to cart button at index ${i + 1}`);
          addToCartButton = buttons[i];
          break;
        }
      } catch (e) {
        console.log(`Button ${i + 1}: Error reading text`);
      }
    }
    
    console.log('🛒 Step 6: Click add to cart...');
    let cartClicked = false;
    if (addToCartButton) {
      try {
        await addToCartButton.click();
        console.log('✅ Clicked add to cart button');
        cartClicked = true;
        await wait(3000);
      } catch (e) {
        console.log('❌ Error clicking add to cart:', e.message);
      }
    } else {
      console.log('❌ Add to cart button not found');
    }
    
    console.log('🔍 Step 7: Check cart status...');
    await page.goto('https://marosatest.netlify.app/checkout?lang=sl', { waitUntil: 'domcontentloaded' });
    await wait(2000);
    
    const pageText = await page.evaluate(() => document.body.textContent);
    const cartEmpty = pageText.includes('košarica je prazna') || pageText.includes('cart is empty');
    const cartHasItems = !cartEmpty;
    
    console.log('\n📊 SHOPPING FLOW RESULTS:');
    console.log('='.repeat(40));
    console.log(`Product loaded: ✅ ${productTitle}`);
    console.log(`Quantity inputs found: ${quantityInputs.length > 0 ? '✅' : '❌'} (${quantityInputs.length})`);
    console.log(`Quantity set: ${quantitySet ? '✅' : '❌'}`);
    console.log(`Add to cart button found: ${addToCartButton ? '✅' : '❌'}`);
    console.log(`Add to cart clicked: ${cartClicked ? '✅' : '❌'}`);
    console.log(`Cart has items: ${cartHasItems ? '✅' : '❌'}`);
    
    if (cartHasItems) {
      console.log('\n🎉 SUCCESS: Shopping flow is working!');
    } else {
      console.log('\n⚠️ ISSUE: Cart is still empty after adding items');
      console.log('This suggests the add to cart functionality needs debugging');
    }
    
    // Test newsletter separately
    console.log('\n📧 Testing newsletter signup...');
    await page.goto('https://marosatest.netlify.app?lang=sl', { waitUntil: 'domcontentloaded' });
    await wait(3000);
    
    const emailInput = await page.$('#popup-email');
    const nameInput = await page.$('#popup-first-name');
    
    if (emailInput && nameInput) {
      console.log('✅ Newsletter popup found');
      try {
        await nameInput.type('Test User');
        await emailInput.type('test500@noexpire.top');
        
        const submitBtn = await page.$('button:has-text("Pridobi 10% popust")').catch(() => null);
        if (submitBtn) {
          await submitBtn.click();
          console.log('✅ Newsletter submitted');
        } else {
          console.log('⚠️ Newsletter submit button not found');
        }
      } catch (e) {
        console.log('⚠️ Newsletter signup error:', e.message);
      }
    } else {
      console.log('⚠️ Newsletter popup not found');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    console.log('\n✅ Test complete. Check results above.');
    console.log('Browser will close in 10 seconds...');
    
    setTimeout(async () => {
      await browser.close();
      console.log('Browser closed.');
    }, 10000);
  }
}

testCoreShoppingFlow().catch(console.error);
