-- Remove duplicate slugs from payment_links, keeping the most recent one
WITH dup AS (
  SELECT slug, ARRAY_AGG(id ORDER BY created_at DESC) AS ids, COUNT(*) c
  FROM public.payment_links
  GROUP BY slug
  HAVING COUNT(*) > 1
)
DELETE FROM public.payment_links pl
USING dup
WHERE pl.slug = dup.slug
  AND pl.id <> dup.ids[1];

-- Create unique index on slug to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS ux_payment_links_slug ON public.payment_links(slug);

-- Also check and fix checkouts table if needed
WITH dup_checkouts AS (
  SELECT slug, ARRAY_AGG(id ORDER BY created_at DESC) AS ids, COUNT(*) c
  FROM public.checkouts
  GROUP BY slug
  HAVING COUNT(*) > 1
)
DELETE FROM public.checkouts c
USING dup_checkouts
WHERE c.slug = dup_checkouts.slug
  AND c.id <> dup_checkouts.ids[1];

-- Create unique index on checkouts slug
CREATE UNIQUE INDEX IF NOT EXISTS ux_checkouts_slug ON public.checkouts(slug);