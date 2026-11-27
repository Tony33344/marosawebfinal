// send-registration-email — welcome email after signup.
// Verifies the auth user exists and registered within the last 15 minutes,
// so this endpoint can't be used as a mail relay for arbitrary addresses.
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { getSecureCorsHeaders, handleCorsPreflightRequest, isAllowedOrigin } from '../secure-cors-headers.ts';
import { generateRegistrationConfirmationEmailHtml, generateRegistrationConfirmationEmailText } from './registrationConfirmationEmail.ts';

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
    const { userId, fullName, language = 'sl' } = await req.json();
    if (!userId || typeof userId !== 'string') {
      return respond({ success: false, message: 'userId required' }, 400);
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: { user }, error } = await supabase.auth.admin.getUserById(userId);

    if (error || !user?.email) {
      return respond({ success: false, message: 'User not found' }, 404);
    }

    const createdAt = new Date(user.created_at).getTime();
    if (Date.now() - createdAt > 15 * 60 * 1000) {
      return respond({ success: false, message: 'Welcome window expired' }, 403);
    }

    const origin = req.headers.get('Origin');
    const base = origin && isAllowedOrigin(origin)
      ? origin
      : (Deno.env.get('SITE_URL')?.replace(/\/$/, '') ?? 'https://marosaf1.netlify.app');
    const confirmationUrl = `${base}/login`;

    const subject = language === 'sl' ? 'Dobrodošli na Kmetiji Maroša!'
      : language === 'de' ? 'Willkommen bei Kmetija Maroša!'
      : language === 'hr' ? 'Dobrodošli u Kmetiju Maroša!'
      : 'Welcome to Kmetija Maroša!';

    const res = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'apikey': SERVICE_KEY,
      },
      body: JSON.stringify({
        type: 'newsletter',
        to: user.email,
        subject,
        body: {
          html: generateRegistrationConfirmationEmailHtml({ fullName, confirmationUrl, language }),
          text: generateRegistrationConfirmationEmailText({ fullName, confirmationUrl, language }),
          isWelcome: true,
        },
      }),
    });

    const result = await res.json().catch(() => ({}));
    if (!res.ok || result?.success === false) {
      console.error('Welcome email send failed:', res.status, JSON.stringify(result).slice(0, 200));
      return respond({ success: false, message: 'Email delivery failed' }, 502);
    }
    return respond({ success: true, result });
  } catch (error: any) {
    console.error('send-registration-email error:', error);
    return respond({ success: false, message: error.message }, 500);
  }
});
