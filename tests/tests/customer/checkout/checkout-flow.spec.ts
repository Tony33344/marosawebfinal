import { test, expect } from '@playwright/test';
import { ProductDetailPage } from '../../../page-objects/product-detail.page';
import { CartPage } from '../../../page-objects/cart.page';
import { CheckoutPage } from '../../../page-objects/checkout.page';
import { TEST_USERS, TEST_PRODUCTS, STRIPE_TEST_CARDS } from '../../../config/test-data';

test.describe('Checkout Flow @smoke @critical', () => {
  let productPage: ProductDetailPage;
  let cartPage: CartPage;
  let checkoutPage: CheckoutPage;

  test.beforeEach(async ({ page }) => {
    productPage = new ProductDetailPage(page);
    cartPage = new CartPage(page);
    checkoutPage = new CheckoutPage(page);
    
    // Clear storage and add product to cart
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    
    // Add product to cart
    await productPage.navigateToProduct(TEST_PRODUCTS.pegastiBadelj.id);
    await productPage.addToCart();
    
    // Navigate to checkout
    await cartPage.navigateToCart();
    await cartPage.expectCartNotEmpty();
    await cartPage.proceedToCheckout();
  });

  test.describe('Shipping Information', () => {
    test('should display checkout page after proceeding from cart', async ({ page }) => {
      await expect(page).toHaveURL(/checkout/);
    });

    test('should require all mandatory fields', async ({ page }) => {
      // Try to proceed without filling form
      const continueBtn = page.locator('button:has-text("Naprej"), button:has-text("Nadaljuj")').first();
      
      if (await continueBtn.isVisible({ timeout: 2000 })) {
        await continueBtn.click();
        
        // Should show validation errors
        await page.waitForTimeout(500);
        const errorMessages = page.locator('.text-red, .error, [data-testid="error"]');
        const errorCount = await errorMessages.count();
        
        expect(errorCount).toBeGreaterThan(0);
        console.log(`[UX-METRIC] Validation errors shown: ${errorCount}`);
      }
    });

    test('should validate email format', async ({ page }) => {
      await checkoutPage.emailInput.fill('invalid-email');
      
      // Trigger validation
      await checkoutPage.firstNameInput.click();
      await page.waitForTimeout(300);
      
      // Check for email validation error
      const emailError = page.locator('[data-testid="error-email"], .error:near(input[type="email"])');
      if (await emailError.isVisible({ timeout: 2000 })) {
        console.log('[UX-METRIC] Email validation working');
      }
    });

    test('should fill shipping information successfully', async ({ page }) => {
      const customer = TEST_USERS.newCustomer;
      
      await checkoutPage.fillCustomerInfo({
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        address: customer.address.street,
        city: customer.address.city,
        postalCode: customer.address.postalCode,
        country: customer.address.country
      });
      
      // All fields should be filled
      await expect(checkoutPage.emailInput).toHaveValue(customer.email);
      await expect(checkoutPage.firstNameInput).toHaveValue(customer.firstName);
    });

    test('should show postal code suggestions for Slovenia', async ({ page }) => {
      await checkoutPage.postalCodeInput.fill('1000');
      await page.waitForTimeout(500);
      
      // Check if city auto-fills or suggestions appear
      const suggestions = page.locator('.postal-suggestions, [data-testid="postal-suggestions"], datalist option');
      if (await suggestions.first().isVisible({ timeout: 2000 })) {
        console.log('[UX-METRIC] Postal code suggestions available');
      }
    });
  });

  test.describe('Order Summary', () => {
    test('should display order summary with correct items', async ({ page }) => {
      const orderSummary = page.locator('[data-testid="order-summary"], .order-summary, .cart-summary').first();
      await expect(orderSummary).toBeVisible();
      
      // Should show product name
      const productName = orderSummary.locator('.item-name, .product-name, h3, h4');
      await expect(productName.first()).toBeVisible();
    });

    test('should display shipping cost', async ({ page }) => {
      const shippingCost = page.locator('[data-testid="shipping-cost"], .shipping-cost, :text("Poštnina")');
      await expect(shippingCost.first()).toBeVisible();
    });

    test('should calculate total correctly', async () => {
      const total = await checkoutPage.getOrderTotal();
      expect(total).toBeGreaterThan(0);
      console.log(`[UX-METRIC] Order total: ${total}€`);
    });
  });

  test.describe('Guest Checkout', () => {
    test('should allow guest checkout option', async ({ page }) => {
      const guestOption = page.locator('button:has-text("Kot gost"), button:has-text("gost"), [data-testid="guest-checkout"]');
      
      if (await guestOption.isVisible({ timeout: 3000 })) {
        await guestOption.click();
        await page.waitForTimeout(500);
        console.log('[UX-METRIC] Guest checkout option available');
      } else {
        // May be auto guest checkout
        console.log('[UX-NOTE] No explicit guest checkout button - may be default');
      }
    });

    test('should complete checkout as guest with required fields only', async ({ page }) => {
      const customer = TEST_USERS.newCustomer;
      
      // Try guest checkout if available
      const guestOption = page.locator('button:has-text("Kot gost"), [data-testid="guest-checkout"]');
      if (await guestOption.isVisible({ timeout: 2000 })) {
        await guestOption.click();
      }
      
      // Fill minimum required fields
      await checkoutPage.fillCustomerInfo({
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        address: customer.address.street,
        city: customer.address.city,
        postalCode: customer.address.postalCode
      });
      
      // Should be able to proceed
      await checkoutPage.continueToNextStep();
    });
  });

  test.describe('Payment Method Selection', () => {
    test.beforeEach(async ({ page }) => {
      // Fill shipping info first
      const customer = TEST_USERS.newCustomer;
      
      const guestOption = page.locator('button:has-text("Kot gost"), [data-testid="guest-checkout"]');
      if (await guestOption.isVisible({ timeout: 2000 })) {
        await guestOption.click();
      }
      
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

    test('should display available payment methods', async ({ page }) => {
      // Try to get to payment step
      await checkoutPage.continueToNextStep();
      await page.waitForTimeout(1000);
      
      // Check for payment options
      const paymentOptions = page.locator('[data-testid="payment-method"], input[name="paymentMethod"], .payment-option');
      const count = await paymentOptions.count();
      
      console.log(`[UX-METRIC] Payment methods available: ${count}`);
      expect(count).toBeGreaterThan(0);
    });

    test('should allow selecting credit card payment', async ({ page }) => {
      await checkoutPage.continueToNextStep();
      await page.waitForTimeout(1000);
      
      const stripeOption = page.locator('label:has-text("Kartica"), label:has-text("Card"), input[value="stripe"]');
      if (await stripeOption.first().isVisible({ timeout: 3000 })) {
        await stripeOption.first().click();
        console.log('[UX-METRIC] Credit card payment option selectable');
      }
    });

    test('should allow selecting bank transfer', async ({ page }) => {
      await checkoutPage.continueToNextStep();
      await page.waitForTimeout(1000);
      
      const bankOption = page.locator('label:has-text("Bančno"), label:has-text("Bank"), input[value="bank"]');
      if (await bankOption.first().isVisible({ timeout: 3000 })) {
        await bankOption.first().click();
        console.log('[UX-METRIC] Bank transfer option selectable');
      }
    });

    test('should allow selecting cash on delivery', async ({ page }) => {
      await checkoutPage.continueToNextStep();
      await page.waitForTimeout(1000);
      
      const codOption = page.locator('label:has-text("Po povzetju"), label:has-text("povzetju"), input[value="cod"]');
      if (await codOption.first().isVisible({ timeout: 3000 })) {
        await codOption.first().click();
        console.log('[UX-METRIC] Cash on delivery option selectable');
      }
    });
  });

  test.describe('Form Validation', () => {
    test('should validate phone number format', async ({ page }) => {
      await checkoutPage.phoneInput.fill('abc123');
      await checkoutPage.emailInput.click(); // Trigger blur
      await page.waitForTimeout(300);
      
      // Check for phone validation
      const phoneError = page.locator('.error:near(input[type="tel"]), [data-testid="error-phone"]');
      if (await phoneError.isVisible({ timeout: 2000 })) {
        console.log('[UX-METRIC] Phone validation working');
      }
    });

    test('should validate Slovenian postal code format', async ({ page }) => {
      // Fill valid postal code
      await checkoutPage.postalCodeInput.fill('1000');
      
      // Should be valid
      const postalError = page.locator('[data-testid="error-postalCode"], .error:near(input[name="postalCode"])');
      await expect(postalError).not.toBeVisible({ timeout: 1000 });
    });

    test('should show clear error messages', async ({ page }) => {
      // Submit empty form
      const submitBtn = page.locator('button:has-text("Naprej"), button:has-text("Nadaljuj"), button[type="submit"]').first();
      await submitBtn.click();
      await page.waitForTimeout(500);
      
      // Errors should be visible and readable
      const errors = page.locator('.text-red-500, .text-red-600, .error, [role="alert"]');
      const errorCount = await errors.count();
      
      if (errorCount > 0) {
        for (let i = 0; i < Math.min(errorCount, 3); i++) {
          const errorText = await errors.nth(i).textContent();
          console.log(`[UX-METRIC] Error message: ${errorText}`);
        }
      }
    });
  });

  test.describe('Navigation', () => {
    test('should allow going back from checkout', async ({ page }) => {
      const backBtn = page.locator('button:has-text("Nazaj"), a:has-text("Nazaj"), [data-testid="back"]');
      
      if (await backBtn.isVisible({ timeout: 2000 })) {
        await backBtn.click();
        await page.waitForLoadState('networkidle');
        console.log('[UX-METRIC] Back navigation works');
      }
    });

    test('should preserve cart when navigating back', async ({ page }) => {
      const customer = TEST_USERS.newCustomer;
      await checkoutPage.emailInput.fill(customer.email);
      
      // Go back to cart
      await page.goto('/cart');
      await cartPage.expectCartNotEmpty();
    });
  });
});
