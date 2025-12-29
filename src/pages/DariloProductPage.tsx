import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Gift, Package, ShoppingBag, Send, Heart, Maximize2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { PageHeader } from '../components/PageHeader';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ImageModal } from '../components/ImageModal';

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

export function DariloProductPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [giftPackages, setGiftPackages] = useState<GiftPackage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modalImage, setModalImage] = useState<{ url: string; alt: string } | null>(null);

  // Check if a specific package ID is provided in the URL query parameters
  useEffect(() => {
    const packageId = searchParams.get('packageId');
    if (packageId) {
      // If a package ID is provided, redirect to the gift builder page
      navigate(`/darilo/builder/${packageId}?lang=${i18n.language}`);
    } else {
      // Otherwise, fetch all gift packages
      fetchGiftPackages();
    }
  }, [searchParams, navigate, i18n.language]);

  const fetchGiftPackages = async () => {
    try {
      setLoading(true);

      // Fetch gift packages from the database
      const { data, error } = await supabase
        .from('gift_packages')
        .select('*')
        .eq('is_active', true)
        .order('base_price');

      if (error) throw error;

      // If no data is returned, use mock data for development
      if (!data || data.length === 0) {
        console.log('No gift packages found in database, using mock data');

        const mockPackages: GiftPackage[] = [
          {
            id: 1,
            name: 'Osnovno darilo',
            name_en: 'Basic Gift',
            name_de: 'Basis-Geschenk',
            name_hr: 'Osnovni poklon',
            description: 'Osnovna darilna embalaža z enim izdelkom po vaši izbiri.',
            description_en: 'Basic gift packaging with one product of your choice.',
            description_de: 'Basis-Geschenkverpackung mit einem Produkt Ihrer Wahl.',
            description_hr: 'Osnovno poklon pakiranje s jednim proizvodom po vašem izboru.',
            base_price: 5.00,
            image_url: '/images/gifts/basic.jpg'
          },
          {
            id: 2,
            name: 'Premium darilo',
            name_en: 'Premium Gift',
            name_de: 'Premium-Geschenk',
            name_hr: 'Premium poklon',
            description: 'Elegantna darilna embalaža z do tremi izdelki po vaši izbiri.',
            description_en: 'Elegant gift packaging with up to three products of your choice.',
            description_de: 'Elegante Geschenkverpackung mit bis zu drei Produkten Ihrer Wahl.',
            description_hr: 'Elegantno poklon pakiranje s do tri proizvoda po vašem izboru.',
            base_price: 12.00,
            image_url: '/images/gifts/premium.jpg'
          },
          {
            id: 3,
            name: 'Luksuzno darilo',
            name_en: 'Luxury Gift',
            name_de: 'Luxus-Geschenk',
            name_hr: 'Luksuzni poklon',
            description: 'Luksuzna darilna škatla z do petimi izdelki po vaši izbiri in personalizirano kartico.',
            description_en: 'Luxury gift box with up to five products of your choice and a personalized card.',
            description_de: 'Luxuriöse Geschenkbox mit bis zu fünf Produkten Ihrer Wahl und einer personalisierten Karte.',
            description_hr: 'Luksuzna poklon kutija s do pet proizvoda po vašem izboru i personaliziranom karticom.',
            base_price: 25.00,
            image_url: '/images/gifts/luxury.jpg'
          }
        ];

        setGiftPackages(mockPackages);
      } else {
        setGiftPackages(data);
      }
    } catch (err: any) {
      console.error('Error fetching gift packages:', err);
      setError(t('gifts.fetchError', 'Failed to load gift options'));
    } finally {
      setLoading(false);
    }
  };

  const getTranslatedName = (giftPackage: GiftPackage) => {
    const lang = i18n.language;
    if (lang === 'en' && giftPackage.name_en) return giftPackage.name_en;
    if (lang === 'de' && giftPackage.name_de) return giftPackage.name_de;
    if (lang === 'hr' && giftPackage.name_hr) return giftPackage.name_hr;
    return giftPackage.name;
  };

  const getTranslatedDescription = (giftPackage: GiftPackage) => {
    const lang = i18n.language;
    if (lang === 'en' && giftPackage.description_en) return giftPackage.description_en;
    if (lang === 'de' && giftPackage.description_de) return giftPackage.description_de;
    if (lang === 'hr' && giftPackage.description_hr) return giftPackage.description_hr;
    return giftPackage.description || '';
  };

  const handleSelectGiftPackage = (giftPackageId: number) => {
    // Route preset packages (IDs 4-9) to preset page, others to builder
    const isPresetPackage = giftPackageId >= 4 && giftPackageId <= 9;
    const route = isPresetPackage ? 'preset' : 'builder';
    navigate(`/darilo/${route}/${giftPackageId}`);
  };

  if (loading) {
    return (
      <div className="bg-brown-50 min-h-screen">
        <PageHeader
          title={t('gifts.title', 'Darilo za prijatelje')}
          subtitle={t('gifts.subtitle', 'Izberite posebno darilo za vaše najdražje')}
          icon={<Gift className="h-8 w-8 text-amber-600" />}
        />
        <div className="container mx-auto px-4 py-12 text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-lg text-brown-700">{t('gifts.loading', 'Nalaganje darilnih paketov...')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-brown-50 min-h-screen">
        <PageHeader
          title={t('gifts.title', 'Darilo za prijatelje')}
          subtitle={t('gifts.subtitle', 'Izberite posebno darilo za vaše najdražje')}
          icon={<Gift className="h-8 w-8 text-amber-600" />}
        />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center text-red-600">
            <p className="text-lg">{error}</p>
            <button
              onClick={fetchGiftPackages}
              className="mt-4 bg-brown-600 hover:bg-brown-700 text-white font-bold py-2 px-4 rounded"
            >
              {t('gifts.retry', 'Poskusi znova')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-brown-50 min-h-screen">
      <PageHeader
        title={t('gifts.title', 'Darilo za prijatelje')}
        subtitle={t('gifts.subtitle', 'Izberite posebno darilo za vaše najdražje')}
        icon={<Gift className="h-8 w-8 text-amber-600" />}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-12 text-center max-w-3xl mx-auto">
          <p className="text-lg text-gray-700">
            {t('gifts.description', 'Izberite darilni paket in ustvarite popolno darilo za vaše najdražje. Izberite embalažo, dodajte izdelke in personalizirano sporočilo.')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {giftPackages.map((giftPackage) => (
            <div
              key={giftPackage.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden border border-brown-100 hover:shadow-xl transition-shadow group"
            >
              <div 
                className="aspect-video overflow-hidden bg-brown-50 relative cursor-zoom-in"
                onClick={() => setModalImage({ 
                  url: giftPackage.image_url || '/images/placeholder-product.jpg', 
                  alt: getTranslatedName(giftPackage) 
                })}
              >
                <img
                  src={giftPackage.image_url || '/images/placeholder-product.jpg'}
                  alt={getTranslatedName(giftPackage)}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <Maximize2 className="text-white opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8" />
                </div>
              </div>
              <div className="p-6">
                <h2 className="text-2xl font-bold text-brown-800 mb-2">{getTranslatedName(giftPackage)}</h2>
                <p className="text-gray-600 mb-4">{getTranslatedDescription(giftPackage)}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-amber-600">{giftPackage.base_price.toFixed(2)} €</span>
                  <button
                    onClick={() => handleSelectGiftPackage(giftPackage.id)}
                    className="bg-brown-600 hover:bg-brown-700 text-white font-bold py-2 px-4 rounded-full flex items-center"
                  >
                    <Heart className="h-5 w-5 mr-2" />
                    {t('gifts.select', 'Izberi')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-amber-50 rounded-lg p-8 mb-16">
          <h2 className="text-3xl font-bold text-brown-800 mb-4">{t('gifts.howItWorks', 'Kako deluje?')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            <div className="flex flex-col items-center text-center">
              <div className="bg-amber-100 rounded-full p-4 mb-4">
                <Package className="h-10 w-10 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-brown-800 mb-2">{t('gifts.step1Title', '1. Izberite embalažo')}</h3>
              <p className="text-gray-600">{t('gifts.step1Description', 'Izberite darilno embalažo, ki ustreza vašemu proračunu in priložnosti.')}</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-amber-100 rounded-full p-4 mb-4">
                <ShoppingBag className="h-10 w-10 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-brown-800 mb-2">{t('gifts.step2Title', '2. Izberite izdelke')}</h3>
              <p className="text-gray-600">{t('gifts.step2Description', 'Dodajte izdelke, ki jih želite vključiti v darilo.')}</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-amber-100 rounded-full p-4 mb-4">
                <Send className="h-10 w-10 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-brown-800 mb-2">{t('gifts.step3Title', '3. Pošljite darilo')}</h3>
              <p className="text-gray-600">{t('gifts.step3Description', 'Dodajte osebno sporočilo in podatke o prejemniku.')}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold text-brown-800 mb-4">{t('gifts.faq', 'Pogosta vprašanja')}</h2>
          <div className="space-y-6 mt-6">
            <div>
              <h3 className="text-xl font-bold text-brown-800 mb-2">{t('gifts.faq1Title', 'Ali lahko pošljem darilo na drug naslov?')}</h3>
              <p className="text-gray-600">{t('gifts.faq1Answer', 'Da, med postopkom naročila boste lahko vnesli podatke o prejemniku, vključno z naslovom za dostavo.')}</p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-brown-800 mb-2">{t('gifts.faq2Title', 'Ali lahko dodam osebno sporočilo?')}</h3>
              <p className="text-gray-600">{t('gifts.faq2Answer', 'Da, k vsakemu darilu lahko dodate osebno sporočilo, ki bo natisnjeno na kartico in priloženo darilu.')}</p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-brown-800 mb-2">{t('gifts.faq3Title', 'Koliko izdelkov lahko vključim v darilo?')}</h3>
              <p className="text-gray-600">{t('gifts.faq3Answer', 'Število izdelkov je odvisno od izbrane darilne embalaže. Osnovno darilo vključuje en izdelek, premium do tri izdelke, luksuzno pa do pet izdelkov.')}</p>
            </div>
          </div>
        </div>
      </div>

      {modalImage && (
        <ImageModal
          imageUrl={modalImage.url}
          alt={modalImage.alt}
          onClose={() => setModalImage(null)}
        />
      )}
    </div>
  );
}
