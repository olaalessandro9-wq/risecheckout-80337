import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TestWebhookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  webhookId: string;
  webhookName: string;
  webhookUrl: string;
}

const AVAILABLE_EVENTS = [
  { value: "pix_generated", label: "PIX Gerado", description: "Quando o QR Code do PIX é gerado" },
  { value: "purchase_approved", label: "Compra Aprovada", description: "Quando o pagamento é confirmado" },
  { value: "purchase_refused", label: "Compra Recusada", description: "Quando o pagamento é recusado (cartão)" },
  { value: "refund", label: "Reembolso", description: "Quando um pedido é reembolsado" },
  { value: "chargeback", label: "Chargeback", description: "Quando ocorre um chargeback" },
  { value: "checkout_abandoned", label: "Abandono de Checkout", description: "Quando o cliente abandona o checkout" },
];

export function TestWebhookDialog({
  open,
  onOpenChange,
  webhookId,
  webhookName,
  webhookUrl,
}: TestWebhookDialogProps) {
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [sending, setSending] = useState(false);

  const handleSendTest = async () => {
    if (!selectedEvent) {
      toast.error("Selecione um evento");
      return;
    }

    setSending(true);
    try {
      // Criar payload de teste completo estilo Cakto
      const testPayload = {
        id: "7954da66-4153-4f01-8e4e-6b71618a7feb",
        status: selectedEvent === "purchase_approved" ? "paid" : "pending",
        totalAmount: 1.89,
        baseAmount: 100,
        discount: 10,
        amount: 90,
        paymentMethod: "credit_card",
        paymentMethodName: "Cartão de Crédito",
        paidAt: selectedEvent === "purchase_approved" ? new Date().toISOString() : null,
        createdAt: new Date().toISOString(),
        due_date: new Date(Date.now() + 86400000).toISOString(),
        refundedAt: null,
        chargedbackAt: null,
        canceledAt: null,
        
        // UTMs
        utm_source: "test",
        utm_medium: "webhook",
        utm_campaign: "test_20251111",
        utm_term: "example",
        utm_content: "example",
        sck: null,
        fbc: null,
        fbp: null,

        // Dados de cartão
        card: {
          lastDigits: "4323",
          holderName: "Card Example",
          brand: "visa",
        },

        // Dados de boleto
        boleto: {
          barcode: "03399853012970000154708032001011596630000000500",
          boletoUrl: "https://urlDePagamento.example.com",
          expirationDate: new Date(Date.now() + 259200000).toISOString().split('T')[0],
        },

        // Dados de PIX
        pix: {
          expirationDate: new Date(Date.now() + 1800000).toISOString(),
          qrCode: "pixqrcode",
        },

        // Dados de PicPay
        picpay: {
          qrCode: "picpaycode",
          paymentURL: "https://urlDePagamento.example.com",
          expirationDate: new Date(Date.now() + 1800000).toISOString(),
        },

        // Dados do cliente
        customer: {
          name: "John Doe",
          email: "john.doe@example.com",
          phone: "34999999999",
          docNumber: "12345678909",
          birthDate: null,
          docType: "cpf",
          address: null,
          shipping: null,
          affiliate: "affiliate@example.com",
        },

        // Dados do produto
        product: {
          name: "Produto Teste",
          id: "ff3fdf01-e88f-43b5-982a-32d50ff12414",
          short_id: "Acknq75",
          supportEmail: "teste@teste.com",
          type: "unique",
          invoiceDescription: null,
        },

        // Comissões
        commissions: [{
          user: "teste@teste.com",
          totalAmount: 180,
          type: "producer",
          percentage: 60,
        }],
        fees: 0,
        couponCode: null,
        reason: "Motivo de recusa do cartão",
        refund_reason: "Motivo de reembolso",
        installments: 1,

        // Assinatura
        subscription: {
          id: "942d796d-abd5-43b4-b08c-d10fb1c487e1",
          status: "active",
          current_period: 1,
          recurrence_period: 30,
          quantity_recurrences: 0,
          trial_days: 1,
          max_retries: 3,
          amount: 90.00,
          retry_interval: 1,
          paid_payments_quantity: 1,
          retention: "00:0:00",
          parent_order: "95Mf2pwi",
        },

        // Pedidos relacionados
        orders: [{
          id: "7954da66-4153-4f01-8e4e-6b71618a7feb",
          next_payment_date: new Date(Date.now() + 2592000000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          canceledAt: null,
        }],

        // Oferta
        offer: {
          id: "B8BcHrY",
          name: "Special Offer",
          price: 10,
          image: null,
          offer_type: "main",
        },

        // Checkout
        checkout: "123",
        checkoutUrl: `https://pay.cakto.com.br/EXAMPLE?utm_source=test&utm_medium=webhook&utm_campaign=test_20251111&utm_term=example&utm_content=example`,
        subscription_period: 1,
        parent_order: "95Mf2pwi",
        webhookUrl: webhookUrl,
        executionMode: "production",
      };

      // Enviar através de uma Edge Function auxiliar que faz o POST
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const response = await fetch(`${supabaseUrl}/functions/v1/send-webhook-test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseAnonKey}`,
          "apikey": supabaseAnonKey,
        },
        body: JSON.stringify({
          webhook_id: webhookId,
          webhook_url: webhookUrl,
          event_type: selectedEvent,
          payload: testPayload,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(`Evento de teste enviado! Status: ${result.status_code}`);
        onOpenChange(false);
      } else {
        toast.error(`Erro ao enviar: ${result.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error("Error sending test event:", error);
      toast.error("Erro ao enviar evento de teste");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Enviar Evento de Teste</DialogTitle>
          <DialogDescription>
            Teste seu webhook enviando um evento simulado
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label style={{ color: "var(--text)" }}>Webhook</Label>
            <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
              {webhookName}
            </p>
            <p className="text-xs font-mono" style={{ color: "var(--subtext)" }}>
              {webhookUrl}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="test-event" style={{ color: "var(--text)" }}>
              Evento <span className="text-red-500">*</span>
            </Label>
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger id="test-event">
                <SelectValue placeholder="Selecione um evento" />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_EVENTS.map((event) => (
                  <SelectItem key={event.value} value={event.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{event.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {event.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg bg-muted p-3">
            <p className="text-xs" style={{ color: "var(--subtext)" }}>
              ℹ️ Este é um evento de teste. O payload será marcado com{" "}
              <code className="bg-background px-1 rounded">test_mode: true</code> e
              o header <code className="bg-background px-1 rounded">X-Rise-Test: true</code>
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSendTest} disabled={sending || !selectedEvent}>
              {sending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Enviar Teste
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
