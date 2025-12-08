import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Cart Page Object
 */
export class CartPage extends BasePage {
  readonly cartContainer: Locator;
  readonly cartItems: Locator;
  readonly emptyCartMessage: Locator;
  readonly subtotal: Locator;
  readonly shippingCost: Locator;
  readonly total: Locator;
  readonly checkoutBtn: Locator;
  readonly continueShoppingBtn: Locator;
  readonly discountCodeInput: Locator;
  readonly applyDiscountBtn: Locator;
  readonly discountMessage: Locator;
  readonly freeShippingProgress: Locator;
  readonly giftItems: Locator;

  constructor(page: Page) {
    super(page);
    this.cartContainer = page.locator('[data-testid="cart"], .cart-container, main').first();
    this.cartItems = page.locator('[data-testid="cart-item"], .cart-item, .flex.items-center.gap-4.p-4');
    this.emptyCartMessage = page.locator('[data-testid="empty-cart"], .empty-cart, :text("Vaša košarica je prazna")').first();
    this.subtotal = page.locator('[data-testid="subtotal"], .subtotal, :text("Vmesni seštevek") + span').first();
    this.shippingCost = page.locator('[data-testid="shipping-cost"], .shipping-cost, :text("Poštnina") + span').first();
    this.total = page.locator('[data-testid="total"], .total, .text-xl.font-bold').first();
    this.checkoutBtn = page.locator('button:has-text("Proceed to Checkout"), button:has-text("Na blagajno"), button.bg-brown-600:has-text("Checkout"), a[href*="checkout"]').first();
    this.continueShoppingBtn = page.locator('[data-testid="continue-shopping"], a:has-text("Nadaljuj z nakupovanjem")').first();
    this.discountCodeInput = page.locator('[data-testid="discount-input"], input[placeholder*="koda"], input[name="discountCode"]').first();
    this.applyDiscountBtn = page.locator('[data-testid="apply-discount"], button:has-text("Uporabi")').first();
    this.discountMessage = page.locator('[data-testid="discount-message"], .discount-message, .text-green-600').first();
    this.freeShippingProgress = page.locator('[data-testid="free-shipping-progress"], .free-shipping-progress').first();
    this.giftItems = page.locator('[data-testid="gift-item"], .gift-item');
  }

  async navigateToCart() {
    await this.goto('/cart');
  }

  async getCartItemCount(): Promise<number> {
    return await this.cartItems.count();
  }

  async isCartEmpty(): Promise<boolean> {
    return await this.emptyCartMessage.isVisible();
  }

  async getItemQuantity(itemIndex: number): Promise<number> {
    const item = this.cartItems.nth(itemIndex);
    const quantityText = await item.locator('[data-testid="item-quantity"], .quantity, input[type="number"]').inputValue();
    return parseInt(quantityText, 10) || 1;
  }

  async setItemQuantity(itemIndex: number, quantity: number) {
    const item = this.cartItems.nth(itemIndex);
    const quantityInput = item.locator('input[type="number"]');
    await quantityInput.fill(quantity.toString());
    await this.page.waitForTimeout(500);
  }

  async increaseItemQuantity(itemIndex: number) {
    const item = this.cartItems.nth(itemIndex);
    await item.locator('button:has-text("+"), [data-testid="increase-qty"]').click();
    await this.page.waitForTimeout(300);
  }

  async decreaseItemQuantity(itemIndex: number) {
    const item = this.cartItems.nth(itemIndex);
    await item.locator('button:has-text("-"), [data-testid="decrease-qty"]').click();
    await this.page.waitForTimeout(300);
  }

  async removeItem(itemIndex: number) {
    const item = this.cartItems.nth(itemIndex);
    await item.locator('[data-testid="remove-item"], button:has-text("Odstrani"), .trash-icon, svg.lucide-trash').click();
    await this.page.waitForTimeout(500);
  }

  async getSubtotal(): Promise<number> {
    const text = await this.subtotal.textContent();
    return this.parsePrice(text);
  }

  async getShippingCost(): Promise<number> {
    const text = await this.shippingCost.textContent();
    return this.parsePrice(text);
  }

  async getTotal(): Promise<number> {
    const text = await this.total.textContent();
    return this.parsePrice(text);
  }

  private parsePrice(text: string | null): number {
    if (!text) return 0;
    const cleanPrice = text.replace(/[€\s]/g, '').replace(',', '.');
    return parseFloat(cleanPrice) || 0;
  }

  async applyDiscountCode(code: string) {
    await this.discountCodeInput.fill(code);
    await this.applyDiscountBtn.click();
    await this.waitForLoading();
  }

  async proceedToCheckout() {
    // Wait for cart to be ready
    await this.page.waitForTimeout(500);
    
    // First try to find the checkout button with various selectors
    const checkoutSelectors = [
      'button:has-text("Proceed to Checkout")',
      'button:has-text("Na blagajno")',
      'button:has-text("Checkout")',
      'a[href*="checkout-steps"]',
      'a[href*="checkout"]',
      '.bg-brown-600:has-text("Checkout")'
    ];
    
    for (const selector of checkoutSelectors) {
      const btn = this.page.locator(selector).first();
      if (await btn.isVisible({ timeout: 1000 })) {
        await btn.click();
        await this.waitForPageLoad();
        return;
      }
    }
    
    // Fallback to default locator
    await this.checkoutBtn.click();
    await this.waitForPageLoad();
  }

  async continueShopping() {
    await this.continueShoppingBtn.click();
    await this.waitForPageLoad();
  }

  async expectCartNotEmpty() {
    const count = await this.getCartItemCount();
    expect(count).toBeGreaterThan(0);
  }

  async expectCartEmpty() {
    await expect(this.emptyCartMessage).toBeVisible();
  }

  async expectCheckoutEnabled() {
    await expect(this.checkoutBtn).toBeEnabled();
  }

  async getItemName(itemIndex: number): Promise<string> {
    const item = this.cartItems.nth(itemIndex);
    const nameText = await item.locator('h3, .item-name, .font-semibold').first().textContent();
    return nameText?.trim() || '';
  }

  async getItemPrice(itemIndex: number): Promise<number> {
    const item = this.cartItems.nth(itemIndex);
    const priceText = await item.locator('.price, .text-amber').first().textContent();
    return this.parsePrice(priceText);
  }
}
