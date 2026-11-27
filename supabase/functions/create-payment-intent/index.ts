// create-payment-intent — creates a Stripe PaymentIntent for an EXISTING
// order. The amount is read from the order row server-side; the client
// can no longer set prices.
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import Stripe from 'https://esm.sh/stripe@12.4.0?dts';
import { getSecureCorsHeaders, handleCorsPreflightRequest } from '../secure-cors-headers.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

serve(async (req) => {
  const preflight = handleCorsPreflightRequest(req);
  if (preflight) return preflight;
  const corsHeaders = getSecureCorsHeaders(req);

  const respond = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      console.error('Stripe secret key is missing in environment variables');
      return respond({ error: 'Server configuration error' }, 500);
    }

    const { orderId } = await req.json();
    if (!orderId || typeof orderId !== 'string') {
      return respond({ error: 'orderId is required' }, 400);
    }

    // Fetch the order — the amount comes from here, never from the client.
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, order_number, total_price, payment_status, payment_method, payment_intent_id')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return respond({ error: 'Order not found' }, 404);
    }
    if (order.payment_method !== 'credit_card') {
      return respond({ error: 'Order is not a card payment' }, 400);
    }
    if (order.payment_status === 'paid') {
      return respond({ error: 'Order is already paid' }, 400);
    }

    const amount = Math.round(Number(order.total_price) * 100);
    if (!amount || amount <= 0) {
      return respond({ error: 'Invalid order total' }, 400);
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'eur',
        automatic_payment_methods: { enabled: true },
        metadata: {
          order_id: order.id,
          order_number: String(order.order_number ?? ''),
        },
      });

      await supabase
        .from('orders')
        .update({
          payment_intent_id: paymentIntent.id,
          payment_status: 'awaiting_payment',
        })
        .eq('id', order.id);

      return respond({ clientSecret: paymentIntent.client_secret });
    } catch (stripeError: any) {
      console.error('Stripe API error:', stripeError);
      return respond({ error: `Stripe API error: ${stripeError.message}` }, 500);
    }
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    return respond({ error: error.message }, 500);
  }
});
