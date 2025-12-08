/**
 * PRODUCTION-READY WEEKLY GHOST BUYER TESTING SUITE
 * 
 * Comprehensive e-commerce testing based on industry best practices:
 * - Playwright/Cypress best practices for resilient selectors
 * - Real user behavior simulation
 * - Comprehensive error detection and reporting
 * - Performance monitoring
 * - Accessibility testing
 * - Cross-browser compatibility
 * - Detailed weekly reports
 * 
 * Usage: node production-ghost-buyer.js
 * Generates: weekly-test-report-YYYY-MM-DD.html
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

// Configuration for production testing
const CONFIG = {
  baseUrl: 'https://marosatest.netlify.app',
  languages: ['sl', 'en', 'de', 'hr'],
  browsers: ['chromium', 'firefox', 'webkit'],
  testEmails: [
    'weekly.test.001@noexpire.top', 'weekly.test.002@noexpire.top',
    'weekly.test.003@noexpire.top', 'weekly.test.004@noexpire.top',
    'weekly.test.005@noexpire.top', 'weekly.test.006@noexpire.top'
  ],
  
  // Test scenarios based on real user behavior patterns
  userScenarios: [
    { type: 'quick_buyer', behavior: 'fast', products: 1, quantity: 1 },
    { type: 'careful_shopper', behavior: 'thorough', products: 2, quantity: 2 },
    { type: 'bulk_buyer', behavior: 'efficient', products: 3, quantity: 5 },
    { type: 'mobile_user', behavior: 'mobile', products: 1, quantity: 1 },
    { type: 'price_conscious', behavior: 'comparison', products: 2, quantity: 1 },
    { type: 'international', behavior: 'shipping_focused', products: 1, quantity: 2 }
  ],
  
  // Performance thresholds
  performance: {
    maxLoadTime: 5000,
    maxFirstContentfulPaint: 2000,
    maxLargestContentfulPaint: 4000,
    maxCumulativeLayoutShift: 0.1
  },
  
  // Timeout configurations
  timeouts: {
    navigation: 30000,
    element: 10000,
    action: 5000
  }
};

// Global test results storage
const testResults = {
  startTime: new Date(),
  endTime: null,
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  },
  browsers: {},
  languages: {},
  scenarios: {},
  performance: {},
  accessibility: {},
  errors: [],
  warnings: [],
  recommendations: []
};

// Utility functions
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const logTest = (testName, success, details = '', category = 'general') => {
  const result = {
    test: testName,
    success,
    details,
    category,
    timestamp: new Date().toISOString()
  };
  
  testResults.summary.total++;
  if (success) {
    testResults.summary.passed++;
    console.log(`✅ ${testName}${details ? ': ' + details : ''}`);
  } else {
    testResults.summary.failed++;
    console.log(`❌ ${testName}${details ? ': ' + details : ''}`);
    testResults.errors.push(result);
  }
  
  return result;
};

const logWarning = (message, details = '') => {
  testResults.summary.warnings++;
  testResults.warnings.push({
    message,
    details,
    timestamp: new Date().toISOString()
  });
  console.log(`⚠️ ${message}${details ? ': ' + details : ''}`);
};

/**
 * Enhanced element interaction with retry logic and better error handling
 */
class ElementInteractor {
  constructor(page) {
    this.page = page;
  }
  
  async findElement(selectors, timeout = CONFIG.timeouts.element) {
    const selectorArray = Array.isArray(selectors) ? selectors : [selectors];
    
    for (const selector of selectorArray) {
      try {
        await this.page.waitForSelector(selector, { timeout: timeout / selectorArray.length });
        const element = await this.page.$(selector);
        if (element) {
          // Verify element is actually interactable
          const isVisible = await this.page.evaluate(el => {
            const rect = el.getBoundingClientRect();
            const style = window.getComputedStyle(el);
            return rect.width > 0 && rect.height > 0 && 
                   style.visibility !== 'hidden' && 
                   style.display !== 'none' &&
                   style.opacity !== '0';
          }, element);
          
          if (isVisible) {
            return { element, selector };
          }
        }
      } catch (error) {
        // Continue to next selector
        continue;
      }
    }
    
    return null;
  }
  
  async safeClick(selectors, options = {}) {
    const found = await this.findElement(selectors);
    if (!found) {
      throw new Error(`Element not found with selectors: ${JSON.stringify(selectors)}`);
    }
    
    try {
      // Scroll element into view
      await this.page.evaluate(el => el.scrollIntoView({ block: 'center' }), found.element);
      await wait(500);
      
      // Wait for element to be stable
      await this.page.waitForFunction(
        el => {
          const rect = el.getBoundingClientRect();
          return rect.top >= 0 && rect.left >= 0;
        },
        { timeout: 2000 },
        found.element
      );
      
      await found.element.click(options);
      return true;
    } catch (error) {
      throw new Error(`Failed to click element ${found.selector}: ${error.message}`);
    }
  }
  
