import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Gift, ShoppingBag, X, Plus, Check } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { getImageUrl } from '../utils/imageUtils';
import { useCart } from '../context/CartContext';
import { PageHeader } from '../components/PageHeader';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface GiftPackage {
  id: number;
  name: string;
  name_en?: string;
  name_de?: string;
  name_hr?: string;
  description?: string;
  description_en?: string;
  description_de?: string;
  description_hr?: string;
  base_price: number;
  image_url?: string;
}

interface Product {
  id: string;
  name: string;
  name_en?: string;
  name_de?: string;
  name_hr?: string;
  description?: string;
  description_en?: string;
  description_de?: string;
  description_hr?: string;
  price: number;
  image_url?: string;
  package_options: any[];
  category_id: string;
}

interface Category {
  id: string;
  name: string;
  name_en?: string;
  name_de?: string;
  name_hr?: string;
}

interface SelectedProduct {
  product: Product;
  packageOption: any;
  quantity: number;
}

export function GiftBuilderPage() {
  const { packageId } = useParams<{ packageId: string }>();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { addGiftToCart } = useCart();

  const [loading, setLoading] = useState(true);
  const [giftPackage, setGiftPackage] = useState<GiftPackage | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState('');
  const [recipientMessage, setRecipientMessage] = useState('');

  // Maximum number of products allowed based on package type
  const [maxProducts, setMaxProducts] = useState(5);

  useEffect(() => {
    if (packageId) {
      fetchGiftPackage(parseInt(packageId));
      fetchProducts();
      fetchCategories();
    }
  }, [packageId]);

  // Set max products based on package type
  useEffect(() => {
    if (giftPackage) {
      // Use package ID instead of name to determine max products
      // This ensures it works correctly regardless of the selected language
      if (giftPackage.id === 1) {
        setMaxProducts(1); // Basic/Osnovno package
      } else if (giftPackage.id === 2) {
        setMaxProducts(3); // Premium package
      } else if (giftPackage.id === 3) {
        setMaxProducts(5); // Luxury/Luksuzno package
      }
    }
  }, [giftPackage]);

  const fetchGiftPackage = async (id: number) => {
    try {
      const { data, error } = await supabase
        .from('gift_packages')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setGiftPackage(data);
      } else {
        setError(t('gifts.packageNotFound', 'Darilni paket ni bil najden'));
      }
    } catch (err: any) {
      console.error('Error fetching gift package:', err);
      setError(t('gifts.fetchError', 'Napaka pri nalaganju darilnega paketa'));
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('isActive', true);

      if (error) throw error;

      // Process products to ensure package_options is parsed
      const processedProducts = (data || []).map(product => ({
        ...product,
        package_options: typeof product.package_options === 'string'
          ? JSON.parse(product.package_options)
          : product.package_options
      }));

      setProducts(processedProducts);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(t('gifts.productsError', 'Napaka pri nalaganju izdelkov'));
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;

      setCategories(data || []);
      if (data && data.length > 0) {
        setSelectedCategory(data[0].id);
      }
    } catch (err: any) {
      console.error('Error fetching categories:', err);
    }
  };

  const getTranslatedName = (item: any) => {
    const lang = i18n.language;
    if (lang === 'en' && item.name_en) return item.name_en;
    if (lang === 'de' && item.name_de) return item.name_de;
    if (lang === 'hr' && item.name_hr) return item.name_hr;
    return item.name;
  };

  const getTranslatedDescription = (item: any) => {
    const lang = i18n.language;
    if (lang === 'en' && item.description_en) return item.description_en;
    if (lang === 'de' && item.description_de) return item.description_de;
    if (lang === 'hr' && item.description_hr) return item.description_hr;
    return item.description || '';
  };

  const handleAddProduct = (product: Product) => {
    if (selectedProducts.length >= maxProducts) {
      alert(t('gifts.maxProductsReached', `Lahko dodate največ ${maxProducts} izdelkov v ta darilni paket.`));
      return;
    }

    // Default to first package option
    const defaultOption = product.package_options && product.package_options.length > 0
      ? product.package_options[0]
      : null;

    if (!defaultOption) {
      alert(t('gifts.noPackageOptions', 'Ta izdelek nima razpoložljivih možnosti pakiranja.'));
      return;
    }

    // Check if product is already selected
    const existingIndex = selectedProducts.findIndex(
      sp => sp.product.id === product.id && sp.packageOption.uniq_id === defaultOption.uniq_id
    );

    if (existingIndex >= 0) {
      // Update quantity if already selected
      const updatedProducts = [...selectedProducts];
      updatedProducts[existingIndex].quantity += 1;
      setSelectedProducts(updatedProducts);
    } else {
      // Add new product
      setSelectedProducts([
        ...selectedProducts,
        {
          product,
          packageOption: defaultOption,
          quantity: 1
        }
      ]);
    }
  };

  const handleRemoveProduct = (index: number) => {
    const updatedProducts = [...selectedProducts];
    updatedProducts.splice(index, 1);
    setSelectedProducts(updatedProducts);
  };

  const handleUpdateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    const updatedProducts = [...selectedProducts];
    updatedProducts[index].quantity = newQuantity;
    setSelectedProducts(updatedProducts);
  };

  const handlePackageOptionChange = (index: number, optionId: string) => {
    const product = selectedProducts[index].product;
    const option = product.package_options.find(opt => opt.uniq_id === optionId);

    if (!option) return;

    const updatedProducts = [...selectedProducts];
    updatedProducts[index].packageOption = option;
    setSelectedProducts(updatedProducts);
  };

  const handleAddToCart = async () => {
    if (!giftPackage) return;

    if (selectedProducts.length === 0) {
      alert(t('gifts.noProductsSelected', 'Izberite vsaj en izdelek za darilo.'));
      return;
    }

    try {
      // Create a special gift item for the cart
      const giftItem = {
        id: `gift-${Date.now()}`,
        name: `${getTranslatedName(giftPackage)} - ${t('gifts.gift', 'Darilo')}`,
        price: calculateTotalPrice(),
        quantity: 1,
        image_url: giftPackage.image_url,
        is_gift: true,
        gift_package_id: giftPackage.id,
        gift_products: selectedProducts.map(sp => ({
          product_id: sp.product.id,
          package_option_id: sp.packageOption.uniq_id,
          quantity: sp.quantity,
          price: sp.packageOption.price,
          name: getTranslatedName(sp.product)
        })),
        recipient_name: recipientName,
        recipient_message: recipientMessage
      };

      // Add to cart
      addGiftToCart(giftItem);

      // Navigate to cart
      navigate('/cart');
    } catch (err) {
      console.error('Error adding gift to cart:', err);
      alert(t('gifts.addToCartError', 'Napaka pri dodajanju darila v košarico.'));
    }
  };

  const calculateTotalPrice = () => {
    if (!giftPackage) return 0;

    // Base price of the gift package
    let total = giftPackage.base_price;

    // Add price of each selected product
    selectedProducts.forEach(sp => {
      total += (sp.packageOption.price * sp.quantity);
    });

    return total;
  };

  // Filter products by category and search term
  const filteredProducts = products.filter(product => {
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
    const matchesSearch = !searchTerm ||
      getTranslatedName(product).toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="bg-brown-50 min-h-screen">
        <PageHeader
          title={t('gifts.builder.title', 'Ustvarite darilo')}
          subtitle={t('gifts.builder.loading', 'Nalaganje...')}
          icon={<Gift className="h-8 w-8 text-amber-600" />}
        />
        <div className="container mx-auto px-4 py-8 text-center">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error || !giftPackage) {
    return (
      <div className="bg-brown-50 min-h-screen">
        <PageHeader
          title={t('gifts.builder.title', 'Ustvarite darilo')}
          subtitle={t('gifts.builder.error', 'Napaka')}
          icon={<Gift className="h-8 w-8 text-amber-600" />}
        />
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <p className="text-red-600 mb-4">{error || t('gifts.packageNotFound', 'Darilni paket ni bil najden')}</p>
            <button
              onClick={() => navigate('/darilo')}
              className="bg-brown-600 hover:bg-brown-700 text-white font-bold py-2 px-4 rounded"
            >
              {t('gifts.backToPackages', 'Nazaj na darilne pakete')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-brown-50 min-h-screen">
      <PageHeader
        title={t('gifts.builder.title', 'Ustvarite darilo')}
        subtitle={getTranslatedName(giftPackage)}
        icon={<Gift className="h-8 w-8 text-amber-600" />}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - Product selection */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold text-brown-800 mb-4">
                {t('gifts.builder.selectProducts', 'Izberite izdelke')}
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({selectedProducts.length}/{maxProducts})
                </span>
              </h2>

              {/* Search and category filters */}
              <div className="mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <input
                    type="text"
                    placeholder={t('gifts.builder.search', 'Išči izdelke...')}
                    className="flex-1 p-2 border border-gray-300 rounded-md"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />

                  <select
                    className="p-2 border border-gray-300 rounded-md"
                    value={selectedCategory || ''}
                    onChange={(e) => setSelectedCategory(e.target.value || null)}
                  >
                    <option value="">{t('gifts.builder.allCategories', 'Vse kategorije')}</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {getTranslatedName(category)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Product grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {filteredProducts.map(product => (
                  <div
                    key={product.id}
                    className="border rounded-md p-3 hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-square overflow-hidden rounded-md mb-2">
                      <img
                        src={product.image_url || '/images/placeholder-product.jpg'}
                        alt={getTranslatedName(product)}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-sm font-medium mb-1 truncate">{getTranslatedName(product)}</div>
                    <div className="text-xs text-gray-500 mb-2 truncate">
                      {product.package_options && product.package_options.length > 0
                        ? `${product.package_options[0].price.toFixed(2)} €`
                        : ''}
                    </div>
                    <button
                      onClick={() => handleAddProduct(product)}
                      disabled={selectedProducts.length >= maxProducts}
                      className={`w-full text-xs py-1 px-2 rounded-full flex items-center justify-center ${
                        selectedProducts.length >= maxProducts
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-amber-600 hover:bg-amber-700 text-white'
                      }`}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {t('gifts.builder.add', 'Dodaj')}
                    </button>
                  </div>
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {t('gifts.builder.noProductsFound', 'Ni najdenih izdelkov')}
                </div>
              )}
            </div>
          </div>

          {/* Right column - Gift summary */}
          <div>
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-bold text-brown-800 mb-4">
                {t('gifts.builder.summary', 'Povzetek darila')}
              </h2>

              <div className="mb-4 p-3 bg-amber-50 rounded-md">
                <div className="flex items-center">
                  <div className="w-16 h-16 rounded-md overflow-hidden mr-3">
                    <img
                      src={giftPackage.image_url || '/images/placeholder-gift.jpg'}
                      alt={getTranslatedName(giftPackage)}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-medium">{getTranslatedName(giftPackage)}</h3>
                    <p className="text-sm text-gray-600">{getTranslatedDescription(giftPackage)}</p>
                    <p className="text-amber-600 font-medium">{giftPackage.base_price.toFixed(2)} €</p>
                  </div>
                </div>
              </div>

              {/* Selected products */}
              <div className="mb-6">
                <h3 className="font-medium mb-2">{t('gifts.builder.selectedProducts', 'Izbrani izdelki')}</h3>

                {selectedProducts.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">
                    {t('gifts.builder.noProductsSelected', 'Ni izbranih izdelkov')}
                  </p>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {selectedProducts.map((sp, index) => (
                      <div key={`${sp.product.id}-${sp.packageOption.uniq_id}`} className="flex items-center border-b pb-2">
                        <div className="w-12 h-12 rounded-md overflow-hidden mr-2">
                          <img
                            src={sp.product.image_url || '/images/placeholder-product.jpg'}
                            alt={getTranslatedName(sp.product)}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{getTranslatedName(sp.product)}</p>

                          {/* Package option selector */}
                          {sp.product.package_options && sp.product.package_options.length > 1 && (
                            <select
                              className="text-xs p-1 border border-gray-300 rounded w-full mt-1"
                              value={sp.packageOption.uniq_id}
                              onChange={(e) => handlePackageOptionChange(index, e.target.value)}
                            >
                              {sp.product.package_options.map(option => (
                                <option key={option.uniq_id} value={option.uniq_id}>
                                  {option.description || `${option.weight}${option.unit || ''}`} - {option.price.toFixed(2)} €
                                </option>
                              ))}
                            </select>
                          )}

                          {sp.product.package_options && sp.product.package_options.length === 1 && (
                            <p className="text-xs text-gray-500">
                              {sp.packageOption.description || `${sp.packageOption.weight}${sp.packageOption.unit || ''}`}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center ml-2">
                          <button
                            onClick={() => handleUpdateQuantity(index, sp.quantity - 1)}
                            className="text-gray-500 hover:text-gray-700 p-1"
                          >
                            -
                          </button>
                          <span className="mx-1 text-sm">{sp.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(index, sp.quantity + 1)}
                            className="text-gray-500 hover:text-gray-700 p-1"
                          >
                            +
                          </button>
                        </div>

                        <div className="ml-2 text-sm font-medium">
                          {(sp.packageOption.price * sp.quantity).toFixed(2)} €
                        </div>

                        <button
                          onClick={() => handleRemoveProduct(index)}
                          className="ml-2 text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recipient information */}
              <div className="mb-6">
                <h3 className="font-medium mb-2">{t('gifts.builder.recipient', 'Prejemnik darila')}</h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      {t('gifts.builder.recipientName', 'Ime prejemnika')}
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder={t('gifts.builder.recipientNamePlaceholder', 'Vnesite ime prejemnika')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      {t('gifts.builder.message', 'Osebno sporočilo')}
                    </label>
                    <textarea
                      className="w-full p-2 border border-gray-300 rounded-md"
                      rows={3}
                      value={recipientMessage}
                      onChange={(e) => setRecipientMessage(e.target.value)}
                      placeholder={t('gifts.builder.messagePlaceholder', 'Vnesite osebno sporočilo')}
                    />
                  </div>
                </div>
              </div>

              {/* Total and add to cart */}
              <div>
                <div className="flex justify-between items-center mb-4 text-lg font-bold">
                  <span>{t('gifts.builder.total', 'Skupaj')}</span>
                  <span>{calculateTotalPrice().toFixed(2)} €</span>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={selectedProducts.length === 0}
                  className={`w-full py-3 px-4 rounded-md flex items-center justify-center ${
                    selectedProducts.length === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-amber-600 hover:bg-amber-700 text-white'
                  }`}
                >
                  <ShoppingBag className="h-5 w-5 mr-2" />
                  {t('gifts.builder.addToCart', 'Dodaj v košarico')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
