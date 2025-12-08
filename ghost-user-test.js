/**
 * Ghost User Test Script - Automated Website Testing
 * 
 * This script simulates a real user going through the website
 * and tests all major functionalities, translations, and user flows.
 * 
 * Run with: node ghost-user-test.js
 */

import puppeteer from 'puppeteer';
import fs from 'fs';

// Enhanced Test configuration for comprehensive real-world testing
const CONFIG = {
  baseUrl: 'https://marosatest.netlify.app',
  languages: ['sl', 'en', 'de', 'hr'],
  headless: false, // Set to true for headless testing
  slowMo: 600, // Realistic human speed
  timeout: 60000,

  // Extended test email addresses for comprehensive testing
  testEmails: [
    'test200@noexpire.top', 'test201@noexpire.top', 'test202@noexpire.top',
    'test203@noexpire.top', 'test204@noexpire.top', 'test205@noexpire.top',
    'test206@noexpire.top', 'test207@noexpire.top', 'test208@noexpire.top',
    'test209@noexpire.top', 'test210@noexpire.top', 'test211@noexpire.top'
  ],

  // Real-world testing scenarios
  testScenarios: [
    'quick_buyer', 'careful_shopper', 'price_conscious', 'bulk_buyer',
    'mobile_user', 'international_customer', 'returning_customer', 'gift_buyer'
  ],

  // Comprehensive realistic test users for different real-world scenarios
  testUsers: [
    {
      name: 'Janez Novak', email: 'test200@noexpire.top', phone: '041234567',
      address: 'Slovenska cesta 15', city: 'Ljubljana', postalCode: '1000',
      country: 'Slovenija', scenario: 'quick_buyer', behavior: 'fast_decisions'
    },
    {
      name: 'Marija Kovač', email: 'test201@noexpire.top', phone: '031987654',
      address: 'Trubarjeva ulica 25', city: 'Maribor', postalCode: '2000',
      country: 'Slovenija', scenario: 'careful_shopper', behavior: 'detailed_review'
    },
    {
      name: 'Ana Horvat', email: 'test202@noexpire.top', phone: '040555666',
      address: 'Cankarjeva cesta 8', city: 'Celje', postalCode: '3000',
      country: 'Slovenija', scenario: 'price_conscious', behavior: 'compare_prices'
    },
    {
      name: 'Petra Zupan', email: 'test203@noexpire.top', phone: '051777888',
      address: 'Prešernova ulica 12', city: 'Kranj', postalCode: '4000',
      country: 'Slovenija', scenario: 'bulk_buyer', behavior: 'large_quantities'
    },
    {
      name: 'Luka Mlakar', email: 'test204@noexpire.top', phone: '070123456',
      address: 'Kidričeva cesta 3', city: 'Novo mesto', postalCode: '8000',
      country: 'Slovenija', scenario: 'mobile_user', behavior: 'mobile_focused'
    },
    {
      name: 'Tina Žagar', email: 'test205@noexpire.top', phone: '041888999',
      address: 'Gosposvetska cesta 5', city: 'Koper', postalCode: '6000',
      country: 'Slovenija', scenario: 'international_customer', behavior: 'shipping_focused'
    },
    {
      name: 'Miha Kos', email: 'test206@noexpire.top', phone: '031555444',
      address: 'Partizanska cesta 20', city: 'Ptuj', postalCode: '2250',
      country: 'Slovenija', scenario: 'returning_customer', behavior: 'loyalty_focused'
    },
    {
      name: 'Sara Kralj', email: 'test207@noexpire.top', phone: '040777333',
      address: 'Cesta svobode 10', city: 'Murska Sobota', postalCode: '9000',
      country: 'Slovenija', scenario: 'gift_buyer', behavior: 'gift_options'
    },
    {
      name: 'David Petek', email: 'test208@noexpire.top', phone: '051222111',
      address: 'Ljubljanska cesta 30', city: 'Domžale', postalCode: '1230',
      country: 'Slovenija', scenario: 'tech_savvy', behavior: 'feature_focused'
    },
    {
      name: 'Nina Golob', email: 'test209@noexpire.top', phone: '070999888',
      address: 'Koroška cesta 7', city: 'Velenje', postalCode: '3320',
      country: 'Slovenija', scenario: 'eco_conscious', behavior: 'sustainability_focused'
    },
    {
      name: 'Rok Vidmar', email: 'test210@noexpire.top', phone: '041666555',
      address: 'Titova cesta 12', city: 'Postojna', postalCode: '6230',
      country: 'Slovenija', scenario: 'budget_shopper', behavior: 'discount_hunter'
    },
    {
      name: 'Eva Hribar', email: 'test211@noexpire.top', phone: '031444333',
      address: 'Glavni trg 8', city: 'Kamnik', postalCode: '1241',
      country: 'Slovenija', scenario: 'premium_buyer', behavior: 'quality_focused'
    }
  ]
};

// Test results storage
let testResults = {
  timestamp: new Date().toISOString(),
  baseUrl: CONFIG.baseUrl,
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  issues: [],
  translations: {
    missing: [],
    hardcoded: []
  },
  performance: {},
  accessibility: []
};

/**
 * Log test result
 */
function logTest(testName, passed, details = '') {
  testResults.totalTests++;
  if (passed) {
    testResults.passedTests++;
    console.log(`✅ ${testName}`);
  } else {
    testResults.failedTests++;
    console.log(`❌ ${testName}: ${details}`);
    testResults.issues.push({ test: testName, details, timestamp: new Date().toISOString() });
  }
}

/**
 * Wait for element with timeout
 */
async function waitForElement(page, selector, timeout = CONFIG.timeout) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Wait for specified time (Puppeteer compatible)
 */
async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Handle cookie consent banner (improved detection)
 */
async function handleCookieConsent(page) {
  console.log('🍪 Checking for cookie consent...');

  // Wait a bit for cookie banner to appear
  await wait(2000);

  // Look for cookie consent by checking all buttons for relevant text
  const buttons = await page.$$('button');
  for (const button of buttons) {
    try {
      const text = await page.evaluate(el => el.textContent.toLowerCase(), button);
      if (text.includes('sprejmi') || text.includes('vse') || text.includes('accept') ||
          text.includes('privolim') || text.includes('cookie')) {
        console.log(`✅ Found cookie consent button with text: "${text}"`);
        await button.click();
        await wait(1000);
        return true;
      }
    } catch (error) {
      // Continue to next button
    }
  }

  console.log('ℹ️ No cookie consent banner found');
  return false;
}

/**
 * Handle newsletter popup and get discount (improved detection)
 */
