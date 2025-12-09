import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { formatCurrency } from '../utils/formatters';
import AdminNavigation from '../components/AdminNavigation';
import { decryptObject, isEncrypted } from '../utils/encryption';
import { isAdminEmail } from '../config/adminConfig';
import { getOrderDisplayNumber } from '../utils/helpers';

interface OrderItem {
  product_id: string;
  product_name: string;
  package_option_id?: string;
  package_description?: string;
  quantity: number;
  price_per_unit: number;
  line_total: number;
  is_gift?: boolean;
  gift_details?: string;
}

interface ShippingAddress {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phone?: string;
  email?: string;
}

interface Order {
  id: string;
  order_number?: number;
  created_at: string;
  status: string;
  total_price: string;
  payment_method: string;
  items: OrderItem[];
  shipping_address: ShippingAddress;
  notes?: string;
  user_id: string;
  profile_id: string;
  is_guest_order: boolean;
  gift_product_id?: string;
  gift_product_package_id?: string;
  gift_product_cost?: number;
  gift_option_id?: string;
  gift_message?: string;
  discount_amount?: number;
  discount_code_id?: string;
}

// Define the exact status values that are allowed by the database constraint
type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'canceled';

export function AdminOrdersPage() {
  const { t, i18n } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check if user is admin - this is now redundant since SecureAdminRoute already checks
  // But we'll keep it for backward compatibility
  const isAdmin = user && isAdminEmail(user.email);

  // Log admin status for debugging
  console.log('AdminOrdersPage - isAdmin:', isAdmin, 'email:', user?.email);

  useEffect(() => {
    // No need to redirect here as SecureAdminRoute handles this
    // Just fetch orders if we have a user
    if (user) {
      fetchOrders();
    }
  }, [user, statusFilter]);

  // Log all status values when component mounts
  useEffect(() => {
    if (user && isAdmin) {
      logAllStatuses();
    }
  }, [user]);

  // Function to log all unique statuses in the database
  const logAllStatuses = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('status');

      if (error) {
        console.error('Error fetching statuses:', error);
        return;
      }

      if (data) {
        // Get unique status values
        const uniqueStatuses = [...new Set(data.map(order => order.status))];
        console.log('All unique status values in database:', uniqueStatuses);
      }
    } catch (err) {
      console.error('Error in logAllStatuses:', err);
    }
  };

  const fetchOrders = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Build query with explicit column selection to ensure we get all gift-related and discount fields
      let query = supabase
        .from('orders')
        .select(`
          id, order_number, created_at, status, total_price, payment_method, items, shipping_address,
          notes, user_id, profile_id, is_guest_order,
          gift_product_id, gift_product_package_id, gift_product_cost,
          gift_option_id, gift_message, discount_amount, discount_code_id
        `)
        .order('created_at', { ascending: false });

      // Apply status filter if not 'all'
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data: ordersData, error: ordersError } = await query;

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        setError(t('admin.orderManagement.errorUpdating', 'Error updating order status'));
        return;
      }

      // Process orders data
      const processedOrders = await Promise.all(ordersData.map(async (order) => {
        // Parse items JSON
        let parsedItems: OrderItem[] = [];
        try {
          parsedItems = typeof order.items === 'string'
            ? JSON.parse(order.items)
            : order.items || [];
        } catch (err) {
          console.error('Error parsing order items:', err);
        }

        // Parse shipping address JSON
        let parsedShippingAddress: ShippingAddress = {
          name: '',
          address: '',
          city: '',
          postalCode: '',
          country: 'Slovenija'
        };

        try {
          // First parse the JSON string
          parsedShippingAddress = typeof order.shipping_address === 'string'
            ? JSON.parse(order.shipping_address)
            : order.shipping_address || parsedShippingAddress;

          // Always attempt to decrypt all potentially encrypted fields
          const fieldsToDecrypt = ['name', 'address', 'phone', 'email'];

          // Log the shipping address before decryption (for debugging)
          console.log(`Admin - Order ${order.id} shipping address before decryption:`, {
            name: parsedShippingAddress.name?.substring(0, 20) + (parsedShippingAddress.name?.length > 20 ? '...' : ''),
            address: parsedShippingAddress.address?.substring(0, 20) + (parsedShippingAddress.address?.length > 20 ? '...' : ''),
            phone: parsedShippingAddress.phone?.substring(0, 20) + (parsedShippingAddress.phone?.length > 20 ? '...' : '')
          });

          // Decrypt fields
          parsedShippingAddress = await decryptObject(
            parsedShippingAddress,
            fieldsToDecrypt
          );

          // Log the shipping address after decryption (for debugging)
          console.log(`Admin - Order ${order.id} shipping address after decryption:`, {
            name: parsedShippingAddress.name,
            address: parsedShippingAddress.address,
            phone: parsedShippingAddress.phone
          });
        } catch (err) {
          console.error('Error processing shipping address:', err);
        }

        // Fetch product translations for all items
        const itemsWithTranslations = await Promise.all(parsedItems.map(async (item) => {
          try {
            // Fetch product details to get translations
            const { data: productData, error: productError } = await supabase
              .from('products')
              .select('name, name_en, name_de, name_hr')
              .eq('id', item.product_id)
              .single();

            if (productError) {
              console.error(`Error fetching product ${item.product_id}:`, productError);
              return item;
            }

            // Get translated product name based on current language
            const getTranslatedName = () => {
              if (!productData) return item.product_name;

              switch (i18n.language) {
                case 'en':
                  return productData.name_en || productData.name || item.product_name;
                case 'de':
                  return productData.name_de || productData.name || item.product_name;
                case 'hr':
                  return productData.name_hr || productData.name || item.product_name;
                case 'sl':
                default:
                  return productData.name || item.product_name;
              }
            };

            return {
              ...item,
              translated_product_name: getTranslatedName()
            };
          } catch (err) {
            console.error(`Error processing product ${item.product_id}:`, err);
            return item;
          }
        }));

        return {
          ...order,
          items: itemsWithTranslations,
          shipping_address: parsedShippingAddress
        };
      }));

      setOrders(processedOrders);
    } catch (err) {
      console.error('Exception fetching orders:', err);
      setError(t('admin.orderManagement.errorUpdating', 'Error updating order status'));
    } finally {
      setLoading(false);
    }
  };

  const toggleOrderDetails = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    if (!user) {
      console.log('User not logged in, aborting update');
      return;
    }

    try {
      console.log(`Starting update process for order ${orderId} to status ${newStatus}`);
      setUpdatingOrderId(orderId);
      setError(null);
      setSuccessMessage(null);

      // Get the current order to see its status
      const { data: currentOrder, error: fetchError } = await supabase
        .from('orders')
        .select('status')
        .eq('id', orderId)
        .single();

      if (fetchError) {
        console.error('Error fetching current order:', fetchError);
      } else {
        console.log('Current order status:', currentOrder?.status);
      }

      // Use the exact status values that are allowed by the database constraint
      const dbStatus = newStatus;

      console.log('Updating order status:', { orderId, uiStatus: newStatus, dbStatusToSend: dbStatus });

      // Log the exact data being sent to the database
      console.log('Sending to database:', { table: 'orders', id: orderId, newStatus: dbStatus });

      // Use the client to update the order status
      const { error } = await supabase
        .from('orders')
        .update({ status: dbStatus })
        .eq('id', orderId);

      if (error) {
        console.error('Error updating order status:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });

        // Try to get the current order status from the database to compare
        const { data: currentOrderAfterError } = await supabase
          .from('orders')
          .select('status')
          .eq('id', orderId)
          .single();

        console.log('Current status after error:', currentOrderAfterError?.status);
        console.log('Attempted to update to:', dbStatus);

        setError(`Error updating order status: ${error.message}`);
        // Also show the original error message for debugging
        console.error('Full error object:', JSON.stringify(error));
      } else {
        setSuccessMessage(t('admin.orderManagement.orderUpdated', 'Order status updated successfully'));

        // Update local state
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order.id === orderId
              ? { ...order, status: newStatus }
              : order
          )
        );

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      }
    } catch (err) {
      console.error('Exception updating order status:', err);
      setError(t('admin.orders.updateError', 'Failed to update order status'));
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-green-100 text-green-800';
      case 'delivered':
        return 'bg-green-200 text-green-900';
      case 'canceled': // American spelling used in database
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(i18n.language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusTranslation = (status: string) => {
    const statusKey = `admin.orderManagement.${status.toLowerCase()}`;
    return t(statusKey, status); // Fallback to the original status if translation not found
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // Redirect if not admin
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">{t('admin.orderManagement.title', 'Order Management')}</h1>

          {/* Status filter */}
          <div className="flex items-center space-x-2">
            <label htmlFor="statusFilter" className="text-sm font-medium text-gray-700">
              {t('admin.orderManagement.filterByStatus', 'Filter by status:')}
            </label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
            >
              <option value="all">{t('admin.orderManagement.allStatuses', 'All Statuses')}</option>
              <option value="pending">{t('orders.statuses.pending', 'Pending')}</option>
              <option value="processing">{t('orders.statuses.processing', 'Processing')}</option>
              <option value="shipped">{t('orders.statuses.shipped', 'Shipped')}</option>
              <option value="delivered">{t('orders.statuses.delivered', 'Delivered')}</option>
              <option value="canceled">{t('orders.statuses.cancelled', 'Cancelled')}</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
            {successMessage}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <h2 className="text-xl font-medium mb-2">
              {statusFilter === 'all'
                ? t('orders.empty', 'No Orders Found')
                : t('orders.empty', 'No Orders with {{status}} Status', { status: getStatusTranslation(statusFilter) })}
            </h2>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div
                  className="p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleOrderDetails(order.id)}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-gray-500">
                          {t('orders.orderNumber', 'Order')} #{getOrderDisplayNumber(order)}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(order.status)}`}>
                          {getStatusTranslation(order.status)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">{formatDate(order.created_at)}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {order.shipping_address.name} • {order.shipping_address.email}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(parseFloat(order.total_price))}</div>
                        <div className="text-sm text-gray-600">{order.items.length} {t('orders.items', 'items')}</div>
                      </div>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-5 w-5 text-gray-400 transition-transform ${expandedOrderId === order.id ? 'transform rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {expandedOrderId === order.id && (
                  <div className="p-4 bg-gray-50">
                    {/* Order Actions */}
                    <div className="mb-6 bg-white p-4 rounded-md shadow-sm">
                      <h3 className="font-medium mb-3">{t('admin.orderManagement.updateOrderStatus', 'Update Order Status')}</h3>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => {
                            console.log('Clicked Pending button');
                            updateOrderStatus(order.id, 'pending');
                          }}
                          disabled={order.status === 'pending' || updatingOrderId === order.id}
                          className={`px-3 py-1 rounded-md text-sm font-medium ${
                            order.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800 cursor-default'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {t('admin.orderManagement.pending', 'V čakanju')}
                        </button>
                        <button
                          onClick={() => {
                            console.log('Clicked Processing button');
                            updateOrderStatus(order.id, 'processing');
                          }}
                          disabled={order.status === 'processing' || updatingOrderId === order.id}
                          className={`px-3 py-1 rounded-md text-sm font-medium ${
                            order.status === 'processing'
                              ? 'bg-blue-100 text-blue-800 cursor-default'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {t('admin.orderManagement.processing', 'V obdelavi')}
                        </button>
                        <button
                          onClick={() => {
                            console.log('Clicked Shipped button');
                            updateOrderStatus(order.id, 'shipped');
                          }}
                          disabled={order.status === 'shipped' || updatingOrderId === order.id}
                          className={`px-3 py-1 rounded-md text-sm font-medium ${
                            order.status === 'shipped'
                              ? 'bg-green-100 text-green-800 cursor-default'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {t('admin.orderManagement.shipped', 'Poslano')}
                        </button>
                        <button
                          onClick={() => {
                            console.log('Clicked Delivered button');
                            // Ensure exact string match with database
                            updateOrderStatus(order.id, 'delivered');
                          }}
                          disabled={order.status === 'delivered' || updatingOrderId === order.id}
                          className={`px-3 py-1 rounded-md text-sm font-medium ${
                            order.status === 'delivered'
                              ? 'bg-green-200 text-green-900 cursor-default'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {t('admin.orderManagement.delivered', 'Dostavljeno')}
                        </button>
                        <button
                          onClick={() => {
                            console.log('Clicked Canceled button');
                            // Use 'canceled' (American spelling) as required by the database constraint
                            updateOrderStatus(order.id, 'canceled');
                          }}
                          disabled={order.status === 'canceled' || updatingOrderId === order.id}
                          className={`px-3 py-1 rounded-md text-sm font-medium ${
                            order.status === 'canceled'
                              ? 'bg-red-100 text-red-800 cursor-default'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {t('admin.orderManagement.canceled', 'Preklicano')}
                        </button>
                      </div>
                      {updatingOrderId === order.id && (
                        <div className="mt-2 text-sm text-gray-600 flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {t('common.updating', 'Updating...')}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-medium mb-2">{t('orders.shippingInfo', 'Shipping Information')}</h3>
                        <div className="bg-white p-3 rounded-md shadow-sm">
                          <div className="text-sm text-gray-600">
                            <p className="font-medium">{order.shipping_address.name}</p>
                            <p>{order.shipping_address.address}</p>
                            <p>{order.shipping_address.postalCode} {order.shipping_address.city}</p>
                            <p>{order.shipping_address.country}</p>
                            {order.shipping_address.phone && <p className="mt-1">{t('admin.orderManagement.phone', 'Telefon')}: {order.shipping_address.phone}</p>}
                            {order.shipping_address.email && <p>{t('admin.orderManagement.email', 'E-pošta')}: {order.shipping_address.email}</p>}
                          </div>
                        </div>

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
                                    <div className="mt-4">
                                      <h3 className="font-medium mb-2 text-amber-700">
                                        <span className="flex items-center">
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a4 4 0 118 0v7M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
                                          </svg>
                                          {t('admin.orderManagement.giftRecipientAddress', 'Gift Recipient Address')}
                                        </span>
                                      </h3>
                                      <div className="bg-amber-50 p-3 rounded-md shadow-sm border border-amber-200">
                                        <div className="text-sm text-amber-800">
                                          <p className="font-medium">{giftAddressData.data.name}</p>
                                          <p>{giftAddressData.data.address}</p>
                                          <p>{giftAddressData.data.postalCode} {giftAddressData.data.city}</p>
                                          <p>{giftAddressData.data.country}</p>
                                        </div>
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
                              <div className="mt-4">
                                <h3 className="font-medium mb-2 text-amber-700">
                                  <span className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a4 4 0 118 0v7M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
                                    </svg>
                                    {t('admin.orderManagement.giftRecipientAddress', 'Gift Recipient Address')}
                                  </span>
                                </h3>
                                <div className="bg-amber-50 p-3 rounded-md shadow-sm border border-amber-200">
                                  <div className="text-sm text-amber-800">
                                    <p className="italic">{t('admin.orderManagement.giftAddressInNotes', 'Gift recipient address information is included in the order notes below.')}</p>
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          return null;
                        })()}

                        <h3 className="font-medium mb-2 mt-4">{t('orders.paymentMethod', 'Payment Method')}</h3>
                        <div className="bg-white p-3 rounded-md shadow-sm">
                          <div className="text-sm text-gray-600">
                            {order.payment_method === 'pay_on_delivery' || order.payment_method === 'cod' || order.payment_method === 'cash_on_delivery'
                              ? t('orders.paymentMethods.cash_on_delivery', 'Plačilo po povzetju')
                              : order.payment_method === 'bank_transfer'
                              ? t('orders.paymentMethods.bank_transfer', 'Bančno nakazilo')
                              : order.payment_method}
                          </div>
                        </div>

                        {(() => {
                          // Clean customer notes by removing system-generated brackets
                          const cleanNotes = order.notes?.replace(
                            /\[(Subtotal|Vmesna vsota): €[0-9.]+\]|\[(Shipping|Poštnina): €[0-9.]+\]|\[(Free Shipping|Brezplačna dostava)\]|\[Gift Option ID: [^\]]+\]|\[Gift Message: [^\]]+\]|\[GIFT_ADDRESS_JSON: [^\]]+\]|\[Stripe Payment ID: [^\]]+\]/g,
                            ''
                          ).trim();

                          return cleanNotes && (
                            <>
                              <h3 className="font-medium mb-2 mt-4">{t('orders.notes', 'Customer Notes')}</h3>
                              <div className="bg-white p-3 rounded-md shadow-sm">
                                <div className="text-sm text-gray-600">
                                  {cleanNotes}
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>

                      <div>
                        <h3 className="font-medium mb-2">{t('orders.orderItems', 'Order Items')}</h3>
                        <div className="bg-white rounded-md shadow-sm overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t('orders.product', 'Product')}
                                  </th>
                                  <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t('orders.price', 'Price')}
                                  </th>
                                  <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t('orders.quantity', 'Qty')}
                                  </th>
                                  <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t('orders.total', 'Total')}
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {order.items.map((item, index) => (
                                  <tr key={`${order.id}-item-${index}`} className={item.is_gift ? "bg-amber-50" : ""}>
                                    <td className="px-4 py-2 text-sm text-gray-900">
                                      <div className="flex items-start">
                                        {item.is_gift && (
                                          <span className="inline-flex items-center justify-center bg-amber-500 text-white rounded-full h-5 w-5 mr-2 flex-shrink-0 mt-0.5">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                              <path fillRule="evenodd" d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v1H4a2 2 0 110-4h1.17A3 3 0 015 5zm4 1V5a1 1 0 10-1 1h1zm3 0a1 1 0 10-1-1v1h1z" clipRule="evenodd" />
                                              <path d="M9 11H3v5a2 2 0 002 2h4v-7zm2 7h4a2 2 0 002-2v-5h-6v7z" />
                                            </svg>
                                          </span>
                                        )}
                                        <div>
                                          <div className={`font-medium ${item.is_gift ? "text-amber-700" : ""}`}>
                                            {item.translated_product_name || item.product_name}
                                          </div>
                                          {item.package_description && (
                                            <div className={`text-xs mt-1 ${item.is_gift ? "text-amber-600" : "text-gray-500"} whitespace-pre-line`}>
                                              {item.package_description}
                                            </div>
                                          )}
                                          {item.is_gift && item.gift_details && (
                                            <div className="mt-2">
                                              <details className="text-xs">
                                                <summary className="cursor-pointer font-medium text-amber-700 hover:text-amber-800">
                                                  {t('admin.orderManagement.viewGiftContents', 'View Gift Contents')}
                                                </summary>
                                                <div className="mt-2 p-2 bg-amber-50 border border-amber-100 rounded">
                                                  {(() => {
                                                    try {
                                                      const giftDetails = JSON.parse(item.gift_details);
                                                      return (
                                                        <div>
                                                          {giftDetails.gift_products && giftDetails.gift_products.length > 0 ? (
                                                            <div>
                                                              <div className="font-medium mb-1">{t('admin.orderManagement.giftContents', 'Gift Contents')}:</div>
                                                              <ul className="list-disc pl-4 space-y-1">
                                                                {giftDetails.gift_products.map((product: any, idx: number) => (
                                                                  <li key={idx} className="text-amber-800">
                                                                    <span className="font-medium">{product.name}</span>
                                                                    <span className="text-amber-600"> × {product.quantity}</span>
                                                                  </li>
                                                                ))}
                                                              </ul>
                                                            </div>
                                                          ) : (
                                                            <div className="text-amber-700">{t('admin.orderManagement.noProducts', 'No products in gift')}</div>
                                                          )}

                                                          {giftDetails.recipient_name && (
                                                            <div className="mt-2">
                                                              <span className="font-medium">{t('admin.orderManagement.recipient', 'Recipient')}:</span> {giftDetails.recipient_name}
                                                            </div>
                                                          )}

                                                          {giftDetails.recipient_message && (
                                                            <div className="mt-1">
                                                              <span className="font-medium">{t('admin.orderManagement.message', 'Message')}:</span> {giftDetails.recipient_message}
                                                            </div>
                                                          )}
                                                        </div>
                                                      );
                                                    } catch (e) {
                                                      console.error("Failed to parse gift details", e);
                                                      return <div className="text-red-500">{t('admin.orderManagement.errorParsingGiftDetails', 'Error parsing gift details')}</div>;
                                                    }
                                                  })()}
                                                </div>
                                              </details>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                                      {formatCurrency(item.price_per_unit)}
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                                      {item.quantity}
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                                      {formatCurrency(item.line_total)}
                                    </td>
                                  </tr>
                                ))}
                                {/* Show discount information if available */}
                                {order.discount_code_id && order.discount_amount && order.discount_amount > 0 && (
                                  <tr className="bg-green-50">
                                    <td colSpan={3} className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                                      <div className="flex items-center justify-end">
                                        <svg className="w-4 h-4 text-green-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                        </svg>
                                        <span className="font-medium text-green-800">
                                          {t('orders.discount', 'Discount')} ({order.discount_code_id})
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-green-800 text-right">
                                      -{formatCurrency(order.discount_amount)}
                                    </td>
                                  </tr>
                                )}
                                <tr className="bg-gray-50">
                                  <td colSpan={3} className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                                    {t('orders.totalAmount', 'Total Amount')}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                    {formatCurrency(parseFloat(order.total_price))}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
