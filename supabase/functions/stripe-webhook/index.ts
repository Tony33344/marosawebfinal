// stripe-webhook — receives Stripe events, verifies the signature, and
// reconciles order payment state. Deployed with --no-verify-jwt (Stripe
// calls it without a Supabase JWT; the Stripe signature IS the auth).
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import Stripe from 'https://esm.sh/stripe@12.4.0?dts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

serve(async (req) => {
  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!stripeSecretKey || !webhookSecret) {
    console.error('Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET');
    return new Response(JSON.stringify({ error: 'Server configuration error' }), { status: 500 });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response(JSON.stringify({ error: 'Missing stripe-signature header' }), { status: 400 });
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object as Stripe.PaymentIntent;
      const orderId = pi.metadata?.order_id;

      const query = supabase.from('orders').update({
        payment_status: 'paid',
        status: 'processing',
        payment_intent_id: pi.id,
      });
      const { data: updated, error } = orderId
        ? await query.eq('id', orderId).neq('payment_status', 'paid').select('id').single()
        : await query.eq('payment_intent_id', pi.id).neq('payment_status', 'paid').select('id').single();

      if (error) {
        // Not an error if already processed (Stripe retries)
        console.log('Order already marked paid or not found:', orderId ?? pi.id);
      } else if (updated) {
        // Send order confirmation now that payment succeeded
        try {
          await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SERVICE_KEY}`,
              'apikey': SERVICE_KEY,
            },
            body: JSON.stringify({ type: 'order-confirmation', orderId: updated.id }),
          });
        } catch (e) {
          console.error('Failed to send order confirmation email:', e);
        }
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      const pi = event.data.object as Stripe.PaymentIntent;
      await supabase
        .from('orders')
        .update({ payment_status: 'failed' })
        .eq('payment_intent_id', pi.id)
        .neq('payment_status', 'paid');
    }
  } catch (e) {
    console.error('Webhook handler error:', e);
    // Still return 200 — Stripe retries on non-2xx and the failure is logged
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});