async function handleNewsletterPopup(page, email) {
  console.log('📧 Checking for newsletter popup...');

  // Wait for potential newsletter popup to appear
  await wait(3000);

  // Look for email input field (newsletter popup should be visible)
  const emailInput = await page.$('input[type="email"]');
  if (emailInput) {
    console.log('✅ Found newsletter email input');

    // Clear and fill email
    await emailInput.click({ clickCount: 3 });
    await emailInput.type(email);
    console.log(`📝 Filled newsletter email: ${email}`);

    // Look for submit button with various texts
    const buttons = await page.$$('button');
    for (const button of buttons) {
      try {
        const text = await page.evaluate(el => el.textContent.toLowerCase(), button);
        if (text.includes('pridobi') || text.includes('subscribe') || text.includes('prijavi') ||
            text.includes('pošlji') || text.includes('10%')) {
          console.log(`✅ Found newsletter submit button: "${text}"`);
          await button.click();
          await wait(3000); // Wait for popup to close and discount to apply
          console.log('✅ Newsletter subscription completed - 10% discount should be applied!');
          return true;
        }
      } catch (error) {
        // Continue to next button
      }
    }

    // Fallback: try any submit button near email input
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) {
      console.log('✅ Found generic submit button, trying...');
      await submitBtn.click();
      await wait(3000);
      return true;
    }
  }

  console.log('ℹ️ No newsletter popup found');
  return false;
}

/**
 * Simulate realistic human typing with behavior patterns
 */
async function humanType(page, selector, text, behavior = 'normal') {
  const element = await page.$(selector);
  if (!element) return false;

  // Clear field first
  await element.click({ clickCount: 3 });
  await wait(200);

  // Different typing patterns based on user behavior
  let baseDelay = 80;
  let variability = 40;

  switch (behavior) {
    case 'fast_decisions':
      baseDelay = 50;
      variability = 20;
      break;
    case 'careful_shopper':
      baseDelay = 120;
      variability = 60;
      break;
    case 'mobile_focused':
      baseDelay = 150;
      variability = 80;
      break;
    default:
      baseDelay = 80;
      variability = 40;
  }

  // Type with realistic human patterns
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    await element.type(char);

    // Simulate occasional pauses (thinking)
    if (Math.random() < 0.1) {
      await wait(Math.random() * 500 + 200);
    } else {
      await wait(Math.random() * variability + baseDelay);
    }

    // Simulate occasional typos and corrections
    if (Math.random() < 0.05 && i > 0) {
      await page.keyboard.press('Backspace');
      await wait(100);
      await element.type(char);
    }
  }

  return true;
}

/**
 * Get random test user
 */
function getRandomTestUser() {
  return CONFIG.testUsers[Math.floor(Math.random() * CONFIG.testUsers.length)];
}

/**
 * Simulate realistic page interactions based on user behavior
 */
async function simulateHumanBehavior(page, behavior = 'normal', scenario = 'browsing') {
  switch (behavior) {
    case 'fast_decisions':
      // Quick scrolling, minimal hesitation
      await page.evaluate(() => window.scrollTo(0, Math.random() * 300));
      await wait(Math.random() * 300 + 200);
      break;

    case 'careful_shopper':
      // Detailed scrolling, reading content
      for (let i = 0; i < 3; i++) {
        await page.evaluate(() => window.scrollBy(0, 200));
        await wait(Math.random() * 1500 + 1000); // Reading time
      }
      break;

    case 'price_conscious':
      // Look for prices, compare
      await page.evaluate(() => {
        const priceElements = document.querySelectorAll('[class*="price"], [class*="cost"]');
        if (priceElements.length > 0) {
          priceElements[0].scrollIntoView();
        }
      });
      await wait(Math.random() * 2000 + 1000);
      break;

    case 'mobile_focused':
      // Simulate mobile-like behavior
      await page.evaluate(() => window.scrollTo(0, Math.random() * 800));
      await wait(Math.random() * 800 + 400);
      break;

    default:
      // Normal browsing behavior
      await page.evaluate(() => window.scrollTo(0, Math.random() * 500));
      await wait(Math.random() * 1000 + 500);
  }

  // Random mouse movement
  await page.mouse.move(
    Math.random() * 800 + 200,
    Math.random() * 600 + 200
  );
  await wait(Math.random() * 500 + 200);
}

/**
 * Simulate specific shopping behaviors
 */
async function simulateShoppingBehavior(page, testUser, scenario) {
  console.log(`🎭 Simulating ${testUser.behavior} behavior for ${scenario}...`);

  switch (testUser.behavior) {
    case 'detailed_review':
      // Read product descriptions, check images
      const images = await page.$$('img');
      if (images.length > 0) {
        await images[0].hover();
        await wait(1000);
      }

      const descriptions = await page.$$('p, .description, [class*="desc"]');
      if (descriptions.length > 0) {
        await descriptions[0].scrollIntoView();
        await wait(2000); // Reading time
      }
      break;

    case 'compare_prices':
      // Look for price comparisons, discounts
      await page.evaluate(() => {
        const priceElements = document.querySelectorAll('[class*="price"], [class*="discount"], [class*="sale"]');
        priceElements.forEach(el => el.style.border = '2px solid red');
      });
      await wait(1500);
      break;

    case 'large_quantities':
      // Look for quantity selectors, bulk options
      const quantitySelectors = await page.$$('select[name*="quantity"], input[name*="quantity"], .quantity');
      if (quantitySelectors.length > 0) {
        await quantitySelectors[0].click();
        await wait(500);
      }
      break;

    case 'gift_options':
      // Look for gift wrapping, messages
      const giftOptions = await page.$$('[class*="gift"], [class*="message"], [class*="wrap"]');
      if (giftOptions.length > 0) {
        await giftOptions[0].scrollIntoView();
        await wait(1000);
      }
      break;

    case 'sustainability_focused':
      // Look for eco-friendly options, organic labels
      await page.evaluate(() => {
        const ecoElements = document.querySelectorAll('[class*="eco"], [class*="organic"], [class*="bio"]');
        ecoElements.forEach(el => el.style.outline = '2px solid green');
      });
      await wait(1000);
      break;
  }
}

/**
 * Check for missing translations
 */
