-- Corrigir política RLS que permite usuários autenticados verem produtos de outras contas
-- Remove política problemática que afeta todos os usuários
DROP POLICY IF EXISTS "public_view_products_via_active_checkouts" ON products;

-- Cria nova política restrita apenas para usuários anônimos (não autenticados)
-- Isso permite que payment links públicos funcionem, mas não vaza dados entre contas
CREATE POLICY "anonymous_view_products_via_active_checkouts"
ON products
FOR SELECT
TO anon
USING (
  (status = 'active') 
  AND product_has_active_checkout(id)
);