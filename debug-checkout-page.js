/**
 * DEBUG CHECKOUT PAGE - See what's actually on the page
 */

import puppeteer from 'puppeteer';

const CONFIG = {
  baseUrl: 'https://marosatest.netlify.app',
  checkoutUrl: 'https://marosatest.netlify.app/checkout-steps?lang=sl'
};

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function debugCheckoutPage() {
  console.log('🔍 DEBUG CHECKOUT PAGE - See what\'s actually there\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 500,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  
  try {
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
          await wait(1000);
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
          await wait(1000);
          break;
        }
      }
    } catch (e) { /* ignore */ }
    
    // Add to cart
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      try {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && text.includes('Dodaj v košarico')) {
          await btn.click();
          console.log('✅ Added to cart');
          await wait(3000);
          break;
        }
      } catch (e) { continue; }
    }
    
    // Step 2: Go to checkout page
    console.log('\n🔍 Step 2: Going to checkout page...');
    await page.goto(CONFIG.checkoutUrl, { waitUntil: 'domcontentloaded' });
    await wait(5000);
    
    console.log(`Current URL: ${page.url()}`);
    
    // Step 3: Debug what's on the page
    console.log('\n📋 Step 3: Analyzing page content...');
    
    // Get page title
    const pageTitle = await page.title();
    console.log(`Page title: ${pageTitle}`);
    
    // Get main headings
    const headings = await page.$$eval('h1, h2, h3', elements => 
      elements.map(el => ({ tag: el.tagName, text: el.textContent.trim() }))
    );
    console.log('Headings found:');
    headings.forEach(h => console.log(`  ${h.tag}: ${h.text}`));
    
    // Check for form elements
    const formElements = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input')).map(input => ({
        type: input.type,
        name: input.name,
        id: input.id,
        placeholder: input.placeholder,
        visible: input.offsetParent !== null
      }));
      
      const buttons = Array.from(document.querySelectorAll('button')).map(button => ({
        text: button.textContent.trim(),
        type: button.type,
        visible: button.offsetParent !== null
      }));
      
      return { inputs, buttons };
    });
    
    console.log('\nForm inputs found:');
    formElements.inputs.forEach((input, i) => {
      console.log(`  ${i + 1}. Type: ${input.type}, Name: ${input.name}, ID: ${input.id}, Visible: ${input.visible}`);
    });
    
    console.log('\nButtons found:');
    formElements.buttons.forEach((button, i) => {
      if (button.text) {
        console.log(`  ${i + 1}. "${button.text}" (visible: ${button.visible})`);
      }
    });
    
    // Check for specific checkout elements
    const checkoutElements = await page.evaluate(() => {
      const elements = [];
      
      // Look for checkout step indicators
      const stepIndicators = document.querySelectorAll('[class*="step"], [class*="Step"]');
      if (stepIndicators.length > 0) {
        elements.push(`Step indicators: ${stepIndicators.length} found`);
      }
      
      // Look for checkout forms
      const forms = document.querySelectorAll('form');
      if (forms.length > 0) {
        elements.push(`Forms: ${forms.length} found`);
      }
      
      // Look for checkout-specific text
      const bodyText = document.body.textContent.toLowerCase();
      if (bodyText.includes('nadaljuj kot gost')) {
        elements.push('Found "Nadaljuj kot gost" text');
      }
      if (bodyText.includes('prijava')) {
        elements.push('Found "Prijava" text');
      }
      if (bodyText.includes('registracija')) {
        elements.push('Found "Registracija" text');
      }
      if (bodyText.includes('prazna')) {
        elements.push('Found "prazna" (empty cart) text');
      }
      
      return elements;
    });
    
    console.log('\nCheckout-specific elements:');
    checkoutElements.forEach(element => console.log(`  - ${element}`));
    
    // Get a snippet of the page content
    const pageContent = await page.evaluate(() => {
      return document.body.textContent.substring(0, 500);
    });
    
    console.log('\nPage content preview:');
    console.log(pageContent);
    
    console.log('\n🔍 ANALYSIS COMPLETE');
    console.log('The browser will stay open for manual inspection...');
    
  } catch (error) {
    console.error('❌ Error during debug:', error.message);
  } finally {
    // Keep browser open for manual inspection
    console.log('\n⏰ Browser will close in 60 seconds...');
    setTimeout(async () => {
      await browser.close();
      console.log('Browser closed.');
    }, 60000);
  }
}

debugCheckoutPage().catch(console.error);
