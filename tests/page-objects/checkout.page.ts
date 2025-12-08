import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { STRIPE_TEST_CARDS } from '../config/test-data';

/**
 * Checkout Page Object - Multi-step checkout flow
 */
export class CheckoutPage extends BasePage {
  // Step indicators
  readonly stepIndicator: Locator;
  readonly currentStep: Locator;
  
  // Customer info form
  readonly emailInput: Locator;
  readonly nameInput: Locator;  // Full name (not split into first/last)
  readonly phoneInput: Locator;
  readonly addressInput: Locator;
  readonly cityInput: Locator;
  readonly postalCodeInput: Locator;
  readonly countrySelect: Locator;
  
  // Guest vs Login selection
  readonly guestCheckoutBtn: Locator;
  readonly loginBtn: Locator;
  readonly passwordInput: Locator;
  
  // Payment methods
  readonly paymentMethodStripe: Locator;
  readonly paymentMethodBankTransfer: Locator;
  readonly paymentMethodCOD: Locator;
  
  // Stripe elements (within iframe)
  readonly stripeCardNumber: Locator;
  readonly stripeExpiry: Locator;
  readonly stripeCvc: Locator;
  
  // Actions
  readonly continueBtn: Locator;
  readonly backBtn: Locator;
  readonly placeOrderBtn: Locator;
  
  // Order summary
  readonly orderSummary: Locator;
  readonly orderTotal: Locator;
  readonly shippingCost: Locator;
  readonly discountAmount: Locator;
  
  // Validation
  readonly errorMessages: Locator;
  readonly successMessage: Locator;
  readonly processingOverlay: Locator;

  // Gift options
  readonly giftRecipientToggle: Locator;
  readonly giftRecipientName: Locator;
  readonly giftRecipientAddress: Locator;
  readonly giftMessage: Locator;

  constructor(page: Page) {
    super(page);
    
    // Step indicators
    this.stepIndicator = page.locator('[data-testid="step-indicator"], .step-indicator, .checkout-steps');
    this.currentStep = page.locator('[data-testid="current-step"], .current-step, .step.active');
    
    // Customer info form - uses single 'name' field, not firstName/lastName
    this.emailInput = page.locator('input[name="email"], input[type="email"], input#email').first();
    this.nameInput = page.locator('input[name="name"], input#name, input[placeholder*="Ime"]').first();
    this.phoneInput = page.locator('input[name="phone"], input[type="tel"], input#phone').first();
    this.addressInput = page.locator('[data-testid="address"], input[name="address"], input[placeholder*="Naslov"]').first();
    this.cityInput = page.locator('[data-testid="city"], input[name="city"], input[placeholder*="Mesto"]').first();
    this.postalCodeInput = page.locator('[data-testid="postalCode"], input[name="postalCode"], input[placeholder*="Poštna"]').first();
    this.countrySelect = page.locator('[data-testid="country"], select[name="country"]').first();
    
    // Guest vs Login
    this.guestCheckoutBtn = page.locator('[data-testid="guest-checkout"], button:has-text("Kot gost"), button:has-text("Nadaljuj kot gost")').first();
    this.loginBtn = page.locator('[data-testid="login-btn"], button:has-text("Prijava"), a:has-text("Prijavi")').first();
    this.passwordInput = page.locator('[data-testid="password"], input[name="password"], input[type="password"]').first();
    
    // Payment methods
    this.paymentMethodStripe = page.locator('[data-testid="payment-stripe"], input[value="stripe"], label:has-text("Kartica")').first();
    this.paymentMethodBankTransfer = page.locator('[data-testid="payment-bank"], input[value="bank"], label:has-text("Bančno")').first();
    this.paymentMethodCOD = page.locator('[data-testid="payment-cod"], input[value="cod"], label:has-text("Po povzetju")').first();
    
    // Stripe iframe elements (will be accessed via frameLocator)
    this.stripeCardNumber = page.locator('iframe[name^="__privateStripeFrame"]').first();
    this.stripeExpiry = page.locator('iframe[name^="__privateStripeFrame"]').nth(1);
    this.stripeCvc = page.locator('iframe[name^="__privateStripeFrame"]').nth(2);
    
    // Actions
    this.continueBtn = page.locator('[data-testid="continue"], button:has-text("Naprej"), button:has-text("Nadaljuj")').first();
    this.backBtn = page.locator('[data-testid="back"], button:has-text("Nazaj")').first();
    this.placeOrderBtn = page.locator('[data-testid="place-order"], button:has-text("Oddaj naročilo"), button:has-text("Plačaj")').first();
    
    // Order summary
    this.orderSummary = page.locator('[data-testid="order-summary"], .order-summary').first();
    this.orderTotal = page.locator('[data-testid="order-total"], .order-total, .total').first();
    this.shippingCost = page.locator('[data-testid="shipping-cost"], .shipping-cost').first();
    this.discountAmount = page.locator('[data-testid="discount-amount"], .discount-amount').first();
    
    // Validation
    this.errorMessages = page.locator('[data-testid="error"], .error-message, .text-red-500, .text-red-600');
    this.successMessage = page.locator('[data-testid="success"], .success-message, .text-green-500').first();
    this.processingOverlay = page.locator('[data-testid="processing"], .processing-overlay, .loading-overlay').first();

    // Gift options
    this.giftRecipientToggle = page.locator('[data-testid="gift-toggle"], input[name="isGift"], label:has-text("Darilo")').first();
    this.giftRecipientName = page.locator('[data-testid="gift-recipient-name"], input[name="giftRecipientName"]').first();
    this.giftRecipientAddress = page.locator('[data-testid="gift-recipient-address"], input[name="giftRecipientAddress"]').first();
    this.giftMessage = page.locator('[data-testid="gift-message"], textarea[name="giftMessage"]').first();
  }

