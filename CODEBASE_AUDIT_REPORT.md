# 🔍 COMPREHENSIVE CODEBASE AUDIT REPORT
## Kmetija Maroša - Farm E-commerce Website
**Generated:** December 8, 2025
**Auditor:** Cascade AI

---

## 📊 EXECUTIVE SUMMARY

| Metric | Value |
|--------|-------|
| **CODEBASE HEALTH SCORE** | **58/100** |
| **Critical Issues** | 8 |
| **Major Improvements Needed** | 15 |
| **Minor Improvements** | 25+ |
| **Files to Remove** | 60+ |
| **Files to Consolidate** | 12 |
| **Estimated Refactoring Effort** | 40-60 hours |

---

## 🚨 CRITICAL ISSUES

### 1. 🔴 MASSIVE FILE SIZES
| File | Lines | Size | Issue |
|------|-------|------|-------|
| `CheckoutPage.tsx` | 2,272 | 100KB | **MUST REFACTOR** - Single responsibility violation |
| `translations.ts` | ~3,000+ | 124KB | Consider splitting by language |
| `ghost-user-test.js` | ~1,500+ | 56KB | Test file in production |
| `AdminDiscountManagement.tsx` | ~1,200+ | 45KB | Too large for single component |

### 2. 🔴 394 CONSOLE.LOG STATEMENTS IN PRODUCTION CODE
**Top Offenders:**
- `CheckoutPage.tsx` - 39 occurrences
- `imageUtils.ts` - 17 occurrences
- `AdminOrdersPage.tsx` - 16 occurrences
- `MultiStepCheckoutPage.tsx` - 16 occurrences
- `AdminDebugPage.tsx` - 15 occurrences

### 3. 🔴 INVOICE/PDF FILES IN REPOSITORY
**Location:** `invoices_documents/` - 46 files
- Contains sensitive business documents
- PDFs, DOCXs, invoices should NOT be in git
- **ACTION:** Remove and add to `.gitignore`

### 4. 🔴 80+ LOOSE TEST/SCRIPT FILES IN ROOT
Should be in proper directories:
```
- checkout-steps-email-test.js
- complete-payment-test.js
- debug-checkout-test.js
- ghost-user-test.js
- 30+ more test files
- 15+ SQL scripts
- 10+ deployment scripts
```

### 5. 🔴 DUPLICATE CHECKOUT IMPLEMENTATIONS
**4 different checkout pages exist:**
1. `CheckoutPage.tsx` (2,272 lines) - Original
2. `ModularCheckoutPage.tsx` (15,698 bytes) - Attempt 1
3. `ModularCheckoutPage2.tsx` (16,651 bytes) - Attempt 2
4. `MultiStepCheckoutPage.tsx` (40,860 bytes) - Attempt 3

**RECOMMENDATION:** Keep ONE, delete others

### 6. 🔴 TYPE MISMATCH: Product ID
```typescript
// In types.ts - Product.id is typed as number
export interface Product {
  id: number;  // ❌ Wrong!
  ...
}

// In database - ID comes as STRING '13'
// Causes comparison bugs like:
product.id === 13  // ❌ Fails because id is '13'
```

### 7. 🔴 239 USAGES OF `any` TYPE
Defeats TypeScript's purpose. Top files:
- `useAnalytics.ts` - 11 occurrences
- `newsletterService.ts` - 11 occurrences
- `CheckoutPage.tsx` - 8 occurrences

### 8. 🔴 EMPTY/DEAD FILES
```
check_all_products.js - 0 bytes
check_pegasti.js - 0 bytes
complete_trigger_fix.sql - 0 bytes
dev-server.log - 0 bytes
AmericanConeflowerPage.tsx - 1 byte
```

---

## 🟠 MAJOR ISSUES

### 1. Missing Test Coverage
- Only 2 test files in `src/test/`
- No E2E tests
- No component tests
- **Coverage: < 5%**

### 2. Inconsistent Error Handling
- Some files use try/catch
- Some use error boundaries
- Some have no error handling

### 3. No Proper Logging Strategy
- 394 console.log statements
- No log levels (info, warn, error)
- No log aggregation setup

### 4. Hardcoded Values Throughout
- Shipping costs hardcoded
- Admin emails hardcoded
- Feature flags hardcoded

### 5. Security Concerns
- Admin check relies on client-side validation
- Some API keys may be exposed in logs
- CSRF tokens not consistently used

