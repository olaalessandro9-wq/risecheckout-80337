-- ============================================================================
-- FIX: Infinite Recursion in RLS Policies (Error 42P17)
-- ============================================================================
-- Problem: RLS policies with subqueries on tables that also have RLS create
--          circular dependencies, causing "infinite recursion detected"
-- Solution: Use SECURITY DEFINER functions to break the cycle
-- ============================================================================

-- 1) Create SECURITY DEFINER helper functions to evaluate conditions without triggering RLS

CREATE OR REPLACE FUNCTION public.has_active_payment_link_for_checkout(p_checkout_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM checkout_links cl
    JOIN payment_links pl ON pl.id = cl.link_id
    WHERE cl.checkout_id = p_checkout_id 
      AND pl.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.product_has_active_checkout(p_product_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM checkouts c
    JOIN checkout_links cl ON cl.checkout_id = c.id
    JOIN payment_links pl ON pl.id = cl.link_id
    WHERE c.product_id = p_product_id 
      AND c.status = 'active' 
      AND pl.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.offer_is_exposed_via_active_link(p_offer_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM payment_links pl 
    WHERE pl.offer_id = p_offer_id 
      AND pl.status = 'active'
  );
$$;

-- Grant EXECUTE permissions to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.has_active_payment_link_for_checkout(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.product_has_active_checkout(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.offer_is_exposed_via_active_link(uuid) TO anon, authenticated;

-- 2) Replace problematic RLS policies with versions that use SECURITY DEFINER functions

-- CHECKOUTS: Fix recursion
DROP POLICY IF EXISTS "public_view_checkout_via_active_payment_link" ON public.checkouts;

CREATE POLICY "public_view_checkout_via_active_payment_link"
ON public.checkouts FOR SELECT
TO public
USING (
  status = 'active' 
  AND public.has_active_payment_link_for_checkout(id)
);

-- PRODUCTS: Fix recursion
DROP POLICY IF EXISTS "public_view_products_via_active_checkouts" ON public.products;

CREATE POLICY "public_view_products_via_active_checkouts"
ON public.products FOR SELECT
TO public
USING (
  status = 'active' 
  AND public.product_has_active_checkout(id)
);

-- OFFERS: Fix recursion
DROP POLICY IF EXISTS "public_view_offers_via_active_links" ON public.offers;

CREATE POLICY "public_view_offers_via_active_links"
ON public.offers FOR SELECT
TO public
USING (
  public.offer_is_exposed_via_active_link(id)
);

-- ============================================================================
-- Result: RLS policies now use SECURITY DEFINER functions which execute
--         without triggering RLS on joined tables, breaking the recursion cycle.
-- Security maintained: Public users still only see data through active links.
-- All features restored: /produtos, /pay/:slug, Order Bumps work again.
-- ============================================================================