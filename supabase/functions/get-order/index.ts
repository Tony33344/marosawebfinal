// get-order — returns a single order for the success page.
// The order UUID (or Stripe payment_intent_id) acts as the access token;
// anon callers can fetch exactly one order by its unguessable id.
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
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
    let orderId: string | null = null;
    let paymentId: string | null = null;

    if (req.method === 'GET') {
      const url = new URL(req.url);
      orderId = url.searchParams.get('order_id');
      paymentId = url.searchParams.get('payment_id');
    } else {
      const body = await req.json().catch(() => ({}));
      orderId = body.orderId ?? null;
      paymentId = body.paymentId ?? null;
    }

    if (!orderId && !paymentId) {
      return respond({ error: 'orderId or paymentId required' }, 400);
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    let query = supabase
      .from('orders')
      .select('id, order_number, total_price, status, payment_status, payment_method, items, shipping_address, shipping_cost, discount_amount, created_at');

    query = orderId ? query.eq('id', orderId) : query.eq('payment_intent_id', paymentId);

    const { data: order, error } = await query.maybeSingle();
    if (error) {
      console.error('get-order error:', error);
      return respond({ error: 'Lookup failed' }, 500);
    }
    if (!order) {
      return respond({ error: 'Order not found' }, 404);
    }

    // items/shipping_address are stored as JSON strings
    for (const key of ['items', 'shipping_address'] as const) {
      if (typeof order[key] === 'string') {
        try { order[key] = JSON.parse(order[key]); } catch { /* leave as-is */ }
      }
    }

    return respond({ order });
  } catch (error: any) {
    console.error('get-order error:', error);
    return respond({ error: error.message }, 500);
  }
});
