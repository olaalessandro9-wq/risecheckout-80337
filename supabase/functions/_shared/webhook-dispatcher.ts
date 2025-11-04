/**
 * Helper para enviar webhooks de saída para vendedores/afiliados
 * 
 * Funcionalidades:
 * - Assinatura HMAC para segurança
 * - Retry automático (exponential backoff)
 * - Registro de tentativas
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.46.1';
import { decrypt } from './crypto.ts';

type OutboundWebhook = {
  id: string;
  url: string;
  secret: string;
  secret_encrypted?: string | null;
  vendor_id: string;
  active: boolean;
  events: string[];
};

type WebhookDelivery = {
  id: string;
  webhook_id: string;
  order_id: string;
  event_type: string;
  payload: WebhookPayload;
  status: string;
  attempts: number;
  last_attempt_at: string;
  next_retry_at: string | null;
  response_status?: number;
  response_body?: string;
  outbound_webhooks?: OutboundWebhook;
};

export type WebhookPayload = {
  event: string;
  orderId: string;
  vendorId: string;
  status: string;
  customerEmail?: string;
  customerName?: string;
  amount?: number;
  currency?: string;
  occurredAt: string;
  data?: Record<string, any>;
};

/**
 * Gera assinatura HMAC SHA-256
 */
async function generateSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payload)
  );

  return Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Envia webhook para uma URL específica
 */
async function sendWebhook(
  url: string,
  payload: WebhookPayload,
  secret: string
): Promise<{ status: number; body: string }> {
  const payloadString = JSON.stringify(payload);
  const signature = await generateSignature(payloadString, secret);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': signature,
      'X-Webhook-Event': payload.event,
      'X-Webhook-Timestamp': new Date().toISOString(),
    },
    body: payloadString,
  });

  return {
    status: response.status,
    body: await response.text(),
  };
}

/**
 * Calcula próximo retry com exponential backoff
 * Tentativa 1: 5 min
 * Tentativa 2: 15 min
 * Tentativa 3: 1 hora
 * Tentativa 4: 6 horas
 * Tentativa 5+: desiste
 */
function getNextRetryDelay(attempts: number): number | null {
  const delays = [5, 15, 60, 360]; // minutos
  if (attempts >= delays.length) {
    return null; // desiste
  }
  return delays[attempts] * 60 * 1000; // converte para ms
}

/**
 * Despacha webhook para todos os vendedores/afiliados configurados
 */
export async function dispatchWebhook(
  supabase: ReturnType<typeof createClient>,
  payload: WebhookPayload
): Promise<void> {
  // 1) Buscar webhooks configurados para este vendedor e evento
  const { data: webhooks, error: webhooksError } = await supabase
    .from('outbound_webhooks')
    .select('*')
    .eq('vendor_id', payload.vendorId)
    .eq('active', true)
    .contains('events', [payload.event]);

  if (webhooksError) {
    console.error('[Webhook] Error fetching webhooks:', webhooksError);
    return;
  }

  if (!webhooks || webhooks.length === 0) {
    console.log('[Webhook] No webhooks configured for event:', payload.event);
    return;
  }

  console.log(`[Webhook] Dispatching to ${webhooks.length} webhook(s)`);

  // 2) Enviar para cada webhook
  for (const webhook of (webhooks as OutboundWebhook[])) {
    try {
      // Descriptografar secret se estiver criptografado
      const webhookSecret = webhook.secret_encrypted 
        ? await decrypt(webhook.secret_encrypted)
        : webhook.secret;

      const result = await sendWebhook(webhook.url as string, payload, webhookSecret);

      // 3) Registrar tentativa
      const delivery = {
        webhook_id: webhook.id,
        order_id: payload.orderId,
        event_type: payload.event,
        payload: payload as any,
        status: result.status >= 200 && result.status < 300 ? 'delivered' : 'failed',
        attempts: 1,
        last_attempt_at: new Date().toISOString(),
        next_retry_at: null as string | null,
        response_status: result.status,
        response_body: result.body.substring(0, 1000), // limita tamanho
      };

      // Se falhou, agendar retry
      if (delivery.status === 'failed') {
        const retryDelay = getNextRetryDelay(0);
        if (retryDelay) {
          delivery.next_retry_at = new Date(Date.now() + retryDelay).toISOString();
          delivery.status = 'pending_retry';
        }
      }

      await supabase.from('webhook_deliveries').insert(delivery);

      console.log(`[Webhook] Sent to ${webhook.url}: ${result.status}`);

    } catch (error) {
      console.error(`[Webhook] Failed to send to ${webhook.url}:`, error);
      const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);

      // Registrar falha
      const retryDelay = getNextRetryDelay(0);
      await supabase.from('webhook_deliveries').insert({
        webhook_id: webhook.id,
        order_id: payload.orderId,
        event_type: payload.event,
        payload: payload as any,
        status: retryDelay ? 'pending_retry' : 'failed',
        attempts: 1,
        last_attempt_at: new Date().toISOString(),
        next_retry_at: retryDelay ? new Date(Date.now() + retryDelay).toISOString() : null,
        response_status: 0,
        response_body: errorMsg,
      });
    }
  }
}

