/**
 * EMAIL DEBUG TEST
 * 
 * This test investigates why emails aren't sent in automation vs manual:
 * 1. Check for bot detection
 * 2. Investigate form submission differences
 * 3. Monitor network requests
 * 4. Check for missing triggers
 */

import puppeteer from 'puppeteer';

const CONFIG = {
  baseUrl: 'https://marosatest.netlify.app',
  testEmail: 'email.debug.001@noexpire.top'
};

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runEmailDebugTest() {
  console.log('🔍 EMAIL DEBUG TEST - Investigating email trigger issues\n');
  console.log(`📧 Test email: ${CONFIG.testEmail}\n`);
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 300,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled', // Hide automation
      '--disable-web-security',
      '--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' // Real user agent
    ]
  });
  
  const page = await browser.newPage();
  
  // Hide automation indicators
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });
    
    // Remove automation indicators
    delete window.navigator.webdriver;
    
    // Override plugins
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
    });
  });
  
  await page.setViewport({ width: 1280, height: 720 });
  
  // Monitor network requests to see email-related calls
  const networkRequests = [];
  page.on('request', request => {
    const url = request.url();
    if (url.includes('email') || url.includes('mail') || url.includes('order') || 
        url.includes('confirm') || url.includes('notification')) {
      networkRequests.push({
        url,
        method: request.method(),
        postData: request.postData(),
        timestamp: new Date().toISOString()
      });
      console.log(`📡 Network: ${request.method()} ${url}`);
    }
  });
  
  // Monitor console logs for email-related messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('email') || text.includes('mail') || text.includes('order') || 
        text.includes('confirm') || text.includes('error')) {
      console.log(`🖥️ Console: ${msg.type()}: ${text}`);
    }
  });
  
  try {
    // Step 1: Check bot detection
    console.log('🤖 Step 1: Checking for bot detection...');
    await page.goto(`${CONFIG.baseUrl}?lang=sl`, { waitUntil: 'networkidle2' });
    await wait(3000);
    
    const botDetection = await page.evaluate(() => {
      return {
        webdriver: navigator.webdriver,
        userAgent: navigator.userAgent,
        plugins: navigator.plugins.length,
        languages: navigator.languages,
        platform: navigator.platform,
        automation: window.navigator.webdriver,
        chrome: !!window.chrome
      };
    });
    
    console.log('   Browser fingerprint:');
    console.log(`   - WebDriver: ${botDetection.webdriver}`);
    console.log(`   - User Agent: ${botDetection.userAgent.substring(0, 50)}...`);
    console.log(`   - Plugins: ${botDetection.plugins}`);
    console.log(`   - Chrome: ${botDetection.chrome}`);
    
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
    
    // Step 2: Add product and monitor requests
    console.log('\n📦 Step 2: Adding product and monitoring requests...');
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
          console.log('✅ Add to cart clicked');
          await wait(5000);
          break;
        }
      } catch (e) { continue; }
    }
    
    // Step 3: Checkout with detailed monitoring
    console.log('\n💳 Step 3: Checkout with detailed monitoring...');
    await page.goto(`${CONFIG.baseUrl}/checkout?lang=sl`, { waitUntil: 'networkidle2' });
    await wait(5000);
    
    // Select guest checkout
    const allButtons = await page.$$('button, a, [role="button"]');
    for (const btn of allButtons) {
      try {
        const text = await page.evaluate(el => el.textContent.toLowerCase(), btn);
        if (text.includes('nadaljuj kot gost')) {
          await btn.click();
          console.log('✅ Guest checkout selected');
          await wait(5000);
          break;
        }
      } catch (e) { continue; }
    }
    
    // Step 4: Fill form and monitor each field
    console.log('\n📝 Step 4: Filling form with detailed monitoring...');
    
    const formFields = [
      { selector: '#email', value: CONFIG.testEmail, name: 'email' },
      { selector: '#name', value: 'Debug Test Buyer', name: 'name' },
      { selector: '#phone', value: '+386 41 444 444', name: 'phone' },
      { selector: '#address', value: 'Debug Street 999', name: 'address' },
      { selector: '#city', value: 'Ljubljana', name: 'city' },
      { selector: '#postalCode', value: '1000', name: 'postalCode' }
    ];
    
    for (const field of formFields) {
      try {
        const element = await page.$(field.selector);
        if (element) {
          await element.click();
          await wait(200);
          await element.click({ clickCount: 3 });
          await element.type(field.value, { delay: 50 });
          
          // Trigger all possible validation events
          await page.evaluate((selector) => {
            const el = document.querySelector(selector);
            if (el) {
              el.dispatchEvent(new Event('input', { bubbles: true }));
              el.dispatchEvent(new Event('change', { bubbles: true }));
              el.dispatchEvent(new Event('blur', { bubbles: true }));
              el.dispatchEvent(new Event('keyup', { bubbles: true }));
            }
          }, field.selector);
          
          await wait(500);
          console.log(`✅ Filled ${field.name}: ${field.value}`);
        }
      } catch (e) {
        console.log(`❌ Could not fill ${field.name}: ${e.message}`);
      }
    }
    
    // Step 5: Payment method with monitoring
    console.log('\n💰 Step 5: Payment method selection with monitoring...');
    
    const paymentMethods = await page.$$('input[type="radio"][name="paymentMethod"]');
    if (paymentMethods.length > 0) {
      const firstMethod = paymentMethods[0];
      await firstMethod.click();
      
      // Trigger payment method events
      await page.evaluate(() => {
        const radios = document.querySelectorAll('input[type="radio"][name="paymentMethod"]');
        radios.forEach(radio => {
          if (radio.checked) {
            radio.dispatchEvent(new Event('change', { bubbles: true }));
            radio.dispatchEvent(new Event('click', { bubbles: true }));
          }
        });
      });
      
      const methodId = await page.evaluate(el => el.id, firstMethod);
      console.log(`✅ Payment method selected: ${methodId}`);
      await wait(2000);
    }
    
    // Step 6: Pre-submission analysis
    console.log('\n🔍 Step 6: Pre-submission analysis...');
    
    const formAnalysis = await page.evaluate(() => {
      const form = document.querySelector('form');
      const analysis = {
        formExists: !!form,
        formAction: form ? form.action : 'none',
        formMethod: form ? form.method : 'none',
        requiredFields: [],
        filledFields: [],
        emptyFields: [],
        formData: {}
      };
      
      if (form) {
        const formData = new FormData(form);
        for (let [key, value] of formData.entries()) {
          analysis.formData[key] = value;
        }
      }
      
      const inputs = document.querySelectorAll('input, select, textarea');
      inputs.forEach(input => {
        const fieldInfo = {
          name: input.name,
          id: input.id,
          type: input.type,
          value: input.value,
          required: input.required
        };
        
        if (input.required) {
          analysis.requiredFields.push(fieldInfo);
        }
        
        if (input.value && input.value.trim() !== '') {
          analysis.filledFields.push(fieldInfo);
        } else {
          analysis.emptyFields.push(fieldInfo);
        }
      });
      
      return analysis;
    });
    
    console.log(`   Form exists: ${formAnalysis.formExists}`);
    console.log(`   Form action: ${formAnalysis.formAction}`);
    console.log(`   Form method: ${formAnalysis.formMethod}`);
    console.log(`   Required fields: ${formAnalysis.requiredFields.length}`);
    console.log(`   Filled fields: ${formAnalysis.filledFields.length}`);
    console.log(`   Empty fields: ${formAnalysis.emptyFields.length}`);
    
    if (formAnalysis.emptyFields.length > 0) {
      console.log('   Empty fields:', formAnalysis.emptyFields.map(f => f.name || f.id).join(', '));
    }
    
    console.log('   Form data:', JSON.stringify(formAnalysis.formData, null, 2));
    
    // Step 7: Submit and monitor
    console.log('\n🚀 Step 7: Submitting order with detailed monitoring...');
    
    const submitButtons = await page.$$('button');
    for (const btn of submitButtons) {
      try {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && text.includes('Oddaj naročilo')) {
          console.log(`   🎯 Submitting with button: "${text}"`);
          await btn.click();
          console.log('✅ Order submitted');
          await wait(10000); // Wait for all processing
          break;
        }
      } catch (e) { continue; }
    }
    
    // Step 8: Post-submission analysis
    console.log('\n📊 Step 8: Post-submission analysis...');
    
    const finalUrl = page.url();
    const success = finalUrl.includes('order-success');
    
    console.log(`   Final URL: ${finalUrl}`);
    console.log(`   Success: ${success}`);
    
    if (success) {
      const orderMatch = await page.evaluate(() => document.body.textContent.match(/(\d{4,})/));
      const orderNumber = orderMatch ? orderMatch[1] : 'Unknown';
      console.log(`   Order number: ${orderNumber}`);
      
      // Check for any post-submission network requests
      console.log('\n📡 Network requests during checkout:');
      networkRequests.forEach((req, index) => {
        console.log(`   ${index + 1}. ${req.method} ${req.url}`);
        if (req.postData) {
          console.log(`      Data: ${req.postData.substring(0, 100)}...`);
        }
      });
      
      if (networkRequests.length === 0) {
        console.log('   ⚠️ NO email-related network requests detected!');
        console.log('   This might explain why emails are not sent.');
      }
    }
    
  } catch (error) {
    console.error('❌ Error during debug test:', error.message);
  } finally {
    console.log('\n⏰ Keeping browser open for manual inspection...');
    setTimeout(async () => {
      await browser.close();
      console.log('Browser closed.');
    }, 60000);
  }
}

runEmailDebugTest().catch(console.error);
