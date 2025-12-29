import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Product } from '../types';
import { ShoppingBag } from 'lucide-react';
import { Image } from './Image';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { i18n, t } = useTranslation();

  // Use database translations if available, fallback to hardcoded translations
  // For Slovenian language, always use the base name field
  const translatedName = i18n.language === 'sl' ? product.name :
    i18n.language === 'en' ? (product.name_en || product.name) :
    i18n.language === 'de' ? (product.name_de || product.name) :
    i18n.language === 'hr' ? (product.name_hr || product.name) :
    product.name; // Default fallback

  // Use database translations if available, fallback to database description
  // For Slovenian language, always use the base description field
  const translatedDescription = i18n.language === 'sl' ? product.description :
    i18n.language === 'en' ? (product.description_en || product.description) :
    i18n.language === 'de' ? (product.description_de || product.description) :
    i18n.language === 'hr' ? (product.description_hr || product.description) :
    product.description; // Default fallback

  // Only log in development
  // Debug logging removed for cleaner console

  // Get the first package option price if available
  const getPrice = () => {
    if (typeof product.package_options === 'string') {
      try {
        const options = JSON.parse(product.package_options);
        return options && options.length > 0 ? options[0].price : null;
      } catch {
        return null;
      }
    } else if (Array.isArray(product.package_options) && product.package_options.length > 0) {
      return product.package_options[0].price;
    }
    return null;
  };

  const price = getPrice();

  // Create the appropriate link - if product ID is 14, link to Darilo page
  const productLink = product.id === '14' || product.id === 14
    ? `/darilo?lang=${i18n.language}`
    : `/izdelek/${product.id}?lang=${i18n.language}`;

  const displayImageSrc = product.id === '13' || product.id === 13
    ? 'https://wiwjkholoebkzzjoczjn.supabase.co/storage/v1/object/public/marosaimages/images/pegasti-badelj/pegastibadeljmain.png'
    : (product.image_url || '');

  return (
    <Link
      to={productLink}
      className="group relative bg-white rounded-xl shadow-lg overflow-hidden transform hover:scale-102 hover:-translate-y-1 transition-all duration-300 hover:shadow-xl"
      onClick={() => {
        window.scrollTo(0, 0);
      }}
    >
      {/* Badge for organic products */}
      {product.category === 'organic' && (
        <div className="absolute top-3 left-3 z-10 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
          {t('products.eco', 'Eco')}
        </div>
      )}

      {/* Image container with overlay */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
        <Image
          src={displayImageSrc}
          alt={translatedName}
          fallbackSrc="/images/placeholder-product.svg"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          style={product.id === '13' || product.id === 13 ? { objectPosition: 'center 25%' } : undefined}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        {/* View details button that appears on hover */}
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm text-brown-800 px-4 py-2 rounded-full text-sm font-medium shadow-lg">
              {t('products.viewDetails')} <ShoppingBag className="w-4 h-4" />
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-brown-800 group-hover:text-amber-600 transition-colors duration-300">{translatedName}</h3>
          {price && (
            <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded-md text-sm font-medium">
              {price} €
            </span>
          )}
        </div>
        <p className="text-gray-600 line-clamp-2 text-sm">{translatedDescription}</p>
      </div>
    </Link>
  );
}
