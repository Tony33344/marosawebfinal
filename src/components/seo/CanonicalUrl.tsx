import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { useFeatureFlag } from '../../hooks/useFeatureFlag';

const BASE_URL = 'https://kmetija-marosa.si';

interface CanonicalUrlProps {
  path?: string;
  noIndex?: boolean;
}

/**
 * CanonicalUrl component for proper SEO URL handling
 * - Adds canonical URL to prevent duplicate content issues
 * - Optionally adds hreflang tags for multilingual support
 * - Controlled by 'canonical_urls' feature flag
 */
export const CanonicalUrl: React.FC<CanonicalUrlProps> = ({ 
  path,
  noIndex = false 
}) => {
  const location = useLocation();
  const enabled = useFeatureFlag('canonical_urls');
  
  if (!enabled) return null;

  // Use provided path or current location
  const currentPath = path || location.pathname;
  
  // Remove language parameter and trailing slashes for canonical
  const cleanPath = currentPath
    .replace(/\/$/, '') // Remove trailing slash
    .replace(/^\/+/, '/'); // Ensure single leading slash
  
  const canonicalUrl = `${BASE_URL}${cleanPath}`;

  // Determine if this is a translatable page
  const isTranslatable = !currentPath.startsWith('/admin');

  return (
    <Helmet>
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* NoIndex for pages that shouldn't be indexed */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Hreflang tags for multilingual support */}
      {isTranslatable && (
        <>
          <link rel="alternate" hrefLang="sl" href={`${canonicalUrl}?lang=sl`} />
          <link rel="alternate" hrefLang="en" href={`${canonicalUrl}?lang=en`} />
          <link rel="alternate" hrefLang="de" href={`${canonicalUrl}?lang=de`} />
          <link rel="alternate" hrefLang="hr" href={`${canonicalUrl}?lang=hr`} />
          <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />
        </>
      )}
    </Helmet>
  );
};

/**
 * Hook to get canonical URL for current page
 */
export function useCanonicalUrl(): string {
  const location = useLocation();
  const cleanPath = location.pathname.replace(/\/$/, '').replace(/^\/+/, '/');
  return `${BASE_URL}${cleanPath}`;
}

export default CanonicalUrl;
