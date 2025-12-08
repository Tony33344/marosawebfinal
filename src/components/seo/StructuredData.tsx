import React from 'react';
import { useFeatureFlag } from '../../hooks/useFeatureFlag';

interface OrganizationData {
  name: string;
  url: string;
  logo: string;
  description: string;
  telephone: string;
  email: string;
  address: {
    streetAddress: string;
    addressLocality: string;
    postalCode: string;
    addressCountry: string;
  };
  sameAs?: string[];
}

interface ProductData {
  name: string;
  description: string;
  image: string;
  sku?: string;
  brand?: string;
  price: number;
  priceCurrency: string;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  url: string;
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

// Organization Schema for the farm
export const OrganizationSchema: React.FC<{ data: OrganizationData }> = ({ data }) => {
  const enabled = useFeatureFlag('structured_data');
  
  if (!enabled) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: data.name,
    url: data.url,
    logo: data.logo,
    description: data.description,
    telephone: data.telephone,
    email: data.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: data.address.streetAddress,
      addressLocality: data.address.addressLocality,
      postalCode: data.address.postalCode,
      addressCountry: data.address.addressCountry
    },
    sameAs: data.sameAs || []
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

// LocalBusiness Schema (more specific for farms)
export const LocalBusinessSchema: React.FC = () => {
  const enabled = useFeatureFlag('structured_data');
  
  if (!enabled) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': 'https://kmetija-marosa.si',
    name: 'Kmetija Maroša',
    image: 'https://kmetija-marosa.si/assets/logo.png',
    description: 'Ekološka kmetija specializirana za pridelavo aronije in slamnika. Tradicionalni slovenski izdelki z naše družinske kmetije v Prekmurju.',
    url: 'https://kmetija-marosa.si',
    telephone: '+386 31 627 364',
    email: 'kmetija.marosa@gmail.com',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Melinci 80',
      addressLocality: 'Beltinci',
      postalCode: '9231',
      addressCountry: 'SI'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 46.5987,
      longitude: 16.2389
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '08:00',
        closes: '18:00'
      }
    ],
    priceRange: '€€',
    paymentAccepted: ['Credit Card', 'Cash', 'Bank Transfer'],
    currenciesAccepted: 'EUR'
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

// Product Schema
export const ProductSchema: React.FC<{ product: ProductData }> = ({ product }) => {
  const enabled = useFeatureFlag('structured_data');
  
  if (!enabled) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    sku: product.sku,
    brand: {
      '@type': 'Brand',
      name: product.brand || 'Kmetija Maroša'
    },
    offers: {
      '@type': 'Offer',
      url: product.url,
      priceCurrency: product.priceCurrency,
      price: product.price,
      availability: `https://schema.org/${product.availability || 'InStock'}`,
      seller: {
        '@type': 'Organization',
        name: 'Kmetija Maroša'
      }
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

// Breadcrumb Schema
export const BreadcrumbSchema: React.FC<{ items: BreadcrumbItem[] }> = ({ items }) => {
  const enabled = useFeatureFlag('breadcrumbs');
  
  if (!enabled) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

// FAQ Schema
export const FAQSchema: React.FC<{ faqs: FAQItem[] }> = ({ faqs }) => {
  const enabled = useFeatureFlag('structured_data');
  
  if (!enabled) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

// WebSite Schema with search action
export const WebSiteSchema: React.FC = () => {
  const enabled = useFeatureFlag('structured_data');
  
  if (!enabled) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Kmetija Maroša',
    url: 'https://kmetija-marosa.si',
    description: 'Ekološka kmetija v Prekmurju - aronija, slamnik in drugi naravni izdelki',
    inLanguage: ['sl', 'en'],
    publisher: {
      '@type': 'Organization',
      name: 'Kmetija Maroša'
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

// Recipe Schema
export const RecipeSchema: React.FC<{
  name: string;
  description: string;
  image: string;
  prepTime: string;
  cookTime: string;
  totalTime: string;
  servings: number;
  ingredients: string[];
  instructions: string[];
}> = ({ name, description, image, prepTime, cookTime, totalTime, servings, ingredients, instructions }) => {
  const enabled = useFeatureFlag('structured_data');
  
  if (!enabled) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name,
    description,
    image,
    author: {
      '@type': 'Organization',
      name: 'Kmetija Maroša'
    },
    prepTime,
    cookTime,
    totalTime,
    recipeYield: `${servings} servings`,
    recipeIngredient: ingredients,
    recipeInstructions: instructions.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      text: step
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

// Combined Schema component for homepage
export const HomePageSchema: React.FC = () => {
  return (
    <>
      <LocalBusinessSchema />
      <WebSiteSchema />
    </>
  );
};
