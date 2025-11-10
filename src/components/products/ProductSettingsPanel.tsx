import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type RequiredFields = {
  name: boolean;
  email: boolean;
  phone: boolean;
  cpf: boolean;
};

type Settings = {
  required_fields: RequiredFields;
  default_payment_method: "pix" | "credit_card";
};

type Props = {
  productId: string;
  onModifiedChange?: (modified: boolean) => void;
};

export default function ProductSettingsPanel({ productId, onModifiedChange }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initial, setInitial] = useState<Settings>({
    required_fields: { name: true, email: true, phone: false, cpf: false },
    default_payment_method: "pix",
  });
  const [form, setForm] = useState<Settings>(initial);

  // Carregar dados do Supabase
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("products")
          .select("required_fields, default_payment_method")
          .eq("id", productId)
          .maybeSingle();

        if (error) {
          console.error("Error loading product settings:", error);
          toast.error("Erro ao carregar configurações.");
        }

        // Normalizar dados com fallback seguro
        const rf = (data?.required_fields as any) || {};
        const loadedSettings: Settings = {
          required_fields: {
            name: true,
            email: true,
            phone: !!rf.phone,
            cpf: !!rf.cpf,
          },
          default_payment_method: (data?.default_payment_method as "pix" | "credit_card") || "pix",
        };
        
        setInitial(loadedSettings);
        setForm(loadedSettings);
      } catch (error) {
        console.error("Unexpected error loading product settings:", error);
        toast.error("Erro inesperado ao carregar configurações.");
      } finally {
        setLoading(false);
      }
    })();
  }, [productId]);

  // Detectar mudanças e notificar o componente pai
  useEffect(() => {
    const hasChanges = JSON.stringify(initial) !== JSON.stringify(form);
    onModifiedChange?.(hasChanges);
  }, [form, initial, onModifiedChange]);


  const handleSave = async () => {
    setSaving(true);
    try {
      // Garantir que nome e email sempre fiquem true
      const payload = {
        required_fields: {
          name: true,
          email: true,
          phone: form.required_fields.phone,
          cpf: form.required_fields.cpf,
        },
        default_payment_method: form.default_payment_method,
      };

      const { data: updated, error: updError } = await supabase
        .from("products")
        .update(payload)
        .eq("id", productId)
        .select("id")
        .maybeSingle();

      if (updError || !updated) {
        console.error("Error saving product settings:", updError);
        toast.error("Erro ao salvar configurações. Verifique sua sessão.");
        return;
      }

      toast.success("Configurações salvas com sucesso.");
      setInitial(form); // Atualiza o estado inicial para resetar flag de modificação
      onModifiedChange?.(false);
    } catch (error) {
      console.error("Unexpected error saving product settings:", error);
      toast.error("Erro inesperado ao salvar configurações.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-muted">
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-muted">
      <CardHeader>
        <CardTitle>Configurações do produto</CardTitle>
        <CardDescription>As alterações afetam o checkout público <strong>após salvar</strong>.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <section className="space-y-4">
          <h3 className="text-sm font-medium">Campos do checkout</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Nome completo</Label>
                <Switch checked={form.required_fields.name} disabled aria-readonly />
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="h-3.5 w-3.5" /> Obrigatório
              </p>
            </div>

            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <Label className="font-medium">E-mail</Label>
                <Switch checked={form.required_fields.email} disabled aria-readonly />
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="h-3.5 w-3.5" /> Obrigatório
              </p>
            </div>

            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Telefone</Label>
                <Switch
                  checked={form.required_fields.phone}
                  onCheckedChange={(v) =>
                    setForm((f) => ({ ...f, required_fields: { ...f.required_fields, phone: !!v } }))
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="h-3.5 w-3.5" /> Opcional
              </p>
            </div>

            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <Label className="font-medium">CPF/CNPJ</Label>
                <Switch
                  checked={form.required_fields.cpf}
                  onCheckedChange={(v) =>
                    setForm((f) => ({ ...f, required_fields: { ...f.required_fields, cpf: !!v } }))
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="h-3.5 w-3.5" /> Opcional
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-medium">Método de pagamento padrão</h3>
          <RadioGroup
            value={form.default_payment_method}
            onValueChange={(v) =>
              setForm((f) => ({ ...f, default_payment_method: v as "pix" | "credit_card" }))
            }
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <Label
              htmlFor="pg-pix"
              className={cn(
                "border rounded-lg p-4 cursor-pointer flex items-center gap-3",
                form.default_payment_method === "pix" ? "ring-2 ring-primary" : ""
              )}
            >
              <RadioGroupItem id="pg-pix" value="pix" />
              Pix
            </Label>

            <Label
              htmlFor="pg-cc"
              className={cn(
                "border rounded-lg p-4 cursor-pointer flex items-center gap-3",
                form.default_payment_method === "credit_card" ? "ring-2 ring-primary" : ""
              )}
            >
              <RadioGroupItem id="pg-cc" value="credit_card" />
              Cartão de crédito
            </Label>
          </RadioGroup>
        </section>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
