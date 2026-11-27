-- Go-live security hardening migration
-- 1) payment tracking columns on orders
-- 2) re-enable RLS everywhere it was disabled for guest checkout
-- 3) replace the policy mess with a clean, minimal set
-- 4) SECURITY DEFINER helpers (is_admin, validate_discount_code)

-- ============================================================
-- 1. Payment tracking columns
-- ============================================================
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_intent_id text,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid';

-- ============================================================
-- 2. Re-enable RLS on every public table that had it disabled
-- ============================================================
ALTER TABLE public.orders                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_codes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_counter          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders_backup          ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. Drop ALL existing policies on those tables (clean slate)
-- ============================================================
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('orders','profiles','newsletter_subscribers','discount_codes',
                        'products','analytics_daily_metrics','analytics_events',
                        'invoices','order_counter','orders_backup')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- ============================================================
-- 4. SECURITY DEFINER is_admin() helper — avoids recursive RLS
--    on profiles (a policy on profiles selecting profiles loops)
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- ============================================================
-- 5. orders
-- ============================================================
-- Logged-in users read their own orders; admins read all.
-- Guests cannot list orders at all (order confirmations are served
-- by the get-order edge function using the unguessable UUID).
CREATE POLICY orders_select ON public.orders
  FOR SELECT USING (
    auth.uid() = profile_id
    OR auth.uid() = user_id
    OR public.is_admin()
  );

-- Guests may only create orders flagged is_guest_order = true.
-- Authenticated users create orders tied to their own id.
-- (Primary path is the create-order edge function via service role,
--  which bypasses RLS — this policy is a safety net.)
CREATE POLICY orders_insert ON public.orders
  FOR INSERT WITH CHECK (
    (auth.uid() IS NULL AND is_guest_order = true)
    OR auth.uid() = profile_id
    OR auth.uid() = user_id
    OR public.is_admin()
  );

CREATE POLICY orders_update ON public.orders
  FOR UPDATE USING (public.is_admin());

CREATE POLICY orders_delete ON public.orders
  FOR DELETE USING (public.is_admin());

-- ============================================================
-- 6. profiles
-- ============================================================
CREATE POLICY profiles_select ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY profiles_insert ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id OR public.is_admin());

CREATE POLICY profiles_update ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_admin());

CREATE POLICY profiles_delete ON public.profiles
  FOR DELETE USING (public.is_admin());

-- ============================================================
-- 7. newsletter_subscribers — admin/service only.
--    Subscribe/confirm/unsubscribe go through edge functions
--    (subscribe-newsletter, newsletter-action) via service role.
-- ============================================================
CREATE POLICY newsletter_admin ON public.newsletter_subscribers
  FOR ALL USING (public.is_admin());

-- ============================================================
-- 8. discount_codes — public may only read codes flagged for the
--    banner. Validation happens via validate_discount_code RPC;
--    usage increments happen inside create-order (service role).
-- ============================================================
CREATE POLICY discount_banner_read ON public.discount_codes
  FOR SELECT USING (show_in_banner = true AND is_active = true);

CREATE POLICY discount_admin ON public.discount_codes
  FOR ALL USING (public.is_admin());

-- ============================================================
-- 9. products — public reads active products only
-- ============================================================
CREATE POLICY products_public_read ON public.products
  FOR SELECT USING ("isActive" = true OR public.is_admin());

CREATE POLICY products_admin_write ON public.products
  FOR ALL USING (public.is_admin());

-- ============================================================
-- 10. analytics — anyone may append events, only admin reads
-- ============================================================
CREATE POLICY analytics_events_insert ON public.analytics_events
  FOR INSERT WITH CHECK (true);
CREATE POLICY analytics_events_admin ON public.analytics_events
  FOR SELECT USING (public.is_admin());

CREATE POLICY analytics_metrics_admin ON public.analytics_daily_metrics
  FOR ALL USING (public.is_admin());

-- ============================================================
-- 11. invoices / order_counter / orders_backup — admin/service only
-- ============================================================
CREATE POLICY invoices_admin ON public.invoices
  FOR ALL USING (public.is_admin());

CREATE POLICY order_counter_admin ON public.order_counter
  FOR ALL USING (public.is_admin());

CREATE POLICY orders_backup_admin ON public.orders_backup
  FOR ALL USING (public.is_admin());

-- ============================================================
-- 12. Discount code validation RPC (SECURITY DEFINER)
--     Lets the checkout validate a single code without exposing
--     the whole discount_codes table.
-- ============================================================
CREATE OR REPLACE FUNCTION public.validate_discount_code(
  p_code text,
  p_order_total numeric DEFAULT 0
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  d record;
  parsed numeric;
  discount_amount numeric := 0;
BEGIN
  SELECT * INTO d
  FROM public.discount_codes
  WHERE code = upper(trim(p_code)) AND is_active = true;

  IF NOT FOUND THEN
    RETURN json_build_object('valid', false, 'message', 'Invalid discount code');
  END IF;

  IF d.valid_from > now() OR (d.valid_until IS NOT NULL AND d.valid_until < now()) THEN
    RETURN json_build_object('valid', false, 'message', 'Expired discount code');
  END IF;

  IF d.max_uses IS NOT NULL AND d.current_uses >= d.max_uses THEN
    RETURN json_build_object('valid', false, 'message', 'Maximum uses reached');
  END IF;

  IF d.min_order_amount IS NOT NULL AND p_order_total < d.min_order_amount THEN
    RETURN json_build_object('valid', false, 'message',
      'Minimum order amount is ' || d.min_order_amount || ' €');
  END IF;

  parsed := COALESCE(d.discount_value, 0);
  IF d.discount_type = 'percentage' THEN
    discount_amount := (p_order_total * parsed) / 100;
  ELSIF d.discount_type = 'fixed' THEN
    discount_amount := parsed;
  END IF;

  IF discount_amount IS NULL OR discount_amount < 0 THEN
    discount_amount := 0;
  END IF;

  RETURN json_build_object(
    'valid', true,
    'discountAmount', discount_amount,
    'discountPercent', CASE WHEN d.discount_type = 'percentage' THEN parsed ELSE 0 END,
    'discountData', json_build_object(
      'id', d.id, 'code', d.code, 'discount_type', d.discount_type,
      'discount_value', d.discount_value, 'min_order_amount', d.min_order_amount
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.validate_discount_code(text, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_discount_code(text, numeric) TO anon, authenticated;

-- 9. Prevent privilege escalation: profiles_update allows users to update
-- their own row, which would let them set is_admin=true on themselves.
-- This trigger silently reverts is_admin changes made by non-admins
-- (service_role and existing admins can still manage the flag).
CREATE OR REPLACE FUNCTION public.protect_is_admin_flag()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.is_admin IS TRUE AND auth.role() <> 'service_role' AND NOT public.is_admin() THEN
      NEW.is_admin := false;
    END IF;
    RETURN NEW;
  END IF;
  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin
     AND auth.role() <> 'service_role'
     AND NOT public.is_admin() THEN
    NEW.is_admin := OLD.is_admin;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_protect_is_admin_ins ON public.profiles;
DROP TRIGGER IF EXISTS profiles_protect_is_admin_upd ON public.profiles;
CREATE TRIGGER profiles_protect_is_admin_ins
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_is_admin_flag();
CREATE TRIGGER profiles_protect_is_admin_upd
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_is_admin_flag();

-- ================= RPC FUNCTION SURFACE LOCKDOWN =================
-- PostgREST inherits EXECUTE from PUBLIC; revoking per-role alone is not enough.
REVOKE EXECUTE ON FUNCTION public.get_next_order_number() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_next_order_number() TO service_role;
REVOKE EXECUTE ON FUNCTION public.create_analytics_events_table() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_analytics_daily_metrics_table() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.execute_sql(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_subscriber_tokens() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_user_admin_status() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_loyalty_points() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_stock_on_order() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.protect_is_admin_flag() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO service_role;
REVOKE EXECUTE ON FUNCTION public.update_translations_updated_at() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_modified_column() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_random_token() FROM PUBLIC;

-- ================= ORDERS INSERT — no direct client inserts =================
-- Orders are created exclusively by the create-order edge function
-- (service role bypasses RLS). Prevents forged 'paid' orders and
-- server-side-pricing bypasses via direct REST inserts.
DROP POLICY IF EXISTS orders_insert ON public.orders;
CREATE POLICY orders_insert ON public.orders
  FOR INSERT WITH CHECK (is_admin());
