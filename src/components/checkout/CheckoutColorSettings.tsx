import { ColorPicker } from "./ColorPicker";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CheckoutColorSettingsProps {
  customization: any;
  onUpdate: (field: string, value: string) => void;
}

export const CheckoutColorSettings = ({ customization, onUpdate }: CheckoutColorSettingsProps) => {
  return (
    <div className="space-y-6 p-4">
      {/* Tema e Fonte */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Tema e Fonte</h3>
        
        <div className="space-y-2">
          <Label>Tema</Label>
          <Select
            value={customization.theme || 'custom'}
            onValueChange={(value) => onUpdate('theme', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Claro</SelectItem>
              <SelectItem value="dark">Escuro</SelectItem>
              <SelectItem value="custom">Customizado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Fonte</Label>
          <Select
            value={customization.font || 'Inter'}
            onValueChange={(value) => onUpdate('font', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Inter">Inter</SelectItem>
              <SelectItem value="Roboto">Roboto</SelectItem>
              <SelectItem value="Poppins">Poppins</SelectItem>
              <SelectItem value="Montserrat">Montserrat</SelectItem>
              <SelectItem value="Open Sans">Open Sans</SelectItem>
              <SelectItem value="Lato">Lato</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Cores de Texto */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Cores de Texto</h3>
        <ColorPicker
          label="Cor Primária do Texto"
          value={customization.primary_text_color || '#FFFFFF'}
          onChange={(value) => onUpdate('primary_text_color', value)}
          description="Títulos e labels principais"
        />
        <ColorPicker
          label="Cor Secundária do Texto"
          value={customization.secondary_text_color || '#CCCCCC'}
          onChange={(value) => onUpdate('secondary_text_color', value)}
          description="Descrições e subtítulos"
        />
        <ColorPicker
          label="Cor Ativa do Texto"
          value={customization.active_text_color || '#10B981'}
          onChange={(value) => onUpdate('active_text_color', value)}
          description="Preços, CTAs e textos em destaque (padrão verde)"
        />
        <ColorPicker
          label="Cor dos Ícones"
          value={customization.icon_color || '#FFFFFF'}
          onChange={(value) => onUpdate('icon_color', value)}
          description="Ícones do Pix, Cartão de Crédito, etc."
        />
      </div>

      <Separator />

      {/* Cores de Fundo */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Cores de Fundo</h3>
        <ColorPicker
          label="Cor de Fundo"
          value={customization.background_color || '#000000'}
          onChange={(value) => onUpdate('background_color', value)}
          description="Fundo geral do checkout"
        />
        <ColorPicker
          label="Cor de Fundo do Formulário de Pagamento"
          value={customization.form_background_color || '#1A1A1A'}
          onChange={(value) => onUpdate('form_background_color', value)}
          description="Fundo da seção de pagamento"
        />
      </div>

      <Separator />

      {/* Botões Não Selecionados */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Botões Não Selecionados</h3>
        <ColorPicker
          label="Cor do Texto"
          value={customization.unselected_button_text_color || '#000000'}
          onChange={(value) => onUpdate('unselected_button_text_color', value)}
        />
        <ColorPicker
          label="Cor de Fundo"
          value={customization.unselected_button_bg_color || '#FFFFFF'}
          onChange={(value) => onUpdate('unselected_button_bg_color', value)}
        />
        <ColorPicker
          label="Cor dos Ícones"
          value={customization.unselected_button_icon_color || '#000000'}
          onChange={(value) => onUpdate('unselected_button_icon_color', value)}
        />
      </div>

      <Separator />

      {/* Botão Selecionado */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Botão Selecionado</h3>
        <ColorPicker
          label="Cor do Texto"
          value={customization.selected_button_text_color || '#FFFFFF'}
          onChange={(value) => onUpdate('selected_button_text_color', value)}
        />
        <ColorPicker
          label="Cor de Fundo"
          value={customization.selected_button_bg_color || '#10B981'}
          onChange={(value) => onUpdate('selected_button_bg_color', value)}
          description="Padrão verde"
        />
        <ColorPicker
          label="Cor do Ícone"
          value={customization.selected_button_icon_color || '#FFFFFF'}
          onChange={(value) => onUpdate('selected_button_icon_color', value)}
        />
      </div>

      <Separator />

      {/* Caixas Padrões */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Caixas Padrões</h3>
        <ColorPicker
          label="Cor de Fundo do Cabeçalho"
          value={customization.box_header_bg_color || '#1A1A1A'}
          onChange={(value) => onUpdate('box_header_bg_color', value)}
        />
        <ColorPicker
          label="Cor Primária do Texto do Cabeçalho"
          value={customization.box_header_primary_text_color || '#FFFFFF'}
          onChange={(value) => onUpdate('box_header_primary_text_color', value)}
        />
        <ColorPicker
          label="Cor Secundária do Texto do Cabeçalho"
          value={customization.box_header_secondary_text_color || '#CCCCCC'}
          onChange={(value) => onUpdate('box_header_secondary_text_color', value)}
        />
        <ColorPicker
          label="Cor de Fundo da Caixa"
          value={customization.box_bg_color || '#0A0A0A'}
          onChange={(value) => onUpdate('box_bg_color', value)}
        />
        <ColorPicker
          label="Cor Primária do Texto da Caixa"
          value={customization.box_primary_text_color || '#FFFFFF'}
          onChange={(value) => onUpdate('box_primary_text_color', value)}
        />
        <ColorPicker
          label="Cor Secundária do Texto da Caixa"
          value={customization.box_secondary_text_color || '#CCCCCC'}
          onChange={(value) => onUpdate('box_secondary_text_color', value)}
        />
      </div>

      <Separator />

      {/* Caixas Não Selecionadas */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Caixas Não Selecionadas</h3>
        <ColorPicker
          label="Cor de Fundo do Cabeçalho"
          value={customization.unselected_box_header_bg_color || '#1A1A1A'}
          onChange={(value) => onUpdate('unselected_box_header_bg_color', value)}
        />
        <ColorPicker
          label="Cor Primária do Texto do Cabeçalho"
          value={customization.unselected_box_header_primary_text_color || '#FFFFFF'}
          onChange={(value) => onUpdate('unselected_box_header_primary_text_color', value)}
        />
        <ColorPicker
          label="Cor Secundária do Texto do Cabeçalho"
          value={customization.unselected_box_header_secondary_text_color || '#CCCCCC'}
          onChange={(value) => onUpdate('unselected_box_header_secondary_text_color', value)}
        />
        <ColorPicker
          label="Cor de Fundo da Caixa"
          value={customization.unselected_box_bg_color || '#0A0A0A'}
          onChange={(value) => onUpdate('unselected_box_bg_color', value)}
        />
        <ColorPicker
          label="Cor Primária do Texto da Caixa"
          value={customization.unselected_box_primary_text_color || '#FFFFFF'}
          onChange={(value) => onUpdate('unselected_box_primary_text_color', value)}
        />
        <ColorPicker
          label="Cor Secundária do Texto da Caixa"
          value={customization.unselected_box_secondary_text_color || '#CCCCCC'}
          onChange={(value) => onUpdate('unselected_box_secondary_text_color', value)}
        />
      </div>

      <Separator />

      {/* Caixas Selecionadas */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Caixas Selecionadas</h3>
        <ColorPicker
          label="Cor de Fundo do Cabeçalho"
          value={customization.selected_box_header_bg_color || '#10B981'}
          onChange={(value) => onUpdate('selected_box_header_bg_color', value)}
          description="Padrão verde"
        />
        <ColorPicker
          label="Cor Primária do Texto do Cabeçalho"
          value={customization.selected_box_header_primary_text_color || '#FFFFFF'}
          onChange={(value) => onUpdate('selected_box_header_primary_text_color', value)}
        />
        <ColorPicker
          label="Cor Secundária do Texto do Cabeçalho"
          value={customization.selected_box_header_secondary_text_color || '#CCCCCC'}
          onChange={(value) => onUpdate('selected_box_header_secondary_text_color', value)}
        />
        <ColorPicker
          label="Cor de Fundo da Caixa"
          value={customization.selected_box_bg_color || '#0A0A0A'}
          onChange={(value) => onUpdate('selected_box_bg_color', value)}
        />
        <ColorPicker
          label="Cor Primária do Texto da Caixa"
          value={customization.selected_box_primary_text_color || '#FFFFFF'}
          onChange={(value) => onUpdate('selected_box_primary_text_color', value)}
        />
        <ColorPicker
          label="Cor Secundária do Texto da Caixa"
          value={customization.selected_box_secondary_text_color || '#CCCCCC'}
          onChange={(value) => onUpdate('selected_box_secondary_text_color', value)}
        />
      </div>

      <Separator />

      {/* Botão do Pagamento */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Botão do Pagamento</h3>
        <ColorPicker
          label="Cor do Texto Botão de Pagar"
          value={customization.payment_button_text_color || '#FFFFFF'}
          onChange={(value) => onUpdate('payment_button_text_color', value)}
        />
        <ColorPicker
          label="Cor do Botão de Pagar"
          value={customization.payment_button_bg_color || '#10B981'}
          onChange={(value) => onUpdate('payment_button_bg_color', value)}
          description="Padrão verde"
        />
      </div>
    </div>
  );
};

