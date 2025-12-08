/**
 * Feature Flags Configuration
 * Central control for all website features - can be toggled in admin panel
 */

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  category: 'payment' | 'checkout' | 'marketing' | 'ui' | 'shipping' | 'seo' | 'analytics';
  enabled: boolean;
  defaultEnabled: boolean;
}

// Default feature flags - these are loaded from localStorage or database
export const DEFAULT_FEATURE_FLAGS: FeatureFlag[] = [
  // Payment Features
  {
    id: 'stripe_payments',
    name: 'Stripe Payments',
    description: 'Enable credit card payments via Stripe',
    category: 'payment',
    enabled: true,
    defaultEnabled: true
  },
  {
    id: 'paypal_payments',
    name: 'PayPal Payments',
    description: 'Enable PayPal payment option',
    category: 'payment',
    enabled: false,
    defaultEnabled: false
  },
  {
    id: 'cash_on_delivery',
    name: 'Cash on Delivery',
    description: 'Enable pay-on-delivery option',
    category: 'payment',
    enabled: true,
    defaultEnabled: true
  },
  {
    id: 'bank_transfer',
    name: 'Bank Transfer',
    description: 'Enable direct bank transfer payments',
    category: 'payment',
    enabled: true,
    defaultEnabled: true
  },
  {
    id: 'upn_qr_code',
    name: 'UPN QR Code',
    description: 'Show UPN QR code for bank transfers',
    category: 'payment',
    enabled: false,
    defaultEnabled: false
  },

  // Checkout Features
  {
    id: 'guest_checkout',
    name: 'Guest Checkout',
    description: 'Allow checkout without registration',
    category: 'checkout',
    enabled: true,
    defaultEnabled: true
  },
  {
    id: 'address_autocomplete',
    name: 'Address Autocomplete',
    description: 'Enable Google Places address autocomplete',
    category: 'checkout',
    enabled: false,
    defaultEnabled: false
  },
  {
    id: 'postal_code_autofill',
    name: 'Postal Code Autofill',
    description: 'Auto-fill city based on postal code',
    category: 'checkout',
    enabled: true,
    defaultEnabled: true
  },
  {
    id: 'order_notes',
    name: 'Order Notes',
    description: 'Allow customers to add notes to orders',
    category: 'checkout',
    enabled: true,
    defaultEnabled: true
  },
  {
    id: 'trust_badges',
    name: 'Trust Badges',
    description: 'Show security and trust badges at checkout',
    category: 'checkout',
    enabled: true,
    defaultEnabled: true
  },
  {
    id: 'payment_logos',
    name: 'Payment Method Logos',
    description: 'Display accepted payment method logos',
    category: 'checkout',
    enabled: true,
    defaultEnabled: true
  },
  {
    id: 'quality_guarantee',
    name: 'Quality Guarantee Badge',
    description: 'Show quality guarantee message at checkout',
    category: 'checkout',
    enabled: true,
    defaultEnabled: true
  },

  // Marketing Features
  {
    id: 'discount_codes',
    name: 'Discount Codes',
    description: 'Enable promotional discount codes',
    category: 'marketing',
    enabled: true,
    defaultEnabled: true
  },
  {
    id: 'welcome_popup',
    name: 'Welcome Popup',
    description: 'Show welcome popup with discount offer',
    category: 'marketing',
    enabled: true,
    defaultEnabled: true
  },
  {
    id: 'newsletter_signup',
    name: 'Newsletter Signup',
    description: 'Enable newsletter subscription form',
    category: 'marketing',
    enabled: true,
    defaultEnabled: true
  },
  {
    id: 'abandoned_cart_emails',
    name: 'Abandoned Cart Emails',
    description: 'Send reminder emails for abandoned carts',
    category: 'marketing',
    enabled: false,
    defaultEnabled: false
  },
  {
    id: 'product_reviews',
    name: 'Product Reviews',
    description: 'Allow customers to leave product reviews',
    category: 'marketing',
    enabled: false,
    defaultEnabled: false
  },
  {
    id: 'referral_program',
    name: 'Referral Program',
    description: 'Enable customer referral rewards',
    category: 'marketing',
    enabled: false,
    defaultEnabled: false
  },

  // UI Features
  {
    id: 'dark_mode',
    name: 'Dark Mode',
    description: 'Enable dark mode toggle for users',
    category: 'ui',
    enabled: false,
    defaultEnabled: false
  },
  {
    id: 'language_switcher',
    name: 'Language Switcher',
    description: 'Show language selection in footer',
    category: 'ui',
    enabled: true,
    defaultEnabled: true
  },
  {
    id: 'product_zoom',
    name: 'Product Image Zoom',
    description: 'Enable zoom on product images',
    category: 'ui',
    enabled: true,
    defaultEnabled: true
  },
  {
    id: 'sticky_cart',
    name: 'Sticky Cart Button',
    description: 'Show floating cart button on mobile',
    category: 'ui',
    enabled: true,
    defaultEnabled: true
  },
  {
    id: 'announcement_banner',
    name: 'Announcement Banner',
    description: 'Show promotional banner at top of site',
    category: 'ui',
    enabled: true,
    defaultEnabled: true
  },
  {
    id: 'gift_packaging',
    name: 'Gift Packaging',
    description: 'Enable gift packaging option at checkout',
    category: 'ui',
    enabled: true,
    defaultEnabled: true
  },
  {
    id: 'recipe_section',
    name: 'Recipe Section',
    description: 'Show recipes on product pages',
    category: 'ui',
    enabled: true,
    defaultEnabled: true
  },

  // Shipping Features
  {
    id: 'free_shipping_threshold',
    name: 'Free Shipping Threshold',
    description: 'Enable free shipping over certain amount',
    category: 'shipping',
    enabled: true,
    defaultEnabled: true
  },
  {
    id: 'express_delivery',
    name: 'Express Delivery',
    description: 'Offer express delivery option',
    category: 'shipping',
    enabled: false,
    defaultEnabled: false
  },
  {
    id: 'parcel_lockers',
    name: 'Parcel Lockers',
    description: 'Enable delivery to parcel lockers (GLS/DPD)',
    category: 'shipping',
    enabled: false,
    defaultEnabled: false
  },
  {
    id: 'local_pickup',
    name: 'Local Pickup',
    description: 'Allow pickup from farm location',
    category: 'shipping',
    enabled: true,
    defaultEnabled: true
  },
  {
    id: 'international_shipping',
    name: 'International Shipping',
    description: 'Enable shipping to other countries',
    category: 'shipping',
    enabled: false,
    defaultEnabled: false
  },

  // SEO Features
  {
    id: 'structured_data',
    name: 'Structured Data (JSON-LD)',
    description: 'Add schema.org structured data for SEO',
    category: 'seo',
    enabled: false,
    defaultEnabled: false
  },
  {
    id: 'open_graph_tags',
    name: 'Open Graph Tags',
    description: 'Enable social media sharing tags',
    category: 'seo',
    enabled: true,
    defaultEnabled: true
  },
  {
    id: 'sitemap_generation',
    name: 'Sitemap Generation',
    description: 'Auto-generate XML sitemap',
    category: 'seo',
    enabled: false,
    defaultEnabled: false
  },
  {
    id: 'breadcrumbs',
    name: 'Breadcrumb Navigation',
    description: 'Show breadcrumb navigation on pages',
    category: 'seo',
    enabled: false,
    defaultEnabled: false
  },
  {
    id: 'canonical_urls',
    name: 'Canonical URLs',
    description: 'Add canonical URL tags to prevent duplicate content',
    category: 'seo',
    enabled: true,
    defaultEnabled: true
  },
  {
    id: 'hreflang_tags',
    name: 'Hreflang Tags',
    description: 'Add language alternative tags for multilingual SEO',
    category: 'seo',
    enabled: true,
    defaultEnabled: true
  },

  // Analytics Features
  {
    id: 'google_analytics',
    name: 'Google Analytics',
    description: 'Enable Google Analytics tracking',
    category: 'analytics',
    enabled: true,
    defaultEnabled: true
  },
  {
    id: 'ecommerce_tracking',
    name: 'E-commerce Tracking',
    description: 'Track purchases in Google Analytics',
    category: 'analytics',
    enabled: false,
    defaultEnabled: false
  },
  {
    id: 'facebook_pixel',
    name: 'Facebook Pixel',
    description: 'Enable Facebook Pixel tracking',
    category: 'analytics',
    enabled: false,
    defaultEnabled: false
  },
  {
    id: 'heatmaps',
    name: 'Heatmaps & Session Recording',
    description: 'Enable Hotjar/Clarity tracking',
    category: 'analytics',
    enabled: false,
    defaultEnabled: false
  }
];