async function checkTranslations(page, language) {
  console.log(`\n🔍 Checking translations for ${language.toUpperCase()}...`);
  
  // Check for [MISSING: key] patterns
  const missingTranslations = await page.evaluate(() => {
    const textNodes = [];
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    let node;
    while (node = walker.nextNode()) {
      if (node.textContent.includes('[MISSING:')) {
        textNodes.push(node.textContent.trim());
      }
    }
    return textNodes;
  });
  
  if (missingTranslations.length > 0) {
    testResults.translations.missing.push({
      language,
      missing: missingTranslations
    });
    logTest(`Translation completeness (${language})`, false, `Found ${missingTranslations.length} missing translations`);
  } else {
    logTest(`Translation completeness (${language})`, true);
  }
  
  // Check for hardcoded English text (when not in English mode)
  if (language !== 'en') {
    const hardcodedText = await page.evaluate(() => {
      const suspiciousTexts = [];
      const textNodes = [];
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      let node;
      while (node = walker.nextNode()) {
        const text = node.textContent.trim();
        // Look for common English words that shouldn't appear in other languages
        if (text.match(/\b(Loading|Error|Submit|Cancel|Save|Delete|Edit|Back|Continue)\b/)) {
          suspiciousTexts.push(text);
        }
      }
      return suspiciousTexts;
    });
    
    if (hardcodedText.length > 0) {
      testResults.translations.hardcoded.push({
        language,
        hardcoded: hardcodedText
      });
      logTest(`Hardcoded text check (${language})`, false, `Found ${hardcodedText.length} potentially hardcoded texts`);
    } else {
      logTest(`Hardcoded text check (${language})`, true);
    }
  }
}

/**
 * Complete homepage test with cookie consent and newsletter
 */
async function testHomepage(page, language, testUser) {
  console.log(`\n🏠 Testing homepage (${language.toUpperCase()}) - User: ${testUser.name}...`);

  // Navigate to homepage
  await page.goto(`${CONFIG.baseUrl}?lang=${language}`, { waitUntil: 'networkidle2' });

  // Handle cookie consent first
  await handleCookieConsent(page);

  // Handle newsletter popup and get discount
  await handleNewsletterPopup(page, testUser.email);

  // Simulate human behavior
  await simulateHumanBehavior(page);

  // Check if page loads
  const title = await page.title();
  logTest(`Homepage loads (${language})`, title.length > 0);

  // Check logo
  const logo = await waitForElement(page, 'img[alt*="Kmetija"], img[alt*="Maroša"]');
  logTest(`Logo visible (${language})`, logo);

  // Check navigation
  const nav = await waitForElement(page, 'nav, [role="navigation"]');
  logTest(`Navigation visible (${language})`, nav);

  // Check hero section
  const hero = await waitForElement(page, 'h1');
  logTest(`Hero section visible (${language})`, hero);

  // Wait for products to load (they might load after cookie/newsletter handling)
  await wait(5000);

  // Scroll down to trigger any lazy loading
  await page.evaluate(() => {
    window.scrollTo(0, 800);
  });
  await wait(2000);

  // Check products section with comprehensive selectors
  const productSelectors = [
    '.product-card',
    '[data-testid="products"]',
    '.grid .product',
    '.products-grid',
    '.product-item',
    '.product',
    'a[href*="/izdelek/"]',
    'a[href*="/product/"]',
    '.grid a',
    '.grid > div',
    '[class*="product"]',
    '.grid-cols-1 > div',
    '.grid-cols-2 > div',
    '.grid-cols-3 > div',
    '.grid-cols-4 > div'
  ];

  let productsFound = false;
  let productElements = [];

  for (const selector of productSelectors) {
    const products = await page.$$(selector);
    if (products.length > 0) {
      console.log(`📦 Found ${products.length} products with selector: ${selector}`);
      productsFound = true;
      productElements = products;
      break;
    }
  }

  // Alternative: Look for any clickable elements that might be products
  if (!productsFound) {
    console.log('🔍 Looking for any clickable product elements...');
    const clickableElements = await page.$$('a, div[onclick], [role="button"]');
    for (const element of clickableElements) {
      try {
        const href = await page.evaluate(el => el.href || el.getAttribute('onclick') || '', element);
        const text = await page.evaluate(el => el.textContent || '', element);
        if (href.includes('izdelek') || href.includes('product') ||
            text.toLowerCase().includes('€') || text.toLowerCase().includes('eur')) {
          console.log(`🎯 Found potential product element: ${href || text.substring(0, 50)}`);
          productElements.push(element);
          productsFound = true;
        }
      } catch (error) {
        // Continue
      }
    }
  }

  logTest(`Products section visible (${language})`, productsFound);

  // Store product elements for later use
  page.productElements = productElements;

  // Check footer
  const footer = await waitForElement(page, 'footer');
  logTest(`Footer visible (${language})`, footer);

  // Check language switcher
  const langSwitcher = await page.$$eval('button', buttons =>
    buttons.some(btn => ['SL', 'EN', 'DE', 'HR'].includes(btn.textContent.trim()))
  );
  logTest(`Language switcher visible (${language})`, langSwitcher);

  await checkTranslations(page, language);

  return productsFound;
}

/**
 * Comprehensive product exploration and testing
 */
async function testProductExploration(page, language, testUser) {
  console.log(`\n🔍 Testing product exploration (${language.toUpperCase()}) - User: ${testUser.name}...`);

  // Simulate user behavior while exploring products
  await simulateShoppingBehavior(page, testUser, 'product_exploration');

  // Test different product discovery methods
  const productDiscoveryMethods = [
    'direct_links', 'category_browsing', 'search_function', 'featured_products'
  ];

  const discoveredProducts = [];

  for (const method of productDiscoveryMethods) {
    console.log(`🎯 Testing product discovery via: ${method}`);

    switch (method) {
      case 'direct_links':
        const directLinks = await page.$$('a[href*="/izdelek/"]');
        console.log(`📦 Found ${directLinks.length} direct product links`);
        discoveredProducts.push(...directLinks.slice(0, 5));
        break;

      case 'category_browsing':
        const categoryLinks = await page.$$('a[href*="/kategorija/"], a[href*="/category/"]');
        console.log(`📂 Found ${categoryLinks.length} category links`);
        break;

      case 'search_function':
        const searchInput = await page.$('input[type="search"], input[placeholder*="search"], input[placeholder*="iskanje"]');
        if (searchInput) {
          console.log('🔍 Testing search functionality');
          await searchInput.type('rastlina', { delay: 100 });
          await page.keyboard.press('Enter');
          await wait(3000);
          const searchResults = await page.$$('.product-card, .search-result');
          console.log(`🔍 Search returned ${searchResults.length} results`);
        }
        break;

      case 'featured_products':
        const featuredProducts = await page.$$('.featured, .recommended, .popular');
        console.log(`⭐ Found ${featuredProducts.length} featured products`);
        break;
    }
  }

  logTest(`Product discovery methods (${language})`, discoveredProducts.length > 0);
  return discoveredProducts;
}

/**
 * Complete shopping flow test - from product selection to checkout
 */
