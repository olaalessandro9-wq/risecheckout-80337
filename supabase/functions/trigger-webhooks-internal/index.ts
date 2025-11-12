import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WebhookPayload {
  event: string;
  vendor_id: string;
  product_id: string;
  order_id: string;
  data: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Criar cliente Supabase com a service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Receber o payload do trigger
    const payload: WebhookPayload = await req.json()
    console.log('[trigger-webhooks-internal] Payload recebido:', JSON.stringify(payload, null, 2))

    const { event, vendor_id, product_id, order_id, data } = payload

    // Buscar todos os webhooks ativos para este vendor
    const { data: webhooks, error: webhooksError } = await supabaseClient
      .from('outbound_webhooks')
      .select('id, name, url, secret_encrypted, events')
      .eq('vendor_id', vendor_id)
      .eq('active', true)

    if (webhooksError) {
      console.error('[trigger-webhooks-internal] Erro ao buscar webhooks:', webhooksError)
      throw webhooksError
    }

    if (!webhooks || webhooks.length === 0) {
      console.log('[trigger-webhooks-internal] Nenhum webhook ativo encontrado para vendor_id:', vendor_id)
      return new Response(
        JSON.stringify({ success: true, message: 'Nenhum webhook ativo encontrado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    console.log(`[trigger-webhooks-internal] Encontrados ${webhooks.length} webhooks ativos`)

    // Para cada webhook, verificar se o produto está configurado e se o evento está habilitado
    for (const webhook of webhooks) {
      console.log(`[trigger-webhooks-internal] Processando webhook: ${webhook.name} (${webhook.id})`)

      // Verificar se o evento está habilitado neste webhook
      if (!webhook.events || !webhook.events.includes(event)) {
        console.log(`[trigger-webhooks-internal] Evento "${event}" não está habilitado no webhook ${webhook.name}`)
        continue
      }

      // Buscar os produtos configurados para este webhook
      const { data: webhookProducts, error: productsError } = await supabaseClient
        .from('webhook_products')
        .select('product_id')
        .eq('webhook_id', webhook.id)

      if (productsError) {
        console.error('[trigger-webhooks-internal] Erro ao buscar produtos do webhook:', productsError)
        continue
      }

      // Se não houver produtos configurados, pular este webhook
      if (!webhookProducts || webhookProducts.length === 0) {
        console.log(`[trigger-webhooks-internal] Nenhum produto configurado para o webhook ${webhook.name}`)
        continue
      }

      // Verificar se o produto do pedido está na lista de produtos configurados
      const productIds = webhookProducts.map(wp => wp.product_id)
      if (!productIds.includes(product_id)) {
        console.log(`[trigger-webhooks-internal] Produto ${product_id} não está configurado no webhook ${webhook.name}`)
        continue
      }

      console.log(`[trigger-webhooks-internal] Produto ${product_id} encontrado no webhook ${webhook.name}. Disparando webhook...`)

      // Preparar o payload para enviar
      const webhookPayload = {
        event,
        timestamp: new Date().toISOString(),
        vendor_id,
        product_id,
        order_id,
        data
      }

      // Criar um registro de log ANTES de tentar enviar o webhook
      const { data: logEntry, error: logError } = await supabaseClient
        .from('webhook_deliveries')
        .insert({
          webhook_id: webhook.id,
          order_id,
          event_type: event,
          payload: webhookPayload,
          status: 'pending',
          attempts: 0
        })
        .select()
        .single()

      if (logError) {
        console.error('[trigger-webhooks-internal] Erro ao criar log de webhook:', logError)
        continue
      }

      console.log(`[trigger-webhooks-internal] Log de webhook criado com ID: ${logEntry.id}`)

      // Tentar enviar o webhook
      try {
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': webhook.secret_encrypted || '',
            'User-Agent': 'RiseCheckout-Webhook/1.0'
          },
          body: JSON.stringify(webhookPayload)
        })

        const responseBody = await response.text()
        console.log(`[trigger-webhooks-internal] Resposta do webhook: Status ${response.status}`)

        // Atualizar o log com o resultado
        await supabaseClient
          .from('webhook_deliveries')
          .update({
            status: response.ok ? 'success' : 'failed',
            attempts: 1,
            last_attempt_at: new Date().toISOString(),
            response_status: response.status,
            response_body: responseBody.substring(0, 1000) // Limitar o tamanho da resposta
          })
          .eq('id', logEntry.id)

        console.log(`[trigger-webhooks-internal] Webhook ${webhook.name} enviado com sucesso!`)

      } catch (error) {
        console.error(`[trigger-webhooks-internal] Erro ao enviar webhook ${webhook.name}:`, error)

        // Atualizar o log com o erro
        await supabaseClient
          .from('webhook_deliveries')
          .update({
            status: 'failed',
            attempts: 1,
            last_attempt_at: new Date().toISOString(),
            response_body: error.message
          })
          .eq('id', logEntry.id)
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Webhooks processados' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('[trigger-webhooks-internal] Erro geral:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
