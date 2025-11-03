import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook para enviar heartbeat de checkout
 * 
 * Envia ping a cada 20 segundos para o backend
 * indicando que o usuário ainda está ativo no checkout.
 * 
 * Usado para detectar checkouts abandonados.
 * 
 * @param sessionId - ID da sessão de checkout (UUID)
 * @param enabled - Se o heartbeat está ativo (default: true)
 */
export function useCheckoutHeartbeat(sessionId: string | null, enabled: boolean = true) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Não iniciar se não tiver sessionId ou se desabilitado
    if (!sessionId || !enabled) {
      return;
    }

    // Função para enviar heartbeat
    const sendHeartbeat = async () => {
      try {
        await supabase.functions.invoke('checkout-heartbeat', {
          body: { sessionId }
        });
        
        console.log('[Heartbeat] Sent:', sessionId);
      } catch (error) {
        console.error('[Heartbeat] Error:', error);
        // Não quebrar o fluxo se falhar
      }
    };

    // Enviar imediatamente
    sendHeartbeat();

    // Enviar a cada 20 segundos
    intervalRef.current = setInterval(sendHeartbeat, 20000);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [sessionId, enabled]);
}

