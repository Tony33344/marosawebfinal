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
   - [ ] Implement WebP/AVIF format with fallbacks
   - [ ] Add proper `width` and `height` attributes to all images
   - [ ] Fix the `fetchPriority` React warning (use lowercase `fetchpriority`)
   - [ ] Implement lazy loading for below-fold images
   - [ ] Use responsive images with `srcset`

2. **Bundle Size Reduction**
   - [ ] Implement code splitting for admin pages
   - [ ] Lazy load Stripe components only when needed
   - [ ] Tree-shake unused Lucide icons

3. **Server-Side Rendering (Optional)**
   - Consider Next.js migration for better SEO and initial load

#### B. SEO Improvements
1. **Meta Tags**
   - [ ] Add structured data (JSON-LD) for products, recipes, and organization
   - [ ] Implement Open Graph tags for social sharing
   - [ ] Add canonical URLs
   - [ ] Create XML sitemap

2. **Content**
   - [ ] Add unique meta descriptions per product
   - [ ] Implement breadcrumb navigation with schema markup
   - [ ] Add FAQ schema for gift package page

### Priority 2: User Experience (Customer Conversion)

#### A. Checkout Flow
1. **Speed Improvements**
   - [ ] Pre-fill postal code database for faster form completion
   - [ ] Add address autocomplete (Google Places API)
   - [ ] Reduce checkout steps - consider single-page checkout

2. **Trust Signals**
   - [ ] Add security badges and SSL seal
   - [ ] Display payment method logos prominently
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
3. [ ] Bank transfer with QR code (UPN)

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
2. [ ] Implement proper e-commerce tracking (GA4)
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
1. [ ] Fix React warnings (`jsx` prop, `fetchPriority`)
2. [ ] Remove console.log statements in production
3. [ ] Implement proper error boundaries
4. [ ] Add loading states for all async operations

#### C. Testing
1. [ ] Complete Playwright test suite (currently improving)
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
- [ ] Complete Slovenian translations
- [ ] Implement proper image optimization
- [ ] Add structured data for products

### Month 2: Conversion
- [ ] Optimize checkout flow
- [ ] Add reviews system
- [ ] Implement abandoned cart emails
- [ ] Add PayPal payment option

### Month 3: Growth
- [ ] Launch loyalty program
- [ ] Implement subscription box
- [ ] Add corporate gift section
- [ ] Launch referral program

---

*Document created: December 8, 2025*
*Last updated: December 8, 2025*