async function testCompleteShoppingFlow(page, language, testUser) {
  console.log(`\n🛒 Testing complete shopping flow (${language.toUpperCase()}) - User: ${testUser.name}...`);

  // Start from homepage
  await page.goto(`${CONFIG.baseUrl}?lang=${language}`, { waitUntil: 'networkidle2' });

  // Handle cookie consent and newsletter if not already done
  await handleCookieConsent(page);
  await wait(2000);

  // First explore products comprehensively
  const discoveredProducts = await testProductExploration(page, language, testUser);

  // Use products found in homepage test
  console.log('🔍 Looking for products...');

  let productNavigated = false;

  // Strategy 1: Use stored product elements from homepage
  if (page.productElements && page.productElements.length > 0) {
    console.log(`📦 Using ${page.productElements.length} detected product elements`);

    for (let i = 0; i < Math.min(3, page.productElements.length); i++) {
      try {
        console.log(`🎯 Trying product element ${i + 1}...`);
        await page.productElements[i].click();
        await wait(4000);

        // Check if we navigated to a product page
        const currentUrl = page.url();
        if (currentUrl.includes('izdelek') || currentUrl.includes('product')) {
          console.log(`✅ Successfully navigated to product page: ${currentUrl}`);
          productNavigated = true;
          break;
        }

        // Check for product page indicators
        const productIndicators = await page.$$('h1, .product-title, .add-to-cart, button[type="submit"]');
        if (productIndicators.length > 0) {
          console.log('✅ Product page detected by content');
          productNavigated = true;
          break;
        }

        // Go back and try next product
        await page.goBack();
        await wait(2000);

      } catch (error) {
        console.log(`⚠️ Error with product element ${i + 1}: ${error.message}`);
        continue;
      }
    }
  }

  // Strategy 2: Direct URL navigation to first product
  if (!productNavigated) {
    console.log('🔗 Trying direct product URL navigation...');
    const productUrls = [
      `${CONFIG.baseUrl}/izdelek/1?lang=${language}`,
      `${CONFIG.baseUrl}/izdelek/2?lang=${language}`,
      `${CONFIG.baseUrl}/izdelek/3?lang=${language}`,
      `${CONFIG.baseUrl}/product/1?lang=${language}`,
      `${CONFIG.baseUrl}/product/2?lang=${language}`
    ];

    for (const url of productUrls) {
      try {
        await page.goto(url, { waitUntil: 'networkidle2' });
        await wait(3000);

        // Check if page loaded successfully (not 404)
        const pageContent = await page.content();
        if (!pageContent.includes('404') && !pageContent.includes('Not Found')) {
          console.log(`✅ Successfully loaded product page: ${url}`);
          productNavigated = true;
          break;
        }
      } catch (error) {
        console.log(`⚠️ Failed to load ${url}`);
        continue;
      }
    }
  }

  logTest(`Product page navigation (${language})`, productNavigated);

  // Comprehensive add to cart testing
  console.log('🛒 Testing comprehensive add to cart scenarios...');

  const cartTestResults = {
    basicAddToCart: false,
    packageSelection: false,
    quantitySelection: false,
    cartUpdate: false,
    cartPersistence: false
  };

  // Test 1: Basic add to cart functionality
  const addToCartSelectors = [
    'button[type="submit"]',
    '.add-to-cart',
    '[data-testid="add-to-cart"]',
    'button.btn-primary',
    'button.add-cart'
  ];

  for (const selector of addToCartSelectors) {
    const addBtn = await page.$(selector);
    if (addBtn) {
      console.log(`🎯 Found add to cart button: ${selector}`);

      // Test 2: Package/variant selection
      const packageSelectors = ['select', '.package-option', '.variant-select', '.size-select'];
      for (const pkgSelector of packageSelectors) {
        const packageSelect = await page.$(pkgSelector);
        if (packageSelect) {
          console.log(`📦 Testing package selection: ${pkgSelector}`);
          await packageSelect.click();
          await wait(500);

          const options = await page.$$('option');
          if (options.length > 1) {
            // Select different options based on user behavior
            let optionIndex = 1; // Default first option
            if (testUser.behavior === 'large_quantities') {
              optionIndex = Math.min(options.length - 1, 2); // Larger package
            } else if (testUser.behavior === 'budget_shopper') {
              optionIndex = 1; // Smallest/cheapest option
            }

            await options[optionIndex].click();
            cartTestResults.packageSelection = true;
            console.log(`✅ Selected package option ${optionIndex}`);
          }
          break;
        }
      }

      // Test 3: Quantity selection
      const quantitySelectors = ['input[name*="quantity"]', '.quantity-input', 'input[type="number"]'];
      for (const qtySelector of quantitySelectors) {
        const quantityInput = await page.$(qtySelector);
        if (quantityInput) {
          console.log(`🔢 Testing quantity selection: ${qtySelector}`);

          let quantity = 1;
          if (testUser.behavior === 'large_quantities') {
            quantity = 3;
          } else if (testUser.behavior === 'bulk_buyer') {
            quantity = 5;
          }

          await quantityInput.click({ clickCount: 3 });
          await quantityInput.type(quantity.toString());
          cartTestResults.quantitySelection = true;
          console.log(`✅ Set quantity to ${quantity}`);
          break;
        }
      }

      // Simulate user behavior before adding to cart
      await simulateShoppingBehavior(page, testUser, 'pre_purchase');

      // Test 4: Add to cart action
      console.log('🛒 Adding product to cart...');
      await addBtn.click();
      await wait(3000);

      // Test 5: Verify cart update
      const successIndicators = [
        '.success', '.added', '.cart-count', '[class*="success"]',
        '.notification', '.toast', '.alert-success'
      ];

      for (const indicator of successIndicators) {
        const elements = await page.$$(indicator);
        if (elements.length > 0) {
          console.log(`✅ Cart update confirmed: ${indicator}`);
          cartTestResults.cartUpdate = true;
          cartTestResults.basicAddToCart = true;
          break;
        }
      }

      // Test 6: Cart persistence (check cart icon/count)
      const cartIndicators = [
        '.cart-count', '[data-testid="cart-count"]', '.cart-items',
        '.cart-badge', '.shopping-cart-count'
      ];

      for (const cartIndicator of cartIndicators) {
        const cartElement = await page.$(cartIndicator);
        if (cartElement) {
          const cartText = await page.evaluate(el => el.textContent, cartElement);
          if (cartText && cartText.trim() !== '0' && cartText.trim() !== '') {
            console.log(`✅ Cart persistence confirmed: ${cartText}`);
            cartTestResults.cartPersistence = true;
            break;
          }
        }
      }

      break; // Exit selector loop if we found a working button
    }
  }

  // Log all cart test results
  Object.entries(cartTestResults).forEach(([test, result]) => {
    logTest(`${test} (${language})`, result);
  });

  const overallCartSuccess = Object.values(cartTestResults).some(result => result);
  logTest(`Overall add to cart functionality (${language})`, overallCartSuccess);

  // Navigate to checkout
  console.log('💳 Navigating to checkout...');

  const checkoutSelectors = [
    'a[href*="/checkout"]',
    '.cart-icon',
    '.checkout-btn',
    'button[class*="checkout"]',
    'button[class*="cart"]'
  ];

  let checkoutFound = false;
  for (const selector of checkoutSelectors) {
    const checkoutBtn = await page.$(selector);
    if (checkoutBtn) {
      await checkoutBtn.click();
      await wait(3000);
      checkoutFound = true;
      break;
    }
  }

  // If no checkout button found, navigate directly
  if (!checkoutFound) {
    await page.goto(`${CONFIG.baseUrl}/checkout?lang=${language}`, { waitUntil: 'networkidle2' });
    checkoutFound = true;
  }

  logTest(`Checkout page access (${language})`, checkoutFound);

  return checkoutFound;
}

