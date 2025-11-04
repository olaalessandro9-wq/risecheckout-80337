-- Adicionar coluna status na tabela checkouts
ALTER TABLE public.checkouts 
ADD COLUMN status TEXT DEFAULT 'active';

-- Criar índice para melhor performance
CREATE INDEX idx_checkouts_status ON public.checkouts(status);

-- Adicionar constraint para validar valores permitidos
ALTER TABLE public.checkouts
ADD CONSTRAINT checkouts_status_check 
CHECK (status IN ('active', 'deleted', 'draft'));

-- Comentário para documentação
COMMENT ON COLUMN public.checkouts.status IS 
'Status do checkout: active (público), deleted (soft delete), draft (em construção)';