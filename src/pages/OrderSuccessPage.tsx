import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabaseClient';
import { CheckCircle, ArrowLeft, Printer, CreditCard, Truck, Mail, Copy, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { decryptObject, isEncrypted } from '../utils/encryption';
import { MarosaUPNQRCode } from '../components/payment/UPNQRCode';

interface OrderItem {
  product_id: string;
  product_name: string;
  package_description: string;
  quantity: number;
  price_per_unit: number;
  line_total: number;
}

interface ShippingAddress {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
}

interface Order {
  id: string;
  created_at: string;
  total_price: number;
  status: string;
  items: OrderItem[];
  shipping_address: ShippingAddress;
  notes?: string;
  payment_method: string;
  gift_product_id?: string;
  gift_product_package_id?: string;
  gift_option_id?: string;
  gift_message?: string;
  order_number?: string;
  discount_amount?: number;
}

export const OrderSuccessPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { clearCart } = useCart();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cartCleared, setCartCleared] = useState(false);

  const searchParams = new URLSearchParams(location.search);
  const orderId = searchParams.get('order_id');
  const paymentId = searchParams.get('payment_id');

  useEffect(() => {
    // Check if we need to clear the cart (from session storage)
    const shouldClearCart = sessionStorage.getItem('clearCartAfterOrder') === 'true';
    const lastOrderId = sessionStorage.getItem('lastSuccessfulOrder');

    if (shouldClearCart && lastOrderId && lastOrderId === orderId && !cartCleared) {
      clearCart();
      setCartCleared(true);
      sessionStorage.removeItem('clearCartAfterOrder');
      sessionStorage.removeItem('lastSuccessfulOrder');
    }

    const fetchOrderDetails = async () => {
      if (!orderId && !paymentId) {
        setError(t('orders.notFound', 'Order not found'));
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Orders are served by the get-order edge function — the order UUID
        // (or Stripe payment id) acts as the access token.
        const { data, error: fetchError } = await supabase.functions.invoke('get-order', {
          body: orderId ? { orderId } : { paymentId },
        });

        if (fetchError || !data?.order) {
          setError(t('orders.notFound', 'Order not found'));
          setLoading(false);
          return;
        }

        const parsedOrder = data.order;

        // Decrypt shipping address fields if they are encrypted
        const fieldsToDecrypt = ['name', 'address', 'phone'];
        if (parsedOrder.shipping_address) {
          try {
            const hasEncryptedFields = fieldsToDecrypt.some(
              field => typeof parsedOrder.shipping_address[field] === 'string' &&
                      isEncrypted(parsedOrder.shipping_address[field])
            );

            if (hasEncryptedFields) {
              parsedOrder.shipping_address = await decryptObject(
                parsedOrder.shipping_address,
                fieldsToDecrypt
              );
            }
          } catch (decryptError) {
            console.error('Error decrypting shipping address:', decryptError);
          }
        }

        setOrder(parsedOrder);
        setLoading(false);
      } catch (err) {
        console.error('Exception fetching order:', err);
        setError(t('orders.fetchError', 'Error loading order details'));
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, paymentId, t]);

  // These variables will be used after we confirm the order exists
  let orderDate, formattedDate, showBankDetails;

  // State for copy button
  const [copied, setCopied] = useState(false);
  const [copiedField, setCopiedField] = useState('');

  // Function to copy text to clipboard
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setCopiedField(field);
      setTimeout(() => {
        setCopied(false);
        setCopiedField('');
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };

  // Generate a simplified reference number
  const generateSimpleReference = (order: any) => {
    // Use order number if available, otherwise fall back to UUID
    if (order.order_number) {
      return order.order_number.toString();
    }
    // Fallback to UUID for old orders
    return order.id.substring(0, 10).replace(/-/g, '');
  };

  if (order) {
    // Format date
    orderDate = new Date(order.created_at);
    formattedDate = new Intl.DateTimeFormat(i18n.language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(orderDate);

    // Bank transfer details
    showBankDetails = order.payment_method === 'bank_transfer';
  }

  // Confirmation emails are sent server-side (create-order / stripe-webhook).

  // Show loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brown-700"></div>
          <p className="mt-4 text-gray-600">{t('common.loading', 'Loading...')}</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-red-800 text-lg font-semibold mb-2">
            {t('orders.error', 'Error')}
          </h2>
          <p className="text-red-700">{error || t('orders.notFound', 'Order not found')}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brown-600 hover:bg-brown-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brown-500"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('common.backToHome', 'Back to Home')}
          </button>
        </div>
      </div>
    );
  }



  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-green-50 p-6 border-b border-green-100">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-green-800">
                {t('checkout.orderSuccess', 'Order placed successfully!')}
              </h1>
              <p className="text-green-700 mt-1">
                {t('checkout.orderSuccessMessage', 'Thank you for your order! We will process it shortly.')}
              </p>
              {order.payment_method === 'credit_card' && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <p className="text-amber-700 text-sm font-medium">
                    {t('checkout.paymentConfirmedNotice', 'Your payment was successful!')}
                  </p>
                  <p className="text-amber-700 text-sm mt-1">
                    {t('checkout.tempOrderEmail', 'You will receive a confirmation email shortly with your order details.')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-8">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                {t('orders.orderDetails', 'Order Details')}
              </h2>
              <p className="text-gray-600">
                <span className="font-medium">{t('orders.orderNumber', 'Order Number')}:</span> {order.order_number || order.id}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">{t('orders.orderDate', 'Order Date')}:</span> {formattedDate}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">{t('orders.status', 'Status')}:</span> {t(`orders.statuses.${order.status}`, order.status)}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">{t('orders.paymentMethod', 'Payment Method')}:</span>{' '}
                {order.payment_method === 'pay_on_delivery' || order.payment_method === 'cod' || order.payment_method === 'cash_on_delivery'
                  ? t('orders.paymentMethods.cash_on_delivery', 'Plačilo po povzetju')
                  : order.payment_method === 'bank_transfer'
                  ? t('orders.paymentMethods.bank_transfer', 'Bančno nakazilo')
                  : order.payment_method === 'credit_card'
                  ? t('orders.paymentMethods.credit_card', 'Kreditna kartica')
                  : order.payment_method}
              </p>
            </div>

            <div className="mt-6 md:mt-0">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                {t('orders.shippingInfo', 'Shipping Information')}
              </h2>
              <p className="text-gray-600">{order.shipping_address?.name}</p>
              <p className="text-gray-600">{order.shipping_address?.address}</p>
              <p className="text-gray-600">{order.shipping_address?.postalCode} {order.shipping_address?.city}</p>
              <p className="text-gray-600">{order.shipping_address?.country}</p>
              <p className="text-gray-600">{order.shipping_address?.phone}</p>
              <p className="text-gray-600">{order.shipping_address?.email}</p>

              {/* Gift Recipient Address - Extract from notes if present */}
              {(() => {
                // Try to extract gift recipient address from notes
                if (order.notes && order.notes.includes('GIFT_ADDRESS_JSON')) {
                  try {
                    // Extract the JSON string from the notes
                    const giftAddressMatch = order.notes.match(/\[GIFT_ADDRESS_JSON: (\{.*?\})\]/);
                    if (giftAddressMatch && giftAddressMatch[1]) {
                      const giftAddressData = JSON.parse(giftAddressMatch[1]);
                      if (giftAddressData.type === 'gift_recipient_address' && giftAddressData.data) {
                        return (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <h3 className="font-semibold text-amber-800 mb-2 flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a4 4 0 118 0v7M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
                              </svg>
                              {t('orders.giftRecipientAddress', 'Gift Recipient Address')}
                            </h3>
                            <div className="bg-amber-50 p-3 rounded-md border border-amber-200">
                              <p className="text-amber-800 font-medium">{giftAddressData.data.name}</p>
                              <p className="text-amber-800">{giftAddressData.data.address}</p>
                              <p className="text-amber-800">{giftAddressData.data.postalCode} {giftAddressData.data.city}</p>
                              <p className="text-amber-800">{giftAddressData.data.country}</p>
                            </div>
                          </div>
                        );
                      }
                    }
                  } catch (e) {
                    console.error("Failed to parse gift address JSON", e);
                    return null;
                  }
                }

                // Check for older format gift recipient information
                if (order.notes && (order.notes.includes('[Gift Recipient:') || order.notes.includes('[Gift Shipping Address:'))) {
                  return (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h3 className="font-semibold text-amber-800 mb-2 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a4 4 0 118 0v7M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
                        </svg>
                        {t('orders.giftRecipientAddress', 'Gift Recipient Address')}
                      </h3>
                      <div className="bg-amber-50 p-3 rounded-md border border-amber-200">
                        <p className="text-amber-800 italic">{t('orders.giftAddressInNotes', 'Gift recipient address information is included in the order.')}</p>
                      </div>
                    </div>
                  );
                }

                return null;
              })()}
            </div>
          </div>

          {/* Bank Transfer Details */}
          {showBankDetails && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
              <div className="flex items-start">
                <CreditCard className="w-5 h-5 text-amber-600 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-amber-800 mb-2">
                    {t('checkout.bankTransferDetails', 'Bank Transfer Details')}
                  </h3>
                  <p className="text-amber-700 mb-2">
                    {t('checkout.bankTransferInstructions', 'Please transfer the total amount to the following bank account:')}
                  </p>
                  <div className="bg-white rounded p-3 border border-amber-200 text-sm">
                    <div className="flex justify-between items-center mb-1">
                      <p><span className="font-medium">IBAN:</span> SI56 0700 0000 4161 875</p>
                      <button
                        onClick={() => copyToClipboard('SI56 0700 0000 4161 875', 'iban')}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded-md hover:bg-blue-50"
                        title={t('common.copy', 'Copy to clipboard')}
                      >
                        {copied && copiedField === 'iban' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="mb-1"><span className="font-medium">{t('checkout.accountHolder', 'Account Holder')}:</span> Kmetija Maroša</p>
                    <p className="mb-1"><span className="font-medium">{t('checkout.bank', 'Bank')}:</span> Gorenjska Banka d.d., Kranj</p>

                    {/* Simplified reference number with copy button */}
                    <div className="flex justify-between items-center mb-1">
                      <p><span className="font-medium">{t('checkout.reference', 'Reference')}:</span> {generateSimpleReference(order)}</p>
                      <button
                        onClick={() => copyToClipboard(generateSimpleReference(order), 'reference')}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded-md hover:bg-blue-50"
                        title={t('common.copy', 'Copy to clipboard')}
                      >
                        {copied && copiedField === 'reference' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="flex justify-between items-center mb-1">
                      <p><span className="font-medium">{t('checkout.amount', 'Amount')}:</span> {order.total_price.toFixed(2)} €</p>
                      <button
                        onClick={() => copyToClipboard(order.total_price.toFixed(2), 'amount')}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded-md hover:bg-blue-50"
                        title={t('common.copy', 'Copy to clipboard')}
                      >
                        {copied && copiedField === 'amount' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <p className="text-amber-700 mt-2 text-sm">
                    {t('checkout.bankTransferNote', 'Please include the reference number shown above in your payment. Your order will be processed once payment is received.')}
                  </p>
                  <p className="text-amber-700 text-sm">
                    <strong>{t('checkout.tip', 'Tip')}:</strong> {t('checkout.copyTip', 'Use the copy buttons to easily copy the payment details to your clipboard.')}
                  </p>
                  
                  {/* UPN QR Code for easy mobile banking */}
                  <div className="mt-4">
                    <MarosaUPNQRCode 
                      amount={order.total_price} 
                      orderId={generateSimpleReference(order)}
                      purpose={t('checkout.upnPurpose', 'Naročilo Kmetija Maroša')}
                    />
                  </div>
                  
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                      <p className="text-green-700 font-medium">
                        {t('checkout.bankTransferSuccess', 'Order Successfully Placed')}
                      </p>
                    </div>
                    <p className="text-green-600 text-sm mt-1">
                      {t('checkout.bankTransferSuccessMessage', 'Your order has been successfully placed. Please complete the bank transfer using the details above to finalize your purchase.')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Order Items */}
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {t('orders.items', 'Order Items')}
          </h2>
          {(!order.items || order.items.length === 0) ? (
            <div className="bg-gray-50 p-4 rounded-md mb-6">
              <p className="text-gray-600">
                {t('orders.noItems', 'No items found for this order.')}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('orders.product', 'Product')}
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('orders.price', 'Price')}
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('orders.quantity', 'Qty')}
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('orders.subtotal', 'Subtotal')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {order.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.product_name}</div>
                        <div className="text-sm text-gray-500">{item.package_description}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.price_per_unit.toFixed(2)} €
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {item.line_total.toFixed(2)} €
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  {/* Subtotal row */}
                  <tr className="bg-gray-50">
                    <td colSpan={3} className="px-4 py-2 text-right text-sm font-medium text-gray-500">
                      {t('cart.subtotal', 'Vmesni seštevek')}:
                    </td>
                    <td className="px-4 py-2 text-right text-sm text-gray-900">
                      {order.items.reduce((sum, item) => sum + item.line_total, 0).toFixed(2)} €
                    </td>
                  </tr>

                  {/* Discount row - show if discount was applied */}
                  {order.discount_amount && order.discount_amount > 0 && (
                    <tr className="bg-green-50">
                      <td colSpan={3} className="px-4 py-2 text-right text-sm font-medium text-green-600">
                        {t('checkout.discountLabel', 'Popust')}:
                      </td>
                      <td className="px-4 py-2 text-right text-sm text-green-600 font-medium">
                        -€{order.discount_amount.toFixed(2)}
                      </td>
                    </tr>
                  )}

                  {/* Shipping cost row - extract from notes if available */}
                  {(() => {
                    // Try to extract shipping cost from notes
                    const shippingMatch = order.notes?.match(/\[(Shipping|Poštnina): €([0-9.]+)\]/);
                    const freeShippingMatch = order.notes?.match(/\[(Free Shipping|Brezplačna dostava)\]/);

                    if (shippingMatch && shippingMatch[2]) {
                      return (
                        <tr className="bg-gray-50">
                          <td colSpan={3} className="px-4 py-2 text-right text-sm font-medium text-gray-500">
                            {t('cart.shipping', 'Poštnina')}:
                          </td>
                          <td className="px-4 py-2 text-right text-sm text-gray-900">
                            {shippingMatch[2]} €
                          </td>
                        </tr>
                      );
                    } else if (freeShippingMatch) {
                      return (
                        <tr className="bg-gray-50">
                          <td colSpan={3} className="px-4 py-2 text-right text-sm font-medium text-gray-500">
                            {t('cart.shipping', 'Poštnina')}:
                          </td>
                          <td className="px-4 py-2 text-right text-sm text-gray-900">
                            {t('cart.free', 'Brezplačno')}
                          </td>
                        </tr>
                      );
                    }

                    // If shipping info not found in notes, don't show a shipping row
                    return null;
                  })()}

                  {/* Total row */}
                  <tr className="bg-gray-50 border-t border-gray-200">
                    <td colSpan={3} className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                      {t('orders.totalAmount', 'Skupni znesek')}:
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                      {order.total_price.toFixed(2)} €
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Notes */}
          {(() => {
            // Clean customer notes by removing system-generated brackets
            const cleanNotes = order.notes?.replace(
              /\[(Subtotal|Vmesna vsota): €[0-9.]+\]|\[(Shipping|Poštnina): €[0-9.]+\]|\[(Free Shipping|Brezplačna dostava)\]|\[Gift Option ID: [^\]]+\]|\[Gift Message: [^\]]+\]|\[GIFT_ADDRESS_JSON: [^\]]+\]|\[Stripe Payment ID: [^\]]+\]/g,
              ''
            ).trim();

            return cleanNotes && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">
                  {t('orders.notes', 'Your Notes')}
                </h2>
                <p className="text-gray-600 bg-gray-50 p-4 rounded-md">
                  {cleanNotes}
                </p>
              </div>
            );
          })()}

          {/* Shipping Information */}
          <div className="mt-8 bg-blue-50 p-4 rounded-lg border border-blue-100">
            <div className="flex items-start">
              <Truck className="w-5 h-5 text-blue-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-800 mb-1">
                  {t('checkout.shippingInformation', 'Shipping Information')}
                </h3>
                <p className="text-blue-700 text-sm">
                  {t('checkout.shippingEstimate', 'Your order will be processed within 1-2 business days. Estimated delivery time is 3-5 business days.')}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-wrap gap-4">
            <button
              onClick={() => navigate('/#izdelki')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brown-600 hover:bg-brown-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brown-500"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('orders.continueShopping', 'Continue Shopping')}
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center px-4 py-2 border border-brown-600 rounded-md shadow-sm text-sm font-medium text-brown-600 bg-white hover:bg-brown-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brown-500"
            >
              <Printer className="w-4 h-4 mr-2" />
              {t('orders.print', 'Print Order')}
            </button>

            {/* Email confirmation button - DISABLED to prevent duplicate emails */}
            <button
              disabled={true}
              className="inline-flex items-center px-4 py-2 border border-green-600 text-green-600 bg-green-50 cursor-default rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Mail className="w-4 h-4 mr-2" />
              {t('orders.emailSent', 'Email Sent')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
