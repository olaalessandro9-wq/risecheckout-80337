import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.46.1';
import { retryPendingWebhooks } from '../_shared/webhook-dispatcher.ts';

/**
 * Job agendado para reprocessar webhooks pendentes de retry
 * 
 * Executa a cada 5-10 minutos via cron
 */

Deno.serve(async (req: Request) => {
  try {
    // Validar chave secreta
    const authHeader = req.headers.get('authorization');
    const cronSecret = Deno.env.get('CRON_SECRET');
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Conectar ao Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[Webhook Retry] Iniciando reprocessamento...');

    await retryPendingWebhooks(supabase);

    console.log('[Webhook Retry] Concluído');

    return new Response(
      JSON.stringify({ message: 'ok' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Webhook Retry] Erro:', error);
    const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

