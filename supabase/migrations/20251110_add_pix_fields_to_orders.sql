-- Adicionar campos para armazenar dados do PIX na tabela orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS pix_id TEXT,
ADD COLUMN IF NOT EXISTS pix_qr_code TEXT,
ADD COLUMN IF NOT EXISTS pix_status TEXT,
ADD COLUMN IF NOT EXISTS pix_created_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- Criar índice para consultas rápidas por pix_id
CREATE INDEX IF NOT EXISTS idx_orders_pix_id ON public.orders(pix_id);

-- Comentários para documentação
COMMENT ON COLUMN public.orders.pix_id IS 'ID da transação PIX na PushinPay';
COMMENT ON COLUMN public.orders.pix_qr_code IS 'Código QR Code do PIX (EMV)';
COMMENT ON COLUMN public.orders.pix_status IS 'Status do PIX: created, paid, canceled';
COMMENT ON COLUMN public.orders.pix_created_at IS 'Data de criação do PIX';
COMMENT ON COLUMN public.orders.paid_at IS 'Data de confirmação do pagamento';