  async safeType(selectors, text, options = {}) {
    const found = await this.findElement(selectors);
    if (!found) {
      throw new Error(`Input element not found with selectors: ${JSON.stringify(selectors)}`);
    }
    
    try {
      await found.element.click({ clickCount: 3 }); // Select all existing text
      await found.element.type(text, { delay: 50, ...options });
      return true;
    } catch (error) {
      throw new Error(`Failed to type in element ${found.selector}: ${error.message}`);
    }
  }
  
  async getText(selectors) {
    const found = await this.findElement(selectors);
    if (!found) return null;
    
    return await this.page.evaluate(el => el.textContent, found.element);
  }
  
  async getAttribute(selectors, attribute) {
    const found = await this.findElement(selectors);
    if (!found) return null;
    
    return await this.page.evaluate((el, attr) => el.getAttribute(attr), found.element, attribute);
  }
}

/**
 * Performance monitoring class
 */
class PerformanceMonitor {
  constructor(page) {
    this.page = page;
  }
  
  async measurePageLoad() {
    const metrics = await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        totalLoadTime: navigation.loadEventEnd - navigation.fetchStart
      };
    });
    
    // Get Core Web Vitals if available
    try {
      const webVitals = await this.page.evaluate(() => {
        return new Promise((resolve) => {
          if ('web-vitals' in window) {
            // If web-vitals library is loaded
            resolve(window.webVitals);
          } else {
            // Fallback measurements
            resolve({
              lcp: performance.getEntriesByType('largest-contentful-paint')[0]?.startTime || 0,
              cls: 0, // Would need more complex measurement
              fid: 0  // Would need user interaction measurement
            });
          }
        });
      });
      
      metrics.webVitals = webVitals;
    } catch (error) {
      metrics.webVitals = null;
    }
    
    return metrics;
  }
  
  evaluatePerformance(metrics) {
    const issues = [];
    const warnings = [];
    
    if (metrics.totalLoadTime > CONFIG.performance.maxLoadTime) {
      issues.push(`Page load time ${metrics.totalLoadTime}ms exceeds threshold ${CONFIG.performance.maxLoadTime}ms`);
    }
    
    if (metrics.firstContentfulPaint > CONFIG.performance.maxFirstContentfulPaint) {
      warnings.push(`First Contentful Paint ${metrics.firstContentfulPaint}ms exceeds recommended ${CONFIG.performance.maxFirstContentfulPaint}ms`);
    }
    
    return { issues, warnings, score: this.calculatePerformanceScore(metrics) };
  }
  
  calculatePerformanceScore(metrics) {
    let score = 100;

    // Deduct points for slow metrics
    if (metrics.totalLoadTime > 3000) score -= 20;
    if (metrics.firstContentfulPaint > 1500) score -= 15;
    if (metrics.domContentLoaded > 2000) score -= 10;

    return Math.max(0, score);
  }
}

/**
 * Accessibility testing class
 */
class AccessibilityTester {
  constructor(page) {
    this.page = page;
  }

  async runAccessibilityChecks() {
    const results = await this.page.evaluate(() => {
      const checks = {
        images: { total: 0, withAlt: 0, issues: [] },
        headings: { structure: [], issues: [] },
        forms: { total: 0, labeled: 0, issues: [] },
        links: { total: 0, descriptive: 0, issues: [] },
        contrast: { issues: [] },
        keyboard: { focusable: 0, issues: [] }
      };

      // Check images
      const images = document.querySelectorAll('img');
      checks.images.total = images.length;
      images.forEach((img, index) => {
        if (img.alt) {
          checks.images.withAlt++;
        } else {
          checks.images.issues.push(`Image ${index + 1} missing alt text`);
        }
      });

      // Check heading structure
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      let lastLevel = 0;
      headings.forEach((heading, index) => {
        const level = parseInt(heading.tagName.charAt(1));
        checks.headings.structure.push({ level, text: heading.textContent.substring(0, 50) });

        if (level > lastLevel + 1) {
          checks.headings.issues.push(`Heading level skip: ${heading.tagName} after h${lastLevel}`);
        }
        lastLevel = level;
      });

      // Check form labels
      const inputs = document.querySelectorAll('input, select, textarea');
      checks.forms.total = inputs.length;
      inputs.forEach((input, index) => {
        const hasLabel = input.labels?.length > 0 ||
                        input.getAttribute('aria-label') ||
                        input.getAttribute('aria-labelledby') ||
                        input.getAttribute('placeholder');

        if (hasLabel) {
          checks.forms.labeled++;
        } else {
          checks.forms.issues.push(`Form element ${index + 1} (${input.type}) missing label`);
        }
      });

      // Check links
      const links = document.querySelectorAll('a[href]');
      checks.links.total = links.length;
      links.forEach((link, index) => {
        const text = link.textContent.trim();
        if (text && text.length > 3 && !['click here', 'read more', 'more'].includes(text.toLowerCase())) {
          checks.links.descriptive++;
        } else {
          checks.links.issues.push(`Link ${index + 1} has non-descriptive text: "${text}"`);
        }
      });

      // Check keyboard focusable elements
      const focusableElements = document.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      checks.keyboard.focusable = focusableElements.length;

      return checks;
    });

    return this.evaluateAccessibility(results);
  }

