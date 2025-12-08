/**
 * Test Data Configuration for Kmetija Maroša E2E Tests
 */

export const TEST_USERS = {
  newCustomer: {
    email: `test.customer.${Date.now()}@example.com`,
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'Stranka',
    address: {
      street: 'Testna ulica 123',
      city: 'Ljubljana',
      postalCode: '1000',
      country: 'SI'
    },
    phone: '+386 41 123 456'
  },
  existingCustomer: {
    email: 'existing.customer@example.com',
    password: 'Nakupi88**'
  },
  admin: {
    email: 'nakupi@si.si',
    password: 'Nakupi88**'
  },
  superAdmin: {
    email: 'super.admin@example.com',
    password: 'SuperAdminPass123!'
  }
};

export const TEST_PRODUCTS = {
  simpleProduct: {
    id: '1',
    name: 'Bučno olje',
    price: 10.00,
    weight: '0,5l'
  },
  variableProduct: {
    id: '9',
    name: 'Aronija',
    variants: ['1l', '0,5l']
  },
  pegastiBadelj: {
    id: '13',
    name: 'Pegasti badelj',
    price: 9.50,
    weight: '250g'
  }
};

export const STRIPE_TEST_CARDS = {
  success: '4242424242424242',
  decline: '4000000000000002',
  insufficientFunds: '4000000000009995',
  expiredCard: '4000000000000069',
  processingError: '4000000000000119',
  threeDSecure: '4000002500003155'
};

export const BANK_TRANSFER_TEST_DATA = {
  bankName: 'Test Banka',
  iban: 'SI56 1234 5678 9012 345',
  bic: 'TESTSI2X',
  reference: 'SI00 12345'
};

export const SHIPPING_OPTIONS = {
  standard: {
    name: 'Standardna dostava',
    price: 3.90,
    minFreeShipping: 35.00
  },
  express: {
    name: 'Hitra dostava',
    price: 7.90
  }
};

export const DISCOUNT_CODES = {
  freeShipping: 'BREZPOSTNINE',
  percentOff: 'DOBRODOSLI10',
  fixedAmount: 'POPUST5'
};

export const SLOVENIAN_POSTAL_CODES = [
  { code: '1000', city: 'Ljubljana' },
  { code: '2000', city: 'Maribor' },
  { code: '3000', city: 'Celje' },
  { code: '4000', city: 'Kranj' },
  { code: '5000', city: 'Nova Gorica' },
  { code: '6000', city: 'Koper' },
  { code: '8000', city: 'Novo mesto' },
  { code: '9000', city: 'Murska Sobota' }
];

export const LANGUAGES = ['sl', 'en', 'de', 'hr'] as const;
export type Language = typeof LANGUAGES[number];

export const ROUTES = {
  home: '/',
  products: '/izdelki',
  product: (id: string) => `/izdelek/${id}`,
  cart: '/cart',
  checkout: '/checkout-steps',
  login: '/login',
  profile: '/profile',
  orders: '/orders',
  recipes: '/recipes',
  about: '/o-nas',
  privacy: '/privacy-policy',
  admin: {
    orders: '/admin/orders',
    products: '/admin/products',
    settings: '/admin/settings',
    debug: '/admin/debug',
    bannerDiscounts: '/admin/banner-discounts',
    translations: '/admin/translations'
  },
  gift: {
    darilo: '/darilo',
    builder: (packageId: string) => `/darilo/builder/${packageId}`
  }
};
