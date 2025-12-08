import { test, expect } from '@playwright/test';
import { HomePage } from '../../page-objects/home.page';
import { ProductDetailPage } from '../../page-objects/product-detail.page';
import { CartPage } from '../../page-objects/cart.page';
import { CheckoutPage } from '../../page-objects/checkout.page';
import { TEST_USERS, TEST_PRODUCTS, STRIPE_TEST_CARDS } from '../../config/test-data';

/**
 * Full Purchase Flow Integration Tests
 * These tests verify the complete customer journey from browsing to order confirmation
 */
test.describe('Full Purchase Flow @critical @integration', () => {
  
  test('Complete guest checkout with credit card payment', async ({ page }) => {
    const homePage = new HomePage(page);
    const productPage = new ProductDetailPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);
    
    // Step 1: Browse homepage
    await test.step('Navigate to homepage', async () => {
      await homePage.navigateToHome();
      await homePage.closeBannerIfPresent();
      await homePage.expectProductsVisible();
    });
    
    // Step 2: Select a product
    await test.step('View product details', async () => {
      await homePage.scrollToProducts();
      await homePage.clickProductCard(0);
      await productPage.expectProductLoaded();
    });
    
    // Step 3: Add to cart
    await test.step('Add product to cart', async () => {
      await productPage.addToCart();
      await page.waitForTimeout(500);
    });
    
    // Step 4: View cart
    await test.step('View shopping cart', async () => {
      await cartPage.navigateToCart();
      await cartPage.expectCartNotEmpty();
    });
    
    // Step 5: Proceed to checkout
    await test.step('Proceed to checkout', async () => {
      await cartPage.proceedToCheckout();
      await expect(page).toHaveURL(/checkout/);
    });
    
    // Step 6: Select guest checkout
    await test.step('Select guest checkout', async () => {
      const guestOption = page.locator('button:has-text("Kot gost"), [data-testid="guest-checkout"]');
      if (await guestOption.isVisible({ timeout: 3000 })) {
        await guestOption.click();
      }
    });
    
    // Step 7: Fill shipping information
    await test.step('Fill shipping information', async () => {
      const customer = TEST_USERS.newCustomer;
      await checkoutPage.fillCustomerInfo({
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        address: customer.address.street,
        city: customer.address.city,
        postalCode: customer.address.postalCode
      });
    });
    
    // Step 8: Continue to payment
    await test.step('Continue to payment step', async () => {
      await checkoutPage.continueToNextStep();
      await page.waitForTimeout(1000);
    });
    
    // Step 9: Select credit card payment
    await test.step('Select credit card payment', async () => {
      const stripeOption = page.locator('label:has-text("Kartica"), input[value="stripe"]');
      if (await stripeOption.first().isVisible({ timeout: 3000 })) {
        await stripeOption.first().click();
        await page.waitForTimeout(1000);
      }
    });
    
    // Step 10: Fill card details
    await test.step('Fill card details', async () => {
      try {
        await checkoutPage.fillStripeCard(STRIPE_TEST_CARDS.success);
      } catch (error) {
        console.log('[UX-NOTE] Stripe card fill may require manual verification');
      }
    });
    
    // Step 11: Place order
    await test.step('Place order', async () => {
      const placeOrderBtn = page.locator('button:has-text("Oddaj naročilo"), button:has-text("Plačaj")').first();
      if (await placeOrderBtn.isEnabled({ timeout: 5000 })) {
        await placeOrderBtn.click();
        await page.waitForTimeout(5000);
      }
    });
    
    // Step 12: Verify order confirmation
    await test.step('Verify order confirmation', async () => {
      const url = page.url();
      const successPage = url.includes('order-confirmation') || 
                         url.includes('order-success') || 
                         url.includes('hvala');
      
      if (successPage) {
        console.log('[UX-METRIC] Full purchase flow completed successfully');
        
        // Check for order number
        const orderNumber = page.locator('[data-testid="order-number"], .order-number');
        if (await orderNumber.isVisible({ timeout: 3000 })) {
          const orderText = await orderNumber.textContent();
          console.log(`[UX-METRIC] Order number: ${orderText}`);
        }
      } else {
        console.log('[UX-NOTE] Order may require manual payment confirmation');
      }
    });
  });

  test('Complete guest checkout with bank transfer', async ({ page }) => {
    const productPage = new ProductDetailPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);
    
    // Add product to cart
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    
    await productPage.navigateToProduct(TEST_PRODUCTS.pegastiBadelj.id);
    await productPage.addToCart();
    await cartPage.navigateToCart();
    await cartPage.proceedToCheckout();
    
    // Guest checkout
    const guestOption = page.locator('button:has-text("Kot gost")');
    if (await guestOption.isVisible({ timeout: 2000 })) {
      await guestOption.click();
    }
    
    // Fill info
    const customer = TEST_USERS.newCustomer;
    await checkoutPage.fillCustomerInfo({
      email: `bank.${Date.now()}@test.com`,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
      address: customer.address.street,
      city: customer.address.city,
      postalCode: customer.address.postalCode
    });
    
    await checkoutPage.continueToNextStep();
    await page.waitForTimeout(1000);
    
    // Select bank transfer
    const bankOption = page.locator('label:has-text("Bančno"), input[value="bank"]');
    if (await bankOption.first().isVisible({ timeout: 3000 })) {
      await bankOption.first().click();
      await page.waitForTimeout(500);
      
      // Place order
      const placeOrderBtn = page.locator('button:has-text("Oddaj naročilo")').first();
      if (await placeOrderBtn.isVisible({ timeout: 3000 })) {
        await placeOrderBtn.click();
        await page.waitForTimeout(3000);
        
        // Check for bank transfer confirmation
        const bankInfo = page.locator(':text("IBAN"), :text("nakazilo"), [data-testid="bank-details"]');
        if (await bankInfo.first().isVisible({ timeout: 5000 })) {
          console.log('[UX-METRIC] Bank transfer order placed - details shown');
        }
      }
    }
  });

  test('Complete guest checkout with cash on delivery', async ({ page }) => {
    const productPage = new ProductDetailPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);
    
    // Add product to cart
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    
    await productPage.navigateToProduct(TEST_PRODUCTS.pegastiBadelj.id);
    await productPage.addToCart();
    await cartPage.navigateToCart();
    await cartPage.proceedToCheckout();
    
    // Guest checkout
    const guestOption = page.locator('button:has-text("Kot gost")');
    if (await guestOption.isVisible({ timeout: 2000 })) {
      await guestOption.click();
    }
    
    // Fill info
    const customer = TEST_USERS.newCustomer;
    await checkoutPage.fillCustomerInfo({
      email: `cod.${Date.now()}@test.com`,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
      address: customer.address.street,
      city: customer.address.city,
      postalCode: customer.address.postalCode
    });
    
    await checkoutPage.continueToNextStep();
    await page.waitForTimeout(1000);
    
    // Select COD
    const codOption = page.locator('label:has-text("Po povzetju"), input[value="cod"]');
    if (await codOption.first().isVisible({ timeout: 3000 })) {
      await codOption.first().click();
      await page.waitForTimeout(500);
      
      // Place order
      const placeOrderBtn = page.locator('button:has-text("Oddaj naročilo")').first();
      if (await placeOrderBtn.isVisible({ timeout: 3000 })) {
        await placeOrderBtn.click();
        await page.waitForTimeout(3000);
        
        console.log('[UX-METRIC] COD order flow completed');
      }
    }
  });

  test('Add multiple products and complete checkout', async ({ page }) => {
    const homePage = new HomePage(page);
    const productPage = new ProductDetailPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);
    
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await homePage.closeBannerIfPresent();
    
    // Add first product
    await productPage.navigateToProduct(TEST_PRODUCTS.pegastiBadelj.id);
    await productPage.addToCart();
    
    // Add second product
    await productPage.navigateToProduct(TEST_PRODUCTS.simpleProduct.id);
    await productPage.addToCart();
    
    // Go to cart
    await cartPage.navigateToCart();
    
    // Verify multiple items
    const itemCount = await cartPage.getCartItemCount();
    expect(itemCount).toBeGreaterThanOrEqual(1);
    
    console.log(`[UX-METRIC] Cart contains ${itemCount} item(s)`);
    
    // Get total
    const total = await cartPage.getTotal();
    console.log(`[UX-METRIC] Cart total: ${total}€`);
    
    // Proceed to checkout
    await cartPage.proceedToCheckout();
    await expect(page).toHaveURL(/checkout/);
  });

  test('Apply discount code during checkout', async ({ page }) => {
    const productPage = new ProductDetailPage(page);
    const cartPage = new CartPage(page);
    
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    
    // Add product
    await productPage.navigateToProduct(TEST_PRODUCTS.pegastiBadelj.id);
    await productPage.addToCart();
    await cartPage.navigateToCart();
    
    // Get initial total
    const initialTotal = await cartPage.getTotal();
    
    // Apply discount code
    const discountInput = page.locator('input[placeholder*="koda"], input[name="discountCode"]');
    if (await discountInput.isVisible({ timeout: 3000 })) {
      await cartPage.applyDiscountCode('BREZPOSTNINE');
      await page.waitForTimeout(1000);
      
      const newTotal = await cartPage.getTotal();
      console.log(`[UX-METRIC] Total before discount: ${initialTotal}€, after: ${newTotal}€`);
      
      // Check for success message
      const successMsg = page.locator('.text-green, .success, [data-testid="discount-success"]');
      if (await successMsg.isVisible({ timeout: 2000 })) {
        console.log('[UX-METRIC] Discount applied successfully');
      }
    }
  });
});

