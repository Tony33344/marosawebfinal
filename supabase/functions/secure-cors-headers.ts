// Secure CORS headers for Supabase Edge Functions
// This file should be imported by all edge functions to ensure consistent security

// Allowed site origins. The production domain is injected via the SITE_URL
// function secret so adding the real domain later requires no code change.
const STATIC_ALLOWED_ORIGINS = [
  'https://marosaf1.netlify.app',
  'https://marosakreditna.netlify.app',
  'https://marosatest.netlify.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  'http://localhost:3000'
];

export function getAllowedOrigins(): string[] {
  const origins = [...STATIC_ALLOWED_ORIGINS];
  const siteUrl = Deno.env.get('SITE_URL');
  if (siteUrl) origins.push(siteUrl.replace(/\/$/, ''));
  return origins;
}

export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  return getAllowedOrigins().includes(origin);
}

/**
 * Get secure CORS headers based on the request origin
 * @param request The incoming request
 * @returns CORS headers object
 */
export function getSecureCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin') || '';

  // Only allow specified origins; disallowed origins get no wildcard — the
  // browser will block the response, while the function still responds 200
  // for server-to-server callers (which don't enforce CORS).
  const allowedOrigin = isAllowedOrigin(origin) ? origin : 'null';

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Max-Age': '86400', // 24 hours
    'Vary': 'Origin' // Important for caching responses with different origins
  };
}

/**
 * Handle CORS preflight requests
 * @param request The incoming request
 * @returns Response for preflight requests or null if not a preflight request
 */
export function handleCorsPreflightRequest(request: Request): Response | null {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: getSecureCorsHeaders(request) });
  }
  return null;
}