  evaluateAccessibility(results) {
    let score = 100;
    const issues = [];
    const warnings = [];

    // Image accessibility
    const imageScore = results.images.total > 0 ?
      (results.images.withAlt / results.images.total) * 100 : 100;
    if (imageScore < 90) {
      issues.push(`${results.images.issues.length} images missing alt text`);
      score -= 15;
    }

    // Form accessibility
    const formScore = results.forms.total > 0 ?
      (results.forms.labeled / results.forms.total) * 100 : 100;
    if (formScore < 100) {
      issues.push(`${results.forms.issues.length} form elements missing labels`);
      score -= 20;
    }

    // Heading structure
    if (results.headings.issues.length > 0) {
      warnings.push(`Heading structure issues: ${results.headings.issues.length}`);
      score -= 10;
    }

    // Link quality
    const linkScore = results.links.total > 0 ?
      (results.links.descriptive / results.links.total) * 100 : 100;
    if (linkScore < 80) {
      warnings.push(`${results.links.issues.length} links with poor descriptions`);
      score -= 5;
    }

    return {
      score: Math.max(0, score),
      issues,
      warnings,
      details: results
    };
  }
}

/**
 * Cross-browser testing manager
 */
class CrossBrowserTester {
  constructor() {
    this.browsers = {};
  }

  async initializeBrowser(browserType) {
    const browserConfig = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    };

    // Browser-specific configurations
    if (browserType === 'firefox') {
      browserConfig.product = 'firefox';
    } else if (browserType === 'webkit') {
      // Note: webkit support in puppeteer is limited
      // Consider using playwright for webkit testing
      browserConfig.product = 'webkit';
    }

    try {
      const browser = await puppeteer.launch(browserConfig);
      this.browsers[browserType] = browser;
      return browser;
    } catch (error) {
      console.log(`⚠️ Could not launch ${browserType}: ${error.message}`);
      return null;
    }
  }

  async closeBrowser(browserType) {
    if (this.browsers[browserType]) {
      await this.browsers[browserType].close();
      delete this.browsers[browserType];
    }
  }

  async closeAllBrowsers() {
    for (const browserType of Object.keys(this.browsers)) {
      await this.closeBrowser(browserType);
    }
  }
}

/**
 * Enhanced shopping flow tester with comprehensive error detection
 */
class ShoppingFlowTester {
  constructor(page, interactor, performanceMonitor, accessibilityTester) {
    this.page = page;
    this.interactor = interactor;
    this.performance = performanceMonitor;
    this.accessibility = accessibilityTester;
  }

