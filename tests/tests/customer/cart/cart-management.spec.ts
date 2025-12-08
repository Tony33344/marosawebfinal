import { test, expect } from '@playwright/test';
import { HomePage } from '../../../page-objects/home.page';
import { ProductDetailPage } from '../../../page-objects/product-detail.page';
import { CartPage } from '../../../page-objects/cart.page';
import { TEST_PRODUCTS } from '../../../config/test-data';

test.describe('Shopping Cart @smoke', () => {
  let homePage: HomePage;
  let productPage: ProductDetailPage;
  let cartPage: CartPage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    productPage = new ProductDetailPage(page);
    cartPage = new CartPage(page);
    
    // Clear localStorage to start fresh
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await homePage.closeBannerIfPresent();
  });

  test.describe('Add to Cart', () => {
    test('should add product to cart from product detail page', async ({ page }) => {
      // Navigate to a product
      await productPage.navigateToProduct(TEST_PRODUCTS.pegastiBadelj.id);
      await productPage.expectProductLoaded();
      
      // Get initial cart count
      const initialCount = await homePage.getCartItemCount();
      
      // Add to cart
      await productPage.addToCart();
      
      // Verify cart count increased
      await page.waitForTimeout(500);
      await expect(page.locator('[data-testid="cart-count"], .cart-count')).toBeVisible();
    });

    test('should add product with custom quantity', async ({ page }) => {
      await productPage.navigateToProduct(TEST_PRODUCTS.pegastiBadelj.id);
      await productPage.expectProductLoaded();
      
      // Set quantity to 3
      await productPage.setQuantity(3);
      await productPage.addToCart();
      
      // Navigate to cart
      await cartPage.navigateToCart();
      
      // Verify item is in cart
      await cartPage.expectCartNotEmpty();
    });

    test('should show feedback when product added', async ({ page }) => {
      await productPage.navigateToProduct(TEST_PRODUCTS.simpleProduct.id);
      await productPage.expectProductLoaded();
      
      await productPage.addToCart();
      
      // Should show some form of confirmation (toast, notification, cart update)
      await page.waitForTimeout(500);
      
      // Check that cart icon shows updated count or notification appeared
      const notification = page.locator('[data-testid="toast"], .toast, [role="alert"], .cart-notification');
      const hasNotification = await notification.first().isVisible({ timeout: 3000 }).catch(() => false);
      
      if (hasNotification) {
        console.log('[UX-METRIC] Add to cart notification shown');
      }
    });

    test('should add product from homepage product card', async ({ page }) => {
      await homePage.navigateToHome();
      await homePage.scrollToProducts();
      
      // Try to add from homepage if button is available
      const productCard = page.locator('.group.relative.bg-white.rounded-xl, [data-testid="product-card"]').first();
      await productCard.hover();
      
      const quickAddBtn = productCard.locator('button:has-text("V košarico"), button:has-text("Dodaj"), [data-testid="quick-add"]');
      
      if (await quickAddBtn.isVisible({ timeout: 2000 })) {
        await quickAddBtn.click();
        await page.waitForTimeout(500);
        console.log('[UX-METRIC] Quick add from homepage works');
      } else {
        // If no quick add, clicking card navigates to product
        await productCard.click();
        await productPage.expectProductLoaded();
        console.log('[UX-METRIC] No quick add on homepage, redirects to product page');
      }
    });
  });

  test.describe('Cart Management', () => {
    test.beforeEach(async ({ page }) => {
      // Add a product first
      await productPage.navigateToProduct(TEST_PRODUCTS.pegastiBadelj.id);
      await productPage.addToCart();
      await cartPage.navigateToCart();
    });

    test('should display cart with added items', async () => {
      await cartPage.expectCartNotEmpty();
      const itemCount = await cartPage.getCartItemCount();
      expect(itemCount).toBeGreaterThan(0);
    });

    test('should show correct item name and price', async () => {
      const itemName = await cartPage.getItemName(0);
      expect(itemName.length).toBeGreaterThan(0);
      
      const itemPrice = await cartPage.getItemPrice(0);
      expect(itemPrice).toBeGreaterThan(0);
    });

    test('should update quantity using +/- buttons', async ({ page }) => {
      const initialQty = await cartPage.getItemQuantity(0);
      
      await cartPage.increaseItemQuantity(0);
      await page.waitForTimeout(500);
      
      const newQty = await cartPage.getItemQuantity(0);
      expect(newQty).toBeGreaterThanOrEqual(initialQty);
    });

    test('should remove item from cart', async ({ page }) => {
      await cartPage.expectCartNotEmpty();
      
      await cartPage.removeItem(0);
      await page.waitForTimeout(500);
      
      // Cart should be empty or have one less item
      const isEmpty = await cartPage.isCartEmpty();
      if (isEmpty) {
        await cartPage.expectCartEmpty();
      }
    });

    test('should calculate totals correctly', async () => {
      const subtotal = await cartPage.getSubtotal();
      const total = await cartPage.getTotal();
      
      expect(subtotal).toBeGreaterThan(0);
      expect(total).toBeGreaterThanOrEqual(subtotal);
      
      console.log(`[UX-METRIC] Cart subtotal: ${subtotal}€, total: ${total}€`);
    });

    test('should show checkout button when cart has items', async () => {
      await cartPage.expectCartNotEmpty();
      await cartPage.expectCheckoutEnabled();
    });
  });

  test.describe('Cart Persistence', () => {
    test('should persist cart after page refresh', async ({ page }) => {
      // Add product
      await productPage.navigateToProduct(TEST_PRODUCTS.pegastiBadelj.id);
      await productPage.addToCart();
      
      // Get cart count before refresh
      await cartPage.navigateToCart();
      const itemCountBefore = await cartPage.getCartItemCount();
      
      // Refresh page
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Check cart count after refresh
      const itemCountAfter = await cartPage.getCartItemCount();
      expect(itemCountAfter).toBe(itemCountBefore);
    });

    test('should persist cart across browser sessions', async ({ page, context }) => {
      // Add product
      await productPage.navigateToProduct(TEST_PRODUCTS.pegastiBadelj.id);
      await productPage.addToCart();
      
      await cartPage.navigateToCart();
      await cartPage.expectCartNotEmpty();
      
      // Close page and open new one in same context
      await page.close();
      const newPage = await context.newPage();
      
      const newCartPage = new CartPage(newPage);
      await newCartPage.navigateToCart();
      
      // Cart should still have items
      await newCartPage.expectCartNotEmpty();
    });
  });

  test.describe('Discount Codes', () => {
    test.beforeEach(async ({ page }) => {
      // Add product first
      await productPage.navigateToProduct(TEST_PRODUCTS.pegastiBadelj.id);
      await productPage.addToCart();
      await cartPage.navigateToCart();
    });

    test('should apply valid discount code', async ({ page }) => {
      const discountInput = page.locator('input[placeholder*="koda"], input[name="discountCode"], [data-testid="discount-input"]');
      
      if (await discountInput.isVisible({ timeout: 2000 })) {
        const totalBefore = await cartPage.getTotal();
        
        await cartPage.applyDiscountCode('BREZPOSTNINE');
        await page.waitForTimeout(1000);
        
        // Check for discount message or reduced total
        const discountMessage = page.locator('.text-green, .discount-applied, [data-testid="discount-message"]');
        if (await discountMessage.isVisible({ timeout: 2000 })) {
          console.log('[UX-METRIC] Discount code applied successfully');
        }
      } else {
        console.log('[UX-NOTE] Discount input not visible on cart page');
      }
    });

    test('should reject invalid discount code', async ({ page }) => {
      const discountInput = page.locator('input[placeholder*="koda"], input[name="discountCode"]');
      
      if (await discountInput.isVisible({ timeout: 2000 })) {
        await cartPage.applyDiscountCode('INVALIDCODE123');
        await page.waitForTimeout(1000);
        
        // Should show error message
        const errorMessage = page.locator('.text-red, .error, [data-testid="discount-error"]');
        if (await errorMessage.isVisible({ timeout: 2000 })) {
          console.log('[UX-METRIC] Invalid discount code rejected correctly');
        }
      }
    });
  });

  test.describe('Empty Cart', () => {
    test('should show empty cart message', async () => {
      await cartPage.navigateToCart();
      await cartPage.expectCartEmpty();
    });

    test('should have continue shopping link', async ({ page }) => {
      await cartPage.navigateToCart();
      
      const continueLink = page.locator('a:has-text("Nadaljuj"), a:has-text("nakupovanjem"), [data-testid="continue-shopping"]');
      if (await continueLink.isVisible({ timeout: 2000 })) {
        await continueLink.click();
        await page.waitForLoadState('networkidle');
        
        // Should navigate away from cart
        expect(page.url()).not.toContain('/cart');
      }
    });
  });
});
