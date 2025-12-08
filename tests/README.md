# 🎭 Playwright E2E Testing Suite

## Kmetija Maroša - Farm E-commerce Website

This directory contains the comprehensive end-to-end testing suite for the Kmetija Maroša e-commerce platform.

---

## 📁 Directory Structure

```
tests/
├── config/                    # Test configuration
│   ├── playwright.config.ts   # Playwright configuration
│   └── test-data.ts          # Test fixtures and mock data
├── fixtures/                  # Test fixtures
├── page-objects/              # Page Object Model classes
│   ├── base.page.ts          # Base page with common methods
│   ├── home.page.ts          # Home page
│   ├── product-detail.page.ts # Product detail page
│   ├── cart.page.ts          # Shopping cart page
│   ├── checkout.page.ts      # Checkout flow page
│   ├── admin/                # Admin page objects
│   └── components/           # Reusable component objects
├── tests/                     # Test specifications
│   ├── customer/             # Customer-facing tests
│   │   ├── browsing/        # Browsing & navigation tests
│   │   ├── cart/            # Shopping cart tests
│   │   ├── checkout/        # Checkout flow tests
│   │   ├── payments/        # Payment method tests
│   │   └── account/         # User account tests
│   ├── admin/               # Admin dashboard tests
│   │   ├── auth/           # Admin authentication
│   │   ├── products/       # Product management
│   │   └── orders/         # Order management
│   ├── integration/         # Integration tests
│   └── performance/         # Performance tests
├── utils/                    # Test utilities
│   └── reporters/           # Custom reporters
└── reports/                  # Generated test reports
```

---

## 🚀 Quick Start

### Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run tests with UI
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Run tests in debug mode
npm run test:e2e:debug

# Run only Chrome tests
npm run test:e2e:chrome

# Run only mobile tests
npm run test:e2e:mobile

# Run smoke tests
npm run test:e2e:smoke

# Run admin tests only
npm run test:e2e:admin

# Run checkout tests only
npm run test:e2e:checkout

# Run payment tests only
npm run test:e2e:payments

# View test report
npm run test:e2e:report
```

---

## 🏷️ Test Tags

Tests are tagged for easy filtering:

| Tag | Description |
|-----|-------------|
| `@smoke` | Critical path tests - run on every deploy |
| `@critical` | Business-critical functionality |
| `@payments` | Payment-related tests |
| `@admin` | Admin dashboard tests |
| `@mobile` | Mobile-specific tests |
| `@i18n` | Internationalization tests |
| `@seo` | SEO-related tests |
| `@performance` | Performance tests |

Example: Run only smoke tests
```bash
npm run test:e2e -- --grep @smoke
```

---

## 📊 Test Data

Test data is defined in `config/test-data.ts`:

- **TEST_USERS**: Test user credentials (guest, customer, admin)
- **TEST_PRODUCTS**: Sample products for testing
- **STRIPE_TEST_CARDS**: Stripe test card numbers
- **DISCOUNT_CODES**: Test discount codes
- **ROUTES**: Application route constants

---

## 🔧 Page Object Model

We use the Page Object Model pattern for maintainable tests:

```typescript
import { HomePage } from '../page-objects/home.page';

test('should add product to cart', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.navigateToHome();
  await homePage.addProductToCartFromHome(0);
  await homePage.expectToastMessage(/dodano/i);
});
```

---

## 📋 Writing New Tests

### 1. Create a Page Object (if needed)

```typescript
// tests/page-objects/my-feature.page.ts
import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class MyFeaturePage extends BasePage {
  readonly myElement: Locator;

  constructor(page: Page) {
    super(page);
    this.myElement = page.locator('[data-testid="my-element"]');
  }

  async doSomething() {
    await this.myElement.click();
  }
}
```

### 2. Create Test File

```typescript
// tests/tests/customer/my-feature.spec.ts
import { test, expect } from '@playwright/test';
import { MyFeaturePage } from '../../page-objects/my-feature.page';

test.describe('My Feature @smoke', () => {
  test('should do something', async ({ page }) => {
    const myPage = new MyFeaturePage(page);
    await myPage.goto('/my-feature');
    await myPage.doSomething();
    await expect(page).toHaveURL(/expected-url/);
  });
});
```

---

## 🐛 Debugging

### Visual Debugging
```bash
npm run test:e2e:headed
```

### Step-by-step Debugging
```bash
npm run test:e2e:debug
```

### View Trace
After test failure, view the trace:
```bash
npx playwright show-trace tests/reports/trace.zip
```

---

## 📈 CI/CD Integration

Add to your CI pipeline:

```yaml
- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run E2E Tests
  run: npm run test:e2e

- name: Upload Test Report
  uses: actions/upload-artifact@v3
  if: always()
  with:
    name: playwright-report
    path: tests/reports/
```

---

## 🔍 UX Metrics

Tests log UX metrics to console. Look for:
- `[UX-METRIC]` - Performance and usability measurements
- `[UX-ISSUE]` - Potential UX problems detected
- `[UX-NOTE]` - Observations and notes

---

## ✅ Coverage Checklist

### Customer Flows
- [ ] Homepage loading and navigation
- [ ] Product browsing and filtering
- [ ] Product detail view
- [ ] Add to cart
- [ ] Cart management
- [ ] Guest checkout
- [ ] Registered user checkout
- [ ] Stripe payment
- [ ] Bank transfer payment
- [ ] Cash on delivery
- [ ] Order confirmation
- [ ] User registration
- [ ] User login
- [ ] Password reset

### Admin Flows
- [ ] Admin login
- [ ] Product CRUD
- [ ] Order management
- [ ] Order status updates
- [ ] Discount code management
- [ ] User management

---

## 📝 Notes

- Tests use Supabase test environment
- Stripe tests require test mode API keys
- Admin tests require valid admin credentials in test-data.ts
- Some tests may fail if test data is not properly seeded

---

**Last Updated:** December 8, 2025
