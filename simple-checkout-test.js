import puppeteer from 'puppeteer';

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testCheckoutPage() {
  console.log('🚀 SIMPLE CHECKOUT PAGE TEST\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 200,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  
  // Monitor console for infinite re-rendering
  let consoleCount = 0;
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Cart state in MultiStepCheckoutPage')) {
      consoleCount++;
      if (consoleCount <= 5) {
        console.log(`🖥️ Console (${consoleCount}): ${text}`);
      } else if (consoleCount === 6) {
        console.log(`🖥️ Console: ... (infinite re-rendering detected, stopping logs)`);
      }
    } else if (text.includes('error') || text.includes('Error')) {
      console.log(`🖥️ Error: ${text}`);
    }
  });
  
  try {
    console.log('📦 Step 1: Going directly to checkout page...');
    await page.goto('http://localhost:5173/checkout-steps?lang=sl', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    console.log('⏰ Waiting 10 seconds to observe behavior...');
    await wait(10000);
    
    if (consoleCount > 10) {
      console.log('❌ INFINITE RE-RENDERING DETECTED!');
      console.log(`   Console logs count: ${consoleCount}`);
    } else {
      console.log('✅ No infinite re-rendering detected');
      console.log(`   Console logs count: ${consoleCount}`);
    }
    
    // Check page content
    const pageText = await page.evaluate(() => document.body.textContent);
    console.log('\n📄 Page content preview:');
    console.log(pageText.substring(0, 500) + '...');
    
    console.log('\n🎯 Test completed. Browser will stay open for 30 seconds for inspection...');
    await wait(30000);
    
  } catch (error) {
    console.error('❌ Error during test:', error.message);
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
}

testCheckoutPage().catch(console.error);