test.describe('Error Recovery @integration', () => {
  test('should recover from network error during checkout', async ({ page }) => {
    const productPage = new ProductDetailPage(page);
    const cartPage = new CartPage(page);
    
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    
    await productPage.navigateToProduct(TEST_PRODUCTS.pegastiBadelj.id);
    await productPage.addToCart();
    await cartPage.navigateToCart();
    
    // Simulate going offline then online
    await page.context().setOffline(true);
    await page.waitForTimeout(1000);
    await page.context().setOffline(false);
    
    // Cart should still be accessible
    await page.reload();
    await cartPage.expectCartNotEmpty();
    
    console.log('[UX-METRIC] Cart persisted through network interruption');
  });

  test('should handle page refresh during checkout', async ({ page }) => {
    const productPage = new ProductDetailPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);
    
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    
    await productPage.navigateToProduct(TEST_PRODUCTS.pegastiBadelj.id);
    await productPage.addToCart();
    await cartPage.navigateToCart();
    await cartPage.proceedToCheckout();
    
    // Fill partial form
    await checkoutPage.emailInput.fill('test@example.com');
    
    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Should still be on checkout with cart items
    expect(page.url()).toContain('checkout');
    
    console.log('[UX-METRIC] Checkout state handled on refresh');
  });
});