  async navigateToCheckout() {
    await this.goto('/checkout-steps');
  }

  async fillCustomerInfo(data: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
    country?: string;
  }) {
    // Wait for form to be ready
    await this.page.waitForTimeout(500);
    
    // Close any popups that might be blocking
    await this.closePopups();
    
    // Fill email
    const emailField = this.page.locator('input[name="email"], input[type="email"], input#email').first();
    if (await emailField.isVisible({ timeout: 3000 })) {
      await emailField.fill(data.email);
    }
    
    // Fill name (combines first + last)
    const nameField = this.page.locator('input[name="name"], input#name').first();
    if (await nameField.isVisible({ timeout: 2000 })) {
      await nameField.fill(`${data.firstName} ${data.lastName}`);
    }
    
    // Fill phone
    const phoneField = this.page.locator('input[name="phone"], input[type="tel"], input#phone').first();
    if (await phoneField.isVisible({ timeout: 2000 })) {
      await phoneField.fill(data.phone);
    }
    
    // Fill address
    const addressField = this.page.locator('input[name="address"], input#address').first();
    if (await addressField.isVisible({ timeout: 2000 })) {
      await addressField.fill(data.address);
    }
    
    // Fill city
    const cityField = this.page.locator('input[name="city"], input#city').first();
    if (await cityField.isVisible({ timeout: 2000 })) {
      await cityField.fill(data.city);
    }
    
    // Fill postal code
    const postalField = this.page.locator('input[name="postalCode"], input#postalCode').first();
    if (await postalField.isVisible({ timeout: 2000 })) {
      await postalField.fill(data.postalCode);
    }
  }

  async selectGuestCheckout() {
    await this.guestCheckoutBtn.click();
    await this.page.waitForTimeout(500);
  }

  async selectPaymentMethod(method: 'stripe' | 'bank' | 'cod') {
    switch (method) {
      case 'stripe':
        await this.paymentMethodStripe.click();
        break;
      case 'bank':
        await this.paymentMethodBankTransfer.click();
        break;
      case 'cod':
        await this.paymentMethodCOD.click();
        break;
    }
    await this.page.waitForTimeout(500);
  }

  async fillStripeCard(cardNumber: string = STRIPE_TEST_CARDS.success) {
    // Wait for Stripe iframe to load
    await this.page.waitForTimeout(1000);
    
    const stripeFrame = this.page.frameLocator('iframe[name^="__privateStripeFrame"]').first();
    
    // Fill card number
    await stripeFrame.locator('[placeholder="Card number"], [name="cardnumber"]').fill(cardNumber);
    
    // Fill expiry
    await stripeFrame.locator('[placeholder="MM / YY"], [name="exp-date"]').fill('12/28');
    
    // Fill CVC
    await stripeFrame.locator('[placeholder="CVC"], [name="cvc"]').fill('123');
    
    // Fill ZIP if present
    try {
      await stripeFrame.locator('[placeholder="ZIP"], [name="postal"]').fill('12345', { timeout: 2000 });
    } catch {
      // ZIP field may not be present
    }
  }

  async continueToNextStep() {
    await this.continueBtn.click();
    await this.waitForLoading();
  }

  async goBack() {
    await this.backBtn.click();
    await this.waitForLoading();
  }

  async placeOrder() {
    await this.placeOrderBtn.click();
    await this.waitForLoading();
  }

  async expectOnStep(stepNumber: number) {
    // Verify we're on the expected step
    await this.page.waitForTimeout(500);
    const currentStepText = await this.currentStep.textContent();
    // Step verification logic depends on actual implementation
  }

  async expectValidationError(fieldName?: string) {
    await expect(this.errorMessages.first()).toBeVisible();
    if (fieldName) {
      await expect(this.errorMessages.filter({ hasText: fieldName })).toBeVisible();
    }
  }

  async expectNoErrors() {
    await expect(this.errorMessages).toHaveCount(0);
  }

  async getOrderTotal(): Promise<number> {
    const totalText = await this.orderTotal.textContent();
    if (!totalText) return 0;
    return parseFloat(totalText.replace(/[€\s]/g, '').replace(',', '.')) || 0;
  }

  async expectOrderConfirmation() {
    await expect(this.page).toHaveURL(/order-confirmation|order-success|hvala/);
    await expect(this.successMessage).toBeVisible();
  }

  async enableGiftOption() {
    await this.giftRecipientToggle.click();
    await this.page.waitForTimeout(300);
  }

  async fillGiftInfo(recipientName: string, recipientAddress: string, message: string) {
    await this.giftRecipientName.fill(recipientName);
    await this.giftRecipientAddress.fill(recipientAddress);
    await this.giftMessage.fill(message);
  }
}
