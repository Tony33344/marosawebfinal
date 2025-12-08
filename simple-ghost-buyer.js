/**
 * Simple, Fast Ghost Buyer - No timeouts, focused testing
 */

import puppeteer from 'puppeteer';

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testRealShoppingFlow() {
  console.log('🚀 Testing REAL Shopping Flow...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 300,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  
  try {
    console.log('📍 Step 1: Loading homepage...');
    await page.goto('https://marosatest.netlify.app?lang=sl', { waitUntil: 'domcontentloaded' });
    await wait(3000);
    
    console.log('🍪 Step 2: Handle cookie consent...');
    const cookieButtons = await page.$$('button');
    for (const btn of cookieButtons) {
      try {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && text.toLowerCase().includes('sprejmi')) {
          console.log('✅ Clicking cookie consent');
          await btn.click();
          await wait(2000);
          break;
        }
      } catch (e) { /* continue */ }
    }
    
    console.log('📧 Step 3: Handle newsletter popup...');
    try {
      const emailInput = await page.$('#popup-email');
      const nameInput = await page.$('#popup-first-name');
      
      if (emailInput && nameInput) {
        console.log('✅ Found newsletter fields');
        await nameInput.type('Test User', { delay: 100 });
        await emailInput.type('test400@noexpire.top', { delay: 100 });
        
        // Find submit button
        const submitButtons = await page.$$('button');
        for (const btn of submitButtons) {
          try {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text && text.includes('10%')) {
              console.log('✅ Submitting newsletter');
              await btn.click();
              await wait(3000);
              break;
            }
          } catch (e) { /* continue */ }
        }
      }
    } catch (e) {
      console.log('⚠️ Newsletter popup not found or already handled');
    }
    
    console.log('🔍 Step 4: Find products...');
    const productLinks = await page.$$('a[href*="/izdelek/"]');
    console.log(`📦 Found ${productLinks.length} product links`);
    
    if (productLinks.length > 0) {
      console.log('🎯 Step 5: Navigate to product...');
      const firstProductHref = await page.evaluate(el => el.href, productLinks[0]);
      console.log(`Going to: ${firstProductHref}`);
      
      await page.goto(firstProductHref, { waitUntil: 'domcontentloaded' });
      await wait(3000);
      
      console.log('📦 Step 6: Analyze product page...');
      const productTitle = await page.$eval('h1', el => el.textContent).catch(() => 'Unknown');
      console.log(`Product: ${productTitle}`);
      
      console.log('🔢 Step 7: Set quantity...');
      const quantityInputs = await page.$$('input[type="number"]');
      console.log(`Found ${quantityInputs.length} quantity inputs`);
      
      if (quantityInputs.length > 0) {
        const firstQuantityInput = quantityInputs[0];
        await firstQuantityInput.click({ clickCount: 3 });
        await firstQuantityInput.type('2');
        console.log('✅ Set quantity to 2');
        await wait(1000);
      }
      
      console.log('🛒 Step 8: Add to cart...');
      const allButtons = await page.$$('button');
      let cartButtonFound = false;
      
      for (const btn of allButtons) {
        try {
          const text = await page.evaluate(el => el.textContent, btn);
          if (text && text.includes('Dodaj v košarico')) {
            console.log('✅ Found "Dodaj v košarico" button');
            await btn.click();
            console.log('✅ Clicked add to cart');
            cartButtonFound = true;
            await wait(3000);
            break;
          }
        } catch (e) { /* continue */ }
      }
      
      if (!cartButtonFound) {
        console.log('❌ Add to cart button not found');
      }
      
      console.log('🔍 Step 9: Check cart...');
      await page.goto('https://marosatest.netlify.app/checkout?lang=sl', { waitUntil: 'domcontentloaded' });
      await wait(3000);
      
      const pageText = await page.evaluate(() => document.body.textContent);
      const cartEmpty = pageText.includes('košarica je prazna');
      
      if (cartEmpty) {
        console.log('❌ Cart is still empty');
      } else {
        console.log('✅ Cart has items!');
      }
      
      console.log('\n🎯 SHOPPING FLOW TEST COMPLETE');
      console.log(`Product found: ✅`);
      console.log(`Quantity set: ${quantityInputs.length > 0 ? '✅' : '❌'}`);
      console.log(`Add to cart clicked: ${cartButtonFound ? '✅' : '❌'}`);
      console.log(`Cart has items: ${!cartEmpty ? '✅' : '❌'}`);
      
    } else {
      console.log('❌ No products found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    console.log('\n✅ Test complete. Browser will stay open for inspection.');
    console.log('Press Ctrl+C to close.');
    
    // Keep browser open for inspection
    await new Promise(resolve => {
      process.on('SIGINT', () => {
        browser.close();
        resolve();
      });
    });
  }
}

testRealShoppingFlow().catch(console.error);
