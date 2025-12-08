import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Home Page Object
 */
export class HomePage extends BasePage {
  readonly heroSection: Locator;
  readonly aboutSection: Locator;
  readonly productsSection: Locator;
  readonly productCards: Locator;
  readonly newsletterSection: Locator;
  readonly newsletterEmailInput: Locator;
  readonly newsletterSubmitBtn: Locator;
  readonly locationSection: Locator;
  readonly categoryFilters: Locator;
  readonly discountBanner: Locator;

  constructor(page: Page) {
    super(page);
    this.heroSection = page.locator('[data-testid="hero-section"], .hero, header .bg-cover').first();
    this.aboutSection = page.locator('[data-testid="about-section"], #about, section:has-text("O nas")').first();
    this.productsSection = page.locator('[data-testid="products-section"], #products, section:has-text("Izdelki")').first();
    this.productCards = page.locator('[data-testid="product-card"], .product-card, .group.relative.bg-white.rounded-xl');
    this.newsletterSection = page.locator('[data-testid="newsletter"], .newsletter, section:has-text("Newsletter")').first();
    this.newsletterEmailInput = page.locator('[data-testid="newsletter-email"], input[type="email"][placeholder*="mail"]').first();
    this.newsletterSubmitBtn = page.locator('[data-testid="newsletter-submit"], button[type="submit"]:has-text("Prijavi")').first();
    this.locationSection = page.locator('[data-testid="location"], #location, section:has-text("Lokacija")').first();
    this.categoryFilters = page.locator('[data-testid="category-filter"], .category-filter, button[data-category]');
    this.discountBanner = page.locator('[data-testid="discount-banner"], .discount-banner, .bg-amber-500').first();
  }

  async navigateToHome() {
    await this.goto('/');
  }

  async getProductCount(): Promise<number> {
    return await this.productCards.count();
  }

  async clickProductCard(index: number = 0) {
    await this.productCards.nth(index).click();
    await this.waitForPageLoad();
  }

  async getProductCardNames(): Promise<string[]> {
    const names: string[] = [];
    const count = await this.productCards.count();
    for (let i = 0; i < count; i++) {
      const name = await this.productCards.nth(i).locator('h3, .product-name').textContent();
      if (name) names.push(name.trim());
    }
    return names;
  }

  async addProductToCartFromHome(productIndex: number = 0) {
    const productCard = this.productCards.nth(productIndex);
    const addToCartBtn = productCard.locator('button:has-text("V košarico"), button:has-text("Dodaj"), [data-testid="add-to-cart"]');
    
    // Hover to reveal button if needed
    await productCard.hover();
    await addToCartBtn.click();
    
    // Wait for cart notification
    await this.page.waitForTimeout(500);
  }

  async filterByCategory(category: string) {
    await this.categoryFilters.filter({ hasText: category }).click();
    await this.waitForLoading();
  }

  async subscribeToNewsletter(email: string) {
    await this.newsletterEmailInput.fill(email);
    await this.newsletterSubmitBtn.click();
    await this.waitForLoading();
  }

  async scrollToProducts() {
    await this.scrollToElement(this.productsSection);
  }

  async scrollToNewsletter() {
    await this.scrollToElement(this.newsletterSection);
  }

  async expectHeroVisible() {
    await expect(this.heroSection).toBeVisible();
  }

  async expectProductsVisible() {
    await expect(this.productsSection).toBeVisible();
    const count = await this.getProductCount();
    expect(count).toBeGreaterThan(0);
  }

  async closeBannerIfPresent() {
    try {
      const closeBtn = this.discountBanner.locator('button, [aria-label="Close"]');
      if (await closeBtn.isVisible({ timeout: 2000 })) {
        await closeBtn.click();
      }
    } catch {
      // Banner not present or already closed
    }
  }
}
