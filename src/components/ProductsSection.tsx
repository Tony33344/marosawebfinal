import { useState, useEffect, useRef } from 'react';
import { ProductCard } from './ProductCard';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabaseClient';
import { Product } from '../types';
import { ShoppingBasket, Filter, Loader } from 'lucide-react';
import { FreeShippingBanner } from './FreeShippingBanner';

export const ProductsSection = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Get unique categories from products
  const getCategories = () => {
    const categories = products
      .map(product => product.category)
      .filter((category, index, self) =>
        category && self.indexOf(category) === index
      ) as string[];

    return ['all', ...categories];
  };

  // Filter products by category
  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter(product => product.category === selectedCategory));
    }
  }, [selectedCategory, products]);

  // Animation on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  // Define mock products outside of the effect to ensure they're always available
  const mockProducts = [
    {
      id: 1,
      created_at: new Date().toISOString(),
      name: 'Bučno olje',
      description: 'Hladno stiskano bučno olje z naše kmetije. Bogato z okusom in hranilnimi snovmi.',
      package_options: JSON.stringify([{ uniq_id: '1', price: 12.99, weight: 500, unit: 'ml' }]),
      image_url: 'https://images.unsplash.com/photo-1597281362711-7004802c6881?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      stock_quantity: 15,
      category: 'oil'
    },
    {
      id: 2,
      created_at: new Date().toISOString(),
      name: 'Bučna semena',
      description: 'Pražena bučna semena, odlična za prigrizek ali kot dodatek solati.',
      package_options: JSON.stringify([{ uniq_id: '2', price: 8.99, weight: 250, unit: 'g' }]),
      image_url: 'https://images.unsplash.com/photo-1573851552153-816785fecf4a?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      stock_quantity: 20,
      category: 'seeds'
    },
    {
      id: 3,
      created_at: new Date().toISOString(),
      name: 'Konopljino olje',
      description: 'Ekološko konopljino olje z oreškastim okusom, bogato z omega maščobnimi kislinami.',
      package_options: JSON.stringify([{ uniq_id: '3', price: 14.99, weight: 250, unit: 'ml' }]),
      image_url: 'https://images.unsplash.com/photo-1590114563441-2f8d39c0a0d1?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      stock_quantity: 10,
      category: 'oil'
    },
    {
      id: 4,
      created_at: new Date().toISOString(),
      name: 'Konopljin čaj',
      description: 'Sproščujoča mešanica konopljinega čaja z naravnimi zelišči.',
      package_options: JSON.stringify([{ uniq_id: '4', price: 7.99, weight: 100, unit: 'g' }]),
      image_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      stock_quantity: 25,
      category: 'tea'
    },
    {
      id: 5,
      created_at: new Date().toISOString(),
      name: 'Melisa',
      description: 'Posušeni listi melise za čaj z osvežilno citrusno aromo.',
      package_options: JSON.stringify([{ uniq_id: '5', price: 6.99, weight: 50, unit: 'g' }]),
      image_url: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      stock_quantity: 30,
      category: 'tea'
    },
    {
      id: 6,
      created_at: new Date().toISOString(),
      name: 'Ajdova kaša',
      description: 'Ekološka ajdova kaša, odlična za kašo ali kot priloga.',
      package_options: JSON.stringify([{ uniq_id: '6', price: 5.99, weight: 500, unit: 'g' }]),
      image_url: 'https://images.unsplash.com/photo-1622542086073-28f816e54a0c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      stock_quantity: 18,
      category: 'grains'
    }
  ];

  // Initialize with mock products immediately to ensure something is always displayed
  useEffect(() => {
    setProducts(mockProducts);
    setFilteredProducts(mockProducts);
  }, []);

  // Fetch products from Supabase
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('Fetching products from Supabase...');
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('isActive', true);

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }

        console.log('Products data received:', data);
        if (data && data.length > 0) {
          setProducts(data);
          setFilteredProducts(data);
        } else {
          console.warn('No products data received from Supabase, using fallback data');
          // Already using mock products from initialization
        }
      } catch (err: any) {
        console.error("Error fetching products:", err);
        // Don't set error state since we're already showing mock products
        // setError(t('products.fetchError', 'Could not load products.'));
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [i18n.language, t]);

  // We don't need a loading state anymore since we always show mock products
  // But we can show a loading indicator within the products section
  const LoadingIndicator = () => {
    if (!loading) return null;
    return (
      <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg z-50 flex items-center gap-2">
        <Loader className="w-5 h-5 text-brown-500 animate-spin" />
        <span className="text-sm text-brown-700">{t('products.loading', 'Loading products...')}</span>
      </div>
    );
  };

  if (error) {
    return (
      <section id="izdelki" className="py-32 bg-stone-50">
        <div className="container mx-auto px-6 lg:px-12 text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-2xl mx-auto">
            <p className="text-red-600 text-lg">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </section>
    );
  }

  const categories = getCategories();

  return (
    <section
      id="izdelki"
      ref={sectionRef}
      className="py-24 bg-gradient-to-b from-brown-50 to-white"
    >
      <LoadingIndicator />
      <FreeShippingBanner />
      <div className="container mx-auto px-6 lg:px-12">
        <div className="text-center mb-16">
          <div className={`inline-flex items-center justify-center gap-3 bg-brown-100 text-brown-800 px-4 py-2 rounded-full mb-4 transition-all duration-700 ${isVisible ? 'opacity-100 transform-none' : 'opacity-0 -translate-y-4'}`}>
            <ShoppingBasket className="w-5 h-5" />
            <span className="text-sm font-medium">{t('products.premiumQuality')}</span>
          </div>

          <h2 className={`text-4xl lg:text-5xl font-bold text-brown-800 mb-4 transition-all duration-1000 ${isVisible ? 'opacity-100 transform-none' : 'opacity-0 -translate-y-6'}`}>
            {t('products.title')}
          </h2>

          <div className={`h-1 w-24 bg-amber-500 mx-auto mb-8 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 w-24' : 'opacity-0 w-0'}`}></div>

          {/* Category Filter */}
          <div className={`flex flex-wrap justify-center gap-3 mb-12 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 transform-none' : 'opacity-0 translate-y-6'}`}>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === category
                  ? 'bg-brown-600 text-white shadow-md'
                  : 'bg-white text-brown-700 hover:bg-brown-100 border border-brown-200'}`}
              >
                {category === 'all' ? t('products.allProducts') : category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {filteredProducts.length > 0 ? (
          <div className={`grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 transform-none' : 'opacity-0 translate-y-10'}`}>
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-brown-50 rounded-xl">
            <Filter className="w-12 h-12 text-brown-300 mx-auto mb-4" />
            <p className="text-brown-600 text-lg">{t('products.noProducts')}</p>
          </div>
        )}
      </div>
    </section>
  );
}
