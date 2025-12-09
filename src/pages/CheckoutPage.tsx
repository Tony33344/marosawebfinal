import React, { useState, useEffect, useCallback } from 'react';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { isValidPhoneNumber, isValidPostalCode, isValidPassword } from '../utils/validation';
import { getPhonePlaceholder as getPhonePlaceholderUtil, formatPhoneNumber } from '../utils/formatters';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';
import { encryptObject } from '../utils/encryption';
import { Product, PackageOption, GiftItem } from '../types';
import { AuthError } from '@supabase/supabase-js';
import { useStripe, useElements } from '@stripe/react-stripe-js';
import { StripePaymentForm } from '../components/StripePaymentForm';
import { ShippingCostNotification } from '../components/ShippingCostNotification';
import { CheckoutSummary } from '../components/checkout/CheckoutSummary';
import { CheckoutForm } from '../components/checkout/CheckoutForm';
import { PaymentMethodSelector } from '../components/checkout/PaymentMethodSelector';
import { CheckoutActions } from '../components/checkout/CheckoutActions';
import { CheckoutStepIndicator } from '../components/checkout/CheckoutStepIndicator';
import { SHIPPING, PAYMENT_METHODS } from '../config/appConfig';
import { useErrorHandler } from '../utils/errorMonitoring';
import { DiscountCodeInput } from '../components/DiscountCodeInput';
import { Gift } from 'lucide-react';
import { GiftRecipientAddressForm } from '../components/GiftRecipientAddressForm';
import { sendOrderConfirmationEmail } from '../utils/emailService';
import { validateSlovenianData } from '../utils/slovenianValidation';

// Define RecipientAddress interface directly since we're not using the GiftRecipientForm component
interface RecipientAddress {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

interface CheckoutDisplayItem {
  id: string;
  created_at: string;
  name: string;
  name_en: string;
  name_de: string;
  name_hr: string;
  description: string;
  description_en: string;
  description_de: string;
  description_hr: string;
  image_url: string;
  stock_quantity: number;
  category: string;
  package_options: PackageOption[];
  packageOption: PackageOption;
  quantity: number;
  isGift?: boolean;
  giftDetails?: any;
}

interface PostalCodeSuggestion {
  code: string;
  city: string;
}

// Define states for the overall checkout flow
type CheckoutStep = 'selection' | 'guest_form' | 'auth_form' | 'registration_form';
// Define states for auth flow within checkout (when 'auth_form' is active)
type AuthSubState = 'initial' | 'login' | 'signup' | 'loggedIn';

// Simple UUID v4 generator
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Helper function for dynamic phone placeholder
const getPhonePlaceholder = (country: string, translateFunc: (key: string, fallback: string) => string): string => {
    return getPhonePlaceholderUtil(country);
};

export const CheckoutPage: React.FC = () => {
  const { cart, gifts, clearCart } = useCart();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, session, loading: authLoading, signInWithPassword, signUp, checkEmailExists, signOut } = useAuth();

  const [cartItemsDetails, setCartItemsDetails] = useState<CheckoutDisplayItem[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch cart item details
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (cart.length === 0 && gifts.length === 0) {
        setCartItemsDetails([]);
        setLoadingDetails(false);
        return;
      }

      setLoadingDetails(true);
      try {
        // Process regular cart items
        let detailedItems: CheckoutDisplayItem[] = [];

        // Process regular cart items
        if (cart.length > 0) {
          const productIds = cart.map(item => item.productId);

          // 1. Fetch products including the package_options JSON column
          const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .in('id', productIds);

          if (error) throw error;

          // Process each cart item
          cart.forEach(cartItem => {
            const product = products?.find(p => p.id === cartItem.productId);
            if (product) {
              // 2. Safely parse the package_options JSON
              let parsedOptions: PackageOption[] = [];
              if (typeof product.package_options === 'string') {
                try {
                  parsedOptions = JSON.parse(product.package_options);
                } catch (parseError) {
                  console.error(`Failed to parse package_options for product ${product.id}:`, parseError, product.package_options);
                }
              } else if (Array.isArray(product.package_options)) {
                // If Supabase returns it pre-parsed (json/jsonb type)
                parsedOptions = product.package_options;
              }

              // 3. Find the specific package option within the parsed options
              const packageOption = parsedOptions.find(
                (opt: PackageOption) => opt.uniq_id === cartItem.packageOptionId
              );

              if (packageOption) {
                // 4. Create the detailed item object
                detailedItems.push({
                  // Spread only the necessary product fields, excluding the raw package_options string
                  id: product.id,
                  created_at: '', // Or fetch if needed, but often not required for display
                  name: product.name,
                  name_en: product.name_en,
                  name_de: product.name_de,
                  name_hr: product.name_hr,
                  description: product.description,
                  description_en: product.description_en,
                  description_de: product.description_de,
                  description_hr: product.description_hr,
                  image_url: product.image_url,
                  stock_quantity: product.stock_quantity,
                  category: product.category,
                  package_options: parsedOptions, // Store the parsed array here if needed elsewhere, or omit
                  // Add the specific matched package option and quantity
                  packageOption,
                  quantity: cartItem.quantity,
                  isGift: false
                });
              } else {
                console.warn(`Package option ${cartItem.packageOptionId} not found in parsed options for product ${cartItem.productId}:`, parsedOptions);
              }
            } else {
              console.warn(`Product ${cartItem.productId} not found for item in cart.`);
            }
          });
        }

        // Process gift items
        if (gifts.length > 0) {
          gifts.forEach(gift => {
            // Add gift as a special cart item
            detailedItems.push({
              id: gift.id,
              created_at: '',
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
              package_options: [],
              packageOption: {
                uniq_id: gift.id,
                price: gift.price,
                weight: 0, // Changed from string to number to match the expected type
                description: t('checkout.giftPackage', 'Darilni paket'),
                description_en: 'Gift Package',
                description_de: 'Geschenkpaket',
                description_hr: 'Poklon paket'
              },
              quantity: gift.quantity,
              isGift: true,
              giftDetails: gift
            });
          });
        }

        setCartItemsDetails(detailedItems);
      } catch (err) {
        console.error('Error fetching product details:', err);
        setError('Failed to load product details. Please try again.');
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchProductDetails();
  }, [cart, gifts, t]);

  // New state for managing checkout steps
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('selection');
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [authSubState, setAuthSubState] = useState<AuthSubState>('initial');

  // Define the steps for the checkout process
  const checkoutSteps = [
    'checkout.steps.information',
    'checkout.steps.shipping',
    'checkout.steps.payment'
  ];

