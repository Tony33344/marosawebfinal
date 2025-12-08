import puppeteer from 'puppeteer';

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const CONFIG = {
  baseUrl: 'http://localhost:5173',
  testEmail: 'email.test.001@noexpire.top'
};

async function robustEmailTest() {
  console.log('🚀 ROBUST EMAIL CONFIRMATION TEST\n');
  console.log(`📧 Test email: ${CONFIG.testEmail}\n`);
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 300,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 720 }
  });
  
  const page = await browser.newPage();
  
  // Monitor console for errors
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('error') || text.includes('Error') || text.includes('failed')) {
      console.log(`🖥️ Console Error: ${text}`);
    }
  });
  
  try {
    // Step 1: Go to homepage and find products
    console.log('📦 Step 1: Finding available products...');
    await page.goto(`${CONFIG.baseUrl}?lang=sl`, { waitUntil: 'networkidle2', timeout: 30000 });
    await wait(3000);
    
    // Handle cookie consent
    try {
      await page.click('button:has-text("Sprejmi vse")', { timeout: 3000 });
      await wait(1000);
    } catch (e) {
      console.log('   No cookie consent needed');
    }
    
    // Find product links
    const productLinks = await page.$$('a[href*="/izdelek/"]');
    console.log(`   Found ${productLinks.length} product links`);
    
    if (productLinks.length === 0) {
      throw new Error('No products found on homepage');
    }
    
    // Click first product
    await productLinks[0].click();
    await wait(3000);
    
    const productName = await page.$eval('h1', el => el.textContent).catch(() => 'Unknown Product');
    console.log(`   Selected product: ${productName}`);
    
    // Step 2: Add to cart
    console.log('\n🛒 Step 2: Adding to cart...');
    
    // Set quantity
    const quantityInputs = await page.$$('input[type="number"]');
    if (quantityInputs.length > 0) {
      await quantityInputs[0].click({ clickCount: 3 });
      await quantityInputs[0].type('1');
      console.log('   ✅ Set quantity to 1');
    }
    
    // Find and click add to cart button
    const addToCartButton = await page.waitForSelector('button:has-text("Dodaj v košarico")', { timeout: 5000 });
    await addToCartButton.click();
    await wait(2000);
    console.log('   ✅ Added to cart');
    
    // Step 3: Go to checkout
    console.log('\n💳 Step 3: Going to checkout...');
    await page.goto(`${CONFIG.baseUrl}/checkout-steps?lang=sl`, { waitUntil: 'networkidle2', timeout: 30000 });
    await wait(3000);
    
    // Check if cart has items
    const pageText = await page.evaluate(() => document.body.textContent);
    if (pageText.includes('prazna')) {
      throw new Error('Cart is empty on checkout page');
    }
    
    console.log('   ✅ Checkout page loaded with items');
    
    // Step 4: Select guest checkout
    console.log('\n👤 Step 4: Selecting guest checkout...');
    const guestButton = await page.waitForSelector('button:has-text("Nadaljuj kot gost")', { timeout: 10000 });
    await guestButton.click();
    await wait(2000);
    console.log('   ✅ Selected guest checkout');
    
    // Step 5: Fill form
    console.log('\n📝 Step 5: Filling checkout form...');
    
    const formData = {
      name: 'Test Customer',
      email: CONFIG.testEmail,
      phone: '031234567',
      address: 'Test Address 123',
      city: 'Ljubljana',
      postalCode: '1000'
    };
    
    // Fill form fields
    await page.fill('input[name="name"]', formData.name);
    await page.fill('input[name="email"]', formData.email);
    await page.fill('input[name="phone"]', formData.phone);
    await page.fill('input[name="address"]', formData.address);
    await page.fill('input[name="city"]', formData.city);
    await page.fill('input[name="postalCode"]', formData.postalCode);
    
    console.log('   ✅ Form filled');
    
    // Step 6: Continue to payment
    console.log('\n💰 Step 6: Proceeding to payment...');
    const nextButton = await page.waitForSelector('button:has-text("Nadaljuj na plačilo")', { timeout: 5000 });
    await nextButton.click();
    await wait(3000);
    
    // Select payment method (bank transfer)
    const bankTransferRadio = await page.waitForSelector('input[value="bank_transfer"]', { timeout: 5000 });
    await bankTransferRadio.click();
    await wait(1000);
    console.log('   ✅ Selected bank transfer payment');
    
    // Step 7: Submit order
    console.log('\n📋 Step 7: Submitting order...');
    const submitButton = await page.waitForSelector('button:has-text("Oddaj naročilo")', { timeout: 5000 });
    await submitButton.click();
    
    // Wait for success page
    console.log('   ⏰ Waiting for order processing...');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
    await wait(5000);
    
    // Check for success
    const finalUrl = page.url();
    const finalContent = await page.evaluate(() => document.body.textContent);
    
    console.log(`\n🎯 Final URL: ${finalUrl}`);
    
    if (finalUrl.includes('order-success') || finalContent.includes('uspešno') || finalContent.includes('hvala')) {
      // Extract order number
      const orderMatch = finalContent.match(/(\d{4,})/);
      const orderNumber = orderMatch ? orderMatch[1] : 'Unknown';
      
      console.log('\n🎉 SUCCESS! Order completed successfully!');
      console.log(`   📋 Order Number: ${orderNumber}`);
      console.log(`   📧 Customer Email: ${CONFIG.testEmail}`);
      console.log('\n📧 EMAIL VERIFICATION:');
      console.log(`   1. Go to: https://noexpire.top`);
      console.log(`   2. Check inbox for: ${CONFIG.testEmail}`);
      console.log(`   3. Look for email from: kmetija.marosa.narocila@gmail.com`);
      console.log(`   4. Subject should contain order #${orderNumber}`);
    } else {
      console.log('\n❌ Order may not have completed successfully');
      console.log(`   Page content preview: ${finalContent.substring(0, 500)}...`);
    }
    
    console.log('\n⏰ Browser will stay open for 30 seconds for inspection...');
    await wait(30000);
    
  } catch (error) {
    console.error('\n❌ Error during test:', error.message);
    console.log('\n⏰ Browser will stay open for 30 seconds for debugging...');
    await wait(30000);
  } finally {
    await browser.close();
    console.log('\nBrowser closed.');
  }
}

robustEmailTest().catch(console.error);
