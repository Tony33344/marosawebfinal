import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabaseClient';
import { Product, PackageOption } from '../types';
import { AddToCart } from './AddToCart';
import { RecipeCard } from './RecipeCard';
import { getRecipesByProductId } from '../data/sampleRecipes';
import { getImageUrl } from '../utils/imageUtils';
import { Image } from './Image';
import { useAnalytics, EventAction, EventCategory } from '../hooks/useAnalytics';
import { ErrorBoundary } from './ErrorBoundary';
import { ProductBundles } from './ProductBundles';

export function ProductDetail() {
  // IMPORTANT: All hooks must be declared at the top level and in the same order every render

  // Basic state and hooks
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const langParam = searchParams.get('lang');

  // Product data state
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [productRecipes, setProductRecipes] = useState<any[]>([]);
  
  // Navigation state for prev/next products
  const [allProducts, setAllProducts] = useState<{ id: number; name: string }[]>([]);
  const [prevProduct, setPrevProduct] = useState<{ id: number; name: string } | null>(null);
  const [nextProduct, setNextProduct] = useState<{ id: number; name: string } | null>(null);

  // Initialize analytics
  const { trackEcommerceEvent, trackEvent } = useAnalytics();

  // Create structured data for SEO - MUST be defined before any conditional returns
  const structuredData = useMemo(() => {
    if (!product) return null;

    // Get the package options array
    const packageOpts = Array.isArray(product.package_options) ? product.package_options : [];

    // Get translated name
    const tName = i18n.language === 'sl' ? product.name :
      i18n.language === 'en' ? (product.name_en || product.name) :
      i18n.language === 'de' ? (product.name_de || product.name) :
      i18n.language === 'hr' ? (product.name_hr || product.name) :
      product.name;

    // Get translated description
    const tDescription = i18n.language === 'sl' ? product.description :
      i18n.language === 'en' ? (product.description_en || product.description) :
      i18n.language === 'de' ? (product.description_de || product.description) :
      i18n.language === 'hr' ? (product.description_hr || product.description) :
      product.description;

    // Get the first package option price or default to 0
    const price = packageOpts.length > 0 && typeof packageOpts[0].price === 'number'
      ? packageOpts[0].price
      : 0;

    // Build the structured data object
    return {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": tName,
      "description": tDescription,
      "image": product.image_url ? getImageUrl(product.image_url) : "",
      "sku": `product-${product.id}`,
      "offers": {
        "@type": "Offer",
        "url": window.location.href,
        "priceCurrency": "EUR",
        "price": price,
        "availability": "https://schema.org/InStock",
        "seller": {
          "@type": "Organization",
          "name": "Kmetija Marosa"
        }
      }
    };
  }, [product, i18n.language]);

  // Language effect
  useEffect(() => {
    if (langParam && langParam !== i18n.language) {
      i18n.changeLanguage(langParam);
    }
  }, [langParam, i18n]);

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      setQuantities({});

      try {
        if (!id) {
          throw new Error("Product ID is missing.");
        }

        const productId = parseInt(id, 10);
        if (isNaN(productId)) {
          throw new Error("Invalid Product ID.");
        }

        // If product ID is 14, redirect to the Darilo page
        if (productId === 14) {
          window.location.href = `/darilo?lang=${i18n.language}`;
          return;
        }

        const { data, error: fetchError } = await supabase
          .from('products')
          .select(`
            id,
            name,
            name_en,
            name_de,
            name_hr,
            description,
            description_en,
            description_de,
            description_hr,
            package_options,
            image_url,
            additional_images,
            stock_quantity,
            category,
            created_at,
            isActive
          `)
          .eq('id', productId)
          .single();

        console.log('Raw data from database:', JSON.stringify(data, null, 2));

        if (fetchError) {
          console.error("Supabase fetch error:", fetchError);
          if (fetchError.code === 'PGRST116') {
            setError(t('productDetail.notFound', 'Product not found.'));
          } else {
            setError(t('productDetail.fetchError', 'Could not load product details.'));
          }
          setProduct(null);
        } else if (data) {
          console.log("Fetched product data:", data);
          console.log("Product ID (number):", typeof data.id, data.id);

          // Track product view
          try {
            console.log('Tracking product view:', data.id, data.name);

            // First, track as a regular event to ensure it's captured correctly
            trackEvent({
              category: EventCategory.ECOMMERCE,
              action: EventAction.VIEW_PRODUCT,
              label: data.name,
              value: data.package_options?.[0]?.price,
              metadata: {
                product_id: data.id,
                product_name: data.name
              }
            });

            // Also track as an ecommerce event for compatibility
            trackEcommerceEvent(
              EventAction.VIEW_PRODUCT,
              data.id,
              data.name,
              data.package_options?.[0]?.price
            );
          } catch (trackError) {
            console.error('Error tracking product view:', trackError);
          }

          let parsedOptions: PackageOption[] = [];
          if (typeof data.package_options === 'string') {
            try {
              parsedOptions = JSON.parse(data.package_options);
            } catch (parseError) {
              console.error("Error parsing package_options JSON:", parseError);
              setError(t('productDetail.fetchError', 'Error reading product options.'));
              setProduct(null);
              setLoading(false);
              return;
            }
          } else if (Array.isArray(data.package_options)) {
            parsedOptions = data.package_options;
          }

          if (!Array.isArray(parsedOptions)) {
            console.error("package_options is not an array after parsing:", parsedOptions);
            setError(t('productDetail.fetchError', 'Invalid product options format.'));
            setProduct(null);
          } else {
            const validOptions = parsedOptions.filter(opt => opt && typeof opt.uniq_id !== 'undefined');
            if (validOptions.length !== parsedOptions.length) {
              console.warn("Some package options are missing uniq_id");
            }

            setProduct({ ...data, package_options: validOptions });

            // Initialize quantities
            const initialQuantities: { [key: string]: number } = {};
            validOptions.forEach(opt => {
              if (opt.uniq_id) {
                initialQuantities[opt.uniq_id] = 1;
              }
            });
            setQuantities(initialQuantities);
          }
        } else {
          setError(t('productDetail.notFound', 'Product not found.'));
          setProduct(null);
        }
      } catch (err: any) {
        console.error("Error fetching product:", err);
        setError(t('productDetail.fetchError', 'Could not load product details.'));
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, i18n.language, t, trackEcommerceEvent]);

  // Process images when product changes
  useEffect(() => {
    if (!product) return;

    const processImages = async () => {
      let images: string[] = [];

      // If we have additional images, use those for the gallery
      if (product.additional_images && product.additional_images.length > 0) {
        console.log('Raw additional images from database:', product.additional_images);

        // Get the main image URL first
        const mainImageUrl = product.image_url ? getImageUrl(product.image_url) : '';
        console.log('Main image URL:', mainImageUrl);

        // Process each additional image directly
        const additionalImageUrls = product.additional_images
          // Handle case where additional_images might be a string with JSON array
          .map(img => {
            try {
              // If the image is a string that looks like a JSON array, parse it
              if (typeof img === 'string' && img.trim().startsWith('[') && img.trim().endsWith(']')) {
                const parsed = JSON.parse(img);
                return Array.isArray(parsed) ? parsed : [parsed];
              }
              return img;
            } catch (e) {
              console.error('Error parsing image path:', img, e);
              return img;
            }
          })
          // Flatten the array in case we have nested arrays
          .flat()
          // Filter out any null/undefined values
          .filter((img): img is string => !!img)
          // Process each image path
          .map(img => {
            // Handle case where the path might be wrapped in quotes or curly braces
            let processedImg = img;

            // Remove any surrounding quotes or curly braces
            processedImg = processedImg.replace(/^['"{]+|['"}]+$/g, '');

            // Handle case sensitivity for known folders
            const lowerImg = processedImg.toLowerCase();
            if (lowerImg.includes('konopljino olje')) {
              processedImg = processedImg.replace(/konopljino olje/gi, 'konopljino olje');
            } else if (lowerImg.includes('konopljin caj')) {
              processedImg = processedImg.replace(/konopljin caj/gi, 'konopljin čaj');
            }

            // Handle spaces in paths - don't encode here as getImageUrl will handle it
            // Remove any existing encoding to prevent double-encoding
            processedImg = processedImg.replace(/%20/g, ' ');

            return processedImg;
          })
          // Convert to full URLs
          .map(img => getImageUrl(img))
          // Filter out the main image to avoid duplication
          .filter(url => url && url !== mainImageUrl);

        console.log('Processed additional image URLs (without main image):', additionalImageUrls);
        images = additionalImageUrls;
      }
      // If no additional images, use the main image if it exists
      else if (product.image_url) {
        const mainImageUrl = getImageUrl(product.image_url);
        images = [mainImageUrl];
      }

      // If no images are available from the database, use product-specific fallback images
      if (images.length === 0) {
        // Define fallback images based on product ID
        const fallbackImageMap: Record<number, string[]> = {
          // Bučno olje / semena
          1: [
            'https://i.ibb.co/zTGSYLCX/olje.jpg',
            'https://i.ibb.co/JWMLz5S5/bucno-olje2.jpg',
            'https://i.ibb.co/s9X6Qt57/bucna-semena-1.jpg'
          ],
          2: [
            'https://wiwjkholoebkzzjoczjn.supabase.co/storage/v1/object/public/marosaimages/images/bucna-semena/bucnasemena2.jpg',
            'https://wiwjkholoebkzzjoczjn.supabase.co/storage/v1/object/public/marosaimages/images/bucna-semena/bucna-semena-buce.jpg',
            'https://wiwjkholoebkzzjoczjn.supabase.co/storage/v1/object/public/marosaimages/images/bucna-semena/vse1.jpg'
          ],
          // Konoplja
          3: [
            'https://i.ibb.co/gFZp3m0S/konoplja1.jpg',
            'https://i.ibb.co/zThVL6bP/konoplja2.jpg'
          ],
          4: [
            'https://i.ibb.co/gFZp3m0S/konoplja1.jpg',
            'https://i.ibb.co/zThVL6bP/konoplja2.jpg'
          ],
          // Melisa
          5: [
            'https://wiwjkholoebkzzjoczjn.supabase.co/storage/v1/object/public/marosaimages/images/melisa/melisa1.jpeg',
            'https://wiwjkholoebkzzjoczjn.supabase.co/storage/v1/object/public/marosaimages/images/melisa/melisa2.jpeg',
            'https://wiwjkholoebkzzjoczjn.supabase.co/storage/v1/object/public/marosaimages/images/melisa/melisa.jpg'
          ],
          // Poprova meta
          6: [
            'https://i.ibb.co/7tVYzd26/Poprova-meta1.jpg',
            'https://i.ibb.co/Pv1Q4yKn/Poprova-meta2.jpg',
            'https://i.ibb.co/gM2WTH9Z/Poprova-meta3.jpg'
          ],
          // Ameriški slamnik (Echinacea)
          7: [
            'https://i.ibb.co/gFZp3m0S/Ameri-ki-slamnik1.jpg',
            'https://i.ibb.co/zThVL6bP/Ameri-ki-slamnik2.jpg',
            'https://i.ibb.co/Qvb0yKG4/Ameri-ki-slamnik3.jpg'
          ],
          // Kamilice
          8: [
            'https://i.ibb.co/99PH97wR/Kamilica1.jpg'
          ],
          // Aronija
          9: [
            'https://i.ibb.co/DDnHs4nj/aronija.jpg'
          ],
          // Ajdova kaša
          10: [
            'https://i.ibb.co/Fb61P4mS/Proso2.jpg',
            'https://i.ibb.co/Ld7MdXvw/Proso1.jpg'
          ],
          // Prosena kaša
          11: [
            'https://i.ibb.co/Fb61P4mS/Proso2.jpg',
            'https://i.ibb.co/Ld7MdXvw/Proso1.jpg'
          ],
          // Fižol češnjevec
          12: [
            'https://i.ibb.co/zTWPQ1vx/fizol-cesenjvec1.jpg',
            'https://i.ibb.co/6hLDXZZ/fizol-cesenjvec2.jpg'
          ],
          // Pegasti badelj
          13: [
            'https://i.ibb.co/6RxY7m8v/Pegasti-badelj-1.jpg'
          ]
        };

        // Get fallback images for this product
        const productId = typeof product.id === 'string' ? parseInt(product.id, 10) : product.id;
        const fallbackImages = fallbackImageMap[productId] || [];

        // Process fallback images through our utility
        images = fallbackImages.map(img => getImageUrl(img));
      }

      // Limit to 6 images maximum and filter out any invalid URLs or placeholder images
      const validImages = images
        .filter(url => {
          // Skip empty URLs
          if (!url) return false;

          // Skip placeholder images
          if (url.includes('placeholder.svg') || url.includes('placeholder-product')) return false;

          return true;
        })
        .slice(0, 6);

      let finalGalleryImages = validImages;

      // Product-specific enforced galleries
      const bucnaSemenaDefaults = [
        'https://wiwjkholoebkzzjoczjn.supabase.co/storage/v1/object/public/marosaimages/images/bucna-semena/bucnasemena2.jpg',
        'https://wiwjkholoebkzzjoczjn.supabase.co/storage/v1/object/public/marosaimages/images/bucna-semena/bucna-semena-buce.jpg'
      ];

      // Ensure Melisa (product id 5) always shows the provided Supabase images
      const melisaGalleryDefaults = [
        'https://wiwjkholoebkzzjoczjn.supabase.co/storage/v1/object/public/marosaimages/images/melisa/melisa1.jpeg',
        'https://wiwjkholoebkzzjoczjn.supabase.co/storage/v1/object/public/marosaimages/images/melisa/melisa.jpg'
      ];

      const productId = typeof product.id === 'string' ? parseInt(product.id, 10) : product.id;
      if (productId === 2) {
        // For Bučna semena, force the Supabase images to avoid placeholders/invalid data
        finalGalleryImages = bucnaSemenaDefaults;
      }
      if (productId === 5) {
        // For Melisa, force only the provided Supabase images to avoid placeholders/duplicates
        finalGalleryImages = melisaGalleryDefaults;
      }

      console.log('Final gallery images:', finalGalleryImages);

      setGalleryImages(finalGalleryImages);
    };

    processImages();
  }, [product]);

  // Fetch recipes when product changes
  useEffect(() => {
    if (!product) return;

    const numericProductId = typeof product.id === 'string' ? parseInt(product.id, 10) : product.id;
    console.log('Using product ID for recipes:', numericProductId, 'original type:', typeof product.id);

    const recipes = getRecipesByProductId(numericProductId);
    console.log('Recipes found:', recipes);
    setProductRecipes(recipes);
  }, [product]);

  // Fetch all products for prev/next navigation
  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('products')
          .select('id, name')
          .eq('isActive', true)
          .neq('id', 14)
          .order('id', { ascending: true });

        if (fetchError) {
          console.error('Error fetching products for navigation:', fetchError);
          return;
        }

        if (data && data.length > 0) {
          const currentId = id ? parseInt(id, 10) : -1;
          const currentIndex = data.findIndex(p => {
            const productId = typeof p.id === 'string' ? parseInt(p.id, 10) : p.id;
            return productId === currentId;
          });

          if (currentIndex === -1) {
            // If current product is not found in the list, do not show prev/next navigation
            setPrevProduct(null);
            setNextProduct(null);
            return;
          }

          const lastIndex = data.length - 1;

          // Wrap-around navigation: first product's "previous" is last, last product's "next" is first
          const prevIndex = currentIndex === 0 ? lastIndex : currentIndex - 1;
          const nextIndex = currentIndex === lastIndex ? 0 : currentIndex + 1;

          setPrevProduct(data[prevIndex]);
          setNextProduct(data[nextIndex]);
        }
      } catch (err) {
        console.error('Error in product navigation:', err);
      }
    };
    fetchAllProducts();
  }, [id]);

  // Handler for quantity input changes
  const handleQuantityChange = (uniqId: string, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      setQuantities(prev => ({
        ...prev,
        [uniqId]: numValue
      }));
    } else if (value === '') {
      setQuantities(prev => ({
        ...prev,
        [uniqId]: 0
      }));
    }
  };

  // Helper functions
  const getPhoneNumber = () => {
    return i18n.language === 'sl' ? '031 627 364' : '+386 31 627 364';
  };

  const getTranslatedPhoneNumberLabel = () => {
    return i18n.language === 'sl' ? 'Telefon' : 'Phone';
  };

  const getTranslatedOptionDescription = (option: PackageOption) => {
    const key = `packageOption.${option.description?.toLowerCase().replace(/\s+/g, '_')}`;
    const fallback = option.description || '';
    return t(key, fallback);
  };

  // Loading state
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">{t('productDetail.loading', 'Loading product details...')}</div>;
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-2xl font-bold mb-4 text-red-600">{error}</h2>
        <Link to={`/?lang=${i18n.language}`} className="text-brown-600 hover:text-brown-700">
          {t('products.backToHome', 'Back to Home')}
        </Link>
      </div>
    );
  }

  // This comment is intentionally left empty to maintain line numbers

  // No product state - must come after all hooks
  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">{t('products.notFound', 'Product not found')}</h2>
          <Link to={`/?lang=${i18n.language}`} className="text-brown-600 hover:text-brown-700">
            {t('products.backToHome', 'Back to Home')}
          </Link>
        </div>
      </div>
    );
  }

  // Prepare data for rendering - move these after the conditional return
  const packageOptionsArray = Array.isArray(product.package_options) ? product.package_options : [];

  // Use type-safe property access for translations
  const translatedName = i18n.language === 'sl' ? product.name :
    i18n.language === 'en' ? (product.name_en || product.name) :
    i18n.language === 'de' ? (product.name_de || product.name) :
    i18n.language === 'hr' ? (product.name_hr || product.name) :
    product.name; // Default fallback

  const translatedDescription = i18n.language === 'sl' ? product.description :
    i18n.language === 'en' ? (product.description_en || product.description) :
    i18n.language === 'de' ? (product.description_de || product.description) :
    i18n.language === 'hr' ? (product.description_hr || product.description) :
    product.description; // Default fallback

  // Determine main image URL with product-specific overrides
  const numericProductIdForMain = typeof product.id === 'string' ? parseInt(product.id, 10) : product.id;
  let mainImageUrl = product.image_url ? getImageUrl(product.image_url) : '';

  // For Melisa (product id 5), always use a reliable Supabase image if no primary image is set
  if ((!mainImageUrl || mainImageUrl.includes('placeholder-product')) && numericProductIdForMain === 5) {
    mainImageUrl = getImageUrl('https://wiwjkholoebkzzjoczjn.supabase.co/storage/v1/object/public/marosaimages/images/melisa/melisa1.jpeg');
  }

  // Track image view
  const handleImageView = (imageUrl: string) => {
    trackEvent({
      category: EventCategory.ENGAGEMENT,
      action: EventAction.VIEW_IMAGE,
      label: `Product ${product?.id} - ${imageUrl.split('/').pop() || 'image'}`,
      metadata: {
        productId: product?.id,
        productName: translatedName
      }
    });
    setSelectedImage(imageUrl);
  };

  // Main render
  return (
    <div>
      {/* JSON-LD Structured Data for SEO */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}

      {/* Main Content */}
      <ErrorBoundary fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200 max-w-md">
            <h2 className="text-2xl font-bold text-red-700 mb-4">{t('error.title', 'Something went wrong')}</h2>
            <p className="text-red-600 mb-6">{t('error.productDetail', 'We encountered an error loading this product. Please try again later.')}</p>
            <Link to={`/?lang=${i18n.language}`} className="px-4 py-2 bg-brown-600 text-white rounded hover:bg-brown-700 transition-colors">
              {t('error.backToHome', 'Back to Home')}
            </Link>
          </div>
        </div>
      }>
        <div className="pt-6 px-6 lg:px-12">
          <div className="max-w-6xl mx-auto">
            {/* Navigation Bar */}
            <div className="flex items-center justify-between mb-8">
              {/* Back Button */}
              <Link to={`/?lang=${i18n.language}`} className="inline-flex items-center text-brown-600 hover:text-brown-700 transition-colors">
                <ArrowLeft className="w-5 h-5 mr-2" />
                {t('productDetailBackButton', 'Back to Products')}
              </Link>

              {/* Product Navigation */}
              <div className="flex items-center gap-4">
                {prevProduct && (
                  <Link 
                    to={`/izdelek/${prevProduct.id}?lang=${i18n.language}`}
                    className="inline-flex items-center text-gray-500 hover:text-brown-600 transition-colors text-sm"
                    title={prevProduct.name}
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    <span>{t('productDetail.prevProduct', 'Prejšnji')}</span>
                  </Link>
                )}
                {nextProduct && (
                  <Link 
                    to={`/izdelek/${nextProduct.id}?lang=${i18n.language}`}
                    className="inline-flex items-center text-brown-600 hover:text-brown-700 transition-colors font-medium"
                    title={nextProduct.name}
                  >
                    <span>{t('productDetail.nextProduct', 'Naslednji izdelek')}</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                )}
              </div>
            </div>

            {/* Product Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 mb-12">
              {/* Image Column */}
              <div className="sticky top-0 md:static md:top-auto">
                <div className="rounded-lg">
                  <Image
                    src={mainImageUrl || ''}
                    alt={translatedName}
                    fallbackSrc="/images/placeholder-product.svg"
                    className="w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity object-contain aspect-square"
                    onClick={() => mainImageUrl && handleImageView(mainImageUrl)}
                    width={500}
                    height={500}
                    loading="eager"
                    fetchPriority="high"
                    ariaLabel={t('productDetail.mainProductImage', 'Main product image')}
                  />
                </div>
              </div>

              {/* Details Column */}
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-3 md:mb-4">{translatedName}</h1>
                <p className="text-gray-600 mb-6 md:mb-8">{translatedDescription}</p>

              {/* Packaging and Prices Section */}
              <div className="bg-brown-50 rounded-lg p-4 md:p-6 mb-6 md:mb-8" role="region" aria-labelledby="packaging-and-prices-heading">
                <h2 id="packaging-and-prices-heading" className="text-2xl font-bold mb-4">{t('productDetail.packagingAndPrices', 'Packaging and Prices')}</h2>
                <div className="space-y-4">
                  {packageOptionsArray.length > 0 ? (
                    packageOptionsArray.map((option: PackageOption) => (
                      option.uniq_id ? (
                        <div
                          key={option.uniq_id}
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 p-3 hover:bg-brown-100 transition-colors rounded-md border border-brown-100"
                        >
                          {/* Option Details */}
                          <div className="flex-1 mr-4 mb-2 sm:mb-0">
                             <span className="font-medium block mb-1">
                              {option.weight || ''}
                              {option.description ? ` (${getTranslatedOptionDescription(option)})` : ''}
                            </span>
                            {typeof option.price === 'number' && (
                              <span className="text-gray-700 font-semibold" aria-label={t('productDetail.priceLabel', 'Price')}>
                                {option.price.toFixed(2)} €
                              </span>
                            )}
                          </div>

                          {/* Quantity Input and Add to Cart Button */}
                          <div className="flex items-center space-x-2 w-full sm:w-auto">
                             <label htmlFor={`quantity-${option.uniq_id}`} className="sr-only">
                               {t('productDetail.quantityLabel', 'Quantity')}
                             </label>
                             <input
                                type="number"
                                id={`quantity-${option.uniq_id}`}
                                name={`quantity-${option.uniq_id}`}
                                min="1" // Minimum quantity is 1
                                max="99" // Reasonable maximum
                                value={quantities[option.uniq_id] || 1} // Default to 1 if undefined
                                onChange={(e) => handleQuantityChange(option.uniq_id, e.target.value)}
                                className="w-16 px-2 py-2 text-center border rounded focus:outline-none focus:ring-2 focus:ring-brown-500 touch-manipulation"
                                aria-label={t('productDetail.quantityAriaLabel', `Quantity for ${option.weight}`)}
                                aria-describedby={`quantity-hint-${option.uniq_id}`}
                              />
                              <div id={`quantity-hint-${option.uniq_id}`} className="sr-only">
                                {t('productDetail.quantityHint', 'Enter a number between 1 and 99')}
                              </div>
                            <AddToCart
                              productId={product.id}
                              packageOptionId={option.uniq_id}
                              quantity={quantities[option.uniq_id] || 1} // Pass current quantity
                            />
                          </div>
                        </div>
                      ) : (
                        <div key={`missing-${Math.random()}`} className="text-red-500 text-sm" role="alert">
                          {t('productDetail.missingOptionId', 'Package option data is incomplete.')}
                        </div>
                      )
                    ))
                  ) : (
                    <p role="alert">{t('productDetail.noOptions', 'No packaging options available.')}</p>
                  )}
                </div>
              </div>


              {/* Gift Option Section - Only shown for Darilni paket products */}
              {product.name && product.name.toLowerCase().includes('darilni paket') && (
                <div className="bg-amber-50 rounded-lg p-6 mb-6 border-2 border-amber-200">
                  <h2 className="text-2xl font-bold mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                    </svg>
                    {t('productDetail.giftOption.title', 'Send as a Gift')}
                  </h2>
                  <p className="text-gray-700 mb-4">
                    {t('productDetail.giftOption.description', 'Would you like to send this as a gift to a friend? Visit our gift page to select packaging options and add a personal message.')}
                  </p>
                  <a
                    href={`/darilo?lang=${i18n.language}`}
                    className="inline-flex items-center justify-center px-6 py-3 bg-amber-600 text-white font-medium rounded-md hover:bg-amber-700 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                    </svg>
                    {t('productDetail.giftOption.button', 'Go to Gift Page')}
                  </a>
                </div>
              )}

              {/* Order Information Section */}
              <div className="bg-brown-50 rounded-lg p-4 md:p-6">
                <h2 className="text-2xl font-bold mb-4">{t('productDetail.order.title', 'How to Order')}</h2>
                <p className="text-gray-600 mb-4">
                  {t('productDetail.order.description', 'For orders or inquiries, please contact us:')}
                </p>
                <ul className="list-disc list-inside text-gray-600">
                  <li>Email: <a href="mailto:kmetija.marosa@gmail.com" className="text-brown-600 hover:underline">kmetija.marosa@gmail.com</a></li>
                  <li>{getTranslatedPhoneNumberLabel()}: <a href={`tel:${getPhoneNumber().replace(/\s/g, '')}`} className="text-brown-600 hover:underline">{getPhoneNumber()}</a></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Gallery Section */}
          {galleryImages.length > 0 && (
            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-8 text-brown-800">
                {product.additional_images && Array.isArray(product.additional_images) && product.additional_images.length > 0
                  ? t('products.additionalImages', 'Additional Images')
                  : t('products.gallery', 'Gallery')}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
                {galleryImages.map((image, index) => (
                  <div
                    key={index}
                    className="aspect-square rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer touch-manipulation"
                    onClick={() => handleImageView(image)}
                    role="button"
                    tabIndex={0}
                    aria-label={t('productDetail.viewLargerImage', 'View larger image')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleImageView(image);
                      }
                    }}
                  >
                    <Image
                      src={image || ''}
                      alt={`${translatedName} - ${t('products.image', 'Image')} ${index + 1}`}
                      fallbackSrc="/images/placeholder.svg"
                      className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                      loading="lazy"
                      width={300}
                      height={300}
                      decoding="async"
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Product Bundles Section - TEMPORARILY DISABLED */}
          {/* <ProductBundles productId={product.id} category={product.category} /> */}

          {/* Recipes Section */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-4 text-brown-800">{t('products.recipes', 'Recipes with this Product')}</h2>
            <p className="text-gray-600 mb-8">{t('products.recipesDescription', 'Discover delicious ways to use this product with our curated recipes.')}</p>

            {/* Recipes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {productRecipes.length > 0 ? (
                productRecipes.map(recipe => (
                  <RecipeCard key={recipe.id} recipe={recipe} compact={true} />
                ))
              ) : (
                <div className="col-span-3 text-center text-gray-500">
                  {t('products.noRecipes', 'No recipes found for this product yet.')}
                </div>
              )}
            </div>

            {/* View All Recipes Button */}
            <div className="mt-8 text-center">
              <Link
                to={`/recipes?lang=${i18n.language}`}
                className="inline-block bg-brown-600 text-white py-2 px-6 rounded-md hover:bg-brown-700 transition-colors"
              >
                {t('products.viewAllRecipes', 'View All Recipes')}
              </Link>
            </div>
          </section>

          {/* Image Modal */}
          {selectedImage && (
            <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
              <div className="relative w-full max-w-5xl max-h-[90vh]">
                {/* Close button */}
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
                  aria-label={t('productDetail.closeImage', 'Close image')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Image - edge-to-edge inside the dark overlay */}
                <Image
                  src={selectedImage || ''}
                  alt={translatedName}
                  fallbackSrc="/images/placeholder.svg"
                  className="w-full h-auto max-h-[85vh] object-contain"
                  width={1000}
                  height={1000}
                />
              </div>
            </div>
          )}
        </div>
        </div>
      </ErrorBoundary>
    </div>
  );
}
