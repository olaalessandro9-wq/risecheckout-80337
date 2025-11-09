import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook para rastreamento de eventos de conversão
 * 
 * Suporta:
 * - Facebook Pixel (eventos de cliente)
 * - API de Conversões do Facebook (eventos de servidor)
 * 
 * Eventos suportados:
 * - InitiateCheckout: Usuário iniciou o processo de checkout
 * - AddPaymentInfo: Usuário selecionou método de pagamento
 * - Purchase: Compra concluída
 * - ViewContent: Visualização de conteúdo (Order Bump)
 * - AddToCart: Adição ao carrinho (Order Bump aceito)
 */

declare global {
  interface Window {
    fbq?: (action: string, event: string, params?: any) => void;
  }
}

interface FacebookPixelConfig {
  pixel_id: string;
  access_token?: string;
}

interface TrackingConfig {
  facebookPixel?: FacebookPixelConfig;
}

export function useTracking(vendorId: string | null) {
  const [config, setConfig] = useState<TrackingConfig | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Carregar configurações de integração do vendedor
  useEffect(() => {
    if (!vendorId) return;

    const loadConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('vendor_integrations')
          .select('integration_type, config, active')
          .eq('vendor_id', vendorId)
          .eq('active', true);

        if (error) {
          console.error('[Tracking] Error loading config:', error);
          return;
        }

        const trackingConfig: TrackingConfig = {};

        // Processar integrações ativas
        data?.forEach((integration) => {
          if (integration.integration_type === 'FACEBOOK_PIXEL') {
            trackingConfig.facebookPixel = integration.config as FacebookPixelConfig;
          }
        });

        setConfig(trackingConfig);
      } catch (error) {
        console.error('[Tracking] Error:', error);
      }
    };

    loadConfig();
  }, [vendorId]);

  // Inicializar Facebook Pixel
  useEffect(() => {
    if (!config?.facebookPixel || initialized) return;

    const pixelId = config.facebookPixel.pixel_id;

    // Injetar script do Facebook Pixel
    if (!window.fbq) {
      const script = document.createElement('script');
      script.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
      `;
      document.head.appendChild(script);
    }

    // Inicializar Pixel
    if (window.fbq) {
      window.fbq('init', pixelId);
      window.fbq('track', 'PageView');
      console.log('[Tracking] Facebook Pixel initialized:', pixelId);
      setInitialized(true);
    }
  }, [config, initialized]);

  /**
   * Disparar evento de rastreamento
   */
  const track = (eventName: string, params?: any) => {
    // Facebook Pixel (cliente)
    if (config?.facebookPixel && window.fbq) {
      window.fbq('track', eventName, params);
      console.log('[Tracking] Facebook Pixel event:', eventName, params);
    }

    // API de Conversões (servidor) - se access_token estiver configurado
    if (config?.facebookPixel?.access_token) {
      sendServerEvent(eventName, params);
    }
  };

  /**
   * Enviar evento para API de Conversões (servidor)
   */
  const sendServerEvent = async (eventName: string, params?: any) => {
    try {
      await supabase.functions.invoke('facebook-conversions-api', {
        body: {
          vendor_id: vendorId,
          event_name: eventName,
          event_data: params,
        },
      });
      console.log('[Tracking] Server event sent:', eventName);
    } catch (error) {
      console.error('[Tracking] Error sending server event:', error);
    }
  };

  return {
    track,
    isReady: initialized || !!config,
  };
}
