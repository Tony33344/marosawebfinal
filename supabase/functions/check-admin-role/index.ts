// check-admin-role — verifies the caller's admin status against
// profiles.is_admin. No dev bypass: no session means not admin.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { getSecureCorsHeaders, handleCorsPreflightRequest } from '../secure-cors-headers.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

serve(async (req) => {
  const preflight = handleCorsPreflightRequest(req);
  if (preflight) return preflight;

  const headers = { ...getSecureCorsHeaders(req), 'Content-Type': 'application/json' };

  try {
    // User-scoped client to resolve the caller's identity
    const authClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } },
    });

    const { data: { user }, error: userError } = await authClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ isAdmin: false }), { headers });
    }

    // Authoritative check: profiles.is_admin via service role
    const serviceClient = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle();

    const isAdmin = profile?.is_admin === true;

    return new Response(
      JSON.stringify({
        isAdmin,
        user: { id: user.id, email: user.email },
      }),
      { headers }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ isAdmin: false, error: error.message }),
      { headers, status: 500 }
    );
  }
});