### 6. Performance Issues
- Large bundle size (100KB+ single files)
- No code splitting for admin routes
- Images not optimized consistently

### 7. i18n Translation Gaps
- Missing translations flagged in console
- `footer.language` translation missing
- `error.title`, `error.productDetail` missing

### 8. Stale/Orphaned Files
```
src/context/zadnje.code-workspace - Workspace file in source
deluje_vse_razen_products_prevodi_18:30_commit.code-workspace - In root
top konc 0.28.code-workspace - In root
```

---

## 📁 DEAD CODE INVENTORY

### Files to DELETE (60+):
```
ROOT LEVEL TEST SCRIPTS:
□ checkout-steps-email-test.js
□ complete-payment-test.js
□ complete-verification-test.js
□ comprehensive-checkout-email-test.js
□ correct-flow-test.js
□ debug-checkout-page.js
□ debug-checkout-test.js
□ email-confirmation-test.js
□ email-debug-test.js
□ exact-flow-test.js
□ final-working-checkout.js
□ fixed-checkout-test.js
□ focused-ghost-buyer.js
□ full-checkout-test.js
□ ghost-user-test.js
□ guest-vs-registered-email-test.js
□ guest-vs-registered-test.js
□ human-like-checkout.js
□ multi-step-checkout-test.js
□ production-ghost-buyer.js
□ proof-ghost-buyer.js
□ robust-email-test.js
□ simple-checkout-test.js
□ simple-ghost-buyer.js
□ simple-guest-vs-registered.js
□ smart-ghost-buyer.js
□ working-ghost-buyer.js
□ working-proof-test.js

PDF/INVOICE CONVERTERS:
□ chrome-pdf-converter.js
□ create-comprehensive-report-pdf.js
□ create-final-corrected-pdfs.js
□ create-final-invoice-27aug.js
□ final-fixed-pdf.js
□ fixed-header-pdf.js
□ html-to-pdf-converter.js
□ optimized-pdf-converter.js
□ ultra-optimized-pdf.js
□ update-final-pdfs.js
□ update-invoice-date.js

EMPTY FILES:
□ check_all_products.js (0 bytes)
□ check_pegasti.js (0 bytes)
□ complete_trigger_fix.sql (0 bytes)
□ dev-server.log (0 bytes)

WORKSPACE FILES:
□ *.code-workspace files (4 files)

ENTIRE DIRECTORY:
□ invoices_documents/ (46 files - sensitive data)
```

### Duplicate Page Implementations to DELETE:
```
KEEP: MultiStepCheckoutPage.tsx (most complete)
DELETE:
□ ModularCheckoutPage.tsx
□ ModularCheckoutPage2.tsx
□ CheckoutPage.tsx (after migration)
```

### Unused Components to VERIFY:
```
□ AmericanConeflowerPage.tsx (1 byte - empty)
□ RecipeTest.tsx (885 bytes - test component)
□ ImageTest.tsx (2,178 bytes - test component)
□ TestStripeEnv.tsx (3,079 bytes - dev only)
□ PopupDebugPage.tsx (3,185 bytes - dev only)
```

---

## 🔀 FILES TO CONSOLIDATE

| Current Files | Consolidate To |
|--------------|----------------|
| `CheckoutPage.tsx` + `ModularCheckoutPage.tsx` + `ModularCheckoutPage2.tsx` + `MultiStepCheckoutPage.tsx` | `CheckoutPage.tsx` (refactored) |
| `emailService.ts` + `directEmailService.ts` + `registrationEmailService.ts` | `services/emailService.ts` |
| `adminCheck.ts` + `adminSecurity.ts` + `SecureAdminRoute.tsx` | `services/adminService.ts` |
| `useFirstTimeVisitor.ts` + `useFirstTimeVisitorDebug.ts` | `useFirstTimeVisitor.ts` |
| Multiple SQL migration scripts | Numbered migrations only |

---

## 🔐 SECURITY AUDIT

### CRITICAL:
| Issue | Location | Status |
|-------|----------|--------|
| Admin check relies on client-side | `SecureAdminRoute.tsx` | ⚠️ REVIEW |
| Potential API key in logs | `console.log` statements | 🔴 FIX |
| CSRF protection inconsistent | Various forms | ⚠️ REVIEW |

### HIGH:
| Issue | Location | Status |
|-------|----------|--------|
| Stripe keys exposure risk | `TestStripeEnv.tsx` | ⚠️ DEV ONLY |
| Sensitive data in invoices folder | `invoices_documents/` | 🔴 REMOVE |

