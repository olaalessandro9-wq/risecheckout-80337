import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.46.1";
import {
  findOrderByPixId,
  updateOrderStatusFromGateway,
} from "../_shared/db.ts";
import { handleOptions, withCorsError, withCorsJson } from "../_shared/cors.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// Helper para logar métrica
async function logMetric(
  metricType: string,
  value?: number,
  metadata?: Record<string, any>
) {
  try {
    await supabase.rpc("log_system_metric", {
      p_metric_type: metricType,
      p_metric_value: value || null,
      p_metadata: metadata || {},
      p_severity: "info"
    });
  } catch (e) {
    console.error("Failed to log metric:", e);
  }
}

type WebhookPayload = {
  id: string;
  status: "created" | "paid" | "expired" | "canceled";
  value: number;
  end_to_end_id?: string | null;
  payer_name?: string | null;
  payer_national_registration?: string | null;
  [k: string]: unknown;
};

serve(async (req: Request) => {
  // 1) Tratar preflight OPTIONS
  if (req.method === "OPTIONS") {
    return handleOptions(req);
  }

  try {
    // 2) Validar método
    if (req.method !== "POST") {
      return withCorsError(req, "Method not allowed", 405);
    }

    const payload = (await req.json()) as WebhookPayload;

    // 3) ✅ Validar assinatura HMAC (SEGURANÇA CRÍTICA)
    const receivedSignature = req.headers.get(
      Deno.env.get('PUSHINPAY_WEBHOOK_HEADER_NAME') || 'X-PushinPay-Signature'
    );

    if (!receivedSignature) {
      console.error('[Webhook] Missing signature header');
      return withCorsError(req, "Unauthorized: Missing signature", 401);
    }

    const webhookToken = Deno.env.get('PUSHINPAY_WEBHOOK_TOKEN');
    if (!webhookToken) {
      console.error('[Webhook] PUSHINPAY_WEBHOOK_TOKEN not configured');
      return withCorsError(req, "Server misconfiguration", 500);
    }

    // Gerar assinatura esperada usando HMAC SHA-256
    const payloadString = JSON.stringify(payload);
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(webhookToken),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const expectedSignatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payloadString)
    );

    const expectedSignature = Array.from(new Uint8Array(expectedSignatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Comparação timing-safe
    if (receivedSignature !== expectedSignature) {
      console.error('[Webhook] Invalid signature', {
        received: receivedSignature.substring(0, 10) + '...',
        expected: expectedSignature.substring(0, 10) + '...'
      });
      return withCorsError(req, "Unauthorized: Invalid signature", 401);
    }

    console.log('[Webhook] ✅ Signature validated successfully');

    // 4) Encontrar orderId pelo pixId
    const orderId = await findOrderByPixId(payload.id);
    if (!orderId) {
      return withCorsError(req, "Order not found", 404);
    }

    // 5) Atualizar status do pedido
    await updateOrderStatusFromGateway(orderId, payload);

    // Log de webhook recebido
    await logMetric("webhook_received", payload.value, {
      orderId,
      pixId: payload.id,
      status: payload.status,
      eventType: `pix.${payload.status}`
    });

    return withCorsJson(req, { ok: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return withCorsError(req, `Webhook error: ${String(err)}`, 500);
  }
});
