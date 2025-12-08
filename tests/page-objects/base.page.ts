import { Page, Locator, expect } from '@playwright/test';

/**
 * Base Page Object - Contains common methods for all pages
 */
export class BasePage {
  readonly page: Page;
  readonly header: Locator;
  readonly footer: Locator;
  readonly navigation: Locator;
  readonly cartIcon: Locator;
  readonly cartCount: Locator;
  readonly languageSwitcher: Locator;
  readonly loadingSpinner: Locator;
  readonly toast: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.locator('header').first();
    this.footer = page.locator('footer').first();
    this.navigation = page.locator('nav').first();
    this.cartIcon = page.locator('[data-testid="cart-icon"], .cart-icon, a[href="/cart"]').first();
    this.cartCount = page.locator('[data-testid="cart-count"], .cart-count').first();
    this.languageSwitcher = page.locator('[data-testid="language-switcher"], .language-switcher').first();
    this.loadingSpinner = page.locator('[data-testid="loading"], .loading-spinner, .animate-spin').first();
    this.toast = page.locator('[data-testid="toast"], .toast, [role="alert"]').first();
  }

  async goto(path: string = '/') {
    await this.page.goto(path);
    await this.waitForPageLoad();
    await this.closePopups();
  }

  async waitForPageLoad() {
    // Use 'domcontentloaded' instead of 'networkidle' for faster, more reliable waits
    try {
      await this.page.waitForLoadState('domcontentloaded', { timeout: 10000 });
      // Give React time to render
      await this.page.waitForTimeout(500);
    } catch {
      // Continue even if timeout - page might still be usable
    }
  }

  /**
   * Close any popups/modals that may appear (newsletter, discount, etc.)
   */
  async closePopups() {
    try {
      // Try to find and click close button on popup
      const popupCloseButtons = [
        '.fixed.inset-0 button:has-text("×")',
        '.fixed.inset-0 button:has-text("Zapri")',
        '.fixed.inset-0 button:has-text("Ne, hvala")',
        '.fixed.inset-0 [aria-label="Close"]',
        '.fixed.inset-0 svg.lucide-x',
        '.fixed.z-50 button:has-text("×")',
        '.fixed.z-50 button:has-text("Zapri")',
        '[data-testid="popup-close"]',
        '.modal-close',
        '.popup-close'
      ];
      
      for (const selector of popupCloseButtons) {
        const closeBtn = this.page.locator(selector).first();
        if (await closeBtn.isVisible({ timeout: 500 })) {
          await closeBtn.click();
          await this.page.waitForTimeout(300);
          return;
        }
      }
      
      // Try pressing Escape to close any modal
      const overlay = this.page.locator('.fixed.inset-0.bg-black.bg-opacity-50, .fixed.inset-0.z-50').first();
      if (await overlay.isVisible({ timeout: 500 })) {
        await this.page.keyboard.press('Escape');
        await this.page.waitForTimeout(300);
      }
    } catch {
      // No popup to close, continue
    }
  }

  async waitForLoading() {
    // Wait for any loading spinners to disappear
    try {
      await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 10000 });
    } catch {
      // Loading spinner may not exist, continue
    }
  }

  async getPageTitle(): Promise<string> {
    return await this.page.title();
  }

  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }

  async switchLanguage(lang: 'sl' | 'en' | 'de' | 'hr') {
    await this.languageSwitcher.click();
    await this.page.click(`[data-lang="${lang}"], button:has-text("${lang.toUpperCase()}")`);
    await this.waitForPageLoad();
  }

  async openCart() {
    await this.cartIcon.click();
    await this.waitForPageLoad();
  }

  async getCartItemCount(): Promise<number> {
    try {
      const countText = await this.cartCount.textContent();
      return parseInt(countText || '0', 10);
    } catch {
      return 0;
    }
  }

  async expectToastMessage(text: string | RegExp) {
    await expect(this.toast).toBeVisible({ timeout: 5000 });
    await expect(this.toast).toContainText(text);
  }

  async scrollToElement(locator: Locator) {
    await locator.scrollIntoViewIfNeeded();
  }

  async screenshot(name: string) {
    await this.page.screenshot({ path: `tests/reports/screenshots/${name}.png`, fullPage: true });
  }

  async measureLoadTime(): Promise<number> {
    const startTime = Date.now();
    await this.waitForPageLoad();
    return Date.now() - startTime;
  }
}
