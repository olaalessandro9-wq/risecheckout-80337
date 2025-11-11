import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Webhook } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { WebhooksList } from "./WebhooksList";
import { WebhookForm } from "./WebhookForm";

interface WebhookData {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  secret: string;
  created_at: string;
}

export function WebhooksConfig() {
  const { user } = useAuth();
  const [webhooks, setWebhooks] = useState<WebhookData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookData | null>(null);

  useEffect(() => {
    if (user) {
      loadWebhooks();
    }
  }, [user]);

  const loadWebhooks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("outbound_webhooks")
        .select("*")
        .eq("vendor_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setWebhooks(data || []);
    } catch (error) {
      console.error("Error loading webhooks:", error);
      toast.error("Erro ao carregar webhooks");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: {
    url: string;
    events: string[];
    active: boolean;
    secret?: string;
  }) => {
    try {
      if (editingWebhook) {
        // Atualizar webhook existente
        const { error } = await supabase
          .from("outbound_webhooks")
          .update({
            url: data.url,
            events: data.events,
            active: data.active,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingWebhook.id);

        if (error) throw error;
        toast.success("Webhook atualizado com sucesso!");
      } else {
        // Criar novo webhook
        const { error } = await supabase
          .from("outbound_webhooks")
          .insert({
            vendor_id: user?.id,
            url: data.url,
            events: data.events,
            active: data.active,
            secret: data.secret!,
          });

        if (error) throw error;
        toast.success("Webhook criado com sucesso!");
      }

      setShowForm(false);
      setEditingWebhook(null);
      loadWebhooks();
    } catch (error) {
      console.error("Error saving webhook:", error);
      throw error;
    }
  };

  const handleEdit = (webhook: WebhookData) => {
    setEditingWebhook(webhook);
    setShowForm(true);
  };

  const handleDelete = async (webhookId: string) => {
    try {
      const { error } = await supabase
        .from("outbound_webhooks")
        .delete()
        .eq("id", webhookId);

      if (error) throw error;

      toast.success("Webhook excluído com sucesso!");
      loadWebhooks();
    } catch (error) {
      console.error("Error deleting webhook:", error);
      toast.error("Erro ao excluir webhook");
      throw error;
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingWebhook(null);
  };

  const handleNewWebhook = () => {
    setEditingWebhook(null);
    setShowForm(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Webhook className="h-6 w-6" style={{ color: "var(--primary)" }} />
            <div>
              <CardTitle style={{ color: "var(--text)" }}>Webhooks</CardTitle>
              <CardDescription style={{ color: "var(--subtext)" }}>
                Configure endpoints para receber notificações de eventos em tempo real
              </CardDescription>
            </div>
            {webhooks.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {webhooks.length}
              </Badge>
            )}
          </div>
          {!showForm && (
            <Button onClick={handleNewWebhook} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Novo Webhook
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm ? (
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text)" }}>
              {editingWebhook ? "Editar Webhook" : "Novo Webhook"}
            </h3>
            <WebhookForm
              webhook={editingWebhook || undefined}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          </div>
        ) : (
          <>
            <WebhooksList
              webhooks={webhooks}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
            
            {webhooks.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <h4 className="text-sm font-semibold mb-2" style={{ color: "var(--text)" }}>
                  📘 Como usar
                </h4>
                <ul className="text-xs space-y-1" style={{ color: "var(--subtext)" }}>
                  <li>• Os webhooks serão enviados via POST com JSON no corpo</li>
                  <li>• Use o header <code className="bg-white dark:bg-gray-800 px-1 rounded">X-Rise-Signature</code> para validar a autenticidade</li>
                  <li>• O payload inclui dados completos do pedido, cliente e produto</li>
                  <li>• Seu endpoint deve responder com status 2xx para confirmar recebimento</li>
                </ul>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