### PAYMENT SECURITY:
- ✅ Stripe integration uses official SDK
- ✅ Payment intents created server-side (edge functions)
- ⚠️ Bank transfer flow needs manual verification
- ⚠️ COD flow needs admin confirmation

---

## ⚡ PERFORMANCE FINDINGS

### Bundle Size Issues:
| File | Size | Impact | Recommendation |
|------|------|--------|----------------|
| `translations.ts` | 124KB | High | Lazy load by language |
| `CheckoutPage.tsx` | 100KB | High | Split into components |
| `sampleRecipes.ts` | 52KB | Medium | Move to database |
| `AdminDiscountManagement.tsx` | 45KB | Medium | Split into components |

### Image Loading:
- ✅ Supabase storage integration working
- ✅ Image fallbacks implemented
- ⚠️ Some external images (ibb.co) may be slow

### Code Splitting:
- ✅ Admin pages are lazy loaded
- ❌ Checkout pages not lazy loaded
- ❌ Large utility files not tree-shaken

---

## 📋 REFACTORING ROADMAP

### IMMEDIATE (Do This Week):
1. □ Delete 60+ dead files from root
2. □ Remove `invoices_documents/` folder
3. □ Remove empty/1-byte files
4. □ Add `invoices_documents/` to `.gitignore`
5. □ Fix Product ID type mismatch (string vs number)

### SHORT TERM (This Sprint):
1. □ Remove console.log statements (394 occurrences)
2. □ Consolidate checkout pages into one
3. □ Consolidate email services
4. □ Add proper error handling
5. □ Set up Playwright E2E tests

### MEDIUM TERM (This Month):
1. □ Split large components (CheckoutPage, AdminDiscountManagement)
2. □ Replace `any` types with proper types (239 occurrences)
3. □ Implement proper logging service
4. □ Add unit tests for critical paths
5. □ Lazy load translations by language

### LONG TERM (Backlog):
1. □ Move sample data to database
2. □ Implement proper feature flags
3. □ Add monitoring/alerting
4. □ Optimize images and assets
5. □ Add accessibility improvements

---

## 📈 RECOMMENDED FOLDER STRUCTURE

```
kmetija-marosa/
├── src/
│   ├── components/
│   │   ├── admin/           # Admin-only components
│   │   ├── checkout/        # Checkout flow components
│   │   ├── common/          # Shared UI components
│   │   ├── layout/          # Header, Footer, Nav
│   │   ├── product/         # Product-related components
│   │   └── ui/              # Base UI primitives
│   ├── pages/
│   │   ├── admin/           # Admin pages
│   │   ├── auth/            # Login, Register, etc.
│   │   ├── checkout/        # Checkout page
│   │   └── public/          # Public pages
│   ├── services/            # API/business logic
│   ├── hooks/               # Custom React hooks
│   ├── utils/               # Pure utility functions
│   ├── lib/                 # Third-party integrations
│   ├── types/               # TypeScript types
│   ├── i18n/                # Translations
│   └── styles/              # Global styles
├── tests/                   # ← NEW: All tests here
│   ├── e2e/                 # Playwright E2E tests
│   ├── unit/                # Unit tests
│   └── fixtures/            # Test data
├── scripts/                 # Build/deploy scripts
├── supabase/                # Supabase config
├── public/                  # Static assets
└── docs/                    # ← NEW: Documentation
```

---

## ✅ WHAT'S WORKING WELL

1. **React 18 + TypeScript + Vite** - Modern stack
2. **TailwindCSS** - Consistent styling approach
3. **Supabase integration** - Auth, DB, Storage working
4. **Stripe integration** - Payment flow functional
5. **i18n support** - 4 languages implemented
6. **Admin dashboard** - Core features working
7. **Lazy loading** - Admin pages are code-split
8. **Error boundaries** - Basic implementation exists

---

## 📊 FINAL STATISTICS

| Category | Count |
|----------|-------|
| Total Source Files | 242 |
| Components | 93 |
| Pages | 35 |
| Utility Files | 30 |
| Hooks | 5 |
| Services | 3 |
| Dead Files to Remove | 60+ |
| Console.log Statements | 394 |
| `any` Type Usages | 239 |
| TODO/FIXME Comments | 21 |
| Duplicate Implementations | 4 checkout pages |

---

**Report Complete. Proceeding to Playwright Test Suite implementation.**
