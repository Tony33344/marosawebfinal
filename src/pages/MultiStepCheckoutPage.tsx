import React, { useState, useEffect, useCallback } from 'react';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { Product, PackageOption } from '../types';
import { CheckoutDisplayItem, CheckoutStep, AuthSubState, Discount } from '../types/checkout';
import { SHIPPING, PAYMENT_METHODS } from '../config/appConfig';

// Components
import { CheckoutStepIndicator } from '../components/checkout/CheckoutStepIndicator';
import { CheckoutSummary } from '../components/checkout/CheckoutSummary';
import { CheckoutForm } from '../components/checkout/CheckoutForm';
import { PaymentMethodSelector } from '../components/checkout/PaymentMethodSelector';
import { DiscountCodeInput } from '../components/DiscountCodeInput';
import { StripePaymentForm } from '../components/StripePaymentForm';
import { ShippingCostNotification } from '../components/ShippingCostNotification';

// Utility functions
import { useErrorHandler } from '../utils/errorMonitoring';
import { validateCheckoutData } from '../utils/slovenianValidation';

/**
 * MultiStepCheckoutPage - A two-step checkout process that maintains the same design and functionality
 */
export const MultiStepCheckoutPage: React.FC = () => {
  const { cart, gifts, clearCart } = useCart();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, session, loading: authLoading, signInWithPassword, signUp, checkEmailExists, signOut } = useAuth();
  const errorHandler = useErrorHandler({ source: 'MultiStepCheckoutPage' });

  // State for cart items and loading
  const [cartItemsDetails, setCartItemsDetails] = useState<CheckoutDisplayItem[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [loadingUserProfile, setLoadingUserProfile] = useState(false);
  const [userProfileFetched, setUserProfileFetched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Error states
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [authError, setAuthError] = useState<string | null>(null);

  // Check URL parameters for step
  const searchParams = new URLSearchParams(location.search);
  const stepParam = searchParams.get('step');

  // Checkout flow states - Start with selection step if specified in URL or guest_form by default
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>(
    stepParam === 'selection' ? 'selection' : 'guest_form'
  );
  const [authSubState, setAuthSubState] = useState<AuthSubState>('loggedIn');

  // Multi-step checkout state
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 2;

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Slovenija',
    notes: '',
    password: '',
    confirmPassword: '',
  });

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHODS.bankTransfer);
  const [stripeError, setStripeError] = useState<string | null>(null);

  // Discount states
  const [appliedDiscount, setAppliedDiscount] = useState<Discount | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Gift options
  const [giftOptionId, setGiftOptionId] = useState<number | null>(null);
  const [giftOptionCost, setGiftOptionCost] = useState(0);
  const [giftProductId, setGiftProductId] = useState<string | null>(null);
  const [giftProductPackageId, setGiftProductPackageId] = useState<string | null>(null);
  const [giftProductCost, setGiftProductCost] = useState(0);

  // Email verification
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Fetch cart item details
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (cart.length === 0 && gifts.length === 0) {
        setCartItemsDetails([]);
        setLoadingDetails(false);
        return;
      }

      try {
        // Fetch product details for cart items
        const productIds = cart.map(item => item.productId);
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .in('id', productIds);

        if (productsError) {
          throw productsError;
        }

        // Map cart items to display items with full product details
        const displayItems: CheckoutDisplayItem[] = cart.map(cartItem => {
          const product = productsData.find(p => p.id === cartItem.productId);
          if (!product) {
            console.error(`Product not found for ID: ${cartItem.productId}`);
            return null;
          }

          // Find the selected package option
          const packageOptions = typeof product.package_options === 'string'
            ? JSON.parse(product.package_options)
            : product.package_options;

          const packageOption = packageOptions.find((opt: PackageOption) =>
            opt.uniq_id === cartItem.packageOptionId
          );

          if (!packageOption) {
            console.error(`Package option not found for ID: ${cartItem.packageOptionId}`);
            return null;
          }

          return {
            ...product,
            packageOption,
            quantity: cartItem.quantity
          };
        }).filter(Boolean) as CheckoutDisplayItem[];

        // Add gift items if any
        if (gifts.length > 0) {
          console.log('Processing gift items:', gifts);

          // Convert gift items to display items
          const giftDisplayItems = gifts.map(gift => {
            return {
              id: gift.id,
              name: gift.name,
              name_en: gift.name,
              name_de: gift.name,
              name_hr: gift.name,
              description: gift.recipient_message || '',
              description_en: gift.recipient_message || '',
              description_de: gift.recipient_message || '',
              description_hr: gift.recipient_message || '',
              image_url: gift.image_url || '',
              stock_quantity: 1,
              category: 'gift',
              packageOption: {
                uniq_id: gift.id,
                price: gift.price,
                weight: 0,
                description: t('checkout.giftPackage', 'Darilni paket'),
                description_en: 'Gift Package',
                description_de: 'Geschenkpaket',
                description_hr: 'Poklon paket'
              },
              quantity: gift.quantity,
              isGift: true,
              giftDetails: gift
            } as CheckoutDisplayItem;
          });

          // Add gift items to display items
          displayItems.push(...giftDisplayItems);
        }

        setCartItemsDetails(displayItems);
        setLoadingDetails(false);
      } catch (err) {
        console.error('Error fetching product details:', err);
        setError(t('checkout.errors.loadingProducts', 'Error loading product details. Please try again.'));
        setLoadingDetails(false);
      }
    };

    fetchProductDetails();
  }, [cart, gifts, t]);

  // Calculate subtotal
  const calculateSubtotal = useCallback(() => {
    return cartItemsDetails.reduce((total, item) => {
      return total + (item.packageOption.price * item.quantity);
    }, 0);
  }, [cartItemsDetails]);

  const subtotal = calculateSubtotal();

  // Calculate subtotal after discount
  const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);

  // Calculate if shipping is free
  const hasShippingFee = subtotalAfterDiscount < SHIPPING.freeThreshold;
  const shippingCost = hasShippingFee ? SHIPPING.cost : 0;

  // Calculate total with shipping, discount, gift option, and gift product
  const total = subtotalAfterDiscount + shippingCost + giftOptionCost + giftProductCost;

  // Handle form input changes
  const handleInputChange = (nameOrEvent: string | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, valueParam?: string) => {
    let name: string;
    let value: string;

    if (typeof nameOrEvent === 'string') {
      name = nameOrEvent;
      value = valueParam || '';
    } else {
      name = nameOrEvent.target.name;
      value = nameOrEvent.target.value;
    }

    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear errors when user is typing
    setError(null);
    setAuthError(null);
  };

  // Handle payment method change
  const handlePaymentMethodChange = (method: string) => {
    setPaymentMethod(method);
    setStripeError(null);
  };

  // Handle email blur to check if email exists
  const handleEmailBlur = async () => {
    const email = formData.email.trim();
    if (!email || checkingEmail) return;

    try {
      setCheckingEmail(true);
      const exists = await checkEmailExists(email);
      setEmailExists(exists);
    } catch (err) {
      console.error('Error checking email:', err);
      errorHandler.captureError(err, { context: 'handleEmailBlur' });
    } finally {
      setCheckingEmail(false);
    }
  };

  // Handle checkout step selection
  const handleCheckoutSelection = (step: CheckoutStep) => {
    setCheckoutStep(step);
    setAuthSubState('initial');
    setError(null);
    setAuthError(null);
  };

  // Handle next step
  const handleNextStep = () => {
    // Validate first step
    if (currentStep === 1) {
      // Clear previous errors
      setFieldErrors({});
      setError(null);

      // Basic validation for first step
      const newFieldErrors: Record<string, string> = {};

      if (!formData.name) {
        newFieldErrors.name = t('checkout.errors.nameRequired', 'Ime je obvezno');
      }
      if (!formData.email) {
        newFieldErrors.email = t('checkout.errors.emailRequired', 'E-pošta je obvezna');
      }
      if (!formData.phone) {
        newFieldErrors.phone = t('checkout.errors.phoneRequired', 'Telefon je obvezen');
      }
      if (!formData.address) {
        newFieldErrors.address = t('checkout.errors.addressRequired', 'Naslov je obvezen');
      }
      if (!formData.city) {
        newFieldErrors.city = t('checkout.errors.cityRequired', 'Mesto je obvezno');
      }
      if (!formData.postalCode) {
        newFieldErrors.postalCode = t('checkout.errors.postalCodeRequired', 'Poštna številka je obvezna');
      }

      // Country-aware validation (Slovenian rules only for Slovenija)
      const dataValidation = validateCheckoutData({
        name: formData.name,
        postalCode: formData.postalCode,
        phone: formData.phone,
        city: formData.city,
        address: formData.address,
        country: formData.country
      });

      if (dataValidation.errors.name) {
        newFieldErrors.name = dataValidation.errors.name;
      }
      if (dataValidation.errors.phone) {
        newFieldErrors.phone = dataValidation.errors.phone;
      }
      if (dataValidation.errors.postalCode) {
        newFieldErrors.postalCode = dataValidation.errors.postalCode;
      }
      if (dataValidation.errors.address) {
        newFieldErrors.address = dataValidation.errors.address;
      }
      if (dataValidation.errors.city) {
        newFieldErrors.city = dataValidation.errors.city;
      }

      // If there are field errors, set them and return
      if (Object.keys(newFieldErrors).length > 0) {
        setFieldErrors(newFieldErrors);
        return;
      }
    }

    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  };

  // Handle previous step
  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Create the order server-side. All pricing is recomputed in the
  // create-order edge function — the client never sends prices.
  const submitOrder = async (): Promise<{ orderId: string; orderNumber: number; totalPrice: number }> => {
    const { data, error } = await supabase.functions.invoke('create-order', {
      body: {
        customer: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          postalCode: formData.postalCode,
          country: formData.country,
          notes: formData.notes,
        },
        items: cart.map(item => ({
          productId: item.productId,
          packageOptionId: item.packageOptionId,
          quantity: item.quantity,
        })),
        gifts,
        discountCode: appliedDiscount?.code ?? null,
        paymentMethod,
        giftOptionId,
        giftProduct: giftProductId && giftProductPackageId
          ? { productId: giftProductId, packageOptionId: giftProductPackageId }
          : null,
        lang: i18n.language,
      },
    });

    if (error) {
      // FunctionsHttpError wraps non-2xx responses; extract the real message
      const detail = (error as any)?.context?.error || error.message;
      throw new Error(typeof detail === 'string' ? detail : 'Order creation failed');
    }
    if (!data?.orderId) throw new Error('Order creation returned no data');
    return data;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    // Clear previous errors
    setFieldErrors({});
    setError(null);

    // Validate form with individual field errors
    const newFieldErrors: Record<string, string> = {};

    if (!formData.name) {
      newFieldErrors.name = t('checkout.errors.nameRequired', 'Ime je obvezno');
    }
    if (!formData.email) {
      newFieldErrors.email = t('checkout.errors.emailRequired', 'E-pošta je obvezna');
    }
    if (!formData.phone) {
      newFieldErrors.phone = t('checkout.errors.phoneRequired', 'Telefon je obvezen');
    }
    if (!formData.address) {
      newFieldErrors.address = t('checkout.errors.addressRequired', 'Naslov je obvezen');
    }
    if (!formData.city) {
      newFieldErrors.city = t('checkout.errors.cityRequired', 'Mesto je obvezno');
    }
    if (!formData.postalCode) {
      newFieldErrors.postalCode = t('checkout.errors.postalCodeRequired', 'Poštna številka je obvezna');
    }

    // Country-aware validation (Slovenian rules only for Slovenija)
    const dataValidation = validateCheckoutData({
      name: formData.name,
      postalCode: formData.postalCode,
      phone: formData.phone,
      city: formData.city,
      address: formData.address,
      country: formData.country
    });

    if (dataValidation.errors.name) {
      newFieldErrors.name = dataValidation.errors.name;
    }
    if (dataValidation.errors.phone) {
      newFieldErrors.phone = dataValidation.errors.phone;
    }
    if (dataValidation.errors.postalCode) {
      newFieldErrors.postalCode = dataValidation.errors.postalCode;
    }
    if (dataValidation.errors.address) {
      newFieldErrors.address = dataValidation.errors.address;
    }
    if (dataValidation.errors.city) {
      newFieldErrors.city = dataValidation.errors.city;
    }

    // If there are field errors, set them and return
    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      setCurrentStep(1); // Go back to first step if there are errors
      return;
    }

    if (!paymentMethod) {
      setError(t('checkout.errors.selectPayment', 'Please select a payment method.'));
      setCurrentStep(2); // Ensure we're on the payment step
      return;
    }

    if (paymentMethod === PAYMENT_METHODS.creditCard) {
      // Card payments are completed via the "Pay Now" button which creates
      // the order first (createOrder) and then confirms the Stripe payment.
      return;
    }

    setIsSubmitting(true);

    try {
      const newOrder = await submitOrder();

      // Store order ID in session storage before navigation
      sessionStorage.setItem('lastSuccessfulOrder', newOrder.orderId);
      sessionStorage.setItem('clearCartAfterOrder', 'true');

      // Clear cart
      clearCart();

      // Navigate to success page with order ID
      const successUrl = `/order-success?order_id=${newOrder.orderId}&lang=${i18n.language}`;
      navigate(successUrl, { replace: true });
    } catch (err: any) {
      console.error('Error processing order:', err);
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        details: err.details,
        hint: err.hint,
        stack: err.stack
      });

      // Provide more specific error messages
      let errorMessage = t('checkout.errors.orderProcessing', 'An error occurred while processing your order. Please try again.');

      if (err.message?.includes('duplicate key')) {
        errorMessage = t('checkout.errors.duplicateOrder', 'This order has already been processed. Please check your email for confirmation.');
      } else if (err.message?.includes('permission denied') || err.code === 'PGRST301') {
        errorMessage = t('checkout.errors.permissionDenied', 'Permission denied. Please try again or contact support.');
      } else if (err.message?.includes('network') || err.message?.includes('fetch')) {
        errorMessage = t('checkout.errors.networkError', 'Network error. Please check your connection and try again.');
      } else if (err.message) {
        errorMessage = `${t('checkout.errors.orderProcessing', 'An error occurred while processing your order.')}: ${err.message}`;
      }

      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  // Effect to handle authentication state changes
  useEffect(() => {
    if (!authLoading) {
      if (user) {
        console.log('User is logged in, skipping selection step.');
        // Advance to the form step if user is logged in
        setCheckoutStep('auth_form');
        setAuthSubState('loggedIn'); // Indicate they are logged in within the auth form state
      } else {
        // If user is not logged in, show selection step
        setCheckoutStep('selection');
      }
    }
  }, [user, authLoading]); // Rerun when auth state changes



  // Fetch user profile data if logged in
  useEffect(() => {
    const fetchUserProfile = async () => {
      // Skip if already fetched or no user
      if (!user || userProfileFetched) {
        setLoadingUserProfile(false);
        return;
      }

      setLoadingUserProfile(true);

      // Safety timeout to prevent infinite loading
      const safetyTimeout = setTimeout(() => {
        setLoadingUserProfile(false);
        setUserProfileFetched(true);
        console.warn('User profile fetch timed out');
      }, 5000); // 5 seconds timeout

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
          return;
        }

        if (profile) {
          console.log('User profile loaded:', profile);

          // Parse the default_shipping_address JSON string
          let shippingAddress = {};
          try {
            if (profile.default_shipping_address) {
              shippingAddress = JSON.parse(profile.default_shipping_address);
            }
          } catch (err) {
            console.error('Error parsing shipping address:', err);
          }

          // Pre-fill form data with user profile information
          setFormData(prev => ({
            ...prev,
            name: profile.full_name || '',
            email: user.email || '',
            phone: profile.telephone_nr || '',
            address: shippingAddress.address || '',
            city: shippingAddress.city || '',
            postalCode: shippingAddress.postalCode || '',
            country: shippingAddress.country || 'Slovenija',
          }));
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
      } finally {
        clearTimeout(safetyTimeout);
        setLoadingUserProfile(false);
        setUserProfileFetched(true);
      }
    };

    fetchUserProfile();

    // Cleanup function
    return () => {
      // This will ensure any pending timeouts are cleared if the component unmounts
      setLoadingUserProfile(false);
    };
  }, [user, userProfileFetched]);

  // Render different content based on checkoutStep
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">{t('checkout.title', 'Blagajna')}</h1>

      {/* Step Indicator - Only show when on checkout form */}
      {(checkoutStep === 'guest_form' || (checkoutStep === 'auth_form' && authSubState === 'loggedIn')) && (
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                currentStep >= 1 ? 'border-brown-600 bg-brown-600 text-white' : 'border-gray-300 bg-white text-gray-300'
              }`}>
                {currentStep > 1 ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-sm font-semibold">1</span>
                )}
              </div>
              <span className={`mt-2 text-sm ${
                currentStep === 1 ? 'font-semibold text-brown-600' : 'text-brown-600'
              }`}>
                {t('checkout.steps.information', 'Podatki')}
              </span>
            </div>

            <div className={`flex-1 h-1 mx-2 ${currentStep > 1 ? 'bg-brown-600' : 'bg-gray-300'}`} />

            <div className="flex flex-col items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                currentStep === 2 ? 'border-brown-600 bg-brown-600 text-white' : 'border-gray-300 bg-white text-gray-300'
              }`}>
                <span className="text-sm font-semibold">2</span>
              </div>
              <span className={`mt-2 text-sm ${
                currentStep === 2 ? 'font-semibold text-brown-600' : 'text-gray-400'
              }`}>
                {t('checkout.steps.payment', 'Plačilo')}
              </span>
            </div>

            <div className="flex-1 h-1 mx-2 bg-gray-300" />

            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-gray-300 bg-white text-gray-300">
                <span className="text-sm font-semibold">3</span>
              </div>
              <span className="mt-2 text-sm text-gray-400">
                {t('checkout.steps.confirmation', 'Potrditev')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Empty Cart Message */}
      {cart.length === 0 && gifts.length === 0 && !loadingDetails && (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <p className="mb-4">{t('checkout.emptyCart', 'Vaša košarica je prazna.')}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-brown-600 text-white rounded-md hover:bg-brown-700 transition-colors"
          >
            {t('checkout.continueShopping', 'Nadaljuj z nakupovanjem')}
          </button>
        </div>
      )}

      {/* Main Checkout Content */}
      {(cart.length > 0 || gifts.length > 0 || loadingDetails) && (
        <>
          {/* Step 1: Checkout Method Selection */}
          {checkoutStep === 'selection' && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-6 text-center">{t('checkout.howToProceed', 'Kako želite nadaljevati?')}</h2>
              <div className="flex flex-col md:flex-row gap-4 justify-center">
                {/* Guest Checkout - Green Button */}
                <button
                  onClick={() => handleCheckoutSelection('guest_form')}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded text-lg"
                >
                  {t('checkout.continueAsGuest', 'Nadaljujte kot gost')}
                </button>

                {/* Registration - Blue Button */}
                <button
                  onClick={() => navigate(`/login?lang=${i18n.language}&mode=register&redirectTo=/checkout-steps`)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded text-lg"
                >
                  {t('checkout.register', 'Registracija')}
                </button>

                {/* Login - Gray Button */}
                <button
                  onClick={() => navigate(`/login?lang=${i18n.language}&redirectTo=/checkout-steps`)}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded text-lg"
                >
                  {t('checkout.login', 'Prijava')}
                </button>
              </div>
            </div>
          )}

          {/* Step 2 & 3: Form (Guest or Auth) */}
          {(checkoutStep === 'guest_form' || (checkoutStep === 'auth_form' && authSubState === 'loggedIn')) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Order Summary - Always visible on all steps */}
              <div className="order-last md:order-first">
                <CheckoutSummary
                  cartItems={cartItemsDetails}
                  loading={loadingDetails}
                  discountAmount={discountAmount}
                  discountCode={appliedDiscount?.code}
                  giftOptionCost={giftOptionCost}
                  giftOptionName={giftOptionId ? t('checkout.giftOption', 'Darilna embalaža') : ''}
                  giftProductCost={giftProductCost}
                  giftProductName={giftProductId ? t('checkout.giftProduct', 'Darilo') : ''}
                />
              </div>

              {/* Checkout Form */}
              <div>
                <form onSubmit={handleSubmit}>

                  {/* Step 1: Shipping Information */}
                  {currentStep === 1 && (
                    <>
                      {loadingUserProfile ? (
                        <div className="flex justify-center items-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brown-600"></div>
                          <span className="ml-2 text-brown-600">{t('checkout.loadingProfile', 'Nalaganje podatkov...')}</span>
                        </div>
                      ) : (
                        <CheckoutForm
                          formData={formData}
                          onChange={handleInputChange}
                          onEmailBlur={handleEmailBlur}
                          isSubmitting={isSubmitting}
                          error={error}
                          fieldErrors={fieldErrors}
                        />
                      )}

                      {/* Next Step Button */}
                      <div className="mt-8 border-t pt-6">
                        <button
                          type="button"
                          onClick={handleNextStep}
                          className="w-full py-3 px-4 bg-brown-600 text-white rounded-md hover:bg-brown-700 focus:outline-none focus:ring-2 focus:ring-brown-500 focus:ring-offset-2 transition-colors"
                        >
                          {t('checkout.nextStep', 'Nadaljuj na plačilo')}
                        </button>
                      </div>
                    </>
                  )}

                  {/* Step 2: Payment */}
                  {currentStep === 2 && (
                    <>
                      {/* Discount Code Input */}
                      <div className="mb-6">
                        <DiscountCodeInput
                          onApply={setAppliedDiscount}
                          currentDiscount={appliedDiscount}
                          subtotal={subtotal}
                          onDiscountChange={setDiscountAmount}
                        />
                      </div>

                      {/* Payment Method Selection */}
                      <PaymentMethodSelector
                        paymentMethod={paymentMethod}
                        onPaymentMethodChange={handlePaymentMethodChange}
                        isSubmitting={isSubmitting}
                        stripeError={stripeError}
                      />

                      {/* Credit Card Payment Form — creates the order first,
                          then confirms the Stripe payment against it */}
                      {paymentMethod === PAYMENT_METHODS.creditCard && (
                        <div className="mt-6">
                          <StripePaymentForm
                            createOrder={async () => {
                              // Validate shipping fields before paying
                              const errs: Record<string, string> = {};
                              const v = validateCheckoutData({
                                name: formData.name,
                                postalCode: formData.postalCode,
                                phone: formData.phone,
                                city: formData.city,
                                address: formData.address,
                                country: formData.country
                              });
                              Object.assign(errs, v.errors);
                              if (Object.keys(errs).length > 0) {
                                setFieldErrors(errs);
                                setCurrentStep(1);
                                throw new Error(t('checkout.errors.invalidShipping', 'Please check your shipping information.'));
                              }
                              return submitOrder();
                            }}
                            onSuccess={(orderId) => {
                              sessionStorage.setItem('lastSuccessfulOrder', orderId);
                              sessionStorage.setItem('clearCartAfterOrder', 'true');
                              clearCart();
                              navigate(`/order-success?order_id=${orderId}&lang=${i18n.language}`, { replace: true });
                            }}
                            onError={(errorMsg) => {
                              setStripeError(errorMsg);
                            }}
                            disabled={isSubmitting}
                          />
                        </div>
                      )}

                      {/* Navigation Buttons */}
                      <div className="mt-8 border-t pt-6 flex justify-between">
                        <button
                          type="button"
                          onClick={handlePrevStep}
                          className="py-3 px-4 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brown-500 focus:ring-offset-2 transition-colors"
                        >
                          {t('checkout.back', 'Nazaj')}
                        </button>

                        {/* For card payments the Stripe "Pay Now" button
                            completes the flow — no separate submit needed */}
                        {paymentMethod !== PAYMENT_METHODS.creditCard && (
                          <button
                            type="submit"
                            disabled={
                              isSubmitting ||
                              (cart.length === 0 && gifts.length === 0) ||
                              loadingDetails ||
                              !paymentMethod ||
                              checkingEmail ||
                              authLoading
                            }
                            className="py-3 px-4 bg-brown-600 text-white rounded-md hover:bg-brown-700 focus:outline-none focus:ring-2 focus:ring-brown-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {isSubmitting ? (
                              <span>{t('checkout.processing', 'Obdelava...')}</span>
                            ) : (
                              <span>{t('checkout.placeOrder', 'Oddaj naročilo')}</span>
                            )}
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MultiStepCheckoutPage;
