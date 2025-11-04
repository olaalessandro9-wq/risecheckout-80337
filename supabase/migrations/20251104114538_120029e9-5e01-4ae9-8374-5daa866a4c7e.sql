-- ============================================================================
-- FASE 3 - MÉDIA: Corrigir search_path em SECURITY DEFINER functions
-- ============================================================================
-- Problema: Funções SECURITY DEFINER sem search_path fixo são vulneráveis
-- a ataques de escalada de privilégios via search_path manipulation
-- ============================================================================

-- 3.1) generate_checkout_slug - Já tem SECURITY DEFINER, adicionar search_path
CREATE OR REPLACE FUNCTION public.generate_checkout_slug()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  new_slug text;
  slug_exists boolean;
  attempts integer := 0;
  max_attempts integer := 100;
BEGIN
  LOOP
    new_slug := lower(substring(md5(random()::text || clock_timestamp()::text) from 1 for 7)) || '_' || lpad(floor(random() * 1000000)::text, 6, '0');
    SELECT EXISTS(SELECT 1 FROM checkouts WHERE slug = new_slug) INTO slug_exists;
    attempts := attempts + 1;
    EXIT WHEN NOT slug_exists OR attempts >= max_attempts;
  END LOOP;
  IF attempts >= max_attempts THEN
    RAISE EXCEPTION 'Não foi possível gerar slug único';
  END IF;
  RETURN new_slug;
END;
$function$;

-- 3.2) create_default_checkout
CREATE OR REPLACE FUNCTION public.create_default_checkout()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO checkouts (product_id, name, slug, is_default, seller_name)
  VALUES (NEW.id, 'Checkout Principal', generate_checkout_slug(), true, NEW.support_name);
  RETURN NEW;
END;
$function$;

-- 3.3) increment_checkout_visits
CREATE OR REPLACE FUNCTION public.increment_checkout_visits(checkout_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE checkouts SET visits_count = visits_count + 1 WHERE id = checkout_id;
END;
$function$;

-- 3.4) generate_slug_for_checkout
CREATE OR REPLACE FUNCTION public.generate_slug_for_checkout()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_checkout_slug();
  END IF;
  RETURN NEW;
END;
$function$;

-- 3.5) generate_link_slug
CREATE OR REPLACE FUNCTION public.generate_link_slug(offer_name text, offer_price numeric)
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  base_slug := lower(regexp_replace(
    offer_name || '-' || replace(offer_price::TEXT, '.', ''),
    '[^a-zA-Z0-9]+',
    '-',
    'g'
  ));
  base_slug := trim(both '-' from base_slug);
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.payment_links WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  RETURN final_slug;
END;
$function$;

-- 3.6) create_payment_link_for_offer (trigger version)
CREATE OR REPLACE FUNCTION public.create_payment_link_for_offer()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  link_slug TEXT;
  link_url TEXT;
  link_id UUID;
BEGIN
  link_slug := public.generate_link_slug(NEW.name, NEW.price);
  link_url := 'https://risecheckout.lovable.app/c/' || link_slug;
  INSERT INTO public.payment_links (offer_id, slug, url)
  VALUES (NEW.id, link_slug, link_url);
  RETURN NEW;
END;
$function$;

-- 3.7) auto_create_payment_link
CREATE OR REPLACE FUNCTION public.auto_create_payment_link()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  v_slug TEXT;
  v_base_url TEXT;
  v_link_id UUID;
BEGIN
  v_slug := generate_link_slug(NEW.name, NEW.price);
  v_base_url := 'https://risecheckout.lovable.app/c/';
  INSERT INTO payment_links (offer_id, slug, url, status)
  VALUES (NEW.id, v_slug, v_base_url || v_slug, 'active')
  RETURNING id INTO v_link_id;
  RETURN NEW;
END;
$function$;

-- 3.8) auto_create_default_offer
CREATE OR REPLACE FUNCTION public.auto_create_default_offer()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  v_offer_count INTEGER;
  v_offer_id UUID;
BEGIN
  SELECT COUNT(*) INTO v_offer_count FROM offers WHERE product_id = NEW.id;
  IF v_offer_count = 0 THEN
    INSERT INTO offers (product_id, name, price, is_default)
    VALUES (NEW.id, NEW.name, NEW.price, true)
    RETURNING id INTO v_offer_id;
  END IF;
  RETURN NEW;
END;
$function$;

-- 3.9) create_default_checkout_for_offer
CREATE OR REPLACE FUNCTION public.create_default_checkout_for_offer()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  v_product_name TEXT;
  v_checkout_id UUID;
  v_link_id UUID;
  v_checkout_count INTEGER;
BEGIN
  IF NEW.is_default = true THEN
    SELECT COUNT(*) INTO v_checkout_count FROM checkouts WHERE product_id = NEW.product_id;
    IF v_checkout_count = 0 THEN
      SELECT name INTO v_product_name FROM products WHERE id = NEW.product_id;
      INSERT INTO checkouts (product_id, name, is_default)
      VALUES (NEW.product_id, 'Checkout Principal', true)
      RETURNING id INTO v_checkout_id;
      SELECT id INTO v_link_id FROM payment_links WHERE offer_id = NEW.id LIMIT 1;
      IF v_link_id IS NOT NULL THEN
        INSERT INTO checkout_links (checkout_id, link_id)
        VALUES (v_checkout_id, v_link_id)
        ON CONFLICT DO NOTHING;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- 3.10) handle_new_user - Já está com SET search_path (manter)
-- (Não precisa alterar)

-- ============================================================================
-- 3.11) Remover views SECURITY DEFINER problemáticas
-- ============================================================================

-- As views v_offers_normalized e v_order_bump_products não deveriam usar
-- SECURITY DEFINER. Vamos removê-las e deixar que sejam acessadas via RLS normal.

DROP VIEW IF EXISTS public.v_offers_normalized CASCADE;
DROP VIEW IF EXISTS public.v_order_bump_products CASCADE;

COMMENT ON SCHEMA public IS 
'Security hardened: All SECURITY DEFINER functions now have fixed search_path. Problematic views removed.';

-- ============================================================================
-- ✅ FASE 3 CONCLUÍDA - TODAS AS CORREÇÕES IMPLEMENTADAS
-- ============================================================================