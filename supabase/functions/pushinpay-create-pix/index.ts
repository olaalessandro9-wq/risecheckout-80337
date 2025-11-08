import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.46.1";
import { decrypt } from "../_shared/crypto.ts";
import { handleOptions, withCorsError, withCorsJson } from "../_shared/cors.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const BASE_PROD = Deno.env.get("PUSHINPAY_BASE_URL_PROD") || "https://api.pushinpay.com.br/api";
const BASE_SANDBOX = Deno.env.get("PUSHINPAY_BASE_URL_SANDBOX") || "https://api-sandbox.pushinpay.com.br/api";
const PLATFORM_ACCOUNT = Deno.env.get("PLATFORM_PUSHINPAY_ACCOUNT_ID");

const PLATFORM_FEE_PERCENT = parseFloat(Deno.env.get("PLATFORM_FEE_PERCENT") || "7.5");

// Helper para logar erros
async function logError(
  functionName: string,
  errorMessage: string,
  errorStack: string | undefined,
  metadata: Record<string, any>
) {
  try {
    await supabase.from("edge_function_errors").insert({
      function_name: functionName,
      error_message: errorMessage,
      error_stack: errorStack,
      request_payload: metadata.payload || null,
      user_id: metadata.userId || null,
      order_id: metadata.orderId || null,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error("Failed to log error:", e);
  }
}

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleOptions(req);
  }

  if (req.method !== "POST") {
    return withCorsError(req, "Method not allowed", 405);
  }

  let orderId: string | undefined;
  let valueInCents: number | undefined;

  try {
    const body = await req.json();
    orderId = body.orderId;
    valueInCents = body.valueInCents;

    // Validações de entrada
    if (!orderId) {
      return withCorsError(req, "orderId é obrigatório", 422);
    }

    if (typeof valueInCents !== "number" || valueInCents < 50) {
      return withCorsError(req, "Valor mínimo é R$ 0,50 (50 centavos)", 422);
    }

    // 1) Buscar o pedido e identificar o vendedor
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id, vendor_id")
      .eq("id", orderId)
      .single();

    if (orderErr || !order) {
      console.error("[pushinpay-create-pix] Order not found:", { orderId, error: orderErr });
      return withCorsError(req, "Pedido não encontrado", 404);
    }

    console.log("[pushinpay-create-pix] Order found:", { orderId, vendorId: order.vendor_id });

    // 2) Buscar configurações do gateway do vendedor
    const { data: settings, error: settingsErr } = await supabase
      .from("payment_gateway_settings")
      .select("*")
      .eq("user_id", order.vendor_id)
      .single();

    if (settingsErr || !settings) {
      console.error("[pushinpay-create-pix] Gateway settings not found:", { 
        vendorId: order.vendor_id, 
        error: settingsErr 
      });
      return withCorsError(
        req,
        "Configuração de gateway não encontrada. Configure em Financeiro.",
        404
      );
    }

    // 3) Descriptografar token
    let token: string;
    try {
      token = await decrypt(settings.token_encrypted);
    } catch (e) {
      return withCorsError(req, "Erro ao processar credenciais de pagamento", 500);
    }

    // 4) Determinar URL base
    const environment = settings.environment as "sandbox" | "production";
    const baseURL = environment === "production" ? BASE_PROD : BASE_SANDBOX;

    console.log("[pushinpay-create-pix] Creating PIX charge:", { 
      orderId, 
      vendorId: order.vendor_id, 
      environment, 
      valueInCents 
    });

    // 5) Calcular split usando taxa fixa do backend
    const platformValue = Math.round(valueInCents * PLATFORM_FEE_PERCENT / 100);

    // Validar que split não excede 50%
    if (platformValue > valueInCents * 0.5) {
      return withCorsError(req, "Split não pode exceder 50% do valor da transação", 422);
    }

    // Montar split_rules apenas se houver taxa e PLATFORM_ACCOUNT configurado
    const split_rules = platformValue > 0 && PLATFORM_ACCOUNT
      ? [{ value: platformValue, account_id: PLATFORM_ACCOUNT }]
      : [];

    // 6) Construir webhook URL
    const webhookUrl = `${new URL(req.url).origin}/functions/v1/pushinpay-webhook`;

    // 7) Criar cobrança na PushinPay
    const requestBody = {
      value: valueInCents, // API PushinPay espera "value" em centavos
      webhook_url: webhookUrl,
      ...(split_rules.length > 0 && { split_rules }),
    };

    const response = await fetch(`${baseURL}/pix/cashIn`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    // Tratamento de erros da API
    if (!response.ok) {
      const errorText = await response.text();
      
      // Erros específicos
      if (response.status === 401) {
        return withCorsError(
          req,
          "Token PushinPay inválido. Verifique suas credenciais em Financeiro.",
          401
        );
      }

      if (response.status === 429) {
        return withCorsError(
          req,
          "Muitas tentativas. Aguarde alguns segundos e tente novamente.",
          429
        );
      }

      if (response.status >= 500) {
        return withCorsError(
          req,
          "Serviço de pagamento temporariamente indisponível. Tente novamente em instantes.",
          502
        );
      }

      return withCorsError(req, `Erro ao criar cobrança PIX: ${errorText}`, response.status);
    }

    const pixData = await response.json();

    console.log("[pushinpay-create-pix] PIX data from PushinPay:", {
      id: pixData.id,
      status: pixData.status,
      hasQrCode: !!pixData.qr_code,
      hasQrCodeBase64: !!pixData.qr_code_base64,
      qrCodeBase64Length: pixData.qr_code_base64?.length || 0,
      qrCodeBase64Preview: pixData.qr_code_base64?.substring(0, 50) || 'EMPTY'
    });

    // Log de sucesso
    await logMetric("pix_created", valueInCents, {
      orderId,
      vendorId: order.vendor_id,
      environment
    });

    let qrBase64Raw: string = (pixData.qr_code_base64 || '').toString().trim();
    // Remover quebras de linha/espaços
    qrBase64Raw = qrBase64Raw.replace(/\s+/g, '');
    // Se já veio com prefixo data:, manter; caso contrário, prefixar corretamente
    const qrBase64DataUrl = qrBase64Raw
      ? (qrBase64Raw.startsWith('data:image/') ? qrBase64Raw : `data:image/png;base64,${qrBase64Raw}`)
      : '';

    // 8) Salvar mapeamento order_id -> pix_id
    const { error: mapErr } = await supabase
      .from("payments_map")
      .upsert({ order_id: orderId, pix_id: pixData.id });

    if (mapErr) {
      console.error("Erro ao salvar mapeamento:", mapErr);
      // Não falha a requisição, mas loga o erro
    }

    // 9) Retornar dados do PIX (envelope "pix" para compatibilidade com frontend)
    return withCorsJson(req, {
      ok: true,
      pix: {
        id: pixData.id,
        pix_id: pixData.id,
        qr_code: pixData.qr_code,
        // Para compatibilidade, devolvemos o campo esperado contendo uma Data URL válida
        qr_code_base64: qrBase64DataUrl,
        // Campo extra apenas para diagnóstico facultativo
        qr_code_base64_raw: qrBase64Raw?.slice(0, 64) ? `len:${qrBase64Raw.length}` : undefined,
        status: pixData.status,
        value: valueInCents,
      }
    });

  } catch (error) {
    console.error("Erro inesperado:", error);
    
    // Log de erro
    await logError(
      "pushinpay-create-pix",
      String(error),
      error instanceof Error ? error.stack : undefined,
      { orderId, valueInCents }
    );
    
    return withCorsError(
      req,
      `Erro inesperado ao processar pagamento: ${String(error)}`,
      500
    );
  }
});
