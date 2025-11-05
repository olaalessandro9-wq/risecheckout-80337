import { ColorPicker } from "./ColorPicker";
import { Separator } from "@/components/ui/separator";

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
          <label className="text-sm font-medium">Tema</label>
          <p className="text-xs text-muted-foreground">Customizado</p>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Fonte</label>
          <p className="text-xs text-muted-foreground">Roboto</p>
        </div>
      </div>

      <Separator />

      {/* Cores Gerais */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Cores Gerais</h3>
        <ColorPicker
          label="Cor de Fundo Principal"
          value={customization.background_color || '#000000'}
          onChange={(value) => onUpdate('background_color', value)}
          description="Fundo geral do checkout"
        />
        <ColorPicker
          label="Cor do Texto Principal"
          value={customization.primary_text_color || '#FFFFFF'}
          onChange={(value) => onUpdate('primary_text_color', value)}
          description="Títulos e textos principais"
        />
        <ColorPicker
          label="Cor do Texto Secundário"
          value={customization.secondary_text_color || '#CCCCCC'}
          onChange={(value) => onUpdate('secondary_text_color', value)}
          description="Descrições e subtítulos"
        />
      </div>

      <Separator />

      {/* Formulário de Pagamento */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Formulário de Pagamento</h3>
        <ColorPicker
          label="Cor de Fundo do Formulário"
          value={customization.form_background_color || '#1A1A1A'}
          onChange={(value) => onUpdate('form_background_color', value)}
          description="Fundo da seção de pagamento"
        />
        <ColorPicker
          label="Cor do Texto dos Inputs"
          value={customization.input_text_color || '#FFFFFF'}
          onChange={(value) => onUpdate('input_text_color', value)}
          description="Cor do texto dentro dos campos de formulário"
        />
        <ColorPicker
          label="Cor de Fundo dos Inputs"
          value={customization.input_bg_color || '#2A2A2A'}
          onChange={(value) => onUpdate('input_bg_color', value)}
          description="Cor de fundo dos campos de formulário"
        />
      </div>

      <Separator />

      {/* Botões de Seleção (PIX, Cartão) */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Botões de Seleção (PIX, Cartão)</h3>
        <h4 className="text-md font-semibold">Não Selecionado</h4>
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
        <h4 className="text-md font-semibold">Selecionado</h4>
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
      </div>

      <Separator />

      {/* Botão Principal de Pagamento */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Botão Principal de Pagamento</h3>
        <ColorPicker
          label="Cor do Texto"
          value={customization.payment_button_text_color || '#FFFFFF'}
          onChange={(value) => onUpdate('payment_button_text_color', value)}
        />
        <ColorPicker
          label="Cor de Fundo"
          value={customization.payment_button_bg_color || '#10B981'}
          onChange={(value) => onUpdate('payment_button_bg_color', value)}
          description="Padrão verde"
        />
      </div>
    </div>
  );
};
