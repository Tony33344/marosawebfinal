// send-email — internal email gateway (Google Apps Script).
//
// SECURITY: This function only accepts calls authenticated with the
// service role key. Browsers/anon keys get 403 — it is called by other
// edge functions (create-order, stripe-webhook, newsletter,
// send-registration-email), never directly by the frontend.
//
// Types:
//   order-confirmation  { orderId }            — order data fetched from DB
//   newsletter          { to, subject, body }  — html/text built by caller fn
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { getSecureCorsHeaders, handleCorsPreflightRequest } from '../secure-cors-headers.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const ORDERS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw2pysAAgrqlkDA85BghF4QM9sCbDjFdogrIHRDA3UDpMo-8SsttlsUXMmATz-kRdSDSg/exec';
const NEWSLETTER_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyHXEz-OkuzmU1Gth6e9xHiZ4GNDILrWRz_DUqud6VlLNf6AK6YM9zzHlpkD4sfr6tcRQ/exec';

const ORDERS_FROM = 'kmetija.marosa.narocila@gmail.com';
const NEWSLETTER_FROM = 'kmetija.marosa.novice@gmail.com';

serve(async (req: Request) => {
  const preflight = handleCorsPreflightRequest(req);
  if (preflight) return preflight;
  const corsHeaders = getSecureCorsHeaders(req);

  const respond = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    // --- service-role-key auth only ---
    const authHeader = req.headers.get('Authorization') ?? '';
    if (authHeader !== `Bearer ${SERVICE_KEY}`) {
      return respond({ success: false, error: 'Forbidden' }, 403);
    }

    const payload = await req.json();
    const { type } = payload;

    // ---------- order-confirmation ----------
    if (type === 'order-confirmation') {
      const { orderId } = payload;
      if (!orderId) return respond({ success: false, error: 'orderId required' }, 400);

      const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
      const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error || !order) {
        return respond({ success: false, error: 'Order not found' }, 404);
      }

      const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
      const shippingAddress = typeof order.shipping_address === 'string'
        ? JSON.parse(order.shipping_address)
        : order.shipping_address;

      const displayOrderNumber = order.order_number
        ? String(order.order_number)
        : String(order.id).substring(0, 8).toUpperCase();

      const scriptData = {
        to: shippingAddress?.email,
        subject: `Kmetija Maroša - Potrditev naročila #${displayOrderNumber}`,
        from: ORDERS_FROM,
        replyTo: ORDERS_FROM,
        orderId: displayOrderNumber,
        orderNumber: displayOrderNumber,
        customerName: shippingAddress?.name,
        customerEmail: shippingAddress?.email,
        adminEmail: ORDERS_FROM,
        orderTotal: Number(order.total_price).toFixed(2),
        paymentMethod: order.payment_method,
        orderItems: (items ?? []).map((item: any) => ({
          product_name: item.product_name || '',
          package_description: item.package_description || '',
          quantity: item.quantity || 0,
          price_per_unit: item.price_per_unit || 0,
          line_total: item.line_total || 0,
        })),
        shippingAddress,
        orderDate: order.created_at,
        replyToEmail: ORDERS_FROM,
      };

      const scriptRes = await fetch(ORDERS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scriptData),
      });
      const text = await scriptRes.text();
      let parsed: unknown = text;
      try { parsed = JSON.parse(text); } catch { /* non-JSON */ }

      return respond({ success: true, googleScriptResponse: parsed });
    }

    // ---------- newsletter (internal callers only) ----------
    if (type === 'newsletter') {
      const { to, subject, body } = payload;
      if (!to || !subject || !body) {
        return respond({ success: false, error: 'to, subject and body are required' }, 400);
      }
      if (!/\S+@\S+\.\S+/.test(to)) {
        return respond({ success: false, error: 'Invalid recipient' }, 400);
      }

      const scriptRes = await fetch(NEWSLETTER_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          subject,
          body: typeof body === 'string' ? body : JSON.stringify(body),
          from: NEWSLETTER_FROM,
          replyTo: NEWSLETTER_FROM,
        }),
      });
      const text = await scriptRes.text();
      let parsed: unknown = text;
      try { parsed = JSON.parse(text); } catch { /* non-JSON */ }

      return respond({ success: true, googleScriptResponse: parsed });
    }

    return respond({ success: false, error: 'Unknown email type' }, 400);
  } catch (error: any) {
    console.error('send-email error:', error);
    return respond({ success: false, error: error.message ?? 'Internal error' }, 500);
  }
});
