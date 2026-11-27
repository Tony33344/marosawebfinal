// newsletter — subscribe / confirm / unsubscribe / update-preferences.
// All subscriber writes happen server-side with the service role;
// newsletter_subscribers has no public access at all.
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { getSecureCorsHeaders, handleCorsPreflightRequest, isAllowedOrigin } from '../secure-cors-headers.ts';
import { rateLimitOk, clientIp } from '../rate-limit.ts';
import { generateConfirmationEmailHtml, generateConfirmationEmailText } from './confirmationEmail.ts';
import { generateWelcomeEmailHtml, generateWelcomeEmailText } from './welcomeEmail.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
}

function siteBase(req: Request): string {
  const origin = req.headers.get('Origin');
  if (origin && isAllowedOrigin(origin)) return origin;
  const envUrl = Deno.env.get('SITE_URL');
  if (envUrl) return envUrl.replace(/\/$/, '');
  return 'https://marosaf1.netlify.app';
}

async function sendMail(to: string, subject: string, body: object) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY,
    },
    body: JSON.stringify({ type: 'newsletter', to, subject, body }),
  });
  return res.json().catch(() => ({}));
}

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
    const { action, ...payload } = await req.json();
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const base = siteBase(req);

    // ---------------- subscribe ----------------
    if (action === 'subscribe') {
      const email = String(payload.email ?? '').trim().toLowerCase();
      const { firstName, source = 'website', preferences, language = 'sl' } = payload;
      if (!email || !/\S+@\S+\.\S+/.test(email)) {
        return respond({ success: false, message: 'Invalid email' });
      }

      // 5 subscribes/IP/hour — caps mass-subscribing victim addresses
      // (per-email dedup is already handled by the unique constraint).
      if (!await rateLimitOk(supabase, `newsletter:ip:${clientIp(req)}`, 5, 3600)) {
        return respond({ success: false, message: 'rate_limited' });
      }

      const confirmationToken = generateToken();
      const unsubscribeToken = generateToken();

      const { error: insertError } = await supabase
        .from('newsletter_subscribers')
        .insert({
          email,
          name: firstName || null,
          is_active: true,
          confirmation_status: 'pending',
          confirmation_token: confirmationToken,
          unsubscribe_token: unsubscribeToken,
          source,
          preferences: preferences || { productUpdates: true, promotions: true, recipes: true },
        });

      if (insertError) {
        if (insertError.code === '23505') {
          return respond({ success: false, message: 'already_subscribed', isExisting: true });
        }
        console.error('Subscribe insert error:', insertError);
        return respond({ success: false, message: 'Failed to create subscription' });
      }

      const confirmationUrl = `${base}/confirm-subscription?${new URLSearchParams({ token: confirmationToken, lang: language })}`;
      const subject = language === 'sl' ? 'Potrdite prijavo na e-novice Kmetije Maroša'
        : language === 'de' ? 'Bestätigen Sie Ihr Abonnement des Kmetija Maroša Newsletters'
        : language === 'hr' ? 'Potvrdite pretplatu na bilten Kmetije Maroša'
        : 'Confirm Your Subscription to Kmetija Maroša Newsletter';

      await sendMail(email, subject, {
        html: generateConfirmationEmailHtml({ firstName, confirmationUrl, language }),
        text: generateConfirmationEmailText({ firstName, confirmationUrl, language }),
        isConfirmation: true,
      });

      return respond({ success: true, message: 'Subscription created' });
    }

    // ---------------- confirm ----------------
    if (action === 'confirm') {
      const token = String(payload.token ?? '');
      if (!token) return respond({ success: false, message: 'No token provided' });

      const { data: subscriber } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .eq('confirmation_token', token)
        .maybeSingle();

      if (!subscriber) {
        return respond({ success: false, message: 'Invalid or expired confirmation token' });
      }

      const result = {
        email: subscriber.email,
        firstName: subscriber.name,
        language: 'sl',
      };

      if (subscriber.confirmation_status === 'confirmed') {
        return respond({ success: true, message: 'already_confirmed', subscriber: result });
      }

      await supabase
        .from('newsletter_subscribers')
        .update({ confirmation_status: 'confirmed', confirmed_at: new Date().toISOString() })
        .eq('id', subscriber.id);

      const discountCode = subscriber.discount_used || 'MAROSA10';
      if (!subscriber.discount_used) {
        await supabase
          .from('newsletter_subscribers')
          .update({ discount_used: discountCode })
          .eq('id', subscriber.id);
      }

      // Welcome email (rate-limited: skip if emailed in last 5 min)
      const lastEmailed = subscriber.last_emailed_at ? new Date(subscriber.last_emailed_at) : null;
      if (!lastEmailed || lastEmailed < new Date(Date.now() - 5 * 60 * 1000)) {
        const unsubscribeUrl = `${base}/unsubscribe?token=${subscriber.unsubscribe_token}&lang=sl`;
        await sendMail(subscriber.email, 'Dobrodošli v družini Kmetije Maroša!', {
          html: generateWelcomeEmailHtml({
            firstName: subscriber.name,
            discountCode,
            unsubscribeUrl,
            language: 'sl',
          }),
          text: generateWelcomeEmailText({
            firstName: subscriber.name,
            discountCode,
            unsubscribeUrl,
            language: 'sl',
          }),
          isWelcome: true,
          discountCode,
        });
        await supabase
          .from('newsletter_subscribers')
          .update({ last_emailed_at: new Date().toISOString() })
          .eq('id', subscriber.id);
      }

      return respond({ success: true, message: 'confirmed', subscriber: result });
    }

    // ---------------- unsubscribe ----------------
    if (action === 'unsubscribe') {
      const token = String(payload.token ?? '');
      if (!token) return respond({ success: false, message: 'No token provided' });

      const { data: subscriber } = await supabase
        .from('newsletter_subscribers')
        .select('id, email, is_active')
        .eq('unsubscribe_token', token)
        .maybeSingle();

      if (!subscriber) {
        return respond({ success: false, message: 'Invalid or expired token' });
      }
      if (!subscriber.is_active) {
        return respond({ success: true, message: 'already_unsubscribed', email: subscriber.email });
      }

      await supabase
        .from('newsletter_subscribers')
        .update({ is_active: false, unsubscribed_at: new Date().toISOString() })
        .eq('id', subscriber.id);

      return respond({ success: true, message: 'unsubscribed', email: subscriber.email });
    }

    // ---------------- update-preferences ----------------
    if (action === 'update-preferences') {
      const token = String(payload.token ?? '');
      if (!token) return respond({ success: false, message: 'No token provided' });

      const { data: subscriber } = await supabase
        .from('newsletter_subscribers')
        .select('id')
        .eq('unsubscribe_token', token)
        .maybeSingle();

      if (!subscriber) {
        return respond({ success: false, message: 'Invalid or expired token' });
      }

      await supabase
        .from('newsletter_subscribers')
        .update({ preferences: payload.preferences ?? {} })
        .eq('id', subscriber.id);

      return respond({ success: true, message: 'Preferences updated' });
    }

    return respond({ error: 'Unknown action' }, 400);
  } catch (error: any) {
    console.error('newsletter function error:', error);
    return respond({ error: error.message }, 500);
  }
});