  // Functions for step navigation
  const goToNextStep = () => {
    if (currentStep < checkoutSteps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Validation for each step
  const validateCurrentStep = (): boolean => {
    // Reset error
    setError('');

    // Step 1: Personal Information
    if (currentStep === 1) {
      // Clear previous errors
      setFieldErrors({});
      setError(null);

      const newFieldErrors: Record<string, string> = {};

      // Basic validation
      if (!formData.name) {
        newFieldErrors.name = t('checkout.errors.nameRequired', 'Ime je obvezno');
      }
      if (!formData.email) {
        newFieldErrors.email = t('checkout.errors.emailRequired', 'E-pošta je obvezna');
      }
      if (!formData.phone) {
        newFieldErrors.phone = t('checkout.errors.phoneRequired', 'Telefon je obvezen');
      }

      // Validate email format
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newFieldErrors.email = t('checkout.errors.invalidEmail', 'Prosimo, vnesite veljaven e-poštni naslov');
      }

      // Validate Slovenian data format
      const dataValidation = validateSlovenianData({
        name: formData.name,
        postalCode: '1000', // Dummy postal code for name validation
        phone: formData.phone,
        city: 'Ljubljana', // Dummy city for name validation
        address: 'Slovenska cesta 1' // Dummy address for name validation
      });

      // Add Slovenian validation errors
      if (dataValidation.errors.name) {
        newFieldErrors.name = dataValidation.errors.name;
      }
      if (dataValidation.errors.phone) {
        newFieldErrors.phone = dataValidation.errors.phone;
      }

      // If there are field errors, set them and return
      if (Object.keys(newFieldErrors).length > 0) {
        setFieldErrors(newFieldErrors);
        return false;
      }
    }

    // Step 2: Shipping Information
    else if (currentStep === 2) {
      // Clear previous errors
      setFieldErrors({});
      setError(null);

      const newFieldErrors: Record<string, string> = {};

      // Basic validation
      if (!formData.address) {
        newFieldErrors.address = t('checkout.errors.addressRequired', 'Naslov je obvezen');
      }
      if (!formData.city) {
        newFieldErrors.city = t('checkout.errors.cityRequired', 'Mesto je obvezno');
      }
      if (!formData.postalCode) {
        newFieldErrors.postalCode = t('checkout.errors.postalCodeRequired', 'Poštna številka je obvezna');
      }

      // Validate Slovenian address format
      if (formData.country === 'Slovenija') {
        const addressValidation = validateSlovenianData({
          name: formData.name,
          postalCode: formData.postalCode,
          phone: formData.phone,
          city: formData.city,
          address: formData.address
        });

        // Add Slovenian validation errors
        if (addressValidation.errors.postalCode) {
          newFieldErrors.postalCode = addressValidation.errors.postalCode;
        }
        if (addressValidation.errors.address) {
          newFieldErrors.address = addressValidation.errors.address;
        }
        if (addressValidation.errors.city) {
          newFieldErrors.city = addressValidation.errors.city;
        }
      }

      // If there are field errors, set them and return
      if (Object.keys(newFieldErrors).length > 0) {
        setFieldErrors(newFieldErrors);
        return false;
      }
    }

    // Step 3: Payment Method
    else if (currentStep === 3) {
      // Check if a payment method is selected
      const paymentMethodSelected = document.querySelector('input[name="payment-method"]:checked');
      if (!paymentMethodSelected) {
        setError(t('checkout.errors.paymentMethodRequired', 'Prosimo, izberite način plačila'));
        return false;
      }
    }

    return true;
  };

  // Effect to skip selection step if user is already logged in
  useEffect(() => {
    if (!authLoading && user) {
      console.log('User is logged in, skipping selection step.');
      // Advance to the form step, potentially pre-fill later
      setCheckoutStep('auth_form');
      setAuthSubState('loggedIn'); // Indicate they are logged in within the auth form state
    }
  }, [user, authLoading]); // Rerun when auth state changes

  // Effect to handle user state changes (e.g., login/logout during checkout)
  useEffect(() => {
    if (!authLoading) {
      if (user) {
        // User is logged in
        setAuthSubState('loggedIn');

        // Fetch user profile data to pre-fill the form
        const fetchUserProfile = async () => {
          try {
            const { data, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single();

            if (error) {
              console.error('Error fetching user profile:', error);
              return;
            }

            if (data) {
              // Set email from user auth data
              const userEmail = user.email || '';

              // Parse shipping address from JSON string
              let addressData = {
                address: '',
                city: '',
                postalCode: '',
                country: 'Slovenija'
              };

              if (data.default_shipping_address) {
                try {
                  const parsedAddress = JSON.parse(data.default_shipping_address);
                  addressData = {
                    address: parsedAddress.address || '',
                    city: parsedAddress.city || '',
                    postalCode: parsedAddress.postalCode || '',
                    country: parsedAddress.country || 'Slovenija'
                  };
                } catch (parseError) {
                  console.error('Error parsing shipping address:', parseError);
                }
              }

              // Pre-fill form with user data
              setFormData(prev => ({
                ...prev,
                name: data.full_name || '',
                email: userEmail,
                phone: data.telephone_nr || '',
                address: addressData.address,
                city: addressData.city,
                postalCode: addressData.postalCode,
                country: addressData.country,
              }));
            }
          } catch (err) {
            console.error('Exception fetching user profile:', err);
          }
        };

        fetchUserProfile();
      } else {
        // User is logged out
        setAuthSubState('initial');
      }
    }
  }, [user, authLoading]);

  const [emailToCheck, setEmailToCheck] = useState<string>('');
  const [checkingEmail, setCheckingEmail] = useState<boolean>(false);

  const [error, setError] = useState<string | null>(null); // General/Submission errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({}); // Individual field errors
  const [authError, setAuthError] = useState<string | null>(null); // Specific auth errors
  const [paymentMethod, setPaymentMethod] = useState<string>('pay_on_delivery');
  const [stripePaymentComplete, setStripePaymentComplete] = useState<boolean>(false);
  const [stripePaymentId, setStripePaymentId] = useState<string | null>(null);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const stripe = useStripe();
  const elements = useElements();
  const [showPassword, setShowPassword] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null);
  const [giftOptionId, setGiftOptionId] = useState<number | null>(null);
  const [giftMessage, setGiftMessage] = useState<string>('');
  const [giftProductId, setGiftProductId] = useState<number | null>(null);
  const [giftProductPackageId, setGiftProductPackageId] = useState<string | null>(null);

  // Gift recipient address state
  const [useGiftRecipientAddress, setUseGiftRecipientAddress] = useState(false);
  const [giftRecipientAddress, setGiftRecipientAddress] = useState<RecipientAddress | null>(null);
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

  const [postalSuggestions, setPostalSuggestions] = useState<PostalCodeSuggestion[]>([]);

  const commonPostalCodes: PostalCodeSuggestion[] = [
    { code: "1000", city: "Ljubljana" },
    { code: "2000", city: "Maribor" },
    { code: "3000", city: "Celje" },
    { code: "4000", city: "Kranj" },
    { code: "5000", city: "Nova Gorica" },
    { code: "6000", city: "Koper" }
  ];

  // Security check to prevent environment variables from being displayed in password fields
  const isEnvironmentVariable = (value: string): boolean => {
    // Check if the value looks like an API key or JWT token
    const apiKeyPattern = /^(sk|pk)_(test|live)_[A-Za-z0-9]+$/;
    const jwtPattern = /^eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;

    return apiKeyPattern.test(value) || jwtPattern.test(value);
  };

  const handleInputChange = (nameOrEvent: string | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, valueParam?: string) => {
    // Handle both direct calls and event-based calls
    let name: string;
    let value: string;

    if (typeof nameOrEvent === 'string') {
      // Direct call with name and value
      name = nameOrEvent;
      value = valueParam || '';
    } else {
      // Event-based call
      name = nameOrEvent.target.name;
      value = nameOrEvent.target.value;
    }

    // Security check for password fields
    if ((name === 'password' || name === 'confirmPassword') && isEnvironmentVariable(value)) {
      console.error('Attempted to set a password field to what appears to be an API key or token. This has been blocked for security reasons.');
      return;
    }

    // Format phone number based on country
    if (name === 'phone') {
      const formatted = formatPhoneNumber(value, formData.country);
      setFormData(prev => ({ ...prev, [name]: formatted }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Show postal code suggestions
    if (name === 'postalCode') {
      const suggestions = value ? commonPostalCodes.filter(p =>
        p.code.startsWith(value) || p.city.toLowerCase().includes(value.toLowerCase())
      ) : [];
      setPostalSuggestions(suggestions);

      // Auto-fill city when selecting from postal suggestions
      const match = commonPostalCodes.find(p => p.code === value);
      if (match) {
        setFormData(prev => ({ ...prev, city: match.city }));
        setPostalSuggestions([]);
      }
    }

    // If email changes during auth flow, only reset sub-state if we're in the initial state
    if (name === 'email' && checkoutStep === 'auth_form' && authSubState !== 'loggedIn' && authSubState !== 'login' && authSubState !== 'signup') {
       setAuthSubState('initial');
       setAuthError(null); // Clear previous auth errors
       setEmailToCheck(value); // Set email to be checked on blur/submit
    }
     if (name === 'password') {
       setAuthError(null); // Clear auth error when password changes
     }
  };

   const handleEmailBlur = useCallback(async () => {
     // Only check email if in the auth flow and not already logged in
     if (checkoutStep !== 'auth_form' || authSubState === 'loggedIn' || !emailToCheck || checkingEmail) {
       return;
     }
     setCheckingEmail(true);
     setAuthError(null);
     try {
       const exists = await checkEmailExists(emailToCheck);
       if (exists) {
         setAuthSubState('login');
       } else {
         if (/\S+@\S+\.\S+/.test(emailToCheck)) {
            setAuthSubState('signup');
         } else {
            setAuthSubState('initial'); // Invalid email format
         }
       }
     } catch (e) {
       console.error("Email check failed:", e);
       setAuthError(t('checkout.errors.emailCheckFailed', 'Could not verify email. Please try again.'));
       setAuthSubState('initial'); // Reset on error
     } finally {
       setCheckingEmail(false);
     }
   }, [emailToCheck, checkoutStep, authSubState, checkingEmail, t, checkEmailExists]);

  const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentMethod(e.target.value);
  };

  const calculateSubtotal = () => {
    return cartItemsDetails.reduce((total, item) => {
      const price = item.packageOption?.price ?? 0;
      return total + price * item.quantity;
    }, 0);
  };

  const subtotal = calculateSubtotal();

  // Calculate discount amount
  const calculateDiscountAmount = () => {
    if (!appliedDiscount) return 0;

    // Use the calculated discount from the validation
    if (appliedDiscount.calculatedDiscount !== undefined) {
      const numeric = Number(appliedDiscount.calculatedDiscount);
      return Number.isFinite(numeric) && numeric >= 0 ? numeric : 0;
    }

    // Fallback calculation using new schema fields
    if (appliedDiscount.discount_type === 'percentage') {
      const value = Number(appliedDiscount.discount_value);
      if (!Number.isFinite(value)) return 0;
      return (subtotal * value) / 100;
    }

    if (appliedDiscount.discount_type === 'fixed') {
      const value = Number(appliedDiscount.discount_value);
      return Number.isFinite(value) && value >= 0 ? value : 0;
    }

    return 0;
  };

  const discountAmount = calculateDiscountAmount();
  const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);

  // Debug: Log discount state
  console.log('=== CHECKOUT SUMMARY DEBUG ===');
  console.log('Applied discount state:', appliedDiscount);
  console.log('Calculated discount amount:', discountAmount);
  console.log('Subtotal:', subtotal);
  console.log('Subtotal after discount:', subtotalAfterDiscount);
  console.log('===============================');

  // Calculate gift option cost (packaging)
  const giftOptionCost = giftOptionId ? 3.50 : 0; // Default cost, will be replaced with actual cost from DB

  // Calculate gift product cost
  const [giftProductCost, setGiftProductCost] = useState(0);

  // Effect to fetch gift product cost when selected
  useEffect(() => {
    const fetchGiftProductCost = async () => {
      if (!giftProductId || !giftProductPackageId) {
        setGiftProductCost(0);
        return;
      }

      try {
        // Fetch the product details
        const { data: product, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', giftProductId)
          .single();

        if (error) throw error;

        if (product) {
          // Parse package options
          let packageOptions = [];
          if (typeof product.package_options === 'string') {
            try {
              packageOptions = JSON.parse(product.package_options);
            } catch (e) {
              console.error('Error parsing package options:', e);
            }
          } else if (Array.isArray(product.package_options)) {
            packageOptions = product.package_options;
          }

          // Find the selected package option
          const selectedOption = packageOptions.find((opt: any) => opt.uniq_id === giftProductPackageId);
          if (selectedOption) {
            setGiftProductCost(selectedOption.price || 0);
          } else {
            setGiftProductCost(0);
          }
        }
      } catch (err) {
        console.error('Error fetching gift product cost:', err);
        setGiftProductCost(0);
      }
    };

    fetchGiftProductCost();
  }, [giftProductId, giftProductPackageId]);

  // Shipping cost constants
  const SHIPPING_COST = 3.90;
  const FREE_SHIPPING_THRESHOLD = 30.00;

  // Calculate if shipping is free
  const hasShippingFee = subtotalAfterDiscount < FREE_SHIPPING_THRESHOLD;
  const shippingCost = hasShippingFee ? SHIPPING_COST : 0;

  // Calculate total with shipping, discount, gift option, and gift product
  const total = subtotalAfterDiscount + shippingCost + giftOptionCost + giftProductCost;

  // Separate handler for Login/Signup actions before placing order
  const handleAuthAction = async (action: 'login' | 'signup') => {
     setAuthError(null);
     setIsSubmitting(true);
     console.log(`Attempting ${action} action`);

     let authResult: { error: AuthError | null } | null = null;

     try {
       if (action === 'login') {
         if (!formData.email || !formData.password) {
           setAuthError(t('checkout.errors.emailPasswordRequired', 'Email and password are required.'));
           setIsSubmitting(false);
           return;
         }
         console.log('Signing in with password');
         authResult = await signInWithPassword({ email: formData.email, password: formData.password });
         console.log('Sign in result:', authResult);
       } else if (action === 'signup') {
         if (!formData.email || !formData.password || !formData.confirmPassword) {
           setAuthError(t('checkout.errors.emailPasswordRequired', 'Email and password are required.'));
           setIsSubmitting(false);
           return;
         }
         if (formData.password !== formData.confirmPassword) {
           setAuthError(t('checkout.errors.passwordMismatch', 'Passwords do not match.'));
           setIsSubmitting(false);
           return;
         }
         // Check password strength
         if (!isValidPassword(formData.password)) {
           setAuthError(t(
             'validation.passwordStrength',
             'Geslo mora vsebovati vsaj 10 znakov, vključno z veliko črko, malo črko, številko in posebnim znakom'
           ));
           setIsSubmitting(false);
           return;
         }
         authResult = await signUp({
            email: formData.email,
            password: formData.password,
            // Don't pass metadata here, we'll create the profile manually
         });
       }

       if (authResult?.error) {
         setAuthError(authResult.error.message);
         setIsSubmitting(false); // Stop submission on auth error
       } else {
         // Auth successful, state will change via onAuthStateChange listener
         // The useEffect for [user, authLoading] will update authSubState to 'loggedIn'
         // Keep checkoutStep as 'auth_form'
         // The user needs to review/complete the form and click "Place Order" again

         // For login action, immediately fetch user profile and pre-fill form
         if (action === 'login') {
           try {
             // Get the current user after login
             const { data: { user: currentUser } = { user: null } } = await supabase.auth.getUser();

             if (currentUser) {
               // Fetch user profile data
               const { data: userProfile, error: profileError } = await supabase
                 .from('profiles')
                 .select('*')
                 .eq('id', currentUser.id)
                 .single();

               if (profileError) {
                 console.error('Error fetching user profile after login:', profileError);
               } else if (userProfile) {
                 // Parse shipping address from JSON string
                 let addressData = {
                   address: '',
                   city: '',
                   postalCode: '',
                   country: 'Slovenija'
                 };

                 if (userProfile.default_shipping_address) {
                   try {
                     const parsedAddress = JSON.parse(userProfile.default_shipping_address);
                     addressData = {
                       address: parsedAddress.address || '',
                       city: parsedAddress.city || '',
                       postalCode: parsedAddress.postalCode || '',
                       country: parsedAddress.country || 'Slovenija'
                     };
                   } catch (parseError) {
                     console.error('Error parsing shipping address after login:', parseError);
                   }
                 }

                 // Pre-fill form with user data
                 setFormData(prev => ({
                   ...prev,
                   name: userProfile.full_name || '',
                   email: currentUser.email || '',
                   phone: userProfile.telephone_nr || '',
                   address: addressData.address,
                   city: addressData.city,
                   postalCode: addressData.postalCode,
                   country: addressData.country,
                 }));

                 console.log('Pre-filled form with user profile data after login');
               }
             }

             // Update state to show the checkout form
             setAuthSubState('loggedIn');
           } catch (err) {
             console.error('Error fetching user data after login:', err);
           }
         } else if (action === 'signup') {
           // After successful signup, create a profile with all the information
           try {
             // Get the current user after signup
             const { data: { user: currentUser } = { user: null } } = await supabase.auth.getUser();

             if (currentUser) {
               console.log("Creating profile with data:", {
                 id: currentUser.id,
                 username: formData.email,
                 full_name: formData.name,
                 email: formData.email,
                 telephone_nr: formData.phone,
                 default_shipping_address: {
                   address: formData.address,
                   city: formData.city,
                   postalCode: formData.postalCode,
                   country: formData.country,
                 }
               });

               try {
                 // Create a new profile with regular supabase client
                 // This is secure because users can only modify their own profiles with RLS
                 const { error: profileError } = await supabase.from('profiles')
                   .upsert({
                     id: currentUser.id,
                     username: formData.email,
                     full_name: formData.name,
                     email: formData.email,
                     telephone_nr: formData.phone,
                     default_shipping_address: JSON.stringify({
                       address: formData.address,
                       city: formData.city,
                       postalCode: formData.postalCode,
                       country: formData.country,
                     }),
                   }, { onConflict: 'id' });

                 if (profileError) {
                   console.error("Error creating/updating profile:", profileError);
                 } else {
                   console.log("Profile created/updated successfully");
                 }
               } catch (err) {
                 console.error("Error in profile operation:", err);
               }
             } else {
               console.error("User not available after signup");
             }
           } catch (err) {
             console.error("Error in user lookup:", err);
           }

           // After successful registration, update state to show the checkout form
           setAuthSubState('loggedIn');

           // Pre-fill form with the data that was used for registration
           // This ensures the form is filled with the user's data after signup
           setFormData(prev => ({
             ...prev,
             name: formData.name || '',
             email: formData.email || '',
             phone: formData.phone || '',
             address: formData.address || '',
             city: formData.city || '',
             postalCode: formData.postalCode || '',
             country: formData.country || 'Slovenija',
           }));

           console.log('Pre-filled form with user registration data after signup');
         } else {
           // Keep checkoutStep as 'auth_form'
           // The user needs to review/complete the form and click "Place Order" again
         }

         setIsSubmitting(false); // Allow user to proceed with form filling
         setError(null); // Clear any previous general errors
       }
     } catch (err: any) {
       console.error(`${action} error:`, err);
       setAuthError(t('checkout.errors.authActionFailed', `Could not ${action}. Please try again.`));
       setIsSubmitting(false); // Stop submission on unexpected error
     }
   };


  // Refactored order placement logic
  const placeOrder = async () => {
    setError(null);
    setAuthError(null); // Clear auth errors before placing order attempt

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!paymentMethod) {
      setError(t('checkout.errorPaymentMethodRequired', 'Please select a payment method.'));
      return;
    }

    if (paymentMethod === 'credit_card') {
      if (!stripePaymentComplete) {
        setError(t('checkout.errorStripePaymentIncomplete', 'Please complete the credit card payment before placing your order.'));
        return;
      }

      if (!stripePaymentId) {
        // Try to recover payment ID from session storage
        const storedPaymentId = sessionStorage.getItem('stripe_payment_id');
        if (storedPaymentId) {
          console.log('Recovered Stripe payment ID from session storage:', storedPaymentId);
          setStripePaymentId(storedPaymentId);
        } else {
          console.error('Stripe payment is marked as complete but no payment ID is present');
          setError(t('checkout.errorStripePaymentNoId', 'Payment was processed but payment ID is missing. Please try again.'));
          return;
        }
      }

      // Store the payment ID in notes field since we don't have a dedicated payment_intent_id field
      formData.notes = `${formData.notes || ''} [Stripe Payment ID: ${stripePaymentId}]`.trim();
      console.log('Proceeding with order using Stripe payment ID (stored in notes):', stripePaymentId);
    }

    if ((cart.length === 0 && gifts.length === 0) || loadingDetails) {
      setError(t('checkout.submitErrorCartEmpty', 'Nadaljevanje z prazno košarico ni mogoče.'));
      return;
    }

    setIsSubmitting(true); // Set submitting true only when starting the actual order placement

    // Ensure we have the latest user ID right before submission
    // Re-fetch user state directly from supabase client just in case context is stale
    const { data: { user: currentUser } = { user: null } } = await supabase.auth.getUser();
    const currentUserId = currentUser?.id || null;
    const isGuest = !currentUserId;

    // Double-check email consistency if logged in
    if (currentUser && currentUser.email !== formData.email) {
        console.warn("Form email differs from logged-in user email. Using logged-in user's email.");
        // Optionally update formData.email or notify user, for now proceed with currentUser.email
    }


    try {
      // 1. Find or Create Profile
      let profileId: string | null = null;

      if (currentUserId) {
          // User is logged in
          const { data: userProfile, error: profileFetchError } = await supabase
              .from('profiles')
              .select('id, full_name, telephone_nr, default_shipping_address') // Updated to match schema
              .eq('id', currentUserId)
              .maybeSingle();

          if (profileFetchError) throw new Error(`Profile lookup failed: ${profileFetchError.message}`);

          if (userProfile) {
              profileId = userProfile.id;
              console.log('Found profile for logged-in user:', profileId);
              // Update profile if form data is different (optional, consider UX)
              // Example: Check if formData.name is different and update
              // For now, we just use the existing profile ID.
              // Pre-fill form with profile data if it wasn't already done (e.g., if they logged in during checkout)
              if (!formData.name && userProfile.full_name) setFormData(prev => ({ ...prev, name: userProfile.full_name }));
              if (!formData.phone && userProfile.telephone_nr) setFormData(prev => ({ ...prev, phone: userProfile.telephone_nr }));

              // Parse and pre-fill address from userProfile.default_shipping_address if needed
              if (userProfile.default_shipping_address && (!formData.address || !formData.city || !formData.postalCode)) {
                try {
                  const parsedAddress = JSON.parse(userProfile.default_shipping_address);
                  if (!formData.address && parsedAddress.address) {
                    setFormData(prev => ({ ...prev, address: parsedAddress.address }));
                  }
                  if (!formData.city && parsedAddress.city) {
                    setFormData(prev => ({ ...prev, city: parsedAddress.city }));
                  }
                  if (!formData.postalCode && parsedAddress.postalCode) {
                    setFormData(prev => ({ ...prev, postalCode: parsedAddress.postalCode }));
                  }
                  if (!formData.country && parsedAddress.country) {
                    setFormData(prev => ({ ...prev, country: parsedAddress.country }));
                  }
                } catch (parseError) {
                  console.error('Error parsing shipping address in placeOrder:', parseError);
                }
              }

          } else {
              // Logged-in user has no profile yet (e.g., signed up but didn't complete checkout before)
              console.log('Creating profile for logged-in user:', currentUserId);
              // Create profile with regular client - we're already authenticated as this user
              console.log("Creating profile with data:", {
                id: currentUserId,
                username: formData.email,
                full_name: formData.name,
                email: formData.email,
                telephone_nr: formData.phone,
                default_shipping_address: {
                  address: formData.address,
                  city: formData.city,
                  postalCode: formData.postalCode,
                  country: formData.country,
                }
              });

                try {
                  // Create or update profile
                  const { error: profileError } = await supabase.from('profiles')
                    .upsert({
                      id: currentUserId,
                      username: formData.email,
                      full_name: formData.name,
                      email: formData.email,
                      telephone_nr: formData.phone,
                      default_shipping_address: JSON.stringify(await encryptObject({
                        address: formData.address,
                        city: formData.city,
                        postalCode: formData.postalCode,
                        country: formData.country,
                      }, ['address'])),
                    }, { onConflict: 'id' });

                  if (profileError) {
                    console.error("Error creating/updating profile:", profileError);
                    throw new Error(`Profile creation/update failed: ${profileError.message}`);
                  } else {
                    console.log("Profile created/updated successfully");
                    profileId = currentUserId;
                  }
                } catch (err) {
                  console.error("Error in profile operation:", err);
                  throw err;
                }
          }
      } else {
          // Guest checkout
          console.log('Processing guest checkout for email:', formData.email);
          // Use regular client for guest profile creation
          // We'll need to implement proper server-side handling in the future

          // Check if a profile exists with this email
          const { data: existingProfile, error: guestProfileError } = await supabase
              .from('profiles')
              .select('id')
              .eq('email', formData.email)
              .maybeSingle();

          if (guestProfileError) throw new Error(`Guest profile lookup failed: ${guestProfileError.message}`);

          if (existingProfile) {
              // Found an existing profile. Reuse it.
              profileId = existingProfile.id;
              console.log('Found existing profile:', profileId);
              // Update profile details
              const { error: updateError } = await supabase
                  .from('profiles')
                  .update({
                    full_name: formData.name,
                    telephone_nr: formData.phone,
                    default_shipping_address: JSON.stringify(await encryptObject({
                      address: formData.address,
                      city: formData.city,
                      postalCode: formData.postalCode,
                      country: formData.country,
                    }, ['address'])),
                  })
                  .eq('id', profileId);

              if (updateError) throw new Error(`Failed to update profile: ${updateError.message}`);
          } else {
              // Create a new profile
              console.log('Creating new profile for email:', formData.email);
              const guestUUID = generateUUID();
              const { data: newProfile, error: insertProfileError } = await supabase
                  .from('profiles')
                  .insert({
                    id: guestUUID,
                    username: formData.email,
                    full_name: formData.name,
                    email: formData.email,
                    telephone_nr: formData.phone,
                    default_shipping_address: JSON.stringify(await encryptObject({
                      address: formData.address,
                      city: formData.city,
                      postalCode: formData.postalCode,
                      country: formData.country,
                    }, ['address'])),
                  })
                  .select('id')
                  .single();

              if (insertProfileError) throw new Error(`Profile creation failed: ${insertProfileError.message}`);
              if (!newProfile) throw new Error('Profile creation returned no data.');
              profileId = newProfile.id;
              console.log('Created new profile:', profileId);
          }
      }


      if (!profileId) {
        throw new Error('Failed to obtain profile ID.');
      }

      // 2. Prepare Order Data
      const orderItems = cartItemsDetails.map((item: CheckoutDisplayItem) => {
        if (item.isGift) {
          // Handle gift items with detailed information
          const giftDetails = item.giftDetails || {};

          // Create a detailed description for the gift package
          let detailedDescription = `Darilni paket: ${item.name}\n`;

          // Add recipient information
          if (giftDetails.recipient_name) {
            detailedDescription += `Prejemnik: ${giftDetails.recipient_name}\n`;
          }

          if (giftDetails.recipient_message) {
            detailedDescription += `Sporočilo: ${giftDetails.recipient_message}\n`;
          }

          // Add gift contents information
          if (giftDetails.products && Array.isArray(giftDetails.products)) {
            detailedDescription += `\nVsebina darila:\n`;
            giftDetails.products.forEach((product: any, index: number) => {
              detailedDescription += `${index + 1}. ${product.name} (${product.package_option?.description || 'Standardna pakiranje'})\n`;
            });
          }

          // Add packaging information
          if (giftDetails.packaging) {
            detailedDescription += `\nEmbalaža: ${giftDetails.packaging}\n`;
          }

          return {
            product_id: item.id,
            product_name: `${item.name} - Darilo`,
            package_option_id: item.packageOption.uniq_id,
            package_description: detailedDescription,
            quantity: item.quantity,
            price_per_unit: item.packageOption.price,
            line_total: item.packageOption.price * item.quantity,
            is_gift: true,
            gift_details: item.giftDetails ? JSON.stringify(item.giftDetails) : null
          };
        } else {
          // Handle regular items
          return {
            product_id: item.id,
            product_name: item[`name_${i18n.language}` as keyof Product] || item.name,
            package_option_id: item.packageOption.uniq_id,
            package_description: item.packageOption.weight || item.packageOption.description || '',
            quantity: item.quantity,
            price_per_unit: item.packageOption.price,
            line_total: item.packageOption.price * item.quantity,
            is_gift: false
          };
        }
      });

      // Create shipping address object with sensitive data
      const shippingAddressRaw = {
        name: formData.name,
        address: formData.address,
        city: formData.city,
        postalCode: formData.postalCode,
        country: formData.country,
        phone: formData.phone,
        email: formData.email, // Include email in shipping address for confirmation emails etc.
      };

      // Encrypt sensitive fields in shipping address
      const shippingAddress = await encryptObject(shippingAddressRaw, [
        'name', 'address', 'phone' // Encrypt personal identifiable information
      ]);

      // 3. Create Order
      console.log('Creating order with profile_id:', profileId, 'user_id:', currentUserId, 'is_guest:', isGuest);
      // Include both shipping and subtotal information in the notes field
      const shippingInfo = hasShippingFee
        ? `[${t('orders.shipping', 'Poštnina')}: €${shippingCost.toFixed(2)}]`
        : `[${t('checkout.freeShipping', 'Brezplačna dostava')}]`;

      const subtotalInfo = `[${t('orders.subtotal', 'Vmesna vsota')}: €${subtotal.toFixed(2)}]`;

      // Include all gift-related information in the notes
      let giftInfo = '';
      if (giftOptionId) {
        giftInfo += `[Gift Option ID: ${giftOptionId}] `;
      }
      if (giftMessage) {
        giftInfo += `[Gift Message: ${giftMessage}] `;
      }
      if (giftProductId) {
        giftInfo += `[Gift Product ID: ${giftProductId}] `;
      }
      if (giftProductPackageId) {
        giftInfo += `[Gift Product Package ID: ${giftProductPackageId}] `;
      }
      if (giftProductCost > 0) {
        giftInfo += `[Gift Product Cost: €${giftProductCost.toFixed(2)}] `;
      }

      // Add gift recipient address information if provided
      if (useGiftRecipientAddress && giftRecipientAddress) {
        giftInfo += `[Gift Recipient: ${giftRecipientAddress.name}] `;
        giftInfo += `[Gift Shipping Address: ${giftRecipientAddress.address}, ${giftRecipientAddress.postalCode} ${giftRecipientAddress.city}, ${giftRecipientAddress.country}] `;

        // Add a structured JSON representation of the gift recipient address in the notes
        // This will make it easier to parse and display in the admin panel
        const giftAddressJson = JSON.stringify({
          type: 'gift_recipient_address',
          data: {
            name: giftRecipientAddress.name,
            address: giftRecipientAddress.address,
            postalCode: giftRecipientAddress.postalCode,
            city: giftRecipientAddress.city,
            country: giftRecipientAddress.country
          }
        });
        giftInfo += `[GIFT_ADDRESS_JSON: ${giftAddressJson}] `;
      }

      const orderNotes = `${formData.notes || ''} ${subtotalInfo} ${shippingInfo} ${giftInfo}`.trim();

      // Prepare gift recipient address if provided
      // We'll keep this code for future use when the database schema is updated
      // but we won't include it in the order data directly for now
      if (useGiftRecipientAddress && giftRecipientAddress) {
        // Encrypt sensitive fields in gift recipient address
        const giftRecipientAddressRaw = {
          name: giftRecipientAddress.name,
          address: giftRecipientAddress.address,
          city: giftRecipientAddress.city,
          postalCode: giftRecipientAddress.postalCode,
          country: giftRecipientAddress.country,
        };

        // This encrypted data will be used in the future when the database schema is updated
        // For now, we're storing the gift recipient address in the notes field
        const encryptedGiftAddressJson = JSON.stringify(await encryptObject(giftRecipientAddressRaw, [
          'name', 'address' // Encrypt personal identifiable information
        ]));

        // Store the encrypted data in session storage for potential future use
        sessionStorage.setItem('lastGiftRecipientAddress', encryptedGiftAddressJson);
      }

      // Debug: Log discount calculation values
      console.log('=== DISCOUNT DEBUG ===');
      console.log('Applied discount:', appliedDiscount);
      console.log('Subtotal:', subtotal);
      console.log('Discount amount:', discountAmount);
      console.log('Subtotal after discount:', subtotalAfterDiscount);
      console.log('Shipping cost:', shippingCost);
      console.log('Final total:', total);
      console.log('======================');

      // Add all columns that exist in the database
      const orderData = {
        profile_id: profileId,
        total_price: total, // Total already includes shipping cost, discount, gift option, and gift product
        status: 'pending',
        items: JSON.stringify(orderItems),
        shipping_address: JSON.stringify(shippingAddress),
        notes: orderNotes,
        payment_method: paymentMethod,
        is_guest_order: isGuest,
        shipping_cost: hasShippingFee ? SHIPPING_COST : 0,
        discount_code_id: appliedDiscount?.id || null,
        discount_amount: discountAmount || 0,
        gift_option_id: giftOptionId,
        gift_message: giftMessage,
        gift_product_id: giftProductId ? String(giftProductId) : null, // Convert to string to match TEXT column type
        gift_product_package_id: giftProductPackageId,
        gift_product_cost: giftProductCost > 0 ? giftProductCost : null
      };

      // Try to add shipping_cost if the column exists
      try {
        // Get next order number directly from function
        const { data: orderNumberData, error: orderNumberError } = await supabase
          .rpc('get_next_order_number');

        if (orderNumberError) {
          console.error('Failed to get order number:', orderNumberError);
          throw new Error('Failed to generate order number');
        }

        const nextOrderNumber = orderNumberData;
        console.log('Got next order number:', nextOrderNumber);

        // Add order number to order data
        const orderDataWithNumber = {
          ...orderData,
          order_number: nextOrderNumber
        };

        const { data: newOrder, error: orderError } = await supabase
          .from('orders')
          .insert(orderDataWithNumber)
          .select('id, order_number')
          .single();

      if (orderError) throw new Error(`Order creation failed: ${orderError.message}`);
      if (!newOrder) throw new Error('Order creation returned no data.');

      console.log('Order created successfully:', newOrder.id);

      // 4. Post-Order Actions
      // Store order ID in session storage before navigation
      sessionStorage.setItem('lastSuccessfulOrder', newOrder.id);
      sessionStorage.setItem('clearCartAfterOrder', 'true');

      // Clean up Stripe payment ID from session storage
      if (paymentMethod === 'credit_card') {
        console.log('Cleaning up Stripe payment data from session storage');
        // Keep the ID until the order is displayed, then clear it in OrderSuccessPage
        sessionStorage.setItem('stripe_payment_used', 'true');
      }

      // Email sending is now handled in MultiStepCheckoutPage
      console.log('Email sending disabled in CheckoutPage - emails are now sent from MultiStepCheckoutPage');

      // Navigate to success page without clearing cart
      const successUrl = `/order-success?order_id=${newOrder.id}&lang=${i18n.language}`;
      console.log('Redirecting to success page:', successUrl);
      navigate(successUrl, { replace: true });
      } catch (err) {
        console.error("Error during order creation:", err);
        throw err; // Re-throw to be caught by the outer catch block
      }

    } catch (err: any) {
      console.error("Order placement error:", err);
      setError(err.message || t('checkout.submitErrorGeneral', 'An unexpected error occurred. Please try again.'));
    } finally {
      setIsSubmitting(false); // Ensure submitting is set to false after attempt
    }
  };

  // Validation functions
  const isValidPostalCode = (postalCode: string): boolean => {
    // Slovenian postal code format: 4 digits
    const slovenianPostalCodeRegex = /^\d{4}$/;
    return slovenianPostalCodeRegex.test(postalCode);
  };

  const isValidCity = (city: string): boolean => {
    return city.trim().length >= 2; // City should be at least 2 characters
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) {
      return t('checkout.errors.nameRequired', 'Name is required.');
    }
    if (!formData.email.trim()) {
      return t('checkout.errors.emailRequired', 'Email is required.');
    }
    if (!formData.phone.trim()) {
      return t('checkout.errors.phoneRequired', 'Phone number is required.');
    }
    if (!formData.address.trim()) {
      return t('checkout.errors.addressRequired', 'Address is required.');
    }
    if (!formData.city.trim()) {
      return t('checkout.errors.cityRequired', 'City is required.');
    }
    if (!isValidCity(formData.city)) {
      return t('checkout.errors.invalidCity', 'Please enter a valid city name.');
    }
    if (!formData.postalCode.trim()) {
      return t('checkout.errors.postalCodeRequired', 'Postal code is required.');
    }
    if (!isValidPostalCode(formData.postalCode)) {
      return t('checkout.errors.invalidPostalCode', 'Please enter a valid 4-digit postal code.');
    }
    if (!formData.country.trim()) {
      return t('checkout.errors.countryRequired', 'Country is required.');
    }
    return null;
  };

  // Main form submission handler - Now decides based on checkoutStep
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear general errors on new submission attempt
    setAuthError(null); // Clear auth errors

    // If user is in the auth flow (login/signup state), handle that first
    if (checkoutStep === 'auth_form') {
        if (authSubState === 'login') {
            await handleAuthAction('login');
            // Don't proceed to placeOrder automatically, user needs to click again after login
            return; // Stop further execution in this submit handler
        } else if (authSubState === 'signup') {
            await handleAuthAction('signup');
            // Don't proceed to placeOrder automatically, user needs to click again after signup
            return; // Stop further execution in this submit handler
        }
        // If already loggedIn or in initial state within auth_form, proceed to placeOrder
    }

    // If guest or already authenticated, proceed to place the order
    await placeOrder();
  };


  // Loading states
  if (authLoading || loadingDetails) {
    return <div className="container mx-auto px-4 py-8 text-center">{t('checkout.loading', 'Nalaganje blagajne...')}</div>;
  }

  // Cart empty state
   if (!loadingDetails && cart.length === 0 && gifts.length === 0 && !isSubmitting) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-semibold mb-4">{t('checkout.cartEmptyTitle', 'Vaša košarica je prazna')}</h1>
        <p className="mb-6">{t('checkout.cartEmptyText', 'Za nadaljevanje na blagajno potrebujete izdelke v košarici.')}</p>
        <button
          onClick={() => navigate(`/?lang=${i18n.language}`)}
          className="bg-brown-600 hover:bg-brown-700 text-white font-bold py-2 px-6 rounded"
        >
          {t('cart.continueShopping', 'Nadaljuj z nakupovanjem')}
        </button>
      </div>
    );
  }

  // Render different content based on checkoutStep

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back to Cart Button */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate('/cart')}
          className="flex items-center text-brown-600 hover:text-brown-800 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          {t('checkout.backToCart', 'Nazaj na košarico')}
        </button>
      </div>

      <h1 className="text-3xl font-bold mb-4 text-center">{t('checkout.title', 'Blagajna')}</h1>

      {/* Checkout Step Indicator - Only shown in guest_form or when logged in */}
      {(checkoutStep === 'guest_form' || (checkoutStep === 'auth_form' && authSubState === 'loggedIn')) && (
        <CheckoutStepIndicator currentStep={currentStep} steps={checkoutSteps} />
      )}

      {/* Debug info removed */}

      {/* Step 1: Selection */}
      {checkoutStep === 'selection' && !user && (
        <div className="bg-white p-6 rounded shadow mb-8">
          <h2 className="text-xl font-semibold mb-6 text-center">{t('checkout.howToProceed', 'Kako želite nadaljevati?')}</h2>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <button
              onClick={() => setCheckoutStep('guest_form')}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded text-lg"
            >
              {t('checkout.continueAsGuest', 'Nadaljujte kot gost')}
            </button>
            <button
              onClick={() => {
                setCheckoutStep('auth_form'); // Corrected: Use 'auth_form' for both login and signup
                setAuthSubState('signup');
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded text-lg"
            >
              {t('checkout.register', 'Registracija')}
            </button>
            <button
              onClick={() => {
                setCheckoutStep('auth_form');
                setAuthSubState('login');
              }}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded text-lg"
            >
              {t('checkout.login', 'Prijava')}
            </button>
          </div>
        </div>
      )}

      {/* Login Form */}
      {checkoutStep === 'auth_form' && authSubState === 'login' && (
        <div className="bg-white p-6 rounded shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">{t('checkout.login', 'Prijava')}</h2>
          <form onSubmit={(e) => {
            e.preventDefault();
            handleAuthAction('login');
          }}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">{t('checkout.form.email', 'Email naslov')}</label>
              <input type="email" id="email" name="email" value={formData.email} onChange={(e) => handleInputChange(e)} required
                placeholder={t('checkout.form.emailPlaceholder', 'janez.novak@primer.si')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brown-500 focus:border-brown-500 placeholder:text-gray-300"
                disabled={checkingEmail}
                // Don't trigger email blur check when in login form
                onBlur={() => {}}
              />
              {checkingEmail && <p className="text-sm text-gray-500 mt-1">{t('checkout.checkingEmail', 'Preverjanje emaila...')}</p>}
            </div>
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">{t('checkout.form.password', 'Geslo')}</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange(e)}
                  required
                  placeholder="********"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brown-500 focus:border-brown-500 placeholder:text-gray-300"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? t('checkout.hide', 'Skrij') : t('checkout.show', 'Pokaži')}
                </button>
              </div>
            </div>
            {authError && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
                {authError}
              </div>
            )}
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => setCheckoutStep('selection')}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                {t('checkout.back', 'Nazaj')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting || checkingEmail || !formData.email || !formData.password}
                className={`bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${(isSubmitting || checkingEmail || !formData.email || !formData.password) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? t('checkout.submitting', 'Processing...') : t('auth.login', 'Prijava')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Registration Form */}
      {checkoutStep === 'auth_form' && authSubState === 'signup' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">{t('checkout.registration', 'Registracija')}</h2>
            <p className="text-sm text-gray-600 mb-6">
              {t('checkout.createAccountBenefit', 'Ustvarite račun za hitrejše naslednje nakupe.')}
            </p>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">{t('checkout.accountDetails', 'Podatki o računu')}</h3>

            {/* Email */}
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {t('checkout.email', 'Email Address')}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={(e) => handleInputChange(e)}
                required
                placeholder={t('checkout.form.emailPlaceholder', 'janez.novak@primer.si')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brown-500 focus:border-brown-500 placeholder:text-gray-300"
                // Don't trigger email blur check when in signup form
                onBlur={() => {}}
              />
            </div>

            {/* Password */}
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {t('checkout.password', 'Password')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange(e)}
                  required
                  placeholder="********"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brown-500 focus:border-brown-500 placeholder:text-gray-300"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-600 hover:text-gray-800"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? t('checkout.hide', 'Skrij') : t('checkout.show', 'Pokaži')}
                </button>
              </div>

              {/* Password strength meter */}
              {formData.password && (
                <div className="mt-2">
                  <PasswordStrengthMeter password={formData.password} />
                  {showPassword && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                      <p className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                        {t('auth.passwordVisibilityWarning', 'Geslo je trenutno vidno. Prepričajte se, da vas nihče ne opazuje.')}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                {t('checkout.confirmPassword', 'Ponovite geslo')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange(e)}
                  required
                  placeholder="********"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brown-500 focus:border-brown-500 placeholder:text-gray-300"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-600 hover:text-gray-800"
                >
                  {showPassword ? t('checkout.hide', 'Skrij') : t('checkout.show', 'Pokaži')}
                </button>
              </div>
            </div>

            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <>
                {/* Full Name */}
                <div className="mb-4">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    {t('checkout.fullName', 'Full Name')}
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange(e)}
                    required
                    placeholder={t('checkout.form.namePlaceholder', 'Janez Novak')}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brown-500 focus:border-brown-500 placeholder:text-gray-300"
                  />
                </div>

                {/* Email */}
                <div className="mb-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    {t('checkout.email', 'Email')}
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange(e)}
                    required
                    placeholder="email@example.com"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brown-500 focus:border-brown-500 placeholder:text-gray-300"
                  />
                </div>

                {/* Phone Number */}
                <div className="mb-6">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    {t('checkout.phone', 'Telefonska številka')}
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange(e)}
                    required
                    placeholder={getPhonePlaceholder(formData.country, t)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brown-500 focus:border-brown-500 placeholder:text-gray-300"
                  />
                </div>
              </>
            )}

            {/* Step 2: Shipping Information */}
            {currentStep === 2 && (
              <>
                {/* Street Address */}
                <div className="mb-4">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    {t('checkout.address', 'Street Address')}
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange(e)}
                    required
                    placeholder={t('checkout.form.addressPlaceholder', 'Slovenska cesta 1')}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brown-500 focus:border-brown-500 placeholder:text-gray-300"
                  />
                </div>

                {/* City */}
                <div className="mb-4">
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                    {t('checkout.city', 'City')}
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange(e)}
                    required
                    placeholder={t('checkout.form.cityPlaceholder', 'Ljubljana')}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brown-500 focus:border-brown-500 placeholder:text-gray-300"
                  />
                </div>

                {/* Postal Code */}
                <div className="mb-4">
                  <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
                    {t('checkout.postalCode', 'Poštna številka')}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="postalCode"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={(e) => handleInputChange(e)}
                      required
                      maxLength={4}
                      placeholder="1000"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brown-500 focus:border-brown-500 placeholder:text-gray-300"
                    />
                    {postalSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                        {postalSuggestions.map((suggestion) => (
                          <button
                            key={suggestion.code}
                            type="button"
                            onClick={() => {
                              handleInputChange('postalCode', suggestion.code);
                              handleInputChange('city', suggestion.city);
                              setPostalSuggestions([]);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100"
                          >
                            {suggestion.code} - {suggestion.city}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <small className="text-sm text-gray-500">
                    {t('checkout.postalCodeFormat', 'Vnesite 4-mestno poštno številko')}
                  </small>
                </div>

                {/* Country */}
                <div className="mb-4">
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                    {t('checkout.country', 'Država')}
                  </label>
                  <select
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={(e) => handleInputChange(e)}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brown-500 focus:border-brown-500"
                  >
                    <option value="Slovenija">Slovenija</option>
                    <option value="Hrvaška">Hrvaška</option>
                    <option value="Avstrija">Avstrija</option>
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Use address for shipping checkbox - Only show in Step 2 */}
          {currentStep === 2 && (
            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={true} // Always checked for simplicity
                  className="h-4 w-4 text-brown-600 focus:ring-brown-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">{t('checkout.useAddressForShipping', 'Ta naslov uporabi tudi za dostavo')}</span>
              </label>
            </div>
          )}

          {/* Step 3: Payment Method */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">{t('checkout.paymentMethod', 'Način plačila')}</h3>

              {/* Payment Method Options */}
              <div className="space-y-4">
                <div className="relative border rounded-md p-4 flex cursor-pointer bg-white">
                  <input
                    id="payment-method-card"
                    name="payment-method"
                    type="radio"
                    className="h-4 w-4 text-brown-600 focus:ring-brown-500 border-gray-300"
                    defaultChecked
                  />
                  <label htmlFor="payment-method-card" className="ml-3 flex flex-col cursor-pointer">
                    <span className="block text-sm font-medium text-gray-900">
                      {t('checkout.creditCard', 'Kreditna kartica')}
                    </span>
                    <span className="block text-sm text-gray-500">
                      {t('checkout.securePayment', 'Varno plačilo s kreditno kartico')}
                    </span>
                    <div className="mt-2 flex space-x-2">
                      <img src="/images/visa.svg" alt="Visa" className="h-8" />
                      <img src="/images/mastercard.svg" alt="Mastercard" className="h-8" />
                    </div>
                  </label>
                </div>

                <div className="relative border rounded-md p-4 flex cursor-pointer bg-white">
                  <input
                    id="payment-method-paypal"
                    name="payment-method"
                    type="radio"
                    className="h-4 w-4 text-brown-600 focus:ring-brown-500 border-gray-300"
                  />
                  <label htmlFor="payment-method-paypal" className="ml-3 flex flex-col cursor-pointer">
                    <span className="block text-sm font-medium text-gray-900">PayPal</span>
                    <span className="block text-sm text-gray-500">
                      {t('checkout.payWithPaypal', 'Plačaj s PayPal računom')}
                    </span>
                    <div className="mt-2">
                      <img src="/images/paypal.svg" alt="PayPal" className="h-8" />
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Error Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
              {error}
            </div>
          )}
          {authError && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
              {authError}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center">
            {/* Back Button - Different behavior based on current step */}
            <button
              type="button"
              onClick={() => {
                if (currentStep > 1) {
                  // If we're not on the first step, go to previous step
                  goToPreviousStep();
                } else {
                  // If we're on the first step, go back to selection
                  setAuthSubState('initial');
                }
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brown-500"
            >
              {currentStep > 1 ? t('checkout.previousStep', 'Prejšnji korak') : t('checkout.back', 'Nazaj')}
            </button>

            {/* Continue/Submit Button - Different behavior based on current step */}
            <button
              type="button" /* Changed from submit to button to prevent form submission */
              onClick={() => {
                if (validateCurrentStep()) {
                  if (currentStep < checkoutSteps.length) {
                    // If not on the last step, go to next step
                    goToNextStep();
                  } else {
                    // If on the last step, submit the form
                    handleSubmit(new Event('submit') as unknown as React.FormEvent);
                  }
                }
              }}
              disabled={isSubmitting}
              className="bg-brown-600 text-white px-6 py-2 rounded-md hover:bg-brown-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brown-500"
            >
              {isSubmitting ? (
                <span>{t('checkout.submitting', 'Processing...')}</span>
              ) : currentStep === 1 ? (
                <span>{t('checkout.continueToShipping', 'Nadaljuj na dostavo')}</span>
              ) : currentStep === 2 ? (
                <span>{t('checkout.continueToPayment', 'Nadaljuj na plačilo')}</span>
              ) : (
                <span>{t('checkout.placeOrder', 'Oddaj naročilo')}</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 2 & 3: Form (Guest or Auth) */}
      {(checkoutStep === 'guest_form' || (checkoutStep === 'auth_form' && authSubState === 'loggedIn')) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Order Summary - Always visible on all steps */}
          <div className="order-last md:order-first">
            {/* Use the new CheckoutSummary component */}
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

            {/* Back button if not logged in initially */}
            {checkoutStep !== 'selection' && !user && (
              <div className="mt-4">
                <button
                  onClick={() => {
                    setCheckoutStep('selection');
                    setError(null);
                    setAuthError(null);
                  }}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {t('checkout.backToOptions', 'Nazaj na možnosti')}
                </button>
              </div>
            )}
          </div>

          {/* Shipping & Payment Form */}
          <div>
            <form onSubmit={handleSubmit}>
              {/* Display general submission errors */}
              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
                  {error}
                </div>
              )}

               {/* User Account Info (Only shown when logged in) */}
               {checkoutStep === 'auth_form' && authSubState === 'loggedIn' && (
                 <div className="mb-6 p-4 border rounded bg-gray-50">
                    <h2 className="text-lg font-semibold mb-3">{t('checkout.accountInfo', 'Podatki o računu')}</h2>
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-green-700">{t('checkout.loggedInAs', 'Prijava kot:')} <strong>{user?.email}</strong></p>
                        <button type="button" onClick={signOut} className="text-sm text-red-600 hover:underline">
                            {t('auth.logout', 'Odjava')}
                        </button>
                    </div>
                 </div>
               )}


               {/* Shipping Information */}
               <h2 className="text-xl font-semibold mb-4">{t('checkout.shippingInfo', 'Podatki za dostavo')}</h2>
               {/* Show email field for guests */}
               {checkoutStep === 'guest_form' && (
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">{t('checkout.form.email', 'Email naslov')}</label>
                        <input type="email" id="email" name="email" value={formData.email} onChange={(e) => handleInputChange(e)} required
                          placeholder={t('checkout.form.emailPlaceholder', 'janez.novak@primer.si')}
                          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-brown-500 focus:border-brown-500 placeholder:text-gray-300 ${fieldErrors.email ? 'border-red-500' : 'border-gray-300'}`} />
                        {fieldErrors.email && <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>}
                    </div>
               )}

              <div className="grid grid-cols-1 gap-4 mb-6">
                {/* Name, Phone, Address fields */}
                 <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">{t('checkout.form.name', 'Polno ime')}</label>
                  <input type="text" id="name" name="name" value={formData.name} onChange={(e) => handleInputChange(e)} required
                    placeholder={t('checkout.form.namePlaceholder', 'Janez Novak')}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-brown-500 focus:border-brown-500 placeholder:text-gray-300 ${fieldErrors.name ? 'border-red-500' : 'border-gray-300'}`} />
                  {fieldErrors.name && <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>}
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">{t('checkout.form.phone', 'Telefonska številka')}</label>
                  <input type="tel" id="phone" name="phone" value={formData.phone} onChange={(e) => handleInputChange(e)} required
                    placeholder={getPhonePlaceholder(formData.country, t)}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-brown-500 focus:border-brown-500 placeholder:text-gray-300 ${fieldErrors.phone ? 'border-red-500' : 'border-gray-300'}`} />
                  {fieldErrors.phone && <p className="mt-1 text-sm text-red-600">{fieldErrors.phone}</p>}
                </div>
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">{t('checkout.form.address', 'Naslov ulice')}</label>
                  <input type="text" id="address" name="address" value={formData.address} onChange={(e) => handleInputChange(e)} required
                    placeholder={t('checkout.form.addressPlaceholder', 'Slovenska cesta 1')}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-brown-500 focus:border-brown-500 placeholder:text-gray-300 ${fieldErrors.address ? 'border-red-500' : 'border-gray-300'}`} />
                  {fieldErrors.address && <p className="mt-1 text-sm text-red-600">{fieldErrors.address}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">{t('checkout.form.city', 'Mesto')}</label>
                    <input type="text" id="city" name="city" value={formData.city} onChange={(e) => handleInputChange(e)} required
                      placeholder={t('checkout.form.cityPlaceholder', 'Ljubljana')}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-brown-500 focus:border-brown-500 placeholder:text-gray-300 ${fieldErrors.city ? 'border-red-500' : 'border-gray-300'}`} />
                    {fieldErrors.city && <p className="mt-1 text-sm text-red-600">{fieldErrors.city}</p>}
                  </div>
                  <div>
                    <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">{t('checkout.form.postalCode', 'Poštna številka')}</label>
                    <div className="relative">
                      <input
                        type="text"
                        id="postalCode"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={(e) => handleInputChange(e)}
                        required
                        maxLength={4}
                        placeholder="1000"
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-brown-500 focus:border-brown-500 placeholder:text-gray-300 ${fieldErrors.postalCode ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {postalSuggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                          {postalSuggestions.map((suggestion) => (
                            <button
                              key={suggestion.code}
                              type="button"
                              onClick={() => {
                                handleInputChange('postalCode', suggestion.code);
                                handleInputChange('city', suggestion.city);
                                setPostalSuggestions([]);
                              }}
                              className="w-full px-4 py-2 text-left hover:bg-gray-100"
                            >
                              {suggestion.code} - {suggestion.city}
                            </button>
                          ))}
                        </div>
                      )}
                      <small className="form-text text-muted">
                        {t('checkout.postalCodeFormat', 'Enter a 4-digit postal code')}
                      </small>
                      {fieldErrors.postalCode && <p className="mt-1 text-sm text-red-600">{fieldErrors.postalCode}</p>}
                    </div>
                  </div>
                </div>
                 <div>
                   <label htmlFor="country" className="block text-sm font-medium text-gray-700">{t('checkout.form.country', 'Država')}</label>
                   <select
                     id="country"
                     name="country"
                     value={formData.country}
                     onChange={(e) => handleInputChange(e)}
                     required
                     className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brown-500 focus:border-brown-500"
                   >
                     <option value="Slovenija">Slovenija</option>
                     <option value="Hrvaška">Hrvaška</option>
                     <option value="Avstrija">Avstrija</option>
                   </select>
                 </div>

                 {/* Gift Recipient Address Form - only shown when there are gift items in the cart */}
                 <GiftRecipientAddressForm
                   hasGiftItems={giftOptionId !== null || giftProductId !== null || gifts.length > 0}
                   onAddressChange={(useGiftAddress, address) => {
                     setUseGiftRecipientAddress(useGiftAddress);
                     setGiftRecipientAddress(address);
                   }}
                 />

                 <div>
                   <label htmlFor="notes" className="block text-sm font-medium text-gray-700">{t('checkout.form.notes', 'Opombe k naročilu (neobvezno)')}</label>
                   <textarea id="notes" name="notes" value={formData.notes} onChange={(e) => handleInputChange(e)} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brown-500 focus:border-brown-500"></textarea>
                 </div>
              </div>

              {/* Discount Code */}
              <div className="mt-6">
                <DiscountCodeInput
                  orderTotal={subtotal}
                  onApply={(discount) => setAppliedDiscount(discount)}
                />
              </div>




              {/* Payment Information */}
              <div className="mt-6 border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">{t('checkout.paymentInfo', 'Podatki o plačilu')}</h3>
                 <fieldset>
                   <legend className="sr-only">{t('checkout.paymentMethod', 'Način plačila')}</legend>
                   <div className="space-y-4">
                     {/* Pay on Delivery */}
                     <div className="flex items-center">
                       <input
                         id="pay_on_delivery"
                         name="paymentMethod"
                         type="radio"
                         value="pay_on_delivery"
                         checked={paymentMethod === 'pay_on_delivery'}
                         onChange={handlePaymentChange}
                         required
                         className="focus:ring-brown-500 h-4 w-4 text-brown-600 border-gray-300"
                       />
                       <label htmlFor="pay_on_delivery" className="ml-3 block text-sm font-medium text-gray-700">
                         {t('checkout.paymentOptions.payOnDelivery', 'Plačilo po povzetju')}
                       </label>
                     </div>
                     {/* Direct Bank Transfer */}
                     <div className="flex items-center">
                       <input
                         id="bank_transfer"
                         name="paymentMethod"
                         type="radio"
                         value="bank_transfer"
                         checked={paymentMethod === 'bank_transfer'}
                         onChange={handlePaymentChange}
                         required
                         className="focus:ring-brown-500 h-4 w-4 text-brown-600 border-gray-300"
                       />
                       <label htmlFor="bank_transfer" className="ml-3 block text-sm font-medium text-gray-700">
                         {t('checkout.paymentOptions.bankTransfer', 'Neposredno bančno nakazilo')}
                       </label>
                     </div>

                     {/* Credit Card (Stripe) */}
                     <div className="flex items-center">
                       <input
                         id="credit_card"
                         name="paymentMethod"
                         type="radio"
                         value="credit_card"
                         checked={paymentMethod === 'credit_card'}
                         onChange={handlePaymentChange}
                         required
                         className="focus:ring-brown-500 h-4 w-4 text-brown-600 border-gray-300"
                       />
                       <label htmlFor="credit_card" className="ml-3 block text-sm font-medium text-gray-700">
                         {t('checkout.paymentOptions.creditCard', 'Kreditna kartica (Stripe)')}
                       </label>
                     </div>
                   </div>
                 </fieldset>
                 <p className="mt-4 text-sm text-gray-600">
                   {paymentMethod === 'bank_transfer'
                     ? t('checkout.paymentInstructions.bankTransfer', 'Navodila za bančno nakazilo bodo poslana na vaš e-poštni naslov po potrditvi naročila.')
                     : paymentMethod === 'pay_on_delivery'
                     ? t('checkout.paymentInstructions.payOnDelivery', 'Prosimo, da imate ob dostavi pripravljen točen znesek.')
                     : paymentMethod === 'credit_card'
                     ? t('checkout.paymentInstructions.creditCard', 'Varno plačilo s kreditno kartico. Vaša kartica bo bremenjena takoj.')
                     : t('checkout.paymentInstructions.selectMethod', 'Izberite način plačila zgoraj.')}
                 </p>

                 {/* Stripe Payment Form */}
                 {paymentMethod === 'credit_card' && (
                   <div className="mt-4">
                     <StripePaymentForm
                       amount={subtotal}
                       onSuccess={(paymentIntentId) => {
                         console.log('Stripe payment successful with ID:', paymentIntentId);
                         setStripePaymentComplete(true);
                         setStripePaymentId(paymentIntentId);
                         setStripeError(null);

                         // The StripePaymentForm will automatically redirect to the order success page
                         // We don't need to do anything else here
                       }}
                       onError={(error) => {
                         console.error('Stripe payment error:', error);
                         setStripeError(error);
                         setStripePaymentComplete(false);
                         setStripePaymentId(null);
                       }}
                       disabled={isSubmitting}
                       orderId={null}
                       shippingAddress={{
                         name: formData.name,
                         address: formData.address,
                         city: formData.city,
                         postalCode: formData.postalCode,
                         country: formData.country,
                         phone: formData.phone,
                         email: formData.email
                       }}
                     />
                     {stripeError && (
                       <div className="mt-2 text-sm text-red-600">
                         {stripeError}
                       </div>
                     )}
                   </div>
                 )}
              </div>



              {/* Place Order Button */}
              <div className="mt-8 border-t pt-6">
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    (cart.length === 0 && gifts.length === 0) ||
                    loadingDetails ||
                    !paymentMethod ||
                    checkingEmail ||
                    authLoading ||
                    (paymentMethod === 'credit_card' && !stripePaymentComplete) // Disable if credit card payment is not complete
                  }
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white ${
                    isSubmitting || (cart.length === 0 && gifts.length === 0) || loadingDetails || !paymentMethod || checkingEmail || authLoading ||
                    (paymentMethod === 'credit_card' && !stripePaymentComplete)
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-brown-600 hover:bg-brown-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brown-500'
                  }`}
                >
                  {isSubmitting ? t('checkout.submitting', 'Oddajanje naročila...') : t('checkout.placeOrder', 'Oddaj naročilo')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
