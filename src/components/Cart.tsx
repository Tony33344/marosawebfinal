import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate
import { supabase } from '../lib/supabaseClient';
import { Product, PackageOption, GiftItem } from '../types';
import { Trash2, Gift } from 'lucide-react';
import { ShippingCostNotification } from './ShippingCostNotification';
import { getImageUrl } from '../utils/imageUtils';

interface CartDisplayItem extends Product {
  packageOption: PackageOption;
  quantity: number;
}

export const Cart: React.FC = () => {
  const { cart, gifts, removeFromCart, removeGiftFromCart, updateQuantity, clearCart } = useCart();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate(); // Initialize useNavigate
  const [cartItemsDetails, setCartItemsDetails] = useState<CartDisplayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCartProductDetails = async () => {
      setLoading(true);
      setError(null);
      if (cart.length === 0) {
        setCartItemsDetails([]);
        setLoading(false);
        return;
      }

      try {
        const productIds = [...new Set(cart.map(item => item.productId))];
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .in('id', productIds);

        if (productsError) throw productsError;
        if (!productsData) throw new Error('No product data returned');

        const productsMap = new Map<number, Product>(
          productsData.map(p => [p.id, p])
        );

        const detailedItems: CartDisplayItem[] = [];
        for (const cartItem of cart) {
          const product = productsMap.get(cartItem.productId);
          if (product) {
            let options: PackageOption[] = [];
            if (typeof product.package_options === 'string') {
              try {
                options = JSON.parse(product.package_options);
              } catch (e) { console.error("Failed to parse package_options for product", product.id); }
            } else if (Array.isArray(product.package_options)) {
              options = product.package_options;
            }

            const packageOption = options.find(opt => opt.uniq_id === cartItem.packageOptionId);

            if (packageOption) {
              detailedItems.push({
                ...product,
                packageOption: packageOption,
                quantity: cartItem.quantity,
              });
            } else {
               console.warn(`Package option ${cartItem.packageOptionId} not found for product ${product.id}`);
               // removeFromCart(cartItem.productId, cartItem.packageOptionId); // Optionally remove
            }
          } else {
             console.warn(`Product with ID ${cartItem.productId} not found in fetched data.`);
             // removeFromCart(cartItem.productId, cartItem.packageOptionId); // Optionally remove
          }
        }
        setCartItemsDetails(detailedItems);

      } catch (err: any) {
        console.error("Error fetching cart item details:", err);
        setError(t('cart.fetchError', 'Could not load cart details.'));
      } finally {
        setLoading(false);
      }
    };

    fetchCartProductDetails();
  }, [cart, t, i18n.language]); // Removed removeFromCart from dependencies

  const handleQuantityChange = (productId: number, packageOptionId: string, value: string) => {
    const newQuantity = parseInt(value, 10);
    if (!isNaN(newQuantity)) {
      updateQuantity(productId, packageOptionId, Math.max(0, newQuantity));
    }
  };

  const calculateSubtotal = () => {
    // Calculate subtotal for regular cart items
    const cartSubtotal = cartItemsDetails.reduce((total, item) => {
      const price = item.packageOption?.price ?? 0;
      return total + price * item.quantity;
    }, 0);

    // Calculate subtotal for gift items
    const giftsSubtotal = gifts.reduce((total, gift) => {
      return total + gift.price * gift.quantity;
    }, 0);

    return cartSubtotal + giftsSubtotal;
  };

  const subtotal = calculateSubtotal();

  // Shipping cost constants
  const SHIPPING_COST = 3.90;
  const FREE_SHIPPING_THRESHOLD = 30.00;

  // Calculate if shipping is free
  const hasShippingFee = subtotal < FREE_SHIPPING_THRESHOLD;
  const shippingCost = hasShippingFee ? SHIPPING_COST : 0;

  // Calculate total with shipping
  const total = subtotal + shippingCost;

  const getTranslatedOptionDescription = (option: PackageOption) => {
    const key = `packageOption.${option.description?.toLowerCase().replace(/\s+/g, '_')}`;
    const fallback = option.description || '';
    return t(key, fallback);
  };

  const handleCheckout = () => {
    navigate(`/checkout-steps?lang=${i18n.language}`); // Navigate to multi-step checkout page
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8 text-center">{t('cart.loading', 'Loading cart...')}</div>;
  }

  if (error) {
    return <div className="container mx-auto px-4 py-8 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">{t('cart.title', 'Vaša nakupovalna košarica')}</h1>

      {cartItemsDetails.length === 0 && gifts.length === 0 ? (
        <div className="text-center py-10 bg-white rounded shadow">
          <p className="text-xl mb-4">{t('cart.empty', 'Vaša košarica je trenutno prazna.')}</p>
          <Link to={`/?lang=${i18n.language}`} className="text-brown-600 hover:text-brown-700 font-semibold">
            {t('cart.continueShopping', 'Nadaljuj z nakupovanjem')}
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-white rounded shadow overflow-hidden">
            {/* Cart Header */}
            <div className="hidden md:grid grid-cols-6 gap-4 font-semibold border-b p-4 text-gray-600">
              <div className="col-span-2">{t('cart.product', 'Product')}</div>
              <div>{t('cart.price', 'Price')}</div>
              <div>{t('cart.quantity', 'Quantity')}</div>
              <div>{t('cart.total', 'Total')}</div>
              <div>{/* Remove Action */}</div>
            </div>

            {/* Regular Cart Items */}
            {cartItemsDetails.map((item) => {
              const itemTotal = (item.packageOption?.price ?? 0) * item.quantity;
              const translatedName = item[`name_${i18n.language}` as keyof Product] || item.name;

              return (
                <div key={`${item.id}-${item.packageOption.uniq_id}`} className="border-b p-3 sm:p-4">
                  {/* Mobile Layout */}
                  <div className="md:hidden">
                    <div className="flex items-start space-x-3 mb-3">
                      <img
                        src={getImageUrl(item.image_url || '/images/placeholder-product.svg')}
                        alt={translatedName}
                        className="w-16 h-16 object-cover rounded flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <Link to={`/izdelek/${item.id}?lang=${i18n.language}`} className="font-semibold text-base hover:text-brown-700 block">
                          {translatedName}
                        </Link>
                        <p className="text-sm text-gray-500 mb-2">
                          {item.packageOption.weight}
                          {item.packageOption.description ? ` (${getTranslatedOptionDescription(item.packageOption)})` : ''}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="text-sm">
                            <span className="text-gray-600">{t('cart.price', 'Cena')}: </span>
                            <span className="font-medium">{(item.packageOption?.price ?? 0).toFixed(2)} €</span>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id, item.packageOption.uniq_id)}
                            className="text-red-500 hover:text-red-700 p-1"
                            aria-label={t('cart.removeAriaLabel', { productName: translatedName })}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">{t('cart.quantity', 'Količina')}:</span>
                        <input
                          type="number"
                          min="0"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item.id, item.packageOption.uniq_id, e.target.value)}
                          className="w-16 px-2 py-1 text-center border rounded focus:outline-none focus:ring-1 focus:ring-brown-500"
                          aria-label={t('cart.quantityAriaLabel', { productName: translatedName })}
                        />
                      </div>
                      <div className="text-right">
                        <span className="text-sm text-gray-600">{t('cart.total', 'Skupaj')}: </span>
                        <span className="font-semibold text-lg">{itemTotal.toFixed(2)} €</span>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden md:grid grid-cols-6 gap-4 items-center">
                    {/* Product Info */}
                    <div className="col-span-2 flex items-center space-x-3">
                      <img
                        src={getImageUrl(item.image_url || '/images/placeholder-product.svg')}
                        alt={translatedName}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div>
                        <Link to={`/izdelek/${item.id}?lang=${i18n.language}`} className="font-semibold text-lg hover:text-brown-700">
                          {translatedName}
                        </Link>
                        <p className="text-sm text-gray-500">
                          {item.packageOption.weight}
                          {item.packageOption.description ? ` (${getTranslatedOptionDescription(item.packageOption)})` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="text-gray-700">
                      {(item.packageOption?.price ?? 0).toFixed(2)} €
                    </div>

                    {/* Quantity */}
                    <div className="flex items-center">
                      <input
                        type="number"
                        min="0"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(item.id, item.packageOption.uniq_id, e.target.value)}
                        className="w-16 px-2 py-1 text-center border rounded focus:outline-none focus:ring-1 focus:ring-brown-500"
                        aria-label={t('cart.quantityAriaLabel', { productName: translatedName })}
                      />
                    </div>

                    {/* Total */}
                    <div className="font-semibold text-gray-800">
                      {itemTotal.toFixed(2)} €
                    </div>

                    {/* Remove Button */}
                    <div className="text-right">
                      <button
                        onClick={() => removeFromCart(item.id, item.packageOption.uniq_id)}
                        className="text-red-500 hover:text-red-700"
                        aria-label={t('cart.removeAriaLabel', { productName: translatedName })}
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Gift Items */}
            {gifts.map((gift) => (
              <div key={gift.id} className="border-b p-3 sm:p-4 bg-amber-50">
                {/* Mobile Layout for Gifts */}
                <div className="md:hidden">
                  <div className="flex items-start space-x-3 mb-3">
                    <div className="relative flex-shrink-0">
                      <img
                        src={getImageUrl(gift.image_url || '') || '/images/placeholder-gift.jpg'}
                        alt={gift.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="absolute -top-2 -right-2 bg-amber-500 rounded-full p-1">
                        <Gift size={12} className="text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-base text-amber-700">
                        {gift.name}
                      </div>
                      <p className="text-sm text-amber-600 mb-2">
                        {t('cart.gift', 'Gift')}
                        {gift.recipient_name ? ` ${t('cart.for', 'for')} ${gift.recipient_name}` : ''}
                      </p>
                      {gift.gift_products.length > 0 && (
                        <div className="text-xs text-gray-500 mb-2">
                          {gift.gift_products.length} {gift.gift_products.length === 1
                            ? t('cart.giftProduct', 'product')
                            : t('cart.giftProducts', 'products')}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <span className="text-gray-600">{t('cart.price', 'Cena')}: </span>
                          <span className="font-medium text-amber-700">{gift.price.toFixed(2)} €</span>
                        </div>
                        <button
                          onClick={() => removeGiftFromCart(gift.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                          aria-label={t('cart.removeGiftAriaLabel', { giftName: gift.name })}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Desktop Layout for Gifts */}
                <div className="hidden md:grid grid-cols-6 gap-4 items-center">
                  {/* Gift Info */}
                  <div className="col-span-2 flex items-center space-x-3">
                    <div className="relative">
                      <img
                        src={getImageUrl(gift.image_url || '') || '/images/placeholder-gift.jpg'}
                        alt={gift.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="absolute -top-2 -right-2 bg-amber-500 rounded-full p-1">
                        <Gift size={14} className="text-white" />
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-lg text-amber-700">
                        {gift.name}
                      </div>
                      <p className="text-sm text-amber-600">
                        {t('cart.gift', 'Gift')}
                        {gift.recipient_name ? ` ${t('cart.for', 'for')} ${gift.recipient_name}` : ''}
                      </p>
                      {gift.gift_products.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          {gift.gift_products.length} {gift.gift_products.length === 1
                            ? t('cart.giftProduct', 'product')
                            : t('cart.giftProducts', 'products')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-amber-700">
                    {gift.price.toFixed(2)} €
                  </div>

                  {/* Quantity - always 1 for gifts */}
                  <div className="flex items-center">
                    <span className="w-16 px-2 py-1 text-center">1</span>
                  </div>

                  {/* Total */}
                  <div className="font-semibold text-amber-700">
                    {gift.price.toFixed(2)} €
                  </div>

                  {/* Remove Button */}
                  <div className="text-right">
                    <button
                      onClick={() => removeGiftFromCart(gift.id)}
                      className="text-red-500 hover:text-red-700"
                      aria-label={t('cart.removeGiftAriaLabel', { giftName: gift.name })}
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Summary & Actions */}
          <div className="mt-6 flex flex-col md:flex-row justify-between items-start md:items-center">
             <button
                onClick={clearCart}
                className="text-sm text-gray-500 hover:text-red-600 mb-4 md:mb-0"
              >
                {t('cart.clearCart', 'Clear Cart')}
              </button>
            <div className="text-right w-full md:w-auto">
              {/* Shipping Cost Notification */}
              <div className="mb-4">
                <ShippingCostNotification
                  subtotal={subtotal}
                  shippingCost={SHIPPING_COST}
                  freeShippingThreshold={FREE_SHIPPING_THRESHOLD}
                />
              </div>

              {/* Cart Summary */}
              <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4 text-brown-800">{t('cart.orderSummary', 'Povzetek naročila')}</h3>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm sm:text-base">
                    <span className="text-gray-600">{t('cart.subtotal', 'Vmesni seštevek')}:</span>
                    <span className="font-medium">{subtotal.toFixed(2)} €</span>
                  </div>

                  <div className="flex justify-between text-sm sm:text-base">
                    <span className="text-gray-600">{t('cart.shipping', 'Dostava')}:</span>
                    <span className={`font-medium ${!hasShippingFee ? 'text-green-600' : ''}`}>
                      {hasShippingFee
                        ? `${shippingCost.toFixed(2)} €`
                        : t('cart.free', 'Brezplačno')}
                    </span>
                  </div>

                  {hasShippingFee && (
                    <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                      {t('cart.freeShippingNote', 'Brezplačna dostava za naročila nad 30,00 €')}
                    </div>
                  )}

                  <div className="flex justify-between font-bold text-lg sm:text-xl border-t pt-3 mt-3 text-brown-800">
                    <span>{t('cart.total', 'Skupaj')}:</span>
                    <span>{total.toFixed(2)} €</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="bg-brown-600 hover:bg-brown-700 text-white font-bold py-2 px-6 rounded w-full mt-4"
              >
                {t('cart.checkout', 'Proceed to Checkout')}
              </button>
              <p className="text-sm text-gray-500 mt-2">{t('cart.checkoutInfo', 'Taxes calculated at checkout.')}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