// Storage key for feature flags
const FEATURE_FLAGS_KEY = 'kmetija_marosa_feature_flags';

/**
 * Get all feature flags from storage
 */
export function getFeatureFlags(): FeatureFlag[] {
  try {
    const stored = localStorage.getItem(FEATURE_FLAGS_KEY);
    if (stored) {
      const parsedFlags = JSON.parse(stored) as FeatureFlag[];
      // Merge with defaults to include any new flags
      return DEFAULT_FEATURE_FLAGS.map(defaultFlag => {
        const storedFlag = parsedFlags.find(f => f.id === defaultFlag.id);
        return storedFlag ? { ...defaultFlag, enabled: storedFlag.enabled } : defaultFlag;
      });
    }
  } catch (e) {
    console.error('Error loading feature flags:', e);
  }
  return DEFAULT_FEATURE_FLAGS;
}

/**
 * Save feature flags to storage
 */
export function saveFeatureFlags(flags: FeatureFlag[]): void {
  try {
    localStorage.setItem(FEATURE_FLAGS_KEY, JSON.stringify(flags));
  } catch (e) {
    console.error('Error saving feature flags:', e);
  }
}

/**
 * Check if a specific feature is enabled
 */
export function isFeatureEnabled(featureId: string): boolean {
  const flags = getFeatureFlags();
  const flag = flags.find(f => f.id === featureId);
  return flag ? flag.enabled : false;
}

