import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Gift, Heart, ArrowLeft } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { supabase } from '../lib/supabaseClient';
import { getImageUrl } from '../utils/imageUtils';
import { PageHeader } from '../components/PageHeader';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useCart } from '../context/CartContext';

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

interface PresetDefinitionItem {
  productName: string;
  optionTextContains: string; // matches option.description or weight/unit text
  quantity: number;
}

type PresetDefinitions = Record<number, PresetDefinitionItem[]>;

export function PresetGiftPage() {
  const { packageId } = useParams<{ packageId: string }>();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { addGiftToCart } = useCart();

  const [giftPackage, setGiftPackage] = useState<GiftPackage | null>(null);
  const { products, loading: productsLoading } = useProducts({ includeInactive: true }); // same source as other pages
  const [error, setError] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState('');
  const [recipientMessage, setRecipientMessage] = useState('');
  const [hasMessage, setHasMessage] = useState(false);

  // Pre-defined product combinations for each package, expressed by
  // product name + option text, so we always match whatever IDs are in Supabase.
  // Note: Supabase uses comma as decimal separator (e.g., "0,5l" not "0.5l")
  const PRESET_DEFINITIONS: PresetDefinitions = {
    4: [ // Paket oranžko
      { productName: 'Bučno olje', optionTextContains: '0,5', quantity: 1 },   // 0,5l
      { productName: 'Bučna semena', optionTextContains: '200', quantity: 1 } // 200g
    ],
    5: [ // Paket zelenko
      { productName: 'Konopljin čaj', optionTextContains: '20g', quantity: 1 },    // 20g
      { productName: 'Konopljino olje', optionTextContains: '0,25', quantity: 1 } // 0,25l
    ],
    6: [ // Paket vijola
      { productName: 'Pegasti badelj', optionTextContains: '250', quantity: 1 }, // 250g
      { productName: 'Aronija', optionTextContains: '0,5', quantity: 1 }         // 0,5l
    ],
    7: [ // Paket mix
      { productName: 'Ameriški slamnik', optionTextContains: '20g', quantity: 1 }, // 20g
      { productName: 'Kamilice', optionTextContains: '20g', quantity: 1 },         // 20g
      { productName: 'Aronija', optionTextContains: '0,5', quantity: 1 }          // 0,5l
    ],
    8: [ // Paket domačko
      { productName: 'Bučno olje', optionTextContains: '0,5', quantity: 1 },  // 0,5l
      { productName: 'Ajdova kaša', optionTextContains: '1kg', quantity: 1 }  // 1kg
    ],
    9: [ // Paket jesenko
      { productName: 'Bučno olje', optionTextContains: '0,5', quantity: 1 },   // 0,5l
      { productName: 'Ajdova kaša', optionTextContains: '500g', quantity: 1 }, // 500g
      { productName: 'Prosena kaša', optionTextContains: '500g', quantity: 1 } // 500g
    ]
  };

  useEffect(() => {
    if (packageId) {
      fetchGiftPackage(parseInt(packageId));
    }
  }, [packageId]);

  const fetchGiftPackage = async (id: number) => {
    try {
      const { data, error } = await supabase
        .from('gift_packages')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setGiftPackage(data as GiftPackage);
      } else {
        setError(t('gifts.packageNotFound', 'Darilni paket ni bil najden'));
      }
    } catch (err: any) {
      console.error('Error fetching gift package:', err);
      setError(t('gifts.fetchError', 'Napaka pri nalaganju darilnega paketa'));
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

  const findProductByName = (name: string) => {
    const lower = name.toLowerCase();
    return products.find((p: any) => {
      const names = [p.name, p.name_en, p.name_de, p.name_hr].filter(Boolean) as string[];
      return names.some(n => n.toLowerCase().includes(lower));
    });
  };

  const buildPresetLines = useMemo(() => {
    if (!giftPackage || products.length === 0) return [] as Array<{ product: any; option: any; quantity: number }>;

    const defs = PRESET_DEFINITIONS[giftPackage.id] || [];

    return defs.map(def => {
      const product = findProductByName(def.productName);
      const options = Array.isArray((product as any)?.package_options)
        ? (product as any).package_options as any[]
        : [];

      const option = options.find((opt: any) => {
        const textParts: string[] = [];
        if (opt.description) textParts.push(String(opt.description));
        if (opt.weight) textParts.push(String(opt.weight));
        if (opt.unit) textParts.push(String(opt.unit));
        const combined = textParts.join(' ').toLowerCase();
        return combined.includes(def.optionTextContains.toLowerCase());
      });

      return { product, option, quantity: def.quantity };
    }).filter(line => line.product && line.option);
  }, [giftPackage, products]);

  const calculateTotalPrice = () => {
    if (!giftPackage) return 0;

    let total = giftPackage.base_price;

    // (Optional) in future we could also sum individual product prices if needed.

    // Add message fee if user adds a message
    if (hasMessage && recipientMessage.trim()) {
      total += 3.00;
    }

    return total;
  };

  const handleAddToCart = async () => {
    if (!giftPackage) return;

    try {
      // Create gift item with preset products, resolved from current products list
      const giftItem = {
        id: `preset-gift-${Date.now()}`,
        name: `${getTranslatedName(giftPackage)} - ${t('gifts.presetGift', 'Prednastavljeno darilo')}`,
        price: calculateTotalPrice(),
        quantity: 1,
        image_url: giftPackage.image_url,
        is_gift: true,
        gift_package_id: giftPackage.id,
        gift_products: buildPresetLines.map(line => ({
          product_id: String(line.product.id),
          package_option_id: String(line.option.uniq_id),
          quantity: line.quantity,
          price: line.option.price || 0,
          name: getTranslatedName(line.product)
        })),
        recipient_name: recipientName,
        recipient_message: recipientMessage,
        has_message_fee: !!(hasMessage && recipientMessage.trim()) // Ensure boolean
      };

      addGiftToCart(giftItem);
      navigate('/cart');
    } catch (err) {
      console.error('Error adding preset gift to cart:', err);
      alert(t('gifts.addToCartError', 'Napaka pri dodajanju darila v košarico.'));
    }
  };

  if (productsLoading || !giftPackage) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader
          title={t('gifts.loading', 'Nalaganje...')}
        />
        <div className="container mx-auto px-4 py-8">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error || !giftPackage) {
    return (
      <div className="bg-brown-50 min-h-screen">
        <PageHeader
          title={t('gifts.presetGift', 'Prednastavljeno darilo')}
          subtitle={t('gifts.error', 'Napaka')}
          icon={<Gift className="h-8 w-8 text-amber-600" />}
        />
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <p className="text-red-600 mb-4">{error || t('gifts.packageNotFound', 'Darilni paket ni bil najden')}</p>
            <button
              onClick={() => navigate('/darilo')}
              className="bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700 transition-colors"
            >
              {t('common.back', 'Nazaj')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Update loading condition for preset products display
  const isLoading = productsLoading || products.length === 0 || buildPresetLines.length === 0;

  return (
    <div className="bg-brown-50 min-h-screen">
      <PageHeader
        title={t('gifts.presetGift', 'Prednastavljeno darilo')}
        subtitle={getTranslatedName(giftPackage)}
        icon={<Gift className="h-8 w-8 text-amber-600" />}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <button
            onClick={() => navigate('/darilo')}
            className="flex items-center text-brown-600 hover:text-brown-700 mb-6"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            {t('gifts.backToPackages', 'Nazaj na darilne pakete')}
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Package details */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 rounded-md overflow-hidden mr-4">
                  <img
                    src={getImageUrl(giftPackage.image_url || '') || '/images/placeholder-gift.jpg'}
                    alt={getTranslatedName(giftPackage)}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-brown-800">{getTranslatedName(giftPackage)}</h2>
                  <p className="text-gray-600">{getTranslatedDescription(giftPackage)}</p>
                  <p className="text-amber-600 font-semibold text-lg">{giftPackage.base_price.toFixed(2)} €</p>
                </div>
              </div>

              {/* Included products */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-brown-800 mb-3">{t('gifts.includedProducts', 'Vključeni izdelki')}:</h3>
                {!isLoading && buildPresetLines.length > 0 ? (
                  <div className="space-y-3">
                    {buildPresetLines.map((line, index) => {
                      const product = line.product;
                      const option = line.option;
                      const quantity = line.quantity;
                      return (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                          <div className="flex items-center">
                            <img
                              src={getImageUrl((product as any)?.image_url || '') || '/images/placeholder-product.jpg'}
                              alt={product ? getTranslatedName(product) : 'Product not found'}
                              className="w-10 h-10 object-cover rounded mr-3"
                            />
                            <div>
                              <p className="font-medium text-sm">{product ? getTranslatedName(product) : ''}</p>
                              <p className="text-xs text-gray-500">
                                {option ? `${option.description || `${option.weight}${option.unit || ''}`} × ${quantity}` : ''}
                              </p>
                            </div>
                          </div>
                          <span className="text-sm font-medium">{option ? ((option.price || 0) * quantity).toFixed(2) : '0.00'} €</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p>{t('gifts.loadingProducts', 'Loading included products...')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Order form */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-brown-800 mb-6">{t('gifts.orderDetails', 'Podrobnosti naročila')}</h3>

              {/* Recipient details */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('gifts.recipientName', 'Ime prejemnika')}
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder={t('gifts.recipientNamePlaceholder', 'Vnesite ime prejemnika')}
                  />
                </div>

                <div>
                  <div className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id="has-message"
                      className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                      checked={hasMessage}
                      onChange={(e) => setHasMessage(e.target.checked)}
                    />
                    <label htmlFor="has-message" className="ml-2 block text-sm font-medium text-gray-700">
                      {t('gifts.addMessage', 'Dodaj osebno sporočilo')} (+3,00 €)
                    </label>
                  </div>

                  {hasMessage && (
                    <textarea
                      rows={4}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                      value={recipientMessage}
                      onChange={(e) => setRecipientMessage(e.target.value)}
                      placeholder={t('gifts.messagePlaceholder', 'Vaše osebno sporočilo...')}
                      maxLength={200}
                    />
                  )}
                </div>
              </div>

              {/* Total and checkout */}
              <div className="border-t pt-4">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span>{t('gifts.packagePrice', 'Cena paketa')}:</span>
                    <span>{giftPackage.base_price.toFixed(2)} €</span>
                  </div>
                  {hasMessage && recipientMessage.trim() && (
                    <div className="flex justify-between text-amber-600">
                      <span>{t('gifts.messageFee', 'Osebno sporočilo')}:</span>
                      <span>+3,00 €</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>{t('gifts.total', 'Skupaj')}:</span>
                    <span>{calculateTotalPrice().toFixed(2)} €</span>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-4 rounded-md flex items-center justify-center"
                >
                  <Heart className="h-5 w-5 mr-2" />
                  {t('gifts.addToCart', 'Dodaj v košarico')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
