import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Copy, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface WebhookFormProps {
  webhook?: {
    id: string;
    url: string;
    events: string[];
    active: boolean;
    secret: string;
  };
  onSave: (data: {
    url: string;
    events: string[];
    active: boolean;
    secret?: string;
  }) => Promise<void>;
  onCancel: () => void;
}

const AVAILABLE_EVENTS = [
  { value: "pix_generated", label: "PIX Gerado", description: "Quando um PIX é criado" },
  { value: "purchase_approved", label: "Compra Aprovada", description: "Quando o pagamento é confirmado" },
];

export function WebhookForm({ webhook, onSave, onCancel }: WebhookFormProps) {
  const [url, setUrl] = useState(webhook?.url || "");
  const [events, setEvents] = useState<string[]>(webhook?.events || []);
  const [active, setActive] = useState(webhook?.active ?? true);
  const [secret, setSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [saving, setSaving] = useState(false);

  const isEditing = !!webhook;

  // Gerar secret automaticamente para novos webhooks
  useEffect(() => {
    if (!isEditing) {
      const generatedSecret = `whsec_${crypto.randomUUID().replace(/-/g, "")}`;
      setSecret(generatedSecret);
    }
  }, [isEditing]);

  const handleEventToggle = (eventValue: string) => {
    setEvents((prev) =>
      prev.includes(eventValue)
        ? prev.filter((e) => e !== eventValue)
        : [...prev, eventValue]
    );
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret);
    toast.success("Secret copiado para a área de transferência!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      toast.error("URL é obrigatória");
      return;
    }

    if (events.length === 0) {
      toast.error("Selecione pelo menos um evento");
      return;
    }

    // Validar URL
    try {
      new URL(url);
    } catch {
      toast.error("URL inválida");
      return;
    }

    setSaving(true);
    try {
      const data: any = {
        url: url.trim(),
        events,
        active,
      };

      // Incluir secret apenas para novos webhooks
      if (!isEditing) {
        data.secret = secret;
      }

      await onSave(data);
    } catch (error) {
      console.error("Erro ao salvar webhook:", error);
      toast.error("Erro ao salvar webhook");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="webhook-url" style={{ color: "var(--text)" }}>
          URL do Webhook <span className="text-red-500">*</span>
        </Label>
        <Input
          id="webhook-url"
          type="url"
          placeholder="https://seu-servidor.com/webhook"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="font-mono"
          required
        />
        <p className="text-xs" style={{ color: "var(--subtext)" }}>
          O endpoint que receberá as notificações de eventos
        </p>
      </div>

      {!isEditing && (
        <div className="space-y-2">
          <Label htmlFor="webhook-secret" style={{ color: "var(--text)" }}>
            Secret (Chave Secreta)
          </Label>
          <div className="flex gap-2">
            <Input
              id="webhook-secret"
              type={showSecret ? "text" : "password"}
              value={secret}
              readOnly
              className="font-mono flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setShowSecret(!showSecret)}
            >
              {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleCopySecret}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-yellow-600 dark:text-yellow-500">
            ⚠️ Copie e guarde esta chave em local seguro. Ela será usada para validar as
            requisições e não poderá ser visualizada novamente.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label style={{ color: "var(--text)" }}>
          Eventos <span className="text-red-500">*</span>
        </Label>
        <div className="space-y-3">
          {AVAILABLE_EVENTS.map((event) => (
            <div key={event.value} className="flex items-start space-x-3">
              <Checkbox
                id={`event-${event.value}`}
                checked={events.includes(event.value)}
                onCheckedChange={() => handleEventToggle(event.value)}
              />
              <div className="grid gap-1 leading-none">
                <label
                  htmlFor={`event-${event.value}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  style={{ color: "var(--text)" }}
                >
                  {event.label}
                </label>
                <p className="text-xs" style={{ color: "var(--subtext)" }}>
                  {event.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label htmlFor="webhook-active" style={{ color: "var(--text)" }}>
            Ativo
          </Label>
          <Switch
            id="webhook-active"
            checked={active}
            onCheckedChange={setActive}
          />
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Atualizar" : "Criar Webhook"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