/**
 * Toggle a feature flag
 */
export function toggleFeature(featureId: string): void {
  const flags = getFeatureFlags();
  const updatedFlags = flags.map(flag => 
    flag.id === featureId ? { ...flag, enabled: !flag.enabled } : flag
  );
  saveFeatureFlags(updatedFlags);
}

/**
 * Enable a feature
 */
export function enableFeature(featureId: string): void {
  const flags = getFeatureFlags();
  const updatedFlags = flags.map(flag => 
    flag.id === featureId ? { ...flag, enabled: true } : flag
  );
  saveFeatureFlags(updatedFlags);
}

/**
 * Disable a feature
 */
export function disableFeature(featureId: string): void {
  const flags = getFeatureFlags();
  const updatedFlags = flags.map(flag => 
    flag.id === featureId ? { ...flag, enabled: false } : flag
  );
  saveFeatureFlags(updatedFlags);
}

/**
 * Reset all features to defaults
 */
export function resetFeatureFlags(): void {
  saveFeatureFlags(DEFAULT_FEATURE_FLAGS);
}

/**
 * Get features by category
 */
export function getFeaturesByCategory(category: FeatureFlag['category']): FeatureFlag[] {
  return getFeatureFlags().filter(f => f.category === category);
}

/**
 * Category display names
 */
export const CATEGORY_NAMES: Record<FeatureFlag['category'], string> = {
  payment: 'Plačilne možnosti',
  checkout: 'Blagajna',
  marketing: 'Marketing',
  ui: 'Uporabniški vmesnik',
  shipping: 'Dostava',
  seo: 'SEO',
  analytics: 'Analitika'
};

/**
 * Category icons (Lucide icon names)
 */
export const CATEGORY_ICONS: Record<FeatureFlag['category'], string> = {
  payment: 'CreditCard',
  checkout: 'ShoppingCart',
  marketing: 'Megaphone',
  ui: 'Palette',
  shipping: 'Truck',
  seo: 'Search',
  analytics: 'BarChart'
};
