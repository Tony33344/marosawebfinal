import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useFeatureFlag } from '../../hooks/useFeatureFlag';

interface OpenGraphProps {
  title: string;
  description: string;
  url: string;
  image?: string;
  type?: 'website' | 'article' | 'product';
  siteName?: string;
  locale?: string;
  // Product specific
  price?: number;
  currency?: string;
  availability?: 'in stock' | 'out of stock';
  // Article specific
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
}

/**
 * OpenGraph component for social media sharing optimization
 * Controlled by the 'open_graph_tags' feature flag
 */
export const OpenGraph: React.FC<OpenGraphProps> = ({
  title,
  description,
  url,
  image = 'https://kmetija-marosa.si/assets/og-default.jpg',
  type = 'website',
  siteName = 'Kmetija Maroša',
  locale = 'sl_SI',
  price,
  currency = 'EUR',
  availability,
  publishedTime,
  modifiedTime,
  author
}) => {
  const enabled = useFeatureFlag('open_graph_tags');

  if (!enabled) {
    // Still render basic meta tags even if OG is disabled
    return (
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
      </Helmet>
    );
  }

  return (
    <Helmet>
      {/* Basic Meta */}
      <title>{title}</title>
      <meta name="description" content={description} />
      
      {/* Open Graph Basic */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={locale} />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Product specific OG tags */}
      {type === 'product' && price && (
        <>
          <meta property="product:price:amount" content={price.toString()} />
          <meta property="product:price:currency" content={currency} />
          {availability && (
            <meta property="product:availability" content={availability} />
          )}
        </>
      )}
      
      {/* Article specific OG tags */}
      {type === 'article' && (
        <>
          {publishedTime && (
            <meta property="article:published_time" content={publishedTime} />
          )}
          {modifiedTime && (
            <meta property="article:modified_time" content={modifiedTime} />
          )}
          {author && (
            <meta property="article:author" content={author} />
          )}
        </>
      )}
    </Helmet>
  );
};

/**
 * Preset for homepage
 */
export const HomePageMeta: React.FC = () => (
  <OpenGraph
    title="Kmetija Maroša | Ekološka kmetija v Prekmurju"
    description="Odkrijte tradicionalne slovenske izdelke z naše družinske kmetije. Ekološka aronija, slamnik in drugi naravni izdelki iz Prekmurja."
    url="https://kmetija-marosa.si"
    type="website"
  />
);

/**
 * Preset for product pages
 */
export const ProductPageMeta: React.FC<{
  name: string;
  description: string;
  price: number;
  image: string;
  slug: string;
}> = ({ name, description, price, image, slug }) => (
  <OpenGraph
    title={`${name} | Kmetija Maroša`}
    description={description}
    url={`https://kmetija-marosa.si/izdelek/${slug}`}
    image={image}
    type="product"
    price={price}
    availability="in stock"
  />
);

/**
 * Preset for recipe pages
 */
export const RecipePageMeta: React.FC<{
  title: string;
  description: string;
  image: string;
  slug: string;
  publishedDate?: string;
}> = ({ title, description, image, slug, publishedDate }) => (
  <OpenGraph
    title={`${title} | Recepti | Kmetija Maroša`}
    description={description}
    url={`https://kmetija-marosa.si/recipes/${slug}`}
    image={image}
    type="article"
    publishedTime={publishedDate}
    author="Kmetija Maroša"
  />
);

/**
 * Preset for about page
 */
export const AboutPageMeta: React.FC = () => (
  <OpenGraph
    title="O nas | Kmetija Maroša"
    description="Spoznajte zgodbo naše družinske kmetije v Prekmurju. Že več generacij združujemo tradicijo z inovacijami pri pridelavi ekoloških izdelkov."
    url="https://kmetija-marosa.si/o-nas"
    type="website"
  />
);

/**
 * Preset for cart/checkout
 */
export const CheckoutPageMeta: React.FC = () => (
  <OpenGraph
    title="Košarica | Kmetija Maroša"
    description="Dokončajte vaše naročilo ekoloških izdelkov z Kmetije Maroša."
    url="https://kmetija-marosa.si/cart"
    type="website"
  />
);

export default OpenGraph;