/**
 * Reprocessa webhooks pendentes de retry
 */
export async function retryPendingWebhooks(
  supabase: any
): Promise<void> {
  // Buscar deliveries pendentes de retry
  const { data: deliveries, error } = await supabase
    .from('webhook_deliveries')
    .select(`
      *,
      outbound_webhooks!inner (*)
    `)
    .eq('status', 'pending_retry')
    .lte('next_retry_at', new Date().toISOString())
    .limit(100);

  if (error || !deliveries || deliveries.length === 0) {
    return;
  }

  console.log(`[Webhook Retry] Processing ${deliveries.length} pending deliveries`);

  for (const delivery of deliveries) {
    const deliveryTyped = delivery as WebhookDelivery;
    const webhook = (delivery as any).outbound_webhooks as OutboundWebhook;

    try {
      // Descriptografar secret se estiver criptografado
      const webhookSecret = webhook.secret_encrypted
        ? await decrypt(webhook.secret_encrypted)
        : webhook.secret;

      const result = await sendWebhook(webhook.url as string, deliveryTyped.payload as WebhookPayload, webhookSecret);

      const newAttempts = (deliveryTyped.attempts ?? 0) + 1;
      const newStatus = result.status >= 200 && result.status < 300 ? 'delivered' : 'failed';

      let nextRetryAt = null;
      if (newStatus === 'failed') {
        const retryDelay = getNextRetryDelay(newAttempts);
        if (retryDelay) {
          nextRetryAt = new Date(Date.now() + retryDelay).toISOString();
        }
      }

      await supabase
        .from('webhook_deliveries')
        .update({
          attempts: newAttempts,
          last_attempt_at: new Date().toISOString(),
          next_retry_at: nextRetryAt,
          status: nextRetryAt ? 'pending_retry' : newStatus,
          response_status: result.status,
          response_body: result.body.substring(0, 1000),
        })
        .eq('id', deliveryTyped.id as any);

      console.log(`[Webhook Retry] ${webhook.url}: ${result.status} (attempt ${newAttempts})`);

    } catch (error) {
      console.error(`[Webhook Retry] Failed: ${webhook.url}:`, error);
      const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
      const deliveryTyped = delivery as WebhookDelivery;

      const newAttempts = (deliveryTyped.attempts ?? 0) + 1;
      const retryDelay = getNextRetryDelay(newAttempts);

      await supabase
        .from('webhook_deliveries')
        .update({
          attempts: newAttempts,
          last_attempt_at: new Date().toISOString(),
          next_retry_at: retryDelay ? new Date(Date.now() + retryDelay).toISOString() : null,
          status: retryDelay ? 'pending_retry' : 'failed',
          response_status: 0,
          response_body: errorMsg,
        })
        .eq('id', deliveryTyped.id as any);
    }
  }
}

