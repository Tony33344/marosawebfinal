/**
 * DEBUG CHECKOUT TEST - Inspect what's actually on the checkout page
 * 
 * This will help us understand the checkout form structure
 */

import puppeteer from 'puppeteer';

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function debugCheckoutPage() {
  console.log('🔍 DEBUG CHECKOUT PAGE - Inspecting form structure\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 500,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  
  try {
    // Step 1: Add item to cart first
    console.log('📦 Step 1: Adding item to cart...');
    await page.goto(`https://marosatest.netlify.app?lang=sl`, { waitUntil: 'networkidle2' });
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
    
    // Go to product and add to cart
    await page.goto(`https://marosatest.netlify.app/izdelek/11?lang=sl`, { waitUntil: 'networkidle2' });
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
          await wait(5000);
          break;
        }
      } catch (e) { continue; }
    }
    
    // Step 2: Go to checkout and inspect
    console.log('\n🔍 Step 2: Inspecting checkout page...');
    await page.goto(`https://marosatest.netlify.app/checkout?lang=sl`, { waitUntil: 'networkidle2' });
    await wait(5000);
    
    // Get page structure
    const pageStructure = await page.evaluate(() => {
      const structure = {
        title: document.title,
        url: window.location.href,
        forms: [],
        inputs: [],
        buttons: [],
        selects: [],
        textareas: [],
        pageText: document.body.textContent.substring(0, 500)
      };
      
      // Get all forms
      document.querySelectorAll('form').forEach((form, index) => {
        structure.forms.push({
          index,
          id: form.id,
          className: form.className,
          action: form.action,
          method: form.method,
          innerHTML: form.innerHTML.substring(0, 200)
        });
      });
      
      // Get all inputs
      document.querySelectorAll('input').forEach((input, index) => {
        structure.inputs.push({
          index,
          type: input.type,
          name: input.name,
          id: input.id,
          placeholder: input.placeholder,
          className: input.className,
          value: input.value,
          visible: input.offsetParent !== null
        });
      });
      
      // Get all buttons
      document.querySelectorAll('button').forEach((button, index) => {
        structure.buttons.push({
          index,
          type: button.type,
          id: button.id,
          className: button.className,
          textContent: button.textContent.trim(),
          visible: button.offsetParent !== null
        });
      });
      
      // Get all selects
      document.querySelectorAll('select').forEach((select, index) => {
        structure.selects.push({
          index,
          name: select.name,
          id: select.id,
          className: select.className,
          options: Array.from(select.options).map(opt => opt.textContent)
        });
      });
      
      // Get all textareas
      document.querySelectorAll('textarea').forEach((textarea, index) => {
        structure.textareas.push({
          index,
          name: textarea.name,
          id: textarea.id,
          placeholder: textarea.placeholder,
          className: textarea.className
        });
      });
      
      return structure;
    });
    
    console.log('\n📊 CHECKOUT PAGE STRUCTURE:');
    console.log('='.repeat(60));
    
    console.log(`Title: ${pageStructure.title}`);
    console.log(`URL: ${pageStructure.url}`);
    
    console.log(`\n📝 FORMS FOUND: ${pageStructure.forms.length}`);
    pageStructure.forms.forEach((form, index) => {
      console.log(`   ${index + 1}. ID: "${form.id}", Class: "${form.className}"`);
      console.log(`      Action: "${form.action}", Method: "${form.method}"`);
      console.log(`      HTML: ${form.innerHTML.substring(0, 100)}...`);
    });
    
    console.log(`\n📋 INPUTS FOUND: ${pageStructure.inputs.length}`);
    pageStructure.inputs.forEach((input, index) => {
      const visibility = input.visible ? '👁️' : '🙈';
      console.log(`   ${index + 1}. ${visibility} Type: "${input.type}", Name: "${input.name}", ID: "${input.id}"`);
      console.log(`      Placeholder: "${input.placeholder}", Class: "${input.className}"`);
    });
    
    console.log(`\n🔘 BUTTONS FOUND: ${pageStructure.buttons.length}`);
    pageStructure.buttons.forEach((button, index) => {
      const visibility = button.visible ? '👁️' : '🙈';
      console.log(`   ${index + 1}. ${visibility} Type: "${button.type}", Text: "${button.textContent}"`);
      console.log(`      ID: "${button.id}", Class: "${button.className}"`);
    });
    
    console.log(`\n📋 SELECTS FOUND: ${pageStructure.selects.length}`);
    pageStructure.selects.forEach((select, index) => {
      console.log(`   ${index + 1}. Name: "${select.name}", ID: "${select.id}"`);
      console.log(`      Options: ${select.options.join(', ')}`);
    });
    
    console.log(`\n📝 TEXTAREAS FOUND: ${pageStructure.textareas.length}`);
    pageStructure.textareas.forEach((textarea, index) => {
      console.log(`   ${index + 1}. Name: "${textarea.name}", ID: "${textarea.id}"`);
      console.log(`      Placeholder: "${textarea.placeholder}"`);
    });
    
    console.log(`\n📄 PAGE CONTENT PREVIEW:`);
    console.log(pageStructure.pageText);
    
    // Step 3: Try to interact with found elements
    console.log('\n🎯 Step 3: Testing element interactions...');
    
    // Try to fill any email inputs
    const emailInputs = pageStructure.inputs.filter(input => 
      input.type === 'email' || 
      input.name.toLowerCase().includes('email') ||
      input.placeholder.toLowerCase().includes('email')
    );
    
    if (emailInputs.length > 0) {
      console.log(`📧 Found ${emailInputs.length} email inputs, trying to fill...`);
      for (const emailInput of emailInputs) {
        try {
          const selector = emailInput.id ? `#${emailInput.id}` : 
                          emailInput.name ? `input[name="${emailInput.name}"]` : 
                          `input[type="email"]`;
          
          const element = await page.$(selector);
          if (element) {
            await element.type('test@example.com');
            console.log(`✅ Filled email input: ${selector}`);
            break;
          }
        } catch (e) {
          console.log(`❌ Could not fill email input: ${e.message}`);
        }
      }
    }
    
    // Try to click submit buttons
    const submitButtons = pageStructure.buttons.filter(button => 
      button.type === 'submit' ||
      button.textContent.toLowerCase().includes('submit') ||
      button.textContent.toLowerCase().includes('potrdi') ||
      button.textContent.toLowerCase().includes('naroči')
    );
    
    if (submitButtons.length > 0) {
      console.log(`🔘 Found ${submitButtons.length} potential submit buttons`);
      submitButtons.forEach((button, index) => {
        console.log(`   ${index + 1}. "${button.textContent}" (Type: ${button.type})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error during debugging:', error.message);
  } finally {
    console.log('\n⏰ Keeping browser open for manual inspection...');
    console.log('Press Ctrl+C to close when done inspecting.');
    
    // Keep browser open for manual inspection
    await new Promise(resolve => {
      process.on('SIGINT', () => {
        browser.close();
        resolve();
      });
    });
  }
}

debugCheckoutPage().catch(console.error);
