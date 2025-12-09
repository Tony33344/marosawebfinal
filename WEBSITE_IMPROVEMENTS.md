# Kmetija Maroša - Website Improvements for Best in Slovenia

## ✅ Fixes Applied Today

### 1. Discount Code System Fixed
- **Problem**: Admin UI showed hardcoded sample data instead of real database discounts
- **Fix**: Updated `BannerDiscountManager.tsx` to fetch/create/update/delete from actual Supabase database
- **Result**: Discount codes now properly sync between admin and customer-facing checkout

### 2. Missing Slovenian Translations Added
- Added translations for:
  - `footer.language` - "Jezik"
  - `gifts.*` - Complete gift package page translations
  - `recipes.viewRecipe` - "Poglej recept"
  - `cart.loading`, `cart.orderSummary`, `cart.freeShippingNote`
  - `productDetail.mainProductImage`, `productDetail.priceLabel`, `productDetail.viewLargerImage`
  - `checkout.loadingProfile`
  - `error.*` - Complete error message translations

---

## 🚀 Recommendations to Be the Best Farm Shop in Slovenia

### Priority 1: Performance & SEO (Critical for Rankings)

#### A. Core Web Vitals Optimization
1. **Image Optimization**
   - [x] Implement WebP/AVIF format with fallbacks (`OptimizedImage.tsx`)
   - [x] Add proper `width` and `height` attributes to all images
   - [x] Fix the `fetchPriority` React warning (correctly using camelCase)
   - [x] Implement lazy loading for below-fold images (`LazyImage.tsx`)
   - [x] Use responsive images with `srcset` (`OptimizedImage.tsx`)

2. **Bundle Size Reduction**
   - [x] Implement code splitting for admin pages (lazy loading all admin pages)
   - [ ] Lazy load Stripe components only when needed
   - [ ] Tree-shake unused Lucide icons

3. **Performance Monitoring**
   - [x] Core Web Vitals tracking (`performance.ts`)
   - [x] Analytics event tracking (`analytics.ts`)

4. **Server-Side Rendering (Optional)**
   - Consider Next.js migration for better SEO and initial load

#### B. SEO Improvements
1. **Meta Tags**
   - [x] Add structured data (JSON-LD) for products, recipes, organization (`StructuredData.tsx`)
   - [x] Implement Open Graph tags for social sharing (`OpenGraph.tsx`)
   - [x] Add canonical URLs (`CanonicalUrl.tsx`)
   - [x] Create XML sitemap (`scripts/generateSitemap.ts`)
   - [x] Add hreflang tags for multilingual support

2. **Content**
   - [ ] Add unique meta descriptions per product
   - [x] Implement breadcrumb navigation with schema markup (`Breadcrumb.tsx`)
   - [x] Add FAQ schema for gift package page (in `StructuredData.tsx`)

### Priority 2: User Experience (Customer Conversion)

#### A. Checkout Flow
1. **Speed Improvements**
   - [x] Pre-fill postal code database for faster form completion (`PostalCodeInput.tsx`, `slovenianPostalCodes.ts` - 350+ codes)
   - [ ] Add address autocomplete (Google Places API)
   - [ ] Reduce checkout steps - consider single-page checkout

2. **Trust Signals**
   - [x] Add security badges and SSL seal (`TrustBadges.tsx`)
   - [x] Display payment method logos prominently (`TrustBadges.tsx`)
   - [ ] Add customer reviews/testimonials

3. **Payment Methods**
   - [ ] Verify Stripe test credentials work in production
   - [ ] Add PayPal option (popular in Slovenia)
   - [ ] Add Moneta/Flik for local payments

#### B. Mobile Experience
1. [ ] Test and optimize all flows on mobile
2. [ ] Implement touch-friendly buttons (min 44x44px)
3. [ ] Add bottom navigation for key actions
4. [ ] Implement swipe gestures for product gallery

### Priority 3: Slovenian Market Features

#### A. Local Payment Integration
1. [ ] Add Moneta payment option
2. [ ] Add Mastercard SecureCode
3. [x] Bank transfer with QR code (UPN) (`UPNQRCode.tsx`)

#### B. Slovenian Logistics
1. [ ] Integration with Pošta Slovenije tracking
2. [ ] Add GLS/DPD parcel lockers option
3. [ ] Same-day delivery option for local area

#### C. Language & Content
1. [ ] Perfect all Slovenian translations (currently ~95% complete)
2. [ ] Add German translations for Austrian/German customers
3. [ ] Implement proper Slovenian number formatting (1.000,00 €)

### Priority 4: Marketing & Growth

#### A. Email Marketing
1. [ ] Automated welcome sequence for new subscribers
2. [ ] Abandoned cart recovery emails
3. [ ] Post-purchase follow-up (review request)
4. [ ] Seasonal/holiday campaign templates

#### B. Analytics & Tracking
1. [ ] Fix the 406 error on `analytics_daily_metrics` endpoint
2. [x] Implement proper e-commerce tracking (GA4) (`analytics.ts`)
3. [ ] Add conversion tracking for ads
4. [ ] Heat map and session recording (Hotjar/Clarity)

#### C. Social Proof
1. [ ] Add product reviews system
2. [ ] Display Instagram feed with tagged photos
3. [ ] Add "As seen on" media section

### Priority 5: Technical Debt & Security

#### A. Security
1. [ ] Move CSP headers from `<meta>` to HTTP headers
2. [ ] Implement rate limiting for checkout/login
3. [ ] Add CAPTCHA for contact form
4. [ ] Regular security audit

#### B. Code Quality
1. [x] Fix React warnings (`jsx` prop, `fetchPriority`) - correctly implemented
2. [ ] Remove console.log statements in production
3. [ ] Implement proper error boundaries
4. [ ] Add loading states for all async operations

#### C. Testing
1. [x] Complete Playwright test suite (`tests/tests/e2e/real-user-journey.spec.ts` - real user flow tests)
2. [ ] Add unit tests for critical business logic
3. [ ] Implement visual regression testing
4. [ ] Add API integration tests

---

## 📊 Competitive Analysis Recommendations

To be the best farm shop in Slovenia, compare with:
1. **Kmetija Gaube** - Strong brand, good SEO
2. **Domača sveža** - Good UX, fast checkout
3. **Zeleni kotiček** - Strong social media presence
4. **Bio-kmetija Šalamun** - Excellent product photography

### Key Differentiators to Develop
1. **Recipe Integration** - Unique feature, expand it
2. **Gift Packages** - Expand with corporate options
3. **Subscription Box** - Monthly farm box delivery
4. **Farm Experience** - Book farm visits/workshops

---

## 🎯 90-Day Action Plan

### Month 1: Foundation
- [ ] Fix all Playwright tests
- [x] Complete Slovenian translations (added missing keys)
- [x] Implement proper image optimization (`OptimizedImage.tsx`, `LazyImage.tsx`)
- [x] Add structured data for products (`StructuredData.tsx`)

### Month 2: Conversion
- [x] Optimize checkout flow (postal code autofill)
- [ ] Add reviews system
- [ ] Implement abandoned cart emails
- [ ] Add PayPal payment option

### Month 3: Growth
- [ ] Launch loyalty program
- [ ] Implement subscription box
- [ ] Add corporate gift section
- [ ] Launch referral program

---

## 🎛️ Feature Flags System

A comprehensive feature flags system has been implemented to control all website features from the admin panel:

**Location:** `/admin/features`

**Features controlled:**
- Payment methods (Stripe, PayPal, Cash on Delivery, Bank Transfer, UPN QR)
- Checkout options (Guest checkout, address autocomplete, postal code autofill)
- Marketing features (Newsletter popup, discount banners, loyalty program)
- UI elements (Dark mode, language switcher, product zoom, sticky cart)
- Shipping options (Free shipping threshold, express delivery, parcel lockers)
- SEO features (Structured data, Open Graph, canonical URLs, breadcrumbs)
- Analytics (Google Analytics, e-commerce tracking, Facebook Pixel)

**Usage:**
```tsx
import { useFeatureFlag } from '../hooks/useFeatureFlag';

const MyComponent = () => {
  const isEnabled = useFeatureFlag('feature_id');
  if (!isEnabled) return null;
  return <div>Feature content</div>;
};
```

---

*Document created: December 8, 2025*
*Last updated: December 8, 2025*
