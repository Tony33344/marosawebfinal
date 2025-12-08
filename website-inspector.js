/**
 * Website Inspector - Analyze the real DOM structure to fix ghost buyer
 */

import puppeteer from 'puppeteer';

async function inspectWebsite() {
  console.log('🔍 Inspecting website structure...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 1000,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  
  try {
    // Go to homepage
    console.log('📍 Loading homepage...');
    await page.goto('https://marosatest.netlify.app?lang=sl', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Handle cookie consent
    console.log('🍪 Handling cookie consent...');
    const cookieButtons = await page.$$('button');
    for (const btn of cookieButtons) {
      const text = await page.evaluate(el => el.textContent.toLowerCase(), btn);
      if (text.includes('sprejmi') || text.includes('vse')) {
        console.log('✅ Clicking cookie consent');
        await btn.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        break;
      }
    }
    
    // Handle newsletter popup
    console.log('📧 Handling newsletter popup...');
    const emailInput = await page.$('input[type="email"]');
    if (emailInput) {
      await emailInput.type('test@example.com');
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) {
        await submitBtn.click();
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    // Inspect product structure
    console.log('\n📦 PRODUCT STRUCTURE ANALYSIS:');
    const productLinks = await page.$$('a[href*="/izdelek/"]');
    console.log(`Found ${productLinks.length} product links`);
    
    if (productLinks.length > 0) {
      // Get first product URL
      const firstProductUrl = await page.evaluate(el => el.href, productLinks[0]);
      console.log(`First product URL: ${firstProductUrl}`);
      
      // Navigate to product page
      console.log('\n🛍️ PRODUCT PAGE ANALYSIS:');
      await page.goto(firstProductUrl, { waitUntil: 'networkidle2' });
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Analyze product page structure
      const pageStructure = await page.evaluate(() => {
        const structure = {
          title: document.querySelector('h1')?.textContent || 'No title found',
          images: document.querySelectorAll('img').length,
          buttons: [],
          forms: [],
          inputs: [],
          selects: []
        };
        
        // Get all buttons with their text
        document.querySelectorAll('button').forEach(btn => {
          structure.buttons.push({
            text: btn.textContent.trim(),
            type: btn.type,
            className: btn.className,
            id: btn.id
          });
        });
        
        // Get all forms
        document.querySelectorAll('form').forEach(form => {
          structure.forms.push({
            action: form.action,
            method: form.method,
            className: form.className,
            id: form.id
          });
        });
        
        // Get all inputs
        document.querySelectorAll('input').forEach(input => {
          structure.inputs.push({
            type: input.type,
            name: input.name,
            id: input.id,
            placeholder: input.placeholder,
            className: input.className
          });
        });
        
        // Get all selects
        document.querySelectorAll('select').forEach(select => {
          structure.selects.push({
            name: select.name,
            id: select.id,
            className: select.className,
            options: Array.from(select.options).map(opt => opt.textContent)
          });
        });
        
        return structure;
      });
      
      console.log('Product page structure:', JSON.stringify(pageStructure, null, 2));
    }
    
    // Inspect checkout page
    console.log('\n💳 CHECKOUT PAGE ANALYSIS:');
    await page.goto('https://marosatest.netlify.app/checkout?lang=sl', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const checkoutStructure = await page.evaluate(() => {
      const structure = {
        forms: [],
        inputs: [],
        buttons: [],
        pageContent: document.body.innerText.substring(0, 500)
      };
      
      document.querySelectorAll('form').forEach(form => {
        structure.forms.push({
          action: form.action,
          method: form.method,
          className: form.className,
          id: form.id
        });
      });
      
      document.querySelectorAll('input').forEach(input => {
        structure.inputs.push({
          type: input.type,
          name: input.name,
          id: input.id,
          placeholder: input.placeholder,
          className: input.className,
          visible: input.offsetParent !== null
        });
      });
      
      document.querySelectorAll('button').forEach(btn => {
        structure.buttons.push({
          text: btn.textContent.trim(),
          type: btn.type,
          className: btn.className,
          id: btn.id
        });
      });
      
      return structure;
    });
    
    console.log('Checkout page structure:', JSON.stringify(checkoutStructure, null, 2));
    
    // Test registration page
    console.log('\n👤 REGISTRATION PAGE ANALYSIS:');
    await page.goto('https://marosatest.netlify.app/register?lang=sl', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const registrationStructure = await page.evaluate(() => {
      const structure = {
        forms: [],
        inputs: [],
        buttons: [],
        pageContent: document.body.innerText.substring(0, 500)
      };
      
      document.querySelectorAll('form').forEach(form => {
        structure.forms.push({
          action: form.action,
          method: form.method,
          className: form.className,
          id: form.id
        });
      });
      
      document.querySelectorAll('input').forEach(input => {
        structure.inputs.push({
          type: input.type,
          name: input.name,
          id: input.id,
          placeholder: input.placeholder,
          className: input.className,
          visible: input.offsetParent !== null
        });
      });
      
      document.querySelectorAll('button').forEach(btn => {
        structure.buttons.push({
          text: btn.textContent.trim(),
          type: btn.type,
          className: btn.className,
          id: btn.id
        });
      });
      
      return structure;
    });
    
    console.log('Registration page structure:', JSON.stringify(registrationStructure, null, 2));
    
  } catch (error) {
    console.error('Error during inspection:', error.message);
  } finally {
    console.log('\n✅ Inspection complete. Check the output above to understand the real website structure.');
    console.log('Press Ctrl+C to close browser and exit.');
    
    // Keep browser open for manual inspection
    await new Promise(resolve => {
      process.on('SIGINT', () => {
        browser.close();
        resolve();
      });
    });
  }
}

inspectWebsite().catch(console.error);
