import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Product Detail Page Object
 */
export class ProductDetailPage extends BasePage {
  readonly productTitle: Locator;
  readonly productPrice: Locator;
  readonly productDescription: Locator;
  readonly productImage: Locator;
  readonly additionalImages: Locator;
  readonly packageOptions: Locator;
  readonly quantityInput: Locator;
  readonly increaseQuantityBtn: Locator;
  readonly decreaseQuantityBtn: Locator;
  readonly addToCartBtn: Locator;
  readonly backButton: Locator;
  readonly relatedProducts: Locator;
  readonly relatedRecipes: Locator;
  readonly stockStatus: Locator;

  constructor(page: Page) {
    super(page);
    this.productTitle = page.locator('h1, [data-testid="product-title"]').first();
    this.productPrice = page.locator('[data-testid="product-price"], .product-price, .text-amber-600').first();
    this.productDescription = page.locator('[data-testid="product-description"], .product-description, p.text-gray-600').first();
    this.productImage = page.locator('[data-testid="product-image"], .product-image, img.main-image').first();
    this.additionalImages = page.locator('[data-testid="additional-image"], .thumbnail, .gallery-image');
    this.packageOptions = page.locator('[data-testid="package-option"], .package-option, button[data-package]');
    this.quantityInput = page.locator('[data-testid="quantity-input"], input[type="number"], .quantity-input').first();
    this.increaseQuantityBtn = page.locator('[data-testid="increase-qty"], button:has-text("+"), .increase-qty').first();
    this.decreaseQuantityBtn = page.locator('[data-testid="decrease-qty"], button:has-text("-"), .decrease-qty').first();
    this.addToCartBtn = page.locator('[data-testid="add-to-cart"], button:has-text("V košarico"), button:has-text("Dodaj v košarico")').first();
    this.backButton = page.locator('[data-testid="back-button"], a:has-text("Nazaj"), button:has-text("Nazaj")').first();
    this.relatedProducts = page.locator('[data-testid="related-products"], .related-products').first();
    this.relatedRecipes = page.locator('[data-testid="related-recipes"], .related-recipes').first();
    this.stockStatus = page.locator('[data-testid="stock-status"], .stock-status, .in-stock, .out-of-stock').first();
  }

  async navigateToProduct(productId: string) {
    await this.goto(`/izdelek/${productId}`);
  }

  async getProductTitle(): Promise<string> {
    return (await this.productTitle.textContent()) || '';
  }

  async getProductPrice(): Promise<number> {
    const priceText = await this.productPrice.textContent();
    if (!priceText) return 0;
    // Parse price like "9,50 €" or "€9.50"
    const cleanPrice = priceText.replace(/[€\s]/g, '').replace(',', '.');
    return parseFloat(cleanPrice) || 0;
  }

  async selectPackageOption(optionIndex: number) {
    await this.packageOptions.nth(optionIndex).click();
    await this.page.waitForTimeout(300);
  }

  async selectPackageByWeight(weight: string) {
    await this.packageOptions.filter({ hasText: weight }).click();
    await this.page.waitForTimeout(300);
  }

  async setQuantity(quantity: number) {
    await this.quantityInput.fill(quantity.toString());
  }

  async increaseQuantity() {
    await this.increaseQuantityBtn.click();
  }

  async decreaseQuantity() {
    await this.decreaseQuantityBtn.click();
  }

  async addToCart() {
    // Try multiple selectors for add to cart button
    const addToCartSelectors = [
      'button:has-text("Dodaj v košarico")',
      'button:has-text("V košarico")',
      'button:has-text("Add to cart")',
      '[data-testid="add-to-cart"]',
      'button.bg-amber-500',
      'button.bg-amber-600'
    ];
    
    for (const selector of addToCartSelectors) {
      const btn = this.page.locator(selector).first();
      if (await btn.isVisible({ timeout: 1000 })) {
        await btn.click();
        await this.page.waitForTimeout(1000);
        return;
      }
    }
    
    // Fallback
    await this.addToCartBtn.click();
    await this.page.waitForTimeout(1000);
  }

  async clickImage() {
    await this.productImage.click();
  }

  async selectAdditionalImage(index: number) {
    await this.additionalImages.nth(index).click();
  }

  async goBack() {
    await this.backButton.click();
    await this.waitForPageLoad();
  }

  async expectProductLoaded() {
    await expect(this.productTitle).toBeVisible();
    await expect(this.productImage).toBeVisible();
    await expect(this.addToCartBtn).toBeVisible();
  }

  async expectAddToCartEnabled() {
    await expect(this.addToCartBtn).toBeEnabled();
  }

  async expectAddToCartDisabled() {
    await expect(this.addToCartBtn).toBeDisabled();
  }

  async getPackageOptionsCount(): Promise<number> {
    return await this.packageOptions.count();
  }

  async getSelectedPackageText(): Promise<string> {
    const selected = this.packageOptions.filter({ has: this.page.locator('.selected, [aria-selected="true"], .bg-amber') });
    return (await selected.textContent()) || '';
  }
}
