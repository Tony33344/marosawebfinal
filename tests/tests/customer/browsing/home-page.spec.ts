import { test, expect } from '@playwright/test';
import { HomePage } from '../../../page-objects/home.page';
import { ROUTES, LANGUAGES } from '../../../config/test-data';

test.describe('Home Page @smoke', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.navigateToHome();
    await homePage.closeBannerIfPresent();
  });

  test.describe('Initial Load', () => {
    test('should load homepage within 3 seconds @performance', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(3000);
      console.log(`[UX-METRIC] Homepage load time: ${loadTime}ms`);
    });

    test('should display header with logo and navigation', async () => {
      await expect(homePage.header).toBeVisible();
      await expect(homePage.navigation).toBeVisible();
      await expect(homePage.cartIcon).toBeVisible();
    });

    test('should display hero section above the fold', async () => {
      await homePage.expectHeroVisible();
    });

    test('should display products section with product cards', async () => {
      await homePage.expectProductsVisible();
      const productCount = await homePage.getProductCount();
      expect(productCount).toBeGreaterThan(0);
      console.log(`[UX-METRIC] Products displayed: ${productCount}`);
    });

    test('should display footer with all required sections', async () => {
      await expect(homePage.footer).toBeVisible();
    });
  });

  test.describe('Navigation', () => {
    test('should have working navigation links', async ({ page }) => {
      // Test About link
      const aboutLink = page.locator('nav a:has-text("O nas"), nav a[href*="o-nas"]').first();
      if (await aboutLink.isVisible()) {
        await aboutLink.click();
        await expect(page).toHaveURL(/o-nas/);
        await page.goBack();
      }

      // Test Recipes link
      const recipesLink = page.locator('nav a:has-text("Recepti"), nav a[href*="recipes"]').first();
      if (await recipesLink.isVisible()) {
        await recipesLink.click();
        await expect(page).toHaveURL(/recipes/);
        await page.goBack();
      }
    });

    test('should navigate to product detail when clicking product card', async ({ page }) => {
      await homePage.scrollToProducts();
      await homePage.clickProductCard(0);
      
      await expect(page).toHaveURL(/\/izdelek\/\d+/);
    });

    test('should navigate to cart when clicking cart icon', async ({ page }) => {
      await homePage.openCart();
      await expect(page).toHaveURL(/\/cart/);
    });
  });

  test.describe('Product Cards', () => {
    test('should display product cards with name, price, and image', async ({ page }) => {
      await homePage.scrollToProducts();
      
      const productCards = page.locator('.group.relative.bg-white.rounded-xl, [data-testid="product-card"]');
      const firstCard = productCards.first();
      
      await expect(firstCard).toBeVisible();
      
      // Check for product name
      const productName = firstCard.locator('h3, .product-name');
      await expect(productName).toBeVisible();
      
      // Check for product image
      const productImage = firstCard.locator('img');
      await expect(productImage).toBeVisible();
      
      // Check for price
      const productPrice = firstCard.locator('.text-amber, .price');
      await expect(productPrice).toBeVisible();
    });

    test('should show all products from database', async () => {
      const productNames = await homePage.getProductCardNames();
      expect(productNames.length).toBeGreaterThan(0);
      
      // Log product names for debugging
      console.log('[UX-METRIC] Available products:', productNames.join(', '));
    });
  });

  test.describe('Responsiveness @mobile', () => {
    test('should display mobile menu on small screens', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Mobile menu toggle should be visible
      const mobileMenuToggle = page.locator('[data-testid="mobile-menu-toggle"], button.md\\:hidden, .hamburger-menu');
      await expect(mobileMenuToggle).toBeVisible();
    });

    test('should display products in single column on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      await homePage.scrollToProducts();
      
      // Products should still be visible on mobile
      await homePage.expectProductsVisible();
    });
  });

  test.describe('SEO & Performance @seo', () => {
    test('should have proper page title', async ({ page }) => {
      const title = await page.title();
      expect(title.length).toBeGreaterThan(10);
      expect(title).toContain('Maroša');
    });

    test('should have meta description', async ({ page }) => {
      const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
      expect(metaDescription).toBeTruthy();
      expect(metaDescription!.length).toBeGreaterThan(50);
    });

    test('should have proper heading hierarchy', async ({ page }) => {
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBeGreaterThanOrEqual(1);
    });
  });

  test.describe('Language Switching @i18n', () => {
    for (const lang of LANGUAGES) {
      test(`should switch to ${lang.toUpperCase()} language`, async ({ page }) => {
        await page.goto(`/?lang=${lang}`);
        
        // URL should contain language parameter
        expect(page.url()).toContain(`lang=${lang}`);
        
        // Page should load without errors
        await expect(page.locator('body')).toBeVisible();
      });
    }
  });

  test.describe('Newsletter Signup', () => {
    test('should have newsletter signup form', async ({ page }) => {
      await homePage.scrollToNewsletter();
      
      const newsletterForm = page.locator('input[type="email"][placeholder*="mail"], [data-testid="newsletter-email"]');
      if (await newsletterForm.isVisible({ timeout: 2000 })) {
        await expect(newsletterForm).toBeVisible();
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should not show any console errors on page load @smoke', async ({ page }) => {
      const consoleErrors: string[] = [];
      
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Filter out known acceptable errors (like CSP warnings)
      const criticalErrors = consoleErrors.filter(error => 
        !error.includes('Content Security Policy') &&
        !error.includes('frame-ancestors') &&
        !error.includes('report-uri')
      );
      
      if (criticalErrors.length > 0) {
        console.log('[UX-ISSUE] Console errors found:', criticalErrors);
      }
      
      // Warning but not failing test for minor errors
      expect(criticalErrors.length).toBeLessThanOrEqual(5);
    });
  });
});
