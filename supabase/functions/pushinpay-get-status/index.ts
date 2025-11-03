import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import {
  loadTokenEnvAndPixId,
  updateOrderStatusFromGateway,
} from "../_shared/db.ts";
import { handleOptions, withCorsError, withCorsJson } from "../_shared/cors.ts";

serve(async (req) => {
  // 1) Tratar preflight OPTIONS
  if (req.method === "OPTIONS") {
    return handleOptions(req);
  }

  // 2) Validar método
  if (req.method !== "POST") {
    return withCorsError(req, "Method not allowed", 405);
  }

  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return withCorsError(req, "orderId is required", 400);
    }

    console.log("[pushinpay-get-status] Checking status for orderId:", orderId);
    
    const { token, environment, pixId } = await loadTokenEnvAndPixId(orderId);
    
    console.log("[pushinpay-get-status] Config loaded:", { environment, pixId });
    
    const baseURL =
      environment === "sandbox"
        ? "https://api-sandbox.pushinpay.com.br/api"
        : "https://api.pushinpay.com.br/api";

    let data: any = null;
    let lastError = "";

    // Tentativa 1: GET /pix/{id}
    try {
      const endpoint1 = `${baseURL}/pix/${pixId}`;
      console.log("[pushinpay-get-status] Tentativa 1:", endpoint1);
      
      const res1 = await fetch(endpoint1, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (res1.ok) {
        data = await res1.json();
        console.log("[pushinpay-get-status] ✅ Sucesso com GET /pix/{id}");
      } else {
        lastError = await res1.text();
        console.warn("[pushinpay-get-status] Falha GET /pix/{id}:", res1.status, lastError);
      }
    } catch (err) {
      console.warn("[pushinpay-get-status] Erro GET /pix/{id}:", err);
    }

    // Tentativa 2: GET /pix/consult/{id}
    if (!data) {
      try {
        const endpoint2 = `${baseURL}/pix/consult/${pixId}`;
        console.log("[pushinpay-get-status] Tentativa 2:", endpoint2);
        
        const res2 = await fetch(endpoint2, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (res2.ok) {
          data = await res2.json();
          console.log("[pushinpay-get-status] ✅ Sucesso com GET /pix/consult/{id}");
        } else {
          lastError = await res2.text();
          console.warn("[pushinpay-get-status] Falha GET /pix/consult/{id}:", res2.status, lastError);
        }
      } catch (err) {
        console.warn("[pushinpay-get-status] Erro GET /pix/consult/{id}:", err);
      }
    }

    // Tentativa 3: POST /pix/consult
    if (!data) {
      try {
        const endpoint3 = `${baseURL}/pix/consult`;
        console.log("[pushinpay-get-status] Tentativa 3:", endpoint3);
        
        const res3 = await fetch(endpoint3, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: pixId }),
        });

        if (res3.ok) {
          data = await res3.json();
          console.log("[pushinpay-get-status] ✅ Sucesso com POST /pix/consult");
        } else {
          lastError = await res3.text();
          console.error("[pushinpay-get-status] Falha POST /pix/consult:", res3.status, lastError);
        }
      } catch (err) {
        console.error("[pushinpay-get-status] Erro POST /pix/consult:", err);
      }
    }

    // Se nenhum endpoint funcionou
    if (!data) {
      console.error("[pushinpay-get-status] ❌ Todos os endpoints falharam. Último erro:", lastError);
      return withCorsJson(req, {
        ok: false,
        status: { status: "unknown" },
        error: lastError
      });
    }
    console.log("[pushinpay-get-status] Response data:", { 
      id: data.id, 
      status: data.status,
      hasPixDetails: !!data.pix_details 
    });

    // Atualizar status no banco
    await updateOrderStatusFromGateway(orderId, data);

    // Resposta simplificada
    return withCorsJson(req, {
      ok: true,
      status: {
        status: data.status || "created"
      }
    });
  } catch (e) {
    console.error("[pushinpay-get-status] Error:", e);
    const errorMsg = e instanceof Error ? e.message : String(e);
    return withCorsError(req, `Error: ${errorMsg}`, 500);
  }
});
