-- Adicionar novos campos de cores e personalização à tabela checkouts

-- Tema
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'custom';

-- Cores de texto
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS primary_text_color TEXT DEFAULT '#000000';
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS secondary_text_color TEXT DEFAULT '#6B7280';
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS active_text_color TEXT DEFAULT '#10B981';
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS icon_color TEXT DEFAULT '#000000';

-- Botões não selecionados
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS unselected_button_text_color TEXT DEFAULT '#000000';
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS unselected_button_bg_color TEXT DEFAULT '#FFFFFF';
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS unselected_button_icon_color TEXT DEFAULT '#000000';

-- Botão selecionado
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS selected_button_text_color TEXT DEFAULT '#FFFFFF';
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS selected_button_bg_color TEXT DEFAULT '#10B981';
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS selected_button_icon_color TEXT DEFAULT '#FFFFFF';

-- Caixas padrões
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS box_header_bg_color TEXT DEFAULT '#1A1A1A';
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS box_header_primary_text_color TEXT DEFAULT '#FFFFFF';
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS box_header_secondary_text_color TEXT DEFAULT '#CCCCCC';
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS box_bg_color TEXT DEFAULT '#0A0A0A';
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS box_primary_text_color TEXT DEFAULT '#FFFFFF';
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS box_secondary_text_color TEXT DEFAULT '#CCCCCC';

-- Caixas não selecionadas
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS unselected_box_header_bg_color TEXT DEFAULT '#1A1A1A';
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS unselected_box_header_primary_text_color TEXT DEFAULT '#FFFFFF';
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS unselected_box_header_secondary_text_color TEXT DEFAULT '#CCCCCC';
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS unselected_box_bg_color TEXT DEFAULT '#0A0A0A';
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS unselected_box_primary_text_color TEXT DEFAULT '#FFFFFF';
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS unselected_box_secondary_text_color TEXT DEFAULT '#CCCCCC';

-- Caixas selecionadas
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS selected_box_header_bg_color TEXT DEFAULT '#10B981';
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS selected_box_header_primary_text_color TEXT DEFAULT '#FFFFFF';
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS selected_box_header_secondary_text_color TEXT DEFAULT '#CCCCCC';
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS selected_box_bg_color TEXT DEFAULT '#0A0A0A';
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS selected_box_primary_text_color TEXT DEFAULT '#FFFFFF';
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS selected_box_secondary_text_color TEXT DEFAULT '#CCCCCC';

-- Botão de pagamento
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS payment_button_bg_color TEXT DEFAULT '#10B981';
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS payment_button_text_color TEXT DEFAULT '#FFFFFF';

-- Imagem de fundo
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS background_image_url TEXT;
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS background_image_fixed BOOLEAN DEFAULT false;
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS background_image_repeat BOOLEAN DEFAULT false;
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS background_image_expand BOOLEAN DEFAULT false;