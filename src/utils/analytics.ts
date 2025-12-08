/**
 * Analytics Tracking Utility
 * Centralized analytics tracking with feature flag support
 */

import { isFeatureEnabled } from '../config/featureFlags';

// Event types for type safety
export type AnalyticsEventType =
  | 'page_view'
  | 'product_view'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'begin_checkout'
  | 'purchase'
  | 'search'
  | 'newsletter_signup'
  | 'discount_applied'
  | 'gift_selected'
  | 'recipe_view'
  | 'contact_form'
  | 'share'
  | 'login'
  | 'signup';

export interface AnalyticsEvent {
  event: AnalyticsEventType;
  category?: string;
  label?: string;
  value?: number;
  currency?: string;
  items?: AnalyticsItem[];
  [key: string]: unknown;
}

export interface AnalyticsItem {
  item_id: string;
  item_name: string;
  price?: number;
  quantity?: number;
  category?: string;
  variant?: string;
}

// Check if Google Analytics is loaded
function isGALoaded(): boolean {
  return typeof window !== 'undefined' && typeof (window as any).gtag === 'function';
}

// Check if Facebook Pixel is loaded
function isFBPixelLoaded(): boolean {
  return typeof window !== 'undefined' && typeof (window as any).fbq === 'function';
}

/**
 * Track a custom event
 */
export function trackEvent(event: AnalyticsEvent): void {
  if (!isFeatureEnabled('analytics_tracking')) {
    console.debug('[Analytics] Tracking disabled:', event.event);
    return;
  }

  console.debug('[Analytics] Tracking event:', event);

  // Google Analytics 4
  if (isGALoaded()) {
    const { event: eventName, ...params } = event;
    (window as any).gtag('event', eventName, params);
  }

  // Facebook Pixel
  if (isFBPixelLoaded() && isFeatureEnabled('facebook_pixel')) {
    const fbEvent = mapToFacebookEvent(event);
    if (fbEvent) {
      (window as any).fbq('track', fbEvent.name, fbEvent.params);
    }
  }
}

/**
 * Track page view
 */
export function trackPageView(path: string, title?: string): void {
  if (!isFeatureEnabled('analytics_tracking')) return;

  console.debug('[Analytics] Page view:', path);

  if (isGALoaded()) {
    (window as any).gtag('event', 'page_view', {
      page_path: path,
      page_title: title || document.title
    });
  }

  if (isFBPixelLoaded() && isFeatureEnabled('facebook_pixel')) {
    (window as any).fbq('track', 'PageView');
  }
}

/**
 * Track product view
 */
export function trackProductView(product: {
  id: string;
  name: string;
  price: number;
  category?: string;
}): void {
  trackEvent({
    event: 'product_view',
    currency: 'EUR',
    value: product.price,
    items: [{
      item_id: product.id,
      item_name: product.name,
      price: product.price,
      category: product.category
    }]
  });
}

/**
 * Track add to cart
 */
export function trackAddToCart(product: {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
}): void {
  trackEvent({
    event: 'add_to_cart',
    currency: 'EUR',
    value: product.price * product.quantity,
    items: [{
      item_id: product.id,
      item_name: product.name,
      price: product.price,
      quantity: product.quantity,
      category: product.category
    }]
  });
}

/**
 * Track remove from cart
 */
export function trackRemoveFromCart(product: {
  id: string;
  name: string;
  price: number;
  quantity: number;
}): void {
  trackEvent({
    event: 'remove_from_cart',
    currency: 'EUR',
    value: product.price * product.quantity,
    items: [{
      item_id: product.id,
      item_name: product.name,
      price: product.price,
      quantity: product.quantity
    }]
  });
}

/**
 * Track begin checkout
 */
export function trackBeginCheckout(cartValue: number, items: AnalyticsItem[]): void {
  trackEvent({
    event: 'begin_checkout',
    currency: 'EUR',
    value: cartValue,
    items
  });
}

/**
 * Track purchase
 */
export function trackPurchase(order: {
  orderId: string;
  total: number;
  shipping?: number;
  tax?: number;
  discount?: number;
  items: AnalyticsItem[];
}): void {
  trackEvent({
    event: 'purchase',
    transaction_id: order.orderId,
    currency: 'EUR',
    value: order.total,
    shipping: order.shipping || 0,
    tax: order.tax || 0,
    coupon: order.discount ? 'discount_applied' : undefined,
    items: order.items
  });
}

/**
 * Track search
 */
export function trackSearch(searchTerm: string): void {
  trackEvent({
    event: 'search',
    search_term: searchTerm
  });
}

/**
 * Track newsletter signup
 */
export function trackNewsletterSignup(email?: string): void {
  trackEvent({
    event: 'newsletter_signup',
    method: 'footer_form'
  });
}

/**
 * Track discount code applied
 */
export function trackDiscountApplied(code: string, discountValue: number): void {
  trackEvent({
    event: 'discount_applied',
    coupon: code,
    value: discountValue,
    currency: 'EUR'
  });
}

/**
 * Track recipe view
 */
export function trackRecipeView(recipe: {
  id: string;
  name: string;
}): void {
  trackEvent({
    event: 'recipe_view',
    content_id: recipe.id,
    content_name: recipe.name
  });
}

/**
 * Track social share
 */
export function trackShare(method: string, contentType: string, contentId: string): void {
  trackEvent({
    event: 'share',
    method,
    content_type: contentType,
    content_id: contentId
  });
}

/**
 * Map to Facebook Pixel events
 */
function mapToFacebookEvent(event: AnalyticsEvent): { name: string; params?: Record<string, unknown> } | null {
  switch (event.event) {
    case 'product_view':
      return {
        name: 'ViewContent',
        params: {
          content_type: 'product',
          content_ids: event.items?.map(i => i.item_id),
          value: event.value,
          currency: 'EUR'
        }
      };
    case 'add_to_cart':
      return {
        name: 'AddToCart',
        params: {
          content_type: 'product',
          content_ids: event.items?.map(i => i.item_id),
          value: event.value,
          currency: 'EUR'
        }
      };
    case 'begin_checkout':
      return {
        name: 'InitiateCheckout',
        params: {
          value: event.value,
          currency: 'EUR',
          num_items: event.items?.length
        }
      };
    case 'purchase':
      return {
        name: 'Purchase',
        params: {
          value: event.value,
          currency: 'EUR',
          content_type: 'product',
          content_ids: event.items?.map(i => i.item_id)
        }
      };
    case 'newsletter_signup':
      return { name: 'Lead' };
    case 'search':
      return {
        name: 'Search',
        params: { search_string: event.search_term }
      };
    default:
      return null;
  }
}

/**
 * Initialize analytics (call once on app load)
 */
export function initializeAnalytics(): void {
  if (!isFeatureEnabled('analytics_tracking')) {
    console.debug('[Analytics] Analytics tracking is disabled');
    return;
  }

  // Track initial page view
  trackPageView(window.location.pathname, document.title);

  console.debug('[Analytics] Initialized');
}
