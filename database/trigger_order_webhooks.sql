-- Trigger que chama diretamente os webhooks configurados
-- Com suporte a order bumps

CREATE OR REPLACE FUNCTION public.trigger_order_webhooks()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  event_type TEXT;
  webhook_payload JSONB;
  webhook_record RECORD;
  product_record RECORD;
  request_id BIGINT;
BEGIN
  -- Determinar qual evento disparar
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    
    -- 1. PIX gerado
    IF NEW.pix_status IN ('created', 'generated', 'active') AND 
       (OLD IS NULL OR OLD.pix_status IS NULL OR OLD.pix_status NOT IN ('created', 'generated', 'active')) THEN
      
      event_type := 'pix_generated';
      
      -- Buscar webhooks ativos para este vendor e evento
      FOR webhook_record IN
        SELECT w.id, w.url, w.events
        FROM outbound_webhooks w
        WHERE w.vendor_id = NEW.vendor_id
          AND w.active = true
          AND w.events @> ARRAY[event_type]::text[]
      LOOP
        -- Verificar se o produto está configurado neste webhook
        IF EXISTS (
          SELECT 1 FROM webhook_products wp
          WHERE wp.webhook_id = webhook_record.id
            AND wp.product_id = NEW.product_id
        ) THEN
          -- Preparar payload
          webhook_payload := jsonb_build_object(
            'event', event_type,
            'timestamp', NOW(),
            'vendor_id', NEW.vendor_id,
            'product_id', NEW.product_id,
            'order_id', NEW.id,
            'data', jsonb_build_object(
              'pix_id', NEW.pix_id,
              'pix_qr_code', NEW.pix_qr_code,
              'amount_cents', NEW.amount_cents,
              'customer_name', NEW.customer_name,
              'customer_email', NEW.customer_email
            )
          );
          
          -- Enviar webhook diretamente
          SELECT INTO request_id net.http_post(
            webhook_record.url,
            webhook_payload,
            '{}'::jsonb,
            '{"Content-Type": "application/json"}'::jsonb,
            5000
          );
          
          -- Registrar log
          INSERT INTO webhook_deliveries (webhook_id, order_id, event_type, payload, status, attempts)
          VALUES (webhook_record.id, NEW.id, event_type, webhook_payload, 'pending', 1);
        END IF;
      END LOOP;
      
    -- 2. Compra aprovada
    ELSIF NEW.status = 'paid' AND (OLD IS NULL OR OLD.status != 'paid') THEN
      
      event_type := 'purchase_approved';
      
      -- Buscar webhooks ativos para este vendor e evento
      FOR webhook_record IN
        SELECT w.id, w.url, w.events
        FROM outbound_webhooks w
        WHERE w.vendor_id = NEW.vendor_id
          AND w.active = true
          AND w.events @> ARRAY[event_type]::text[]
      LOOP
        -- Para cada item do pedido (produto principal + order bumps)
        FOR product_record IN
          SELECT oi.product_id, oi.product_name, oi.amount_cents, oi.is_bump
          FROM order_items oi
          WHERE oi.order_id = NEW.id
        LOOP
          -- Verificar se este produto está configurado no webhook
          IF EXISTS (
            SELECT 1 FROM webhook_products wp
            WHERE wp.webhook_id = webhook_record.id
              AND wp.product_id = product_record.product_id
          ) THEN
            -- Preparar payload
            webhook_payload := jsonb_build_object(
              'event', event_type,
              'timestamp', NOW(),
              'vendor_id', NEW.vendor_id,
              'product_id', product_record.product_id,
              'order_id', NEW.id,
              'data', jsonb_build_object(
                'product_name', product_record.product_name,
                'amount_cents', product_record.amount_cents,
                'is_bump', product_record.is_bump,
                'customer_name', NEW.customer_name,
                'customer_email', NEW.customer_email,
                'paid_at', NEW.paid_at
              )
            );
            
            -- Enviar webhook diretamente
            SELECT INTO request_id net.http_post(
              webhook_record.url,
              webhook_payload,
              '{}'::jsonb,
              '{"Content-Type": "application/json"}'::jsonb,
              5000
            );
            
            -- Registrar log
            INSERT INTO webhook_deliveries (webhook_id, order_id, event_type, payload, status, attempts)
            VALUES (webhook_record.id, NEW.id, event_type, webhook_payload, 'pending', 1);
          END IF;
        END LOOP;
        
        -- Se não houver order_items, enviar para o produto principal
        IF NOT FOUND THEN
          IF EXISTS (
            SELECT 1 FROM webhook_products wp
            WHERE wp.webhook_id = webhook_record.id
              AND wp.product_id = NEW.product_id
          ) THEN
            webhook_payload := jsonb_build_object(
              'event', event_type,
              'timestamp', NOW(),
              'vendor_id', NEW.vendor_id,
              'product_id', NEW.product_id,
              'order_id', NEW.id,
              'data', jsonb_build_object(
                'product_name', 'Produto Principal',
                'amount_cents', NEW.amount_cents,
                'is_bump', false,
                'customer_name', NEW.customer_name,
                'customer_email', NEW.customer_email,
                'paid_at', NEW.paid_at
              )
            );
            
            SELECT INTO request_id net.http_post(
              webhook_record.url,
              webhook_payload,
              '{}'::jsonb,
              '{"Content-Type": "application/json"}'::jsonb,
              5000
            );
            
            INSERT INTO webhook_deliveries (webhook_id, order_id, event_type, payload, status, attempts)
            VALUES (webhook_record.id, NEW.id, event_type, webhook_payload, 'pending', 1);
          END IF;
        END IF;
      END LOOP;
      
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$function$;
