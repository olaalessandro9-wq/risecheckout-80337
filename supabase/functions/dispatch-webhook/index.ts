import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DispatchWebhookRequest {
  webhook_id: string;
  webhook_url: string;
  order_id: string;
  event_type: string;
  payload: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
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

    const { webhook_id, webhook_url, order_id, event_type, payload }: DispatchWebhookRequest = await req.json()

    console.log('[dispatch-webhook] Disparando webhook:', {
      webhook_id,
      webhook_url,
      order_id,
      event_type
    })

    // Criar registro de log ANTES de enviar
    const { data: logEntry, error: logError } = await supabaseClient
      .from('webhook_deliveries')
      .insert({
        webhook_id,
        order_id,
        event_type,
        payload,
        status: 'pending',
        attempts: 0
      })
      .select()
      .single()

    if (logError) {
      console.error('[dispatch-webhook] Erro ao criar log:', logError)
      throw logError
    }

    // Enviar webhook
    try {
      const response = await fetch(webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'RiseCheckout-Webhook/1.0'
        },
        body: JSON.stringify(payload)
      })

      const responseBody = await response.text()
      console.log('[dispatch-webhook] Resposta:', response.status, responseBody.substring(0, 100))

      // Atualizar log com resultado
      await supabaseClient
        .from('webhook_deliveries')
        .update({
          status: response.ok ? 'success' : 'failed',
          attempts: 1,
          last_attempt_at: new Date().toISOString(),
          response_status: response.status,
          response_body: responseBody.substring(0, 1000)
        })
        .eq('id', logEntry.id)

      return new Response(
        JSON.stringify({ 
          success: true, 
          status_code: response.status,
          log_id: logEntry.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )

    } catch (error) {
      console.error('[dispatch-webhook] Erro ao enviar:', error)

      // Atualizar log com erro
      await supabaseClient
        .from('webhook_deliveries')
        .update({
          status: 'failed',
          attempts: 1,
          last_attempt_at: new Date().toISOString(),
          response_body: error.message
        })
        .eq('id', logEntry.id)

      throw error
    }

  } catch (error) {
    console.error('[dispatch-webhook] Erro geral:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