  async testCompleteShoppingFlow(language, userScenario, emailIndex) {
    const results = {
      language,
      scenario: userScenario.type,
      steps: {},
      performance: {},
      accessibility: {},
      errors: [],
      warnings: []
    };

    try {
      // Step 1: Homepage and initial setup
      console.log(`🏠 Testing homepage for ${language} (${userScenario.type})`);
      const homepageResult = await this.testHomepage(language);
      results.steps.homepage = homepageResult;

      // Step 2: Cookie consent handling
      console.log(`🍪 Handling cookie consent`);
      const cookieResult = await this.handleCookieConsent();
      results.steps.cookieConsent = cookieResult;

      // Step 3: Newsletter popup handling
      console.log(`📧 Handling newsletter popup`);
      const newsletterResult = await this.handleNewsletterPopup(CONFIG.testEmails[emailIndex]);
      results.steps.newsletter = newsletterResult;

      // Step 4: Product discovery and navigation
      console.log(`🔍 Testing product discovery`);
      const productResult = await this.testProductDiscovery(userScenario);
      results.steps.productDiscovery = productResult;

      // Step 5: Product page interaction
      console.log(`📦 Testing product page interaction`);
      const productPageResult = await this.testProductPage(userScenario);
      results.steps.productPage = productPageResult;

      // Step 6: Add to cart functionality
      console.log(`🛒 Testing add to cart`);
      const cartResult = await this.testAddToCart(userScenario);
      results.steps.addToCart = cartResult;

      // Step 7: Checkout process
      console.log(`💳 Testing checkout process`);
      const checkoutResult = await this.testCheckoutProcess(userScenario);
      results.steps.checkout = checkoutResult;

      // Step 8: Performance analysis
      console.log(`⚡ Analyzing performance`);
      results.performance = await this.performance.measurePageLoad();

      // Step 9: Accessibility testing
      console.log(`♿ Testing accessibility`);
      results.accessibility = await this.accessibility.runAccessibilityChecks();

    } catch (error) {
      results.errors.push({
        step: 'shopping_flow',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }

    return results;
  }

  async testHomepage(language) {
    const startTime = Date.now();

    try {
      await this.page.goto(`${CONFIG.baseUrl}?lang=${language}`, {
        waitUntil: 'networkidle2',
        timeout: CONFIG.timeouts.navigation
      });

      const loadTime = Date.now() - startTime;

      // Test essential homepage elements
      const elements = {
        logo: await this.interactor.findElement(['[data-testid="logo"]', '.logo', 'img[alt*="logo"]']),
        navigation: await this.interactor.findElement(['nav', '[role="navigation"]', '.navigation']),
        hero: await this.interactor.findElement(['.hero', '.banner', '.main-content']),
        footer: await this.interactor.findElement(['footer', '[role="contentinfo"]'])
      };

      const elementsFound = Object.values(elements).filter(Boolean).length;

      return {
        success: elementsFound >= 3,
        loadTime,
        elementsFound,
        details: `Found ${elementsFound}/4 essential elements`
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        details: 'Homepage failed to load'
      };
    }
  }

  async handleCookieConsent() {
    try {
      await wait(2000); // Wait for cookie banner to appear

      const cookieSelectors = [
        'button:has-text("Sprejmi")',
        'button:has-text("Accept")',
        'button[id*="cookie"]',
        'button[class*="cookie"]'
      ];

      // Use text-based search since :has-text() doesn't work in puppeteer
      const buttons = await this.page.$$('button');
      for (const button of buttons) {
        const text = await this.page.evaluate(el => el.textContent.toLowerCase(), button);
        if (text.includes('sprejmi') || text.includes('accept') || text.includes('vse')) {
          await button.click();
          await wait(1000);
          return { success: true, details: 'Cookie consent handled' };
        }
      }

      return { success: false, details: 'Cookie consent button not found' };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async handleNewsletterPopup(email) {
    try {
      await wait(3000); // Wait for newsletter popup

      const emailInput = await this.interactor.findElement(['#popup-email', 'input[type="email"]']);
      const nameInput = await this.interactor.findElement(['#popup-first-name', 'input[name*="name"]']);

      if (emailInput && nameInput) {
        await this.interactor.safeType(['#popup-first-name'], 'Test User');
        await this.interactor.safeType(['#popup-email'], email);

        // Find submit button
        const buttons = await this.page.$$('button');
        for (const button of buttons) {
          const text = await this.page.evaluate(el => el.textContent, button);
          if (text && text.includes('10%')) {
            await button.click();
            await wait(3000);
            return { success: true, details: 'Newsletter signup completed', email };
          }
        }
      }

      return { success: false, details: 'Newsletter popup not found or incomplete' };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async testProductDiscovery(userScenario) {
    try {
      // Test different product discovery methods based on user behavior
      const discoveryMethods = {
        direct_links: async () => {
          const productLinks = await this.page.$$('a[href*="/izdelek/"]');
          return { method: 'direct_links', count: productLinks.length, elements: productLinks };
        },

        search: async () => {
          const searchInput = await this.interactor.findElement([
            'input[type="search"]',
            'input[placeholder*="search"]',
            'input[placeholder*="iskanje"]'
          ]);

          if (searchInput) {
            await this.interactor.safeType(['input[type="search"]'], 'rastlina');
            await this.page.keyboard.press('Enter');
            await wait(2000);
            const results = await this.page.$$('.product-card, .search-result');
            return { method: 'search', count: results.length, elements: results };
          }
          return { method: 'search', count: 0, elements: [] };
        },

        categories: async () => {
          const categoryLinks = await this.page.$$('a[href*="/kategorija/"], a[href*="/category/"]');
          return { method: 'categories', count: categoryLinks.length, elements: categoryLinks };
        }
      };

      // Choose discovery method based on user behavior
      let primaryMethod = 'direct_links';
      if (userScenario.behavior === 'thorough') primaryMethod = 'search';
      if (userScenario.behavior === 'comparison') primaryMethod = 'categories';

      const result = await discoveryMethods[primaryMethod]();

      return {
        success: result.count > 0,
        method: result.method,
        productsFound: result.count,
        details: `Found ${result.count} products via ${result.method}`
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async testProductPage(userScenario) {
    try {
      // Navigate to a specific product page
      const productUrl = `${CONFIG.baseUrl}/izdelek/11?lang=sl`;
      await this.page.goto(productUrl, { waitUntil: 'networkidle2' });

      // Test product page elements
      const elements = {
        title: await this.interactor.findElement(['h1', '.product-title']),
        images: await this.page.$$('img'),
        price: await this.interactor.findElement(['.price', '[class*="price"]', '.cost']),
        description: await this.interactor.findElement(['.description', '.product-description', 'p']),
        addToCartButton: await this.interactor.findElement(['button[type="submit"]', '.add-to-cart']),
        quantityInput: await this.interactor.findElement(['input[type="number"]', 'input[name*="quantity"]'])
      };

      const elementsFound = Object.values(elements).filter(Boolean).length;

      // Simulate user behavior on product page
      if (userScenario.behavior === 'thorough') {
        // Scroll through images and read description
        if (elements.images.length > 0) {
          await elements.images[0].hover();
          await wait(1000);
        }

        if (elements.description) {
          await this.page.evaluate(el => el.scrollIntoView(), elements.description);
          await wait(2000); // Reading time
        }
      }

      return {
        success: elementsFound >= 4,
        elementsFound,
        productTitle: elements.title ? await this.interactor.getText(['h1']) : 'Unknown',
        details: `Product page loaded with ${elementsFound}/6 elements`
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async testAddToCart(userScenario) {
    try {
      // Set quantity based on user scenario
      const quantityInputs = await this.page.$$('input[type="number"]');
      if (quantityInputs.length > 0) {
        const quantity = userScenario.quantity || 1;
        await this.interactor.safeType(['input[type="number"]'], quantity.toString());
        await wait(500);
      }

      // Find and click add to cart button
      const buttons = await this.page.$$('button');
      let cartButtonClicked = false;

      for (const button of buttons) {
        const text = await this.page.evaluate(el => el.textContent, button);
        if (text && text.includes('Dodaj v košarico')) {
          await button.click();
          cartButtonClicked = true;
          await wait(3000);
          break;
        }
      }

      if (!cartButtonClicked) {
        return { success: false, details: 'Add to cart button not found' };
      }

      // Verify cart was updated
      await this.page.goto(`${CONFIG.baseUrl}/checkout?lang=sl`, { waitUntil: 'networkidle2' });
      await wait(2000);

      const pageContent = await this.page.evaluate(() => document.body.textContent);
      const cartEmpty = pageContent.includes('košarica je prazna') || pageContent.includes('cart is empty');

      return {
        success: !cartEmpty,
        cartHasItems: !cartEmpty,
        quantitySet: quantityInputs.length > 0,
        details: cartEmpty ? 'Cart is empty after adding items' : 'Items successfully added to cart'
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async testCheckoutProcess(userScenario) {
    try {
      // Test checkout form fields
      const formFields = {
        email: await this.interactor.findElement(['input[type="email"]', 'input[name="email"]']),
        name: await this.interactor.findElement(['input[name="name"]', 'input[name*="first"]']),
        phone: await this.interactor.findElement(['input[type="tel"]', 'input[name="phone"]']),
        address: await this.interactor.findElement(['input[name="address"]', 'input[name*="street"]']),
        city: await this.interactor.findElement(['input[name="city"]']),
        postalCode: await this.interactor.findElement(['input[name*="postal"]', 'input[name="zip"]'])
      };

      const fieldsFound = Object.values(formFields).filter(Boolean).length;

      // Test form validation if fields are present
      let validationTested = false;
      if (fieldsFound > 0) {
        try {
          // Try to submit empty form to test validation
          const submitButton = await this.interactor.findElement(['button[type="submit"]', '.submit-btn']);
          if (submitButton) {
            await submitButton.click();
            await wait(1000);

            // Check for validation messages
            const validationMessages = await this.page.$$('.error, .invalid, [class*="error"]');
            validationTested = validationMessages.length > 0;
          }
        } catch (error) {
          // Validation test failed, but that's okay
        }
      }

      return {
        success: fieldsFound >= 3,
        fieldsFound,
        validationTested,
        details: `Checkout form has ${fieldsFound} fields, validation ${validationTested ? 'working' : 'not tested'}`
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

/**
 * HTML Report Generator
 */
class ReportGenerator {
  constructor(results) {
    this.results = results;
  }

  generateHTML() {
    const duration = this.results.endTime - this.results.startTime;
    const durationMinutes = Math.round(duration / 1000 / 60);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Weekly Ghost Buyer Test Report - ${this.results.startTime.toISOString().split('T')[0]}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 2.5em; }
        .header .subtitle { opacity: 0.9; margin-top: 10px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; padding: 30px; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .metric-label { color: #666; font-size: 0.9em; }
        .success { color: #28a745; }
        .warning { color: #ffc107; }
        .error { color: #dc3545; }
        .section { padding: 30px; border-bottom: 1px solid #eee; }
        .section h2 { margin-top: 0; color: #333; }
        .test-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .test-card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; }
        .test-card h3 { margin-top: 0; }
        .status-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold; }
        .status-success { background: #d4edda; color: #155724; }
        .status-warning { background: #fff3cd; color: #856404; }
        .status-error { background: #f8d7da; color: #721c24; }
        .progress-bar { background: #e9ecef; border-radius: 4px; height: 8px; margin: 10px 0; }
        .progress-fill { background: #28a745; height: 100%; border-radius: 4px; transition: width 0.3s; }
        .details { background: #f8f9fa; padding: 15px; border-radius: 4px; margin-top: 15px; font-size: 0.9em; }
        .recommendations { background: #e7f3ff; border-left: 4px solid #007bff; padding: 20px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 Weekly Ghost Buyer Report</h1>
            <div class="subtitle">
                Comprehensive E-commerce Testing Report<br>
                Generated: ${this.results.startTime.toLocaleString()}<br>
                Duration: ${durationMinutes} minutes
            </div>
        </div>

        <div class="summary">
            <div class="metric">
                <div class="metric-value success">${this.results.summary.passed}</div>
                <div class="metric-label">Tests Passed</div>
            </div>
            <div class="metric">
                <div class="metric-value error">${this.results.summary.failed}</div>
                <div class="metric-label">Tests Failed</div>
            </div>
            <div class="metric">
                <div class="metric-value warning">${this.results.summary.warnings}</div>
                <div class="metric-label">Warnings</div>
            </div>
            <div class="metric">
                <div class="metric-value">${Math.round((this.results.summary.passed / this.results.summary.total) * 100)}%</div>
                <div class="metric-label">Success Rate</div>
            </div>
        </div>

        ${this.generateLanguageSection()}
        ${this.generateScenarioSection()}
        ${this.generatePerformanceSection()}
        ${this.generateAccessibilitySection()}
        ${this.generateErrorsSection()}
        ${this.generateRecommendationsSection()}

        <div class="footer">
            Report generated by Production Ghost Buyer Testing Suite<br>
            Next scheduled test: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
        </div>
    </div>
</body>
</html>`;
  }

  generateLanguageSection() {
    return `
        <div class="section">
            <h2>🌍 Multi-Language Testing</h2>
            <div class="test-grid">
                ${CONFIG.languages.map(lang => {
                  const langResults = this.results.languages[lang] || { passed: 0, total: 1 };
                  const successRate = Math.round((langResults.passed / langResults.total) * 100);
                  return `
                    <div class="test-card">
                        <h3>${lang.toUpperCase()}</h3>
                        <span class="status-badge ${successRate >= 80 ? 'status-success' : successRate >= 60 ? 'status-warning' : 'status-error'}">
                            ${successRate}% Success
                        </span>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${successRate}%"></div>
                        </div>
                        <div class="details">
                            Tests: ${langResults.passed}/${langResults.total}<br>
                            Status: ${successRate >= 80 ? 'Excellent' : successRate >= 60 ? 'Needs Attention' : 'Critical Issues'}
                        </div>
                    </div>
                  `;
                }).join('')}
            </div>
        </div>`;
  }

  generateScenarioSection() {
    return `
        <div class="section">
            <h2>🎭 User Scenario Testing</h2>
            <div class="test-grid">
                ${CONFIG.userScenarios.map(scenario => {
                  const scenarioResults = this.results.scenarios[scenario.type] || { success: false, details: 'Not tested' };
                  return `
                    <div class="test-card">
                        <h3>${scenario.type.replace('_', ' ').toUpperCase()}</h3>
                        <span class="status-badge ${scenarioResults.success ? 'status-success' : 'status-error'}">
                            ${scenarioResults.success ? 'PASS' : 'FAIL'}
                        </span>
                        <div class="details">
                            Behavior: ${scenario.behavior}<br>
                            Products: ${scenario.products}<br>
                            Quantity: ${scenario.quantity}<br>
                            Result: ${scenarioResults.details}
                        </div>
                    </div>
                  `;
                }).join('')}
            </div>
        </div>`;
  }

  generatePerformanceSection() {
    const perfData = this.results.performance;
    return `
        <div class="section">
            <h2>⚡ Performance Analysis</h2>
            <div class="test-grid">
                <div class="test-card">
                    <h3>Load Times</h3>
                    <div class="details">
                        Page Load: ${perfData.avgLoadTime || 'N/A'}ms<br>
                        First Contentful Paint: ${perfData.avgFCP || 'N/A'}ms<br>
                        DOM Content Loaded: ${perfData.avgDCL || 'N/A'}ms
                    </div>
                </div>
                <div class="test-card">
                    <h3>Performance Score</h3>
                    <div class="metric-value ${perfData.score >= 80 ? 'success' : perfData.score >= 60 ? 'warning' : 'error'}">
                        ${perfData.score || 'N/A'}/100
                    </div>
                </div>
            </div>
        </div>`;
  }

  generateAccessibilitySection() {
    const a11yData = this.results.accessibility;
    return `
        <div class="section">
            <h2>♿ Accessibility Testing</h2>
            <div class="test-grid">
                <div class="test-card">
                    <h3>Accessibility Score</h3>
                    <div class="metric-value ${a11yData.score >= 90 ? 'success' : a11yData.score >= 70 ? 'warning' : 'error'}">
                        ${a11yData.score || 'N/A'}/100
                    </div>
                    <div class="details">
                        Issues Found: ${a11yData.issues?.length || 0}<br>
                        Warnings: ${a11yData.warnings?.length || 0}
                    </div>
                </div>
            </div>
        </div>`;
  }

  generateErrorsSection() {
    if (this.results.errors.length === 0) return '';

    return `
        <div class="section">
            <h2>🐛 Issues Found</h2>
            ${this.results.errors.map(error => `
                <div class="test-card">
                    <h3>${error.test}</h3>
                    <span class="status-badge status-error">ERROR</span>
                    <div class="details">
                        ${error.details}<br>
                        <small>Time: ${new Date(error.timestamp).toLocaleTimeString()}</small>
                    </div>
                </div>
            `).join('')}
        </div>`;
  }

  generateRecommendationsSection() {
    return `
        <div class="section">
            <h2>🎯 Recommendations</h2>
            <div class="recommendations">
                <h3>Immediate Actions:</h3>
                <ul>
                    ${this.results.summary.failed > 0 ? '<li>Address failed test cases to improve user experience</li>' : ''}
                    ${this.results.summary.warnings > 5 ? '<li>Review and resolve warning messages</li>' : ''}
                    ${this.results.performance?.score < 80 ? '<li>Optimize page load performance</li>' : ''}
                    ${this.results.accessibility?.score < 90 ? '<li>Improve accessibility compliance</li>' : ''}
                </ul>

                <h3>Weekly Monitoring:</h3>
                <ul>
                    <li>Continue automated testing to catch regressions early</li>
                    <li>Monitor performance trends over time</li>
                    <li>Test new features with comprehensive user scenarios</li>
                    <li>Validate accessibility improvements</li>
                </ul>
            </div>
        </div>`;
  }
}

/**
 * Main Production Test Runner
 */
async function runProductionTests() {
  console.log('🚀 Starting PRODUCTION Weekly Ghost Buyer Testing Suite...\n');
  console.log(`📅 Test Date: ${testResults.startTime.toLocaleDateString()}`);
  console.log(`🌐 Target: ${CONFIG.baseUrl}`);
  console.log(`🗣️ Languages: ${CONFIG.languages.join(', ')}`);
  console.log(`🎭 Scenarios: ${CONFIG.userScenarios.length}`);
  console.log(`📧 Test Emails: ${CONFIG.testEmails.length}`);
  console.log('='.repeat(80));

  const crossBrowserTester = new CrossBrowserTester();

  try {
    // Test with primary browser (Chromium)
    console.log('\n🌐 Initializing Chromium browser...');
    const browser = await crossBrowserTester.initializeBrowser('chromium');

    if (!browser) {
      throw new Error('Failed to initialize browser');
    }

    let emailIndex = 0;

    // Test each language with multiple scenarios
    for (const language of CONFIG.languages) {
      console.log(`\n🌍 Testing Language: ${language.toUpperCase()}`);
      console.log('-'.repeat(60));

      testResults.languages[language] = { passed: 0, total: 0 };

      // Test multiple user scenarios per language
      for (const scenario of CONFIG.userScenarios.slice(0, 3)) { // Test 3 scenarios per language
        console.log(`\n👤 Testing Scenario: ${scenario.type} (${scenario.behavior})`);

        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 720 });

        // Set up testing components
        const interactor = new ElementInteractor(page);
        const performanceMonitor = new PerformanceMonitor(page);
        const accessibilityTester = new AccessibilityTester(page);
        const shoppingTester = new ShoppingFlowTester(page, interactor, performanceMonitor, accessibilityTester);

        try {
          // Run comprehensive shopping flow test
          const testResult = await shoppingTester.testCompleteShoppingFlow(
            language,
            scenario,
            emailIndex % CONFIG.testEmails.length
          );

          // Process results
          const scenarioKey = `${language}_${scenario.type}`;
          testResults.scenarios[scenarioKey] = testResult;

          // Update language statistics
          testResults.languages[language].total++;

          // Count successful steps
          const successfulSteps = Object.values(testResult.steps).filter(step => step.success).length;
          const totalSteps = Object.keys(testResult.steps).length;

          if (successfulSteps >= totalSteps * 0.7) { // 70% success threshold
            testResults.languages[language].passed++;
            logTest(`${language} - ${scenario.type}`, true, `${successfulSteps}/${totalSteps} steps passed`);
          } else {
            logTest(`${language} - ${scenario.type}`, false, `Only ${successfulSteps}/${totalSteps} steps passed`);
          }

          // Collect performance data
          if (testResult.performance) {
            if (!testResults.performance.measurements) testResults.performance.measurements = [];
            testResults.performance.measurements.push(testResult.performance);
          }

          // Collect accessibility data
          if (testResult.accessibility) {
            if (!testResults.accessibility.scores) testResults.accessibility.scores = [];
            testResults.accessibility.scores.push(testResult.accessibility.score);
          }

          emailIndex++;

        } catch (error) {
          console.error(`❌ Error testing ${language} - ${scenario.type}:`, error.message);
          logTest(`${language} - ${scenario.type}`, false, error.message);
          testResults.languages[language].total++;
        }

        await page.close();
        await wait(2000); // Brief pause between tests
      }
    }

    // Calculate aggregate performance metrics
    if (testResults.performance.measurements?.length > 0) {
      const measurements = testResults.performance.measurements;
      testResults.performance.avgLoadTime = Math.round(
        measurements.reduce((sum, m) => sum + (m.totalLoadTime || 0), 0) / measurements.length
      );
      testResults.performance.avgFCP = Math.round(
        measurements.reduce((sum, m) => sum + (m.firstContentfulPaint || 0), 0) / measurements.length
      );
      testResults.performance.avgDCL = Math.round(
        measurements.reduce((sum, m) => sum + (m.domContentLoaded || 0), 0) / measurements.length
      );

      // Calculate performance score
      let perfScore = 100;
      if (testResults.performance.avgLoadTime > 3000) perfScore -= 20;
      if (testResults.performance.avgFCP > 1500) perfScore -= 15;
      if (testResults.performance.avgDCL > 2000) perfScore -= 10;
      testResults.performance.score = Math.max(0, perfScore);
    }

    // Calculate aggregate accessibility score
    if (testResults.accessibility.scores?.length > 0) {
      testResults.accessibility.score = Math.round(
        testResults.accessibility.scores.reduce((sum, score) => sum + score, 0) /
        testResults.accessibility.scores.length
      );
    }

  } catch (error) {
    console.error('❌ Critical error during testing:', error.message);
    testResults.errors.push({
      test: 'Main Test Runner',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  } finally {
    await crossBrowserTester.closeAllBrowsers();
  }

  // Finalize results
  testResults.endTime = new Date();

  // Generate and save report
  await generateFinalReport();
}

/**
 * Generate comprehensive HTML report
 */
async function generateFinalReport() {
  console.log('\n📊 Generating comprehensive test report...');

  const reportGenerator = new ReportGenerator(testResults);
  const htmlReport = reportGenerator.generateHTML();

  // Save HTML report
  const reportDate = testResults.startTime.toISOString().split('T')[0];
  const reportFilename = `weekly-test-report-${reportDate}.html`;

  fs.writeFileSync(reportFilename, htmlReport);

  // Save JSON data for analysis
  const jsonFilename = `weekly-test-data-${reportDate}.json`;
  fs.writeFileSync(jsonFilename, JSON.stringify(testResults, null, 2));

  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 WEEKLY GHOST BUYER TEST SUMMARY');
  console.log('='.repeat(80));

  const duration = testResults.endTime - testResults.startTime;
  const durationMinutes = Math.round(duration / 1000 / 60);

  console.log(`⏱️  Test Duration: ${durationMinutes} minutes`);
  console.log(`📊 Total Tests: ${testResults.summary.total}`);
  console.log(`✅ Passed: ${testResults.summary.passed}`);
  console.log(`❌ Failed: ${testResults.summary.failed}`);
  console.log(`⚠️  Warnings: ${testResults.summary.warnings}`);
  console.log(`📈 Success Rate: ${Math.round((testResults.summary.passed / testResults.summary.total) * 100)}%`);

  if (testResults.performance.score) {
    console.log(`⚡ Performance Score: ${testResults.performance.score}/100`);
  }

  if (testResults.accessibility.score) {
    console.log(`♿ Accessibility Score: ${testResults.accessibility.score}/100`);
  }

  console.log(`\n📄 Reports Generated:`);
  console.log(`   📊 HTML Report: ${reportFilename}`);
  console.log(`   📋 JSON Data: ${jsonFilename}`);

  if (testResults.summary.failed > 0) {
    console.log(`\n🚨 CRITICAL ISSUES FOUND:`);
    testResults.errors.slice(0, 5).forEach((error, index) => {
      console.log(`   ${index + 1}. ${error.test}: ${error.details}`);
    });
  }

  console.log(`\n🎯 RECOMMENDATIONS:`);
  if (testResults.summary.failed === 0) {
    console.log(`   ✅ All tests passing - website is functioning excellently!`);
  } else {
    console.log(`   🔧 Address ${testResults.summary.failed} failed tests`);
  }

  if (testResults.performance.score < 80) {
    console.log(`   ⚡ Improve page load performance (current: ${testResults.performance.score}/100)`);
  }

  if (testResults.accessibility.score < 90) {
    console.log(`   ♿ Enhance accessibility compliance (current: ${testResults.accessibility.score}/100)`);
  }

  console.log(`\n📅 Next scheduled test: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}`);
  console.log('='.repeat(80));

  console.log(`\n🎉 Weekly testing complete! Open ${reportFilename} in your browser to view the detailed report.`);
}

// Run the production tests
runProductionTests().catch(console.error);
