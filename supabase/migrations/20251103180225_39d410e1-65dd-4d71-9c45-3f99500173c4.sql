-- 1) Criar índice único em checkouts.slug para evitar duplicados
CREATE UNIQUE INDEX IF NOT EXISTS idx_checkouts_slug_unique ON public.checkouts(slug);

-- 2) Identificar e corrigir slugs duplicados existentes
-- Primeiro, identificar duplicados
DO $$
DECLARE
  dup_record RECORD;
  row_to_rename RECORD;
  counter INT;
BEGIN
  -- Para cada slug duplicado
  FOR dup_record IN 
    SELECT slug, COUNT(*) as cnt 
    FROM public.checkouts 
    GROUP BY slug 
    HAVING COUNT(*) > 1
  LOOP
    RAISE NOTICE 'Encontrado slug duplicado: % (% ocorrências)', dup_record.slug, dup_record.cnt;
    
    counter := 1;
    
    -- Manter o mais recente, renomear os demais
    FOR row_to_rename IN 
      SELECT id, slug, created_at
      FROM public.checkouts
      WHERE slug = dup_record.slug
      ORDER BY created_at ASC -- Mais antigos primeiro
      LIMIT (dup_record.cnt - 1) -- Renomear todos menos o mais recente
    LOOP
      -- Renomear com sufixo único
      UPDATE public.checkouts
      SET slug = dup_record.slug || '-old-' || EXTRACT(EPOCH FROM row_to_rename.created_at)::TEXT
      WHERE id = row_to_rename.id;
      
      RAISE NOTICE 'Renomeado checkout % de % para %', 
        row_to_rename.id, 
        dup_record.slug, 
        dup_record.slug || '-old-' || EXTRACT(EPOCH FROM row_to_rename.created_at)::TEXT;
      
      counter := counter + 1;
    END LOOP;
  END LOOP;
END $$;

-- 3) Comentário para documentação
COMMENT ON INDEX idx_checkouts_slug_unique IS 'Garante unicidade de slug nos checkouts, prevenindo erros 406 em consultas públicas';