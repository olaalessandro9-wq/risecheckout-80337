-- ============================================================================
-- Migration: Fix RLS Infinite Recursion on Checkouts and Products
-- ============================================================================
-- Remove recursive policies and recreate PERMISSIVE policies that allow:
-- 1. Anonymous users to read active checkouts and products
-- 2. Authenticated users (owners) to read their own items
-- 3. Admins to manage everything
-- ============================================================================

-- ============================================================================
-- CHECKOUTS TABLE
-- ============================================================================

-- Drop problematic policies that cause recursion
DROP POLICY IF EXISTS "Public can view checkouts via valid payment links" ON public.checkouts;
DROP POLICY IF EXISTS "public_read_active_checkouts" ON public.checkouts;
DROP POLICY IF EXISTS "Users can view their own checkouts" ON public.checkouts;
DROP POLICY IF EXISTS "Admins can manage all checkouts" ON public.checkouts;

-- Recreate PERMISSIVE policies without subselects that cause recursion

-- Allow anonymous users to read active checkouts
CREATE POLICY "public_read_active_checkouts"
ON public.checkouts
AS PERMISSIVE
FOR SELECT
TO anon
USING (status = 'active');

-- Allow authenticated users to read checkouts from their own products
CREATE POLICY "owner_read_checkouts"
ON public.checkouts
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (product_id IN (SELECT id FROM public.products WHERE user_id = auth.uid()));

-- Allow admins to manage all checkouts
CREATE POLICY "admin_manage_checkouts"
ON public.checkouts
AS PERMISSIVE
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- PRODUCTS TABLE
-- ============================================================================

-- Drop problematic policies
DROP POLICY IF EXISTS "Public can view products in active checkouts" ON public.products;
DROP POLICY IF EXISTS "public_read_active_products" ON public.products;
DROP POLICY IF EXISTS "Users can view their own products" ON public.products;
DROP POLICY IF EXISTS "Admins can view all products" ON public.products;
DROP POLICY IF EXISTS "Admins can update all products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete all products" ON public.products;

-- Recreate PERMISSIVE policies without recursion

-- Allow anonymous users to read active products
CREATE POLICY "public_read_active_products"
ON public.products
AS PERMISSIVE
FOR SELECT
TO anon
USING (status = 'active');

-- Allow authenticated users to read their own products
CREATE POLICY "owner_read_products"
ON public.products
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Allow admins to manage all products
CREATE POLICY "admin_manage_products"
ON public.products
AS PERMISSIVE
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- Keep existing owner policies for INSERT/UPDATE/DELETE on both tables
-- ============================================================================

-- Checkouts: owners can insert/update/delete their own
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'checkouts' 
    AND policyname = 'Users can insert their own checkouts'
  ) THEN
    CREATE POLICY "Users can insert their own checkouts"
    ON public.checkouts
    FOR INSERT
    TO authenticated
    WITH CHECK (product_id IN (SELECT id FROM public.products WHERE user_id = auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'checkouts' 
    AND policyname = 'Users can update their own checkouts'
  ) THEN
    CREATE POLICY "Users can update their own checkouts"
    ON public.checkouts
    FOR UPDATE
    TO authenticated
    USING (product_id IN (SELECT id FROM public.products WHERE user_id = auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'checkouts' 
    AND policyname = 'Users can delete their own checkouts'
  ) THEN
    CREATE POLICY "Users can delete their own checkouts"
    ON public.checkouts
    FOR DELETE
    TO authenticated
    USING (product_id IN (SELECT id FROM public.products WHERE user_id = auth.uid()));
  END IF;
END $$;

-- Products: owners can insert/update/delete their own
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'products' 
    AND policyname = 'Users can insert their own products'
  ) THEN
    CREATE POLICY "Users can insert their own products"
    ON public.products
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'products' 
    AND policyname = 'Users can update their own products'
  ) THEN
    CREATE POLICY "Users can update their own products"
    ON public.products
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'products' 
    AND policyname = 'Users can delete their own products'
  ) THEN
    CREATE POLICY "Users can delete their own products"
    ON public.products
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());
  END IF;
END $$;