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
          value={customization.colors?.primaryText || '#000000'}
          onChange={(value) => onUpdate('colors.primaryText', value)}
          description="Títulos e labels principais"
        />
        <ColorPicker
          label="Cor Secundária do Texto"
          value={customization.colors?.secondaryText || '#6B7280'}
          onChange={(value) => onUpdate('colors.secondaryText', value)}
          description="Descrições e subtítulos"
        />
        <ColorPicker
          label="Cor Ativa do Texto"
          value={customization.colors?.active || '#10B981'}
          onChange={(value) => onUpdate('colors.active', value)}
          description="Preços, CTAs e textos em destaque (padrão verde)"
        />
        <ColorPicker
          label="Cor dos Ícones"
          value={customization.colors?.icon || '#000000'}
          onChange={(value) => onUpdate('colors.icon', value)}
          description="Ícones do Pix, Cartão de Crédito, etc."
        />
      </div>

      <Separator />

      {/* Cores de Fundo */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Cores de Fundo</h3>
        <ColorPicker
          label="Cor de Fundo"
          value={customization.colors?.background || '#FFFFFF'}
          onChange={(value) => onUpdate('colors.background', value)}
          description="Fundo geral do checkout"
        />
        <ColorPicker
          label="Cor de Fundo do Formulário de Pagamento"
          value={customization.colors?.formBackground || '#F9FAFB'}
          onChange={(value) => onUpdate('colors.formBackground', value)}
          description="Fundo da seção de pagamento"
        />
      </div>

      <Separator />

      {/* Botões Não Selecionados */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Botões Não Selecionados</h3>
        <ColorPicker
          label="Cor do Texto"
          value={customization.colors?.unselectedButton?.text || '#000000'}
          onChange={(value) => onUpdate('colors.unselectedButton.text', value)}
        />
        <ColorPicker
          label="Cor de Fundo"
          value={customization.colors?.unselectedButton?.background || '#FFFFFF'}
          onChange={(value) => onUpdate('colors.unselectedButton.background', value)}
        />
        <ColorPicker
          label="Cor dos Ícones"
          value={customization.colors?.unselectedButton?.icon || '#000000'}
          onChange={(value) => onUpdate('colors.unselectedButton.icon', value)}
        />
      </div>

      <Separator />

      {/* Botão Selecionado */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Botão Selecionado</h3>
        <ColorPicker
          label="Cor do Texto"
          value={customization.colors?.selectedButton?.text || '#FFFFFF'}
          onChange={(value) => onUpdate('colors.selectedButton.text', value)}
        />
        <ColorPicker
          label="Cor de Fundo"
          value={customization.colors?.selectedButton?.background || '#10B981'}
          onChange={(value) => onUpdate('colors.selectedButton.background', value)}
          description="Padrão verde"
        />
        <ColorPicker
          label="Cor do Ícone"
          value={customization.colors?.selectedButton?.icon || '#FFFFFF'}
          onChange={(value) => onUpdate('colors.selectedButton.icon', value)}
        />
      </div>

      <Separator />

      {/* Caixas Padrões */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Caixas Padrões</h3>
        <ColorPicker
          label="Cor de Fundo do Cabeçalho"
          value={customization.colors?.box?.headerBg || '#1A1A1A'}
          onChange={(value) => onUpdate('colors.box.headerBg', value)}
        />
        <ColorPicker
          label="Cor Primária do Texto do Cabeçalho"
          value={customization.colors?.box?.headerPrimaryText || '#FFFFFF'}
          onChange={(value) => onUpdate('colors.box.headerPrimaryText', value)}
        />
        <ColorPicker
          label="Cor Secundária do Texto do Cabeçalho"
          value={customization.colors?.box?.headerSecondaryText || '#CCCCCC'}
          onChange={(value) => onUpdate('colors.box.headerSecondaryText', value)}
        />
        <ColorPicker
          label="Cor de Fundo da Caixa"
          value={customization.colors?.box?.bg || '#0A0A0A'}
          onChange={(value) => onUpdate('colors.box.bg', value)}
        />
        <ColorPicker
          label="Cor Primária do Texto da Caixa"
          value={customization.colors?.box?.primaryText || '#FFFFFF'}
          onChange={(value) => onUpdate('colors.box.primaryText', value)}
        />
        <ColorPicker
          label="Cor Secundária do Texto da Caixa"
          value={customization.colors?.box?.secondaryText || '#CCCCCC'}
          onChange={(value) => onUpdate('colors.box.secondaryText', value)}
        />
      </div>

      <Separator />

      {/* Caixas Não Selecionadas */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Caixas Não Selecionadas</h3>
        <ColorPicker
          label="Cor de Fundo do Cabeçalho"
          value={customization.colors?.unselectedBox?.headerBg || '#1A1A1A'}
          onChange={(value) => onUpdate('colors.unselectedBox.headerBg', value)}
        />
        <ColorPicker
          label="Cor Primária do Texto do Cabeçalho"
          value={customization.colors?.unselectedBox?.headerPrimaryText || '#FFFFFF'}
          onChange={(value) => onUpdate('colors.unselectedBox.headerPrimaryText', value)}
        />
        <ColorPicker
          label="Cor Secundária do Texto do Cabeçalho"
          value={customization.colors?.unselectedBox?.headerSecondaryText || '#CCCCCC'}
          onChange={(value) => onUpdate('colors.unselectedBox.headerSecondaryText', value)}
        />
        <ColorPicker
          label="Cor de Fundo da Caixa"
          value={customization.colors?.unselectedBox?.bg || '#0A0A0A'}
          onChange={(value) => onUpdate('colors.unselectedBox.bg', value)}
        />
        <ColorPicker
          label="Cor Primária do Texto da Caixa"
          value={customization.colors?.unselectedBox?.primaryText || '#FFFFFF'}
          onChange={(value) => onUpdate('colors.unselectedBox.primaryText', value)}
        />
        <ColorPicker
          label="Cor Secundária do Texto da Caixa"
          value={customization.colors?.unselectedBox?.secondaryText || '#CCCCCC'}
          onChange={(value) => onUpdate('colors.unselectedBox.secondaryText', value)}
        />
      </div>

      <Separator />

      {/* Caixas Selecionadas */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Caixas Selecionadas</h3>
        <ColorPicker
          label="Cor de Fundo do Cabeçalho"
          value={customization.colors?.selectedBox?.headerBg || '#10B981'}
          onChange={(value) => onUpdate('colors.selectedBox.headerBg', value)}
          description="Padrão verde"
        />
        <ColorPicker
          label="Cor Primária do Texto do Cabeçalho"
          value={customization.colors?.selectedBox?.headerPrimaryText || '#FFFFFF'}
          onChange={(value) => onUpdate('colors.selectedBox.headerPrimaryText', value)}
        />
        <ColorPicker
          label="Cor Secundária do Texto do Cabeçalho"
          value={customization.colors?.selectedBox?.headerSecondaryText || '#CCCCCC'}
          onChange={(value) => onUpdate('colors.selectedBox.headerSecondaryText', value)}
        />
        <ColorPicker
          label="Cor de Fundo da Caixa"
          value={customization.colors?.selectedBox?.bg || '#0A0A0A'}
          onChange={(value) => onUpdate('colors.selectedBox.bg', value)}
        />
        <ColorPicker
          label="Cor Primária do Texto da Caixa"
          value={customization.colors?.selectedBox?.primaryText || '#FFFFFF'}
          onChange={(value) => onUpdate('colors.selectedBox.primaryText', value)}
        />
        <ColorPicker
          label="Cor Secundária do Texto da Caixa"
          value={customization.colors?.selectedBox?.secondaryText || '#CCCCCC'}
          onChange={(value) => onUpdate('colors.selectedBox.secondaryText', value)}
        />
      </div>

      <Separator />

      {/* Botão do Pagamento */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Botão do Pagamento</h3>
        <ColorPicker
          label="Cor do Texto Botão de Pagar"
          value={customization.colors?.button?.text || '#FFFFFF'}
          onChange={(value) => onUpdate('colors.button.text', value)}
        />
        <ColorPicker
          label="Cor do Botão de Pagar"
          value={customization.colors?.button?.background || '#10B981'}
          onChange={(value) => onUpdate('colors.button.background', value)}
          description="Padrão verde"
        />
      </div>
    </div>
  );
};