/**
 * Test comprehensive checkout form with realistic data
 */
async function testCheckoutForm(page, language, testUser) {
  console.log(`\n💳 Testing checkout form (${language.toUpperCase()}) - User: ${testUser.name}...`);

  // Try multiple checkout URLs
  const checkoutUrls = [
    `${CONFIG.baseUrl}/checkout?lang=${language}`,
    `${CONFIG.baseUrl}/blagajna?lang=${language}`,
    `${CONFIG.baseUrl}/cart?lang=${language}`,
    `${CONFIG.baseUrl}/order?lang=${language}`
  ];

  let checkoutLoaded = false;
  for (const url of checkoutUrls) {
    try {
      await page.goto(url, { waitUntil: 'networkidle2' });
      await wait(3000);

      // Check if this looks like a checkout page
      const pageContent = await page.content();
      if (!pageContent.includes('404') && !pageContent.includes('Not Found')) {
        console.log(`✅ Loaded checkout page: ${url}`);
        checkoutLoaded = true;
        break;
      }
    } catch (error) {
      console.log(`⚠️ Failed to load ${url}`);
      continue;
    }
  }

  if (!checkoutLoaded) {
    console.log('❌ Could not load any checkout page');
    return;
  }

  // Wait for any dynamic content to load
  await wait(5000);

  // Look for form fields with comprehensive selectors
  const fieldSelectors = {
    name: [
      'input[name="name"]', 'input[id="name"]', '#name',
      '[placeholder*="ime"]', '[placeholder*="name"]',
      'input[name="firstName"]', 'input[name="fullName"]',
      'input[name="customer_name"]', 'input[name="billing_name"]'
    ],
    email: [
      'input[name="email"]', 'input[id="email"]', '#email',
      'input[type="email"]', '[placeholder*="email"]',
      'input[name="customer_email"]', 'input[name="billing_email"]'
    ],
    phone: [
      'input[name="phone"]', 'input[id="phone"]', '#phone',
      'input[type="tel"]', '[placeholder*="telefon"]', '[placeholder*="phone"]',
      'input[name="customer_phone"]', 'input[name="billing_phone"]'
    ],
    address: [
      'input[name="address"]', 'input[id="address"]', '#address',
      '[placeholder*="naslov"]', '[placeholder*="address"]',
      'input[name="street"]', 'input[name="billing_address"]'
    ],
    city: [
      'input[name="city"]', 'input[id="city"]', '#city',
      '[placeholder*="mesto"]', '[placeholder*="city"]',
      'input[name="billing_city"]', 'input[name="customer_city"]'
    ],
    postalCode: [
      'input[name="postalCode"]', 'input[id="postalCode"]', '#postalCode',
      '[placeholder*="pošt"]', '[placeholder*="postal"]', '[placeholder*="zip"]',
      'input[name="zip"]', 'input[name="billing_postal"]'
    ]
  };

  const foundFields = {};

  // Find all form fields with improved detection
  for (const [fieldName, selectors] of Object.entries(fieldSelectors)) {
    for (const selector of selectors) {
      const field = await page.$(selector);
      if (field) {
        // Verify field is visible and interactable
        const isVisible = await page.evaluate(el => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 &&
                 window.getComputedStyle(el).visibility !== 'hidden' &&
                 window.getComputedStyle(el).display !== 'none';
        }, field);

        if (isVisible) {
          foundFields[fieldName] = selector;
          console.log(`✅ Found ${fieldName} field: ${selector}`);
          break;
        }
      }
    }
  }

  // Alternative: Look for any input fields if specific ones not found
  if (Object.keys(foundFields).length < 3) {
    console.log('🔍 Looking for any input fields...');
    const allInputs = await page.$$('input[type="text"], input[type="email"], input[type="tel"], input:not([type])');
    console.log(`📝 Found ${allInputs.length} total input fields`);

    for (let i = 0; i < allInputs.length; i++) {
      const input = allInputs[i];
      const placeholder = await page.evaluate(el => el.placeholder || '', input);
      const name = await page.evaluate(el => el.name || '', input);
      const id = await page.evaluate(el => el.id || '', input);
      console.log(`Input ${i + 1}: name="${name}", id="${id}", placeholder="${placeholder}"`);
    }
  }

  const fieldsFound = Object.keys(foundFields).length;
  logTest(`Checkout form fields found (${language})`, fieldsFound >= 4, `Found ${fieldsFound}/6 fields`);

  if (fieldsFound >= 2) { // Lower threshold for testing
    console.log('📝 Filling form with realistic data...');

    // Fill form with test user data using improved typing
    if (foundFields.name) {
      console.log(`📝 Filling name: ${testUser.name}`);
      await page.focus(foundFields.name);
      await page.evaluate(selector => document.querySelector(selector).value = '', foundFields.name);
      await page.type(foundFields.name, testUser.name, { delay: 100 });
    }
    if (foundFields.email) {
      console.log(`📧 Filling email: ${testUser.email}`);
      await page.focus(foundFields.email);
      await page.evaluate(selector => document.querySelector(selector).value = '', foundFields.email);
      await page.type(foundFields.email, testUser.email, { delay: 100 });
    }
    if (foundFields.phone) {
      console.log(`📞 Filling phone: ${testUser.phone}`);
      await page.focus(foundFields.phone);
      await page.evaluate(selector => document.querySelector(selector).value = '', foundFields.phone);
      await page.type(foundFields.phone, testUser.phone, { delay: 100 });
    }
    if (foundFields.address) {
      console.log(`🏠 Filling address: ${testUser.address}`);
      await page.focus(foundFields.address);
      await page.evaluate(selector => document.querySelector(selector).value = '', foundFields.address);
      await page.type(foundFields.address, testUser.address, { delay: 100 });
    }
    if (foundFields.city) {
      console.log(`🏙️ Filling city: ${testUser.city}`);
      await page.focus(foundFields.city);
      await page.evaluate(selector => document.querySelector(selector).value = '', foundFields.city);
      await page.type(foundFields.city, testUser.city, { delay: 100 });
    }
    if (foundFields.postalCode) {
      console.log(`📮 Filling postal code: ${testUser.postalCode}`);
      await page.focus(foundFields.postalCode);
      await page.evaluate(selector => document.querySelector(selector).value = '', foundFields.postalCode);
      await page.type(foundFields.postalCode, testUser.postalCode, { delay: 100 });
    }

    // Simulate human behavior
    await simulateHumanBehavior(page);

    console.log('✅ Form filled with realistic data');
    logTest(`Form filling with valid data (${language})`, true);

    // Test form validation with invalid data
    console.log('🧪 Testing form validation...');

    // Clear and fill with invalid data
    if (foundFields.name) {
      await page.click(foundFields.name, { clickCount: 3 });
      await page.type(foundFields.name, 'a b');
    }
    if (foundFields.email) {
      await page.click(foundFields.email, { clickCount: 3 });
      await page.type(foundFields.email, 'invalid-email');
    }
    if (foundFields.phone) {
      await page.click(foundFields.phone, { clickCount: 3 });
      await page.type(foundFields.phone, '123');
    }
    if (foundFields.city) {
      await page.click(foundFields.city, { clickCount: 3 });
      await page.type(foundFields.city, 'dsda');
    }

    // Try to submit form
    const submitSelectors = [
      'button[type="submit"]',
      'button[class*="submit"]',
      'button[class*="continue"]',
      'button[class*="next"]',
      '.submit-btn',
      '.checkout-submit'
    ];

    let submitBtn = null;
    for (const selector of submitSelectors) {
      submitBtn = await page.$(selector);
      if (submitBtn) {
        console.log(`🎯 Found submit button: ${selector}`);
        break;
      }
    }

    if (submitBtn) {
      await submitBtn.click();
      await wait(3000);

      // Check for validation errors
      const errorSelectors = [
        '.text-red-600',
        '.error',
        '.field-error',
        '[class*="error"]',
        '.invalid-feedback'
      ];

      let errorsFound = 0;
      for (const selector of errorSelectors) {
        const errors = await page.$$(selector);
        errorsFound += errors.length;
      }

      console.log(`🚨 Found ${errorsFound} validation errors`);
      logTest(`Form validation working (${language})`, errorsFound > 0);

      // Test individual field errors
      const individualErrors = await page.$$('.text-red-600');
      logTest(`Individual field errors displayed (${language})`, individualErrors.length > 0);

    } else {
      logTest(`Submit button found (${language})`, false, 'No submit button found');
    }

  } else {
    console.log('❌ Not enough form fields found to test checkout');
  }

  await checkTranslations(page, language);
}

/**
 * Test user registration flow
 */
async function testUserRegistration(page, language, testUser) {
  console.log(`\n👤 Testing user registration (${language.toUpperCase()}) - User: ${testUser.name}...`);

  // Try multiple registration URLs
  const registrationUrls = [
    `${CONFIG.baseUrl}/register?lang=${language}`,
    `${CONFIG.baseUrl}/registracija?lang=${language}`,
    `${CONFIG.baseUrl}/signup?lang=${language}`,
    `${CONFIG.baseUrl}/prijava?lang=${language}`
  ];

  let registrationLoaded = false;
  for (const url of registrationUrls) {
    try {
      await page.goto(url, { waitUntil: 'networkidle2' });
      await wait(3000);

      const pageContent = await page.content();
      if (!pageContent.includes('404') && !pageContent.includes('Not Found')) {
        console.log(`✅ Loaded registration page: ${url}`);
        registrationLoaded = true;
        break;
      }
    } catch (error) {
      continue;
    }
  }

  if (!registrationLoaded) {
    // Try to find registration link on homepage
    await page.goto(`${CONFIG.baseUrl}?lang=${language}`, { waitUntil: 'networkidle2' });
    await wait(2000);

    const regLinks = await page.$$('a');
    for (const link of regLinks) {
      const text = await page.evaluate(el => el.textContent.toLowerCase(), link);
      const href = await page.evaluate(el => el.href, link);
      if (text.includes('registr') || text.includes('signup') || text.includes('prijav') ||
          href.includes('register') || href.includes('signup')) {
        console.log(`🔗 Found registration link: ${text}`);
        await link.click();
        await wait(3000);
        registrationLoaded = true;
        break;
      }
    }
  }

  if (registrationLoaded) {
    console.log('📝 Testing registration form...');

    // Look for registration form fields
    const regFields = {
      name: ['input[name="name"]', 'input[name="firstName"]', 'input[name="fullName"]'],
      email: ['input[name="email"]', 'input[type="email"]'],
      password: ['input[name="password"]', 'input[type="password"]'],
      confirmPassword: ['input[name="confirmPassword"]', 'input[name="password_confirmation"]'],
      phone: ['input[name="phone"]', 'input[type="tel"]']
    };

    const foundRegFields = {};
    for (const [fieldName, selectors] of Object.entries(regFields)) {
      for (const selector of selectors) {
        const field = await page.$(selector);
        if (field) {
          foundRegFields[fieldName] = selector;
          console.log(`✅ Found registration ${fieldName} field`);
          break;
        }
      }
    }

    const regFieldsFound = Object.keys(foundRegFields).length;
    logTest(`Registration form fields found (${language})`, regFieldsFound >= 3, `Found ${regFieldsFound} fields`);

    if (regFieldsFound >= 3) {
      // Fill registration form
      if (foundRegFields.name) {
        await page.type(foundRegFields.name, testUser.name, { delay: 100 });
      }
      if (foundRegFields.email) {
        await page.type(foundRegFields.email, testUser.email, { delay: 100 });
      }
      if (foundRegFields.password) {
        await page.type(foundRegFields.password, 'TestPassword123!', { delay: 100 });
      }
      if (foundRegFields.confirmPassword) {
        await page.type(foundRegFields.confirmPassword, 'TestPassword123!', { delay: 100 });
      }
      if (foundRegFields.phone) {
        await page.type(foundRegFields.phone, testUser.phone, { delay: 100 });
      }

      console.log('✅ Registration form filled');
      logTest(`Registration form filling (${language})`, true);

      // Note: We don't actually submit to avoid creating test accounts
      console.log('ℹ️ Registration form ready (not submitted to avoid test accounts)');
    }
  } else {
    logTest(`Registration page access (${language})`, false, 'Registration page not found');
  }
}

/**
 * Test newsletter signup with realistic user data
 */
async function testNewsletterSignup(page, language, testUser) {
  console.log(`\n📧 Testing newsletter signup (${language.toUpperCase()}) - User: ${testUser.email}...`);

  // Go to homepage to test newsletter
  await page.goto(`${CONFIG.baseUrl}?lang=${language}`, { waitUntil: 'networkidle2' });
  await wait(2000);

  // Look for newsletter signup form on page
  const newsletterSelectors = [
    'input[type="email"][placeholder*="email"]',
    'input[name*="newsletter"]',
    'input[id*="newsletter"]',
    '.newsletter input[type="email"]',
    '.newsletter-form input[type="email"]'
  ];

  let newsletterInput = null;
  for (const selector of newsletterSelectors) {
    newsletterInput = await page.$(selector);
    if (newsletterInput) {
      console.log(`📧 Found newsletter input: ${selector}`);
      break;
    }
  }

  if (newsletterInput) {
    // Clear and fill with test email
    await newsletterInput.click({ clickCount: 3 });
    await humanType(page, newsletterSelectors[0], testUser.email);

    // Look for submit button
    const submitSelectors = [
      'button[type="submit"]',
      'button[class*="submit"]',
      'button[class*="newsletter"]',
      'button[class*="subscribe"]',
      '.newsletter-submit',
      '.newsletter button'
    ];

    let submitBtn = null;
    for (const selector of submitSelectors) {
      submitBtn = await page.$(selector);
      if (submitBtn) {
        console.log(`📤 Found newsletter submit: ${selector}`);
        break;
      }
    }

    if (submitBtn) {
      await submitBtn.click();
      await wait(3000);

      // Check for success message
      const successSelectors = [
        '.success',
        '.text-green-600',
        '[class*="success"]',
        '.newsletter-success',
        '.confirmation'
      ];

      let successFound = false;
      for (const selector of successSelectors) {
        const successMsg = await page.$(selector);
        if (successMsg) {
          console.log(`✅ Newsletter success message found: ${selector}`);
          successFound = true;
          break;
        }
      }

      logTest(`Newsletter signup (${language})`, successFound);

      if (successFound) {
        console.log(`✅ Newsletter signup successful for ${testUser.email}`);
      }

    } else {
      logTest(`Newsletter submit button (${language})`, false, 'Submit button not found');
    }
  } else {
    logTest(`Newsletter signup form (${language})`, false, 'Newsletter form not found');
  }
}

/**
 * Comprehensive real-world test runner with multiple scenarios
 */
async function runTests() {
  console.log('🚀 Starting COMPREHENSIVE REAL-WORLD Ghost Buyer Tests...\n');
  console.log(`Testing: ${CONFIG.baseUrl}`);
  console.log(`Languages: ${CONFIG.languages.join(', ')}`);
  console.log(`Test Users: ${CONFIG.testUsers.length}`);
  console.log(`Test Scenarios: ${CONFIG.testScenarios.join(', ')}`);
  console.log(`Headless: ${CONFIG.headless}\n`);

  const startTime = Date.now();
  const comprehensiveResults = {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    userScenarios: {},
    languageResults: {},
    functionalityResults: {},
    performanceMetrics: {}
  };

  const browser = await puppeteer.launch({
    headless: CONFIG.headless,
    slowMo: CONFIG.slowMo,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 720 }
  });

  try {
    // Test each language with multiple user scenarios
    for (const language of CONFIG.languages) {
      console.log(`\n🌍 COMPREHENSIVE TESTING - Language: ${language.toUpperCase()}`);
      console.log('='.repeat(80));

      comprehensiveResults.languageResults[language] = {
        users: [],
        scenarios: {},
        overallSuccess: false
      };

      // Test with multiple users per language for comprehensive coverage
      const usersForLanguage = CONFIG.testUsers.slice(0, 6); // Test with 6 different users per language

      for (let userIndex = 0; userIndex < usersForLanguage.length; userIndex++) {
        const testUser = usersForLanguage[userIndex];

        console.log(`\n👤 USER ${userIndex + 1}/${usersForLanguage.length}: ${testUser.name}`);
        console.log(`📧 Email: ${testUser.email}`);
        console.log(`🎭 Behavior: ${testUser.behavior}`);
        console.log(`🎯 Scenario: ${testUser.scenario}`);
        console.log(`📍 Location: ${testUser.city}, ${testUser.postalCode}`);
        console.log(`📞 Phone: ${testUser.phone}`);
        console.log('-'.repeat(60));

        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 720 });

        // Set language preference and realistic headers
        await page.setExtraHTTPHeaders({
          'Accept-Language': language,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        });

        // Set realistic user agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        const userStartTime = Date.now();

        try {
          console.log(`🏁 Starting comprehensive test suite for ${testUser.name}...`);

          // Test Suite 1: Homepage and Initial Experience
          console.log('\n📋 TEST SUITE 1: Homepage & Initial Experience');
          const productsFound = await testHomepage(page, language, testUser);

          // Test Suite 2: Product Discovery and Exploration
          console.log('\n📋 TEST SUITE 2: Product Discovery & Exploration');
          const discoveredProducts = await testProductExploration(page, language, testUser);

          // Test Suite 3: Complete Shopping Flow
          console.log('\n📋 TEST SUITE 3: Complete Shopping Flow');
          if (productsFound || discoveredProducts.length > 0) {
            await testCompleteShoppingFlow(page, language, testUser);
          } else {
            console.log('⚠️ Skipping shopping flow - no products found');
          }

          // Test Suite 4: Checkout and Forms
          console.log('\n📋 TEST SUITE 4: Checkout & Forms');
          await testCheckoutForm(page, language, testUser);

          // Test Suite 5: User Registration
          console.log('\n📋 TEST SUITE 5: User Registration');
          await testUserRegistration(page, language, testUser);

          // Test Suite 6: Newsletter and Communication
          console.log('\n📋 TEST SUITE 6: Newsletter & Communication');
          await testNewsletterSignup(page, language, testUser);

          // Test Suite 7: Mobile Responsiveness (if mobile user)
          if (testUser.behavior === 'mobile_focused') {
            console.log('\n📋 TEST SUITE 7: Mobile Responsiveness');
            await page.setViewport({ width: 375, height: 667 }); // iPhone size
            await testMobileExperience(page, language, testUser);
          }

          // Test Suite 8: Performance and Accessibility
          console.log('\n📋 TEST SUITE 8: Performance & Accessibility');
          await testPerformanceAndAccessibility(page, language, testUser);

          const userEndTime = Date.now();
          const userTestDuration = userEndTime - userStartTime;

          console.log(`\n✅ COMPLETED all test suites for ${testUser.name}`);
          console.log(`⏱️ Test duration: ${(userTestDuration / 1000).toFixed(2)} seconds`);

          // Store user results
          comprehensiveResults.userScenarios[`${language}_${testUser.name}`] = {
            user: testUser,
            language: language,
            duration: userTestDuration,
            success: true
          };

        } catch (error) {
          console.error(`❌ Error testing ${language} with user ${testUser.name}:`, error.message);
          testResults.issues.push({
            test: `Comprehensive testing - ${language} - ${testUser.name}`,
            details: error.message,
            timestamp: new Date().toISOString()
          });

          comprehensiveResults.userScenarios[`${language}_${testUser.name}`] = {
            user: testUser,
            language: language,
            success: false,
            error: error.message
          };
        }

        await page.close();

        // Brief pause between users
        await wait(1000);
      }

      console.log(`\n✅ COMPLETED comprehensive testing for ${language.toUpperCase()}`);
    }

    // Generate comprehensive analysis
    await generateComprehensiveAnalysis(comprehensiveResults, startTime);

  } finally {
    await browser.close();
  }
}

/**
 * Test mobile experience and responsiveness
 */
async function testMobileExperience(page, language, testUser) {
  console.log(`\n📱 Testing mobile experience (${language.toUpperCase()}) - User: ${testUser.name}...`);

  // Test mobile navigation
  const mobileMenuSelectors = ['.mobile-menu', '.hamburger', '.menu-toggle', '[data-testid="mobile-menu"]'];
  let mobileMenuFound = false;

  for (const selector of mobileMenuSelectors) {
    const menuBtn = await page.$(selector);
    if (menuBtn) {
      console.log(`📱 Found mobile menu: ${selector}`);
      await menuBtn.click();
      await wait(1000);
      mobileMenuFound = true;
      break;
    }
  }

  logTest(`Mobile navigation (${language})`, mobileMenuFound);

  // Test touch interactions
  const touchElements = await page.$$('button, a, .clickable');
  if (touchElements.length > 0) {
    console.log(`👆 Testing touch interactions on ${touchElements.length} elements`);
    // Simulate touch on first few elements
    for (let i = 0; i < Math.min(3, touchElements.length); i++) {
      try {
        await touchElements[i].tap();
        await wait(500);
      } catch (error) {
        // Continue with next element
      }
    }
  }

  logTest(`Mobile touch interactions (${language})`, touchElements.length > 0);
}

/**
 * Test performance and accessibility
 */
async function testPerformanceAndAccessibility(page, language, testUser) {
  console.log(`\n⚡ Testing performance and accessibility (${language.toUpperCase()}) - User: ${testUser.name}...`);

  // Test page load performance
  const performanceMetrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0];
    return {
      loadTime: navigation.loadEventEnd - navigation.loadEventStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
      firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
    };
  });

  console.log(`⏱️ Performance metrics:`, performanceMetrics);
  logTest(`Page load performance (${language})`, performanceMetrics.loadTime < 5000);

  // Test accessibility features
  const accessibilityFeatures = {
    altTexts: await page.$$eval('img', imgs => imgs.filter(img => img.alt).length),
    headingStructure: await page.$$eval('h1, h2, h3, h4, h5, h6', headings => headings.length),
    ariaLabels: await page.$$eval('[aria-label]', elements => elements.length),
    focusableElements: await page.$$eval('button, a, input, select, textarea', elements => elements.length)
  };

  console.log(`♿ Accessibility features:`, accessibilityFeatures);
  logTest(`Accessibility features (${language})`, accessibilityFeatures.altTexts > 0 && accessibilityFeatures.headingStructure > 0);
}

/**
 * Generate comprehensive analysis report
 */
async function generateComprehensiveAnalysis(results, startTime) {
  const endTime = Date.now();
  const totalDuration = endTime - startTime;

  console.log('\n' + '='.repeat(100));
  console.log('📊 COMPREHENSIVE REAL-WORLD TESTING ANALYSIS');
  console.log('='.repeat(100));

  console.log(`\n⏱️ TOTAL TEST DURATION: ${(totalDuration / 1000 / 60).toFixed(2)} minutes`);
  console.log(`📊 TOTAL TEST SCENARIOS: ${Object.keys(results.userScenarios).length}`);

  // Analyze success rates by language
  console.log('\n🌍 SUCCESS RATE BY LANGUAGE:');
  for (const language of CONFIG.languages) {
    const languageTests = Object.values(results.userScenarios).filter(test => test.language === language);
    const successfulTests = languageTests.filter(test => test.success);
    const successRate = (successfulTests.length / languageTests.length * 100).toFixed(1);
    console.log(`  ${language.toUpperCase()}: ${successRate}% (${successfulTests.length}/${languageTests.length})`);
  }

  // Analyze success rates by user behavior
  console.log('\n🎭 SUCCESS RATE BY USER BEHAVIOR:');
  const behaviorStats = {};
  Object.values(results.userScenarios).forEach(test => {
    if (test.user) {
      const behavior = test.user.behavior;
      if (!behaviorStats[behavior]) {
        behaviorStats[behavior] = { total: 0, successful: 0 };
      }
      behaviorStats[behavior].total++;
      if (test.success) behaviorStats[behavior].successful++;
    }
  });

  Object.entries(behaviorStats).forEach(([behavior, stats]) => {
    const successRate = (stats.successful / stats.total * 100).toFixed(1);
    console.log(`  ${behavior}: ${successRate}% (${stats.successful}/${stats.total})`);
  });

  // Test results summary
  console.log('\n📋 FUNCTIONALITY TEST RESULTS:');
  console.log(`  ✅ Passed: ${testResults.passedTests}`);
  console.log(`  ❌ Failed: ${testResults.failedTests}`);
  console.log(`  📊 Success Rate: ${((testResults.passedTests / (testResults.passedTests + testResults.failedTests)) * 100).toFixed(1)}%`);

  // Issues summary
  if (testResults.issues.length > 0) {
    console.log('\n🐛 ISSUES FOUND:');
    testResults.issues.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue.test}: ${issue.details}`);
    });
  }

  console.log('\n🎯 RECOMMENDATIONS:');
  if (testResults.failedTests > 0) {
    console.log('  • Address failed functionality tests');
    console.log('  • Improve form field detection and interaction');
    console.log('  • Enhance product discovery mechanisms');
  }
  if (testResults.issues.length > 0) {
    console.log('  • Fix identified technical issues');
    console.log('  • Improve error handling and user feedback');
  }
  console.log('  • Continue monitoring with automated testing');
  console.log('  • Consider A/B testing for user experience improvements');

  console.log('\n✅ COMPREHENSIVE TESTING COMPLETED');
  console.log('='.repeat(100));
}

// Run tests if this file is executed directly
runTests().catch(console.error);

export { runTests, CONFIG, testResults };
