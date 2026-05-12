/**
 * Application Configuration
 *
 * This file contains centralized configuration values for the application.
 * Instead of hardcoding values throughout the codebase, import them from here.
 */

// Environment detection
export const ENV = {
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  isStaging: import.meta.env.VITE_STAGING_BANNER === 'true',
  apiUrl: import.meta.env.VITE_SUPABASE_URL || '',
  apiKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  stripeKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
};

// Shipping configuration
export const SHIPPING = {
  cost: 3.90,
  freeThreshold: 50.00,
  countries: ['Slovenija', 'Hrvaška', 'Avstrija', 'Nemčija'],
  defaultCountry: 'Slovenija',
};

// Payment methods
export const PAYMENT_METHODS = {
  creditCard: 'credit_card',
  payOnDelivery: 'pay_on_delivery',
  bankTransfer: 'bank_transfer',
};

// Order status values
export const ORDER_STATUS = {
  pending: 'pending',
  processing: 'processing',
  shipped: 'shipped',
  delivered: 'delivered',
  cancelled: 'cancelled',
};

// Common postal codes for Slovenia
export const POSTAL_CODES = [
  { code: "1000", city: "Ljubljana" },
  { code: "2000", city: "Maribor" },
  { code: "3000", city: "Celje" },
  { code: "4000", city: "Kranj" },
  { code: "5000", city: "Nova Gorica" },
  { code: "6000", city: "Koper" },
  { code: "8000", city: "Novo mesto" },
  { code: "9000", city: "Murska Sobota" },
];

// Password requirements
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
};

// Image configuration
export const IMAGES = {
  placeholderImage: '/images/placeholder.svg',
  logoPath: '/images/logo.png',
  maxAdditionalImages: 6,
  allowedDomains: [
    'images.unsplash.com',
    'source.unsplash.com',
    'vibrantplate.com',
    'squarespace-cdn.com',
    'blogger.googleusercontent.com',
    'pixabay.com',
    'verywellhealth.com',
    'sakiproducts.com',
    'simplybeyondherbs.com',
    'duckduckgo.com',
    'jernejkitchen.com',
    'googleusercontent.com',
    'thefeedfeed.com',
    'dreamstime.com',
    'tse4.mm.bing.net',
    'bp.blogspot.com',
    'forbes.com',
    'urbanfarmingzone.com',
    'littlesunnykitchen.com',
    'treehugger.com',
    'delo.si',
    'onaplus.delo.si',
    'marosakreditna.netlify.app'
  ],
};

// API endpoints
export const API = {
  products: 'products',
  orders: 'orders',
  profiles: 'profiles',
  recipes: 'recipes',
};

// Pagination
export const PAGINATION = {
  defaultPageSize: 10,
  maxPageSize: 50,
};

// Timeouts
export const TIMEOUTS = {
  sessionTimeout: 30 * 60 * 1000, // 30 minutes in milliseconds
  apiTimeout: 10000, // 10 seconds in milliseconds
};

// Form validation
export const VALIDATION = {
  emailRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phoneRegex: /^\+?[0-9]{8,15}$/,
  postalCodeRegex: /^\d{4}$/,
  minNameLength: 2,
};

// Default form values
export const DEFAULT_FORM_VALUES = {
  country: 'Slovenija',
};

// Local storage keys
export const STORAGE_KEYS = {
  cart: 'cart',
  lastOrder: 'lastSuccessfulOrder',
  clearCart: 'clearCartAfterOrder',
  stripePayment: 'stripe_payment_id',
  stripePaymentUsed: 'stripe_payment_used',
  language: 'i18nextLng',
};

// Routes
export const ROUTES = {
  home: '/',
  about: '/o-nas',
  product: '/izdelek',
  recipe: '/recept',
  recipes: '/recepti',
  checkout: '/checkout',
  orderSuccess: '/order-success',
  orderConfirmation: '/order-confirmation',
  profile: '/profile',
  orders: '/orders',
  login: '/login',
  admin: {
    orders: '/admin/orders',
    products: '/admin/products',
    settings: '/admin/settings',
    debug: '/admin/debug',
  },
};

// Default language
export const DEFAULT_LANGUAGE = 'sl';

// Available languages
export const LANGUAGES = ['sl', 'en', 'de', 'hr'];

// Export default config object
export default {
  ENV,
  SHIPPING,
  PAYMENT_METHODS,
  ORDER_STATUS,
  POSTAL_CODES,
  PASSWORD_REQUIREMENTS,
  IMAGES,
  API,
  PAGINATION,
  TIMEOUTS,
  VALIDATION,
  DEFAULT_FORM_VALUES,
  STORAGE_KEYS,
  ROUTES,
  DEFAULT_LANGUAGE,
  LANGUAGES,
};
