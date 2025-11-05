-- ========================================
-- RLS POLICIES PARA ACESSO PÚBLICO AO CHECKOUT
-- ========================================

-- 1. Permitir leitura pública de checkouts ativos
CREATE POLICY "public_read_active_checkouts"
ON public.checkouts
FOR SELECT
TO anon
USING (status = 'active');

-- 2. Permitir leitura pública de offers (necessário para carregar dados do checkout)
CREATE POLICY "public_read_offers_for_checkout"
ON public.offers
FOR SELECT
TO anon
USING (true);

-- 3. Permitir leitura pública de produtos ativos
CREATE POLICY "public_read_active_products"
ON public.products
FOR SELECT
TO anon
USING (status = 'active');

-- 4. Garantir que payment_links e checkout_links sejam lidos publicamente
-- (já existem policies, mas vamos garantir que estão corretas)
DROP POLICY IF EXISTS "pl_read_active_anon" ON public.payment_links;
CREATE POLICY "pl_read_active_anon"
ON public.payment_links
FOR SELECT
TO anon
USING (status = 'active');

DROP POLICY IF EXISTS "cl_read_on_active_link_anon" ON public.checkout_links;
CREATE POLICY "cl_read_on_active_link_anon"
ON public.checkout_links
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.payment_links pl
    WHERE pl.id = checkout_links.link_id
    AND pl.status = 'active'
  )
);