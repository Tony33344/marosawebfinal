import React, { useState, useRef } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabaseClient';

interface StripePaymentFormProps {
  // Creates the order server-side and returns its id. Called when the user
  // clicks "Pay Now" — the order must exist before a payment intent is made.
  createOrder: () => Promise<{ orderId: string; orderNumber?: number; totalPrice?: number }>;
  onSuccess: (orderId: string) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

export const StripePaymentForm: React.FC<StripePaymentFormProps> = ({
  createOrder,
  onSuccess,
  onError,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  // Track if there's an in-flight payment to prevent duplicate submissions
  const [hasInFlightPayment, setHasInFlightPayment] = useState(false);

  // Cache order + PI so a retry after a declined/incomplete card reuses the
  // same order instead of creating a duplicate `awaiting_payment` order.
  const pendingRef = useRef<{ orderId: string; clientSecret: string } | null>(null);

  const handleSubmit = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    // Prevent multiple submissions
    if (hasInFlightPayment || isProcessing) {
      return;
    }

    if (!stripe || !elements) {
      setCardError('Stripe is not initialized. Please refresh the page and try again.');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setCardError('Card element not found. Please refresh the page and try again.');
      return;
    }

    setIsProcessing(true);
    setHasInFlightPayment(true);
    setCardError(null);

    try {
      let orderId: string;
      let clientSecret: string;

      if (pendingRef.current) {
        ({ orderId, clientSecret } = pendingRef.current);
      } else {
        // 1. Create the order first — server-side pricing, real row in `orders`
        const order = await createOrder();
        orderId = order.orderId;

        // 2. Create a payment intent bound to that order (amount set server-side)
        const { data: paymentIntent, error: intentError } = await supabase.functions.invoke('create-payment-intent', {
          body: { orderId }
        });

        if (intentError || !paymentIntent?.clientSecret) {
          throw new Error(intentError?.message || t('checkout.paymentError', 'Failed to create payment'));
        }
        clientSecret = paymentIntent.clientSecret;
        pendingRef.current = { orderId, clientSecret };
      }

      // 3. Confirm the payment with the card element (handles 3DS)
      const { error: paymentError, paymentIntent: confirmedIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      );

      if (paymentError) {
        throw new Error(paymentError.message || t('checkout.paymentFailed', 'Payment failed'));
      }

      if (!confirmedIntent || confirmedIntent.status !== 'succeeded') {
        throw new Error(t('checkout.paymentNotCompleted', `Payment not completed. Status: ${confirmedIntent?.status ?? 'unknown'}`));
      }

      // 4. Order exists + payment succeeded — the webhook marks it paid.
      pendingRef.current = null;
      onSuccess(orderId);
    } catch (error: any) {
      setCardError(error.message || t('checkout.paymentProcessingError', 'Error processing payment'));
      onError(error.message || t('checkout.paymentProcessingError', 'Error processing payment'));
    } finally {
      setIsProcessing(false);
      setHasInFlightPayment(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <div className="mt-4 space-y-4">
      <div className="p-4 border border-gray-300 rounded-md bg-white">
        <CardElement options={cardElementOptions} />
      </div>

      {cardError && (
        <div className="text-red-600 text-sm mt-2">
          {cardError}
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!stripe || isProcessing || hasInFlightPayment || disabled}
        className={`w-full py-2 px-4 rounded-md text-white font-medium ${
          !stripe || isProcessing || hasInFlightPayment || disabled
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700'
        }`}
      >
        {isProcessing ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {t('checkout.processing', 'Processing...')}
          </span>
        ) : (
          t('checkout.payNow', 'Pay Now')
        )}
      </button>
    </div>
  );
};
