import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Home } from 'lucide-react';
import { useFeatureFlag } from '../../hooks/useFeatureFlag';
import { BreadcrumbSchema } from '../seo/StructuredData';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
}

/**
 * Breadcrumb navigation component with schema.org markup
 * Controlled by 'breadcrumbs' feature flag
 */
export const Breadcrumb: React.FC<BreadcrumbProps> = ({ 
  items,
  className = '' 
}) => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const enabled = useFeatureFlag('breadcrumbs');

  if (!enabled) return null;

  // Auto-generate breadcrumbs from path if not provided
  const breadcrumbItems: BreadcrumbItem[] = items || generateBreadcrumbs(location.pathname, (key: string, fallback?: string) => t(key, fallback || key));

  // Generate schema data for SEO
  const schemaItems = breadcrumbItems.map((item) => ({
    name: item.label,
    url: `https://kmetija-marosa.si${item.path || ''}`
  }));

  return (
    <>
      {/* Schema.org Breadcrumb markup */}
      <BreadcrumbSchema items={schemaItems} />

      {/* Visual breadcrumb */}
      <nav 
        aria-label={t('navigation.breadcrumb', 'Breadcrumb')}
        className={`py-3 ${className}`}
      >
        <ol className="flex items-center flex-wrap gap-1 text-sm">
          {/* Home */}
          <li className="flex items-center">
            <Link 
              to={`/?lang=${i18n.language}`}
              className="text-gray-500 hover:text-brown-600 transition-colors flex items-center"
            >
              <Home className="w-4 h-4" />
              <span className="sr-only">{t('navigation.home', 'Domov')}</span>
            </Link>
          </li>

          {breadcrumbItems.map((item, index) => (
            <li key={index} className="flex items-center">
              <ChevronRight className="w-4 h-4 text-gray-400 mx-1" />
              {item.path && index < breadcrumbItems.length - 1 ? (
                <Link
                  to={`${item.path}?lang=${i18n.language}`}
                  className="text-gray-500 hover:text-brown-600 transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span 
                  className="text-gray-900 font-medium"
                  aria-current="page"
                >
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
};

/**
 * Auto-generate breadcrumbs from URL path
 */
function generateBreadcrumbs(
  pathname: string, 
  t: (key: string, fallback?: string) => string
): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const items: BreadcrumbItem[] = [];

  // Path translations
  const pathLabels: Record<string, string> = {
    'o-nas': t('navigation.about', 'O nas'),
    'izdelek': t('navigation.product', 'Izdelek'),
    'products': t('navigation.products', 'Izdelki'),
    'recipes': t('navigation.recipes', 'Recepti'),
    'cart': t('navigation.cart', 'Košarica'),
    'checkout': t('navigation.checkout', 'Blagajna'),
    'checkout-steps': t('navigation.checkout', 'Blagajna'),
    'darilo': t('navigation.gifts', 'Darila'),
    'gift-builder': t('navigation.giftBuilder', 'Sestavi darilo'),
    'profile': t('navigation.profile', 'Profil'),
    'orders': t('navigation.orders', 'Naročila'),
    'login': t('navigation.login', 'Prijava'),
    'privacy-policy': t('navigation.privacyPolicy', 'Politika zasebnosti'),
    'admin': t('navigation.admin', 'Admin'),
  };

  let currentPath = '';
  
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    
    // Get label - use translation or capitalize segment
    let label = pathLabels[segment];
    
    if (!label) {
      // For dynamic segments like product IDs, try to make them readable
      label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }

    items.push({
      label,
      path: index < segments.length - 1 ? currentPath : undefined
    });
  });

  return items;
}

/**
 * Pre-configured breadcrumb for product pages
 */
export const ProductBreadcrumb: React.FC<{ productName: string }> = ({ productName }) => (
  <Breadcrumb 
    items={[
      { label: 'Izdelki', path: '/#izdelki' },
      { label: productName }
    ]}
  />
);

/**
 * Pre-configured breadcrumb for recipe pages
 */
export const RecipeBreadcrumb: React.FC<{ recipeName: string }> = ({ recipeName }) => (
  <Breadcrumb 
    items={[
      { label: 'Recepti', path: '/recipes' },
      { label: recipeName }
    ]}
  />
);

export default Breadcrumb;
