// Shared DB-backed rate limiter for edge functions.
// Events live in public.rate_limit_events (RLS on, no policies → service-role only).
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Registers an event in `bucket` and returns true if the bucket is within
// `limit` events over the last `windowSec` seconds. Fails OPEN on DB errors —
// a broken limiter must not take checkout down.
export async function rateLimitOk(
  serviceClient: SupabaseClient,
  bucket: string,
  limit: number,
  windowSec: number,
): Promise<boolean> {
  try {
    await serviceClient.from('rate_limit_events').insert({ bucket });
    const since = new Date(Date.now() - windowSec * 1000).toISOString();
    const { count, error } = await serviceClient
      .from('rate_limit_events')
      .select('id', { count: 'exact', head: true })
      .eq('bucket', bucket)
      .gte('created_at', since);
    if (error) return true;
    // occasional cleanup of stale rows
    if (Math.random() < 0.02) {
      serviceClient
        .from('rate_limit_events')
        .delete()
        .lt('created_at', new Date(Date.now() - 86400_000).toISOString())
        .then(() => {});
    }
    return (count ?? 0) <= limit;
  } catch {
    return true;
  }
}

// Best-effort client IP from edge-function request headers.
export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for') ?? '';
  return fwd.split(',')[0].trim() || 'unknown';
}
