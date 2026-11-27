// create-order — authoritative order creation.
// The client sends items + customer data; ALL pricing is recomputed
// server-side from the products/gift_packages/gift_options tables.
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { getSecureCorsHeaders, handleCorsPreflightRequest } from '../secure-cors-headers.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const SHIPPING_COST = 3.90;
const FREE_SHIPPING_THRESHOLD = 50;

const PAYMENT_METHODS = ['credit_card', 'pay_on_delivery', 'bank_transfer'];

const PAYMENT_METHOD_LABELS: Record<string, Record<string, string>> = {
  credit_card:      { sl: 'Kreditna kartica (Stripe)', en: 'Credit card (Stripe)', de: 'Kreditkarte (Stripe)', hr: 'Kreditna kartica (Stripe)' },
  pay_on_delivery:  { sl: 'Plačilo po povzetju', en: 'Cash on delivery', de: 'Nachnahme', hr: 'Plaćanje pouzećem' },
  bank_transfer:    { sl: 'Neposredno bančno nakazilo', en: 'Direct bank transfer', de: 'Direkte Banküberweisung', hr: 'Izravna bankovna uplata' },
};

function json(res: unknown, status: number, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(res), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function fail(message: string, status: number, corsHeaders: Record<string, string>) {
  return json({ error: message }, status, corsHeaders);
}

function generateUUID(): string {
  return crypto.randomUUID();
}

serve(async (req) => {
  const preflight = handleCorsPreflightRequest(req);
  if (preflight) return preflight;
  const corsHeaders = getSecureCorsHeaders(req);

  try {
    const body = await req.json();
    const {
      customer,
      items,
      gifts = [],
      discountCode,
      paymentMethod,
      giftOptionId,
      giftProduct,
      lang = 'sl',
      notes = '',
    } = body;

    // ---------- input validation ----------
    if (!customer || typeof customer !== 'object') {
      return fail('Missing customer data', 400, corsHeaders);
    }
    for (const f of ['name', 'email', 'phone', 'address', 'city', 'postalCode', 'country']) {
      if (!customer[f] || typeof customer[f] !== 'string' || !customer[f].trim()) {
        return fail(`Missing required field: ${f}`, 400, corsHeaders);
      }
    }
    if (!/\S+@\S+\.\S+/.test(customer.email)) {
      return fail('Invalid email address', 400, corsHeaders);
    }
    if (!PAYMENT_METHODS.includes(paymentMethod)) {
      return fail('Invalid payment method', 400, corsHeaders);
    }
    if ((!Array.isArray(items) || items.length === 0) && (!Array.isArray(gifts) || gifts.length === 0)) {
      return fail('Cart is empty', 400, corsHeaders);
    }

    // ---------- clients ----------
    const serviceClient = createClient(SUPABASE_URL, SERVICE_KEY);
    const authClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    });
    const { data: { user } } = await authClient.auth.getUser();
    const userId = user?.id ?? null;

    // ---------- fetch products ----------
    const productIds = new Set<string>();
    for (const it of items ?? []) productIds.add(String(it.productId));
    for (const g of gifts ?? []) {
      for (const gp of g.gift_products ?? []) productIds.add(String(gp.product_id));
    }
    if (giftProduct?.productId) productIds.add(String(giftProduct.productId));

    const { data: products, error: prodErr } = await serviceClient
      .from('products')
      .select('*')
      .in('id', [...productIds]);
    if (prodErr) return fail('Failed to load products', 500, corsHeaders);

    const productMap = new Map((products ?? []).map((p: any) => [String(p.id), p]));

    const findPackageOption = (productId: string, packageOptionId: string) => {
      const product = productMap.get(String(productId));
      if (!product || product.isActive === false) return null;
      const options = typeof product.package_options === 'string'
        ? JSON.parse(product.package_options)
        : product.package_options;
      return (options ?? []).find((o: any) => o.uniq_id === packageOptionId) ?? null;
    };

    // ---------- price regular items ----------
    const orderItems: any[] = [];
    let subtotal = 0;

    for (const it of items ?? []) {
      const qty = Math.floor(Number(it.quantity));
      if (!qty || qty < 1 || qty > 100) return fail('Invalid item quantity', 400, corsHeaders);
      const opt = findPackageOption(it.productId, it.packageOptionId);
      if (!opt) return fail(`Unknown product or package option: ${it.productId}`, 400, corsHeaders);
      const product = productMap.get(String(it.productId));
      const unitPrice = Number(opt.price);
      orderItems.push({
        product_id: it.productId,
        product_name: product[`name_${lang}`] || product.name,
        package_option_id: opt.uniq_id,
        package_description: opt.weight || opt.description || '',
        quantity: qty,
        price_per_unit: unitPrice,
        line_total: unitPrice * qty,
        is_gift: false,
      });
      subtotal += unitPrice * qty;
    }

    // ---------- price gift packages ----------
    for (const g of gifts ?? []) {
      const qty = Math.floor(Number(g.quantity)) || 1;
      const { data: pkg } = await serviceClient
        .from('gift_packages')
        .select('*')
        .eq('id', g.gift_package_id)
        .single();
      if (!pkg) return fail(`Unknown gift package: ${g.gift_package_id}`, 400, corsHeaders);

      let giftPrice = Number(pkg.base_price) || 0;
      const giftProductsDesc: string[] = [];
      for (const gp of g.gift_products ?? []) {
        const gpQty = Math.floor(Number(gp.quantity)) || 1;
        const opt = findPackageOption(gp.product_id, gp.package_option_id);
        if (!opt) return fail(`Unknown gift product option: ${gp.product_id}`, 400, corsHeaders);
        const product = productMap.get(String(gp.product_id));
        giftPrice += Number(opt.price) * gpQty;
        giftProductsDesc.push(`${product.name} (${opt.weight || opt.description || ''})`);
      }

      let detailedDescription = `Darilni paket: ${g.name || pkg.name}\n`;
      if (g.recipient_name) detailedDescription += `Prejemnik: ${g.recipient_name}\n`;
      if (g.recipient_message) detailedDescription += `Sporočilo: ${g.recipient_message}\n`;
      if (giftProductsDesc.length) {
        detailedDescription += `\nVsebina darila:\n`;
        giftProductsDesc.forEach((d, i) => { detailedDescription += `${i + 1}. ${d}\n`; });
      }

      orderItems.push({
        product_id: g.id,
        product_name: `${g.name || pkg.name} - Darilo`,
        package_option_id: g.id,
        package_description: detailedDescription,
        quantity: qty,
        price_per_unit: giftPrice,
        line_total: giftPrice * qty,
        is_gift: true,
        gift_details: JSON.stringify(g),
      });
      subtotal += giftPrice * qty;
    }

    // ---------- gift option (wrapping) ----------
    let giftOptionCost = 0;
    if (giftOptionId) {
      const { data: opt } = await serviceClient
        .from('gift_options')
        .select('price, is_active')
        .eq('id', giftOptionId)
        .single();
      if (!opt || opt.is_active === false) return fail('Unknown gift option', 400, corsHeaders);
      giftOptionCost = Number(opt.price) || 0;
    }

    // ---------- extra gift product ----------
    let giftProductCost = 0;
    if (giftProduct?.productId && giftProduct?.packageOptionId) {
      const opt = findPackageOption(giftProduct.productId, giftProduct.packageOptionId);
      if (!opt) return fail('Unknown gift product', 400, corsHeaders);
      giftProductCost = Number(opt.price);
    }

    // ---------- discount ----------
    let discountAmount = 0;
    let discountCodeId: string | null = null;
    let discountRow: any = null;
    if (discountCode) {
      const { data: d } = await serviceClient
        .from('discount_codes')
        .select('*')
        .eq('code', String(discountCode).trim().toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (!d) return fail('Invalid discount code', 400, corsHeaders);
      const now = new Date();
      if (d.valid_from && new Date(d.valid_from) > now) return fail('Discount code not yet valid', 400, corsHeaders);
      if (d.valid_until && new Date(d.valid_until) < now) return fail('Discount code expired', 400, corsHeaders);
      if (d.max_uses != null && d.current_uses >= d.max_uses) return fail('Discount code fully used', 400, corsHeaders);
      if (d.min_order_amount != null && subtotal < Number(d.min_order_amount)) {
        return fail(`Minimum order amount is ${d.min_order_amount} €`, 400, corsHeaders);
      }

      const val = Number(d.discount_value) || 0;
      discountAmount = d.discount_type === 'percentage' ? (subtotal * val) / 100 : val;
      discountAmount = Math.max(0, discountAmount);
      discountCodeId = d.id;
      discountRow = d;
    }

    // ---------- totals ----------
    const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);
    const hasShippingFee = subtotalAfterDiscount < FREE_SHIPPING_THRESHOLD;
    const shippingCost = hasShippingFee ? SHIPPING_COST : 0;
    const total = subtotalAfterDiscount + shippingCost + giftOptionCost + giftProductCost;

    // ---------- profile ----------
    let profileId: string | null = null;
    if (userId) {
      const { data: existing } = await serviceClient
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
      profileId = existing?.id ?? userId;
      if (!existing) {
        await serviceClient.from('profiles').insert({
          id: userId,
          username: customer.email,
          full_name: customer.name,
          email: customer.email,
          telephone_nr: customer.phone,
          default_shipping_address: JSON.stringify({
            address: customer.address,
            city: customer.city,
            postalCode: customer.postalCode,
            country: customer.country,
          }),
        });
      }
    } else {
      profileId = generateUUID();
      const { error: profErr } = await serviceClient.from('profiles').insert({
        id: profileId,
        username: customer.email,
        full_name: customer.name,
        email: customer.email,
        telephone_nr: customer.phone,
        default_shipping_address: JSON.stringify({
          address: customer.address,
          city: customer.city,
          postalCode: customer.postalCode,
          country: customer.country,
        }),
      });
      if (profErr) return fail(`Profile creation failed: ${profErr.message}`, 500, corsHeaders);
    }

    // ---------- order number + insert ----------
    const { data: orderNumber, error: numErr } = await serviceClient.rpc('get_next_order_number');
    if (numErr || orderNumber == null) return fail('Failed to generate order number', 500, corsHeaders);

    const shippingAddress = {
      name: customer.name,
      address: customer.address,
      city: customer.city,
      postalCode: customer.postalCode,
      country: customer.country,
      phone: customer.phone,
      email: customer.email,
    };

    const orderNotes = `${notes} [Vmesna vsota: €${subtotal.toFixed(2)}] ${hasShippingFee ? `[Poštnina: €${shippingCost.toFixed(2)}]` : '[Brezplačna dostava]'}`.trim();

    const orderData: Record<string, unknown> = {
      profile_id: profileId,
      total_price: total,
      status: 'pending',
      items: JSON.stringify(orderItems),
      shipping_address: JSON.stringify(shippingAddress),
      notes: orderNotes,
      payment_method: paymentMethod,
      is_guest_order: !userId,
      shipping_cost: shippingCost,
      discount_amount: discountAmount,
      order_number: orderNumber,
      payment_status: paymentMethod === 'credit_card' ? 'awaiting_payment' : 'unpaid',
    };
    if (userId) orderData.user_id = userId;
    if (discountCodeId) orderData.discount_code_id = discountCodeId;
    if (giftOptionId) orderData.gift_option_id = giftOptionId;

    const { data: newOrder, error: orderErr } = await serviceClient
      .from('orders')
      .insert(orderData)
      .select('id, order_number')
      .single();

    if (orderErr) return fail(`Order creation failed: ${orderErr.message}`, 500, corsHeaders);

    // ---------- discount usage ----------
    if (discountRow) {
      await serviceClient
        .from('discount_codes')
        .update({ current_uses: (discountRow.current_uses ?? 0) + 1 })
        .eq('id', discountRow.id);
    }

    // ---------- confirmation email (non-card payments only; card emails
    // are sent by stripe-webhook once the payment actually succeeds) ----------
    if (paymentMethod !== 'credit_card') {
      try {
        await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'apikey': SERVICE_KEY,
          },
          body: JSON.stringify({ type: 'order-confirmation', orderId: newOrder.id, lang }),
        });
      } catch (e) {
        console.error('Failed to send order confirmation email:', e);
      }
    }

    return json({
      orderId: newOrder.id,
      orderNumber: newOrder.order_number,
      totalPrice: total,
      paymentStatus: orderData.payment_status,
    }, 200, corsHeaders);
  } catch (error: any) {
    console.error('create-order error:', error);
    return fail(error.message ?? 'Internal error', 500, corsHeaders);
  }
});
