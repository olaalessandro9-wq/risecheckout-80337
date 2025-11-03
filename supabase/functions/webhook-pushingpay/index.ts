import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.46.1';
import { normalizePushingPayEvent, verifyPushingPaySignature, type PushingPayEvent } from '../_shared/adapters/pushingpay-adapter.ts';
import { getNextStatus } from '../_shared/state-machine.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-pushingpay-signature',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1) Ler payload
    const payload = await req.text();
    const event: PushingPayEvent = JSON.parse(payload);

    // 2) Validar assinatura (se configurado)
    const signature = req.headers.get('x-pushingpay-signature');
    const webhookSecret = Deno.env.get('PUSHINGPAY_WEBHOOK_SECRET');
    
    if (webhookSecret && signature) {
      const isValid = await verifyPushingPaySignature(payload, signature, webhookSecret);
      if (!isValid) {
        console.error('[Webhook] Invalid signature');
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 3) Normalizar evento
    const normalized = normalizePushingPayEvent(event);
    console.log('[Webhook] Normalized event:', {
      type: normalized.eventType,
      status: normalized.status,
      gatewayEventId: normalized.gatewayEventId,
    });

    // 4) Conectar ao Supabase (service role para bypass RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 5) Descobrir o pedido
    const gatewayPaymentId = (event as any).payment_id;
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('gateway_payment_id', gatewayPaymentId)
      .single();

    if (orderError || !order) {
      console.warn('[Webhook] Order not found:', gatewayPaymentId);
      return new Response(
        JSON.stringify({ message: 'no-order' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[Webhook] Order found:', {
      orderId: order.id,
      currentStatus: order.status,
    });

    // 6) Registrar evento (idempotente)
    const { error: eventError } = await supabase
      .from('order_events')
      .insert({
        order_id: order.id,
        vendor_id: order.vendor_id,
        type: normalized.eventType,
        data: event,
        gateway_event_id: normalized.gatewayEventId,
        occurred_at: normalized.occurredAt.toISOString(),
      });

    if (eventError) {
      // Violação de unique constraint = evento duplicado
      if (eventError.code === '23505') {
        console.log('[Webhook] Duplicate event, skipping:', normalized.gatewayEventId);
        return new Response(
          JSON.stringify({ message: 'duplicate' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw eventError;
    }

    console.log('[Webhook] Event registered:', {
      eventId: normalized.gatewayEventId,
      type: normalized.eventType,
    });

    // 7) Atualizar status do pedido (state machine)
    const nextStatus = getNextStatus(normalized.eventType, order.status);
    
    if (nextStatus) {
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: nextStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      if (updateError) {
        throw updateError;
      }

      console.log('[Webhook] Order status updated:', {
        orderId: order.id,
        from: order.status,
        to: nextStatus,
      });
    } else {
      console.log('[Webhook] No status transition needed');
    }

    // 8) Publicar evento para n8n (se configurado)
    // await publishToN8n({ orderId: order.id, eventType: normalized.eventType });

    // 9) Enviar para Utmify (se integração ativa)
    try {
      const utmifyUrl = `${supabaseUrl}/functions/v1/forward-to-utmify`;
      await fetch(utmifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ orderId: order.id }),
      });
      console.log('[Webhook] Utmify notification sent');
    } catch (utmifyError) {
      // Não quebrar o fluxo se Utmify falhar
      console.error('[Webhook] Utmify error:', utmifyError);
    }

    return new Response(
      JSON.stringify({ message: 'ok', orderId: order.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Webhook] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

