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

    const { token, environment, pixId } = await loadTokenEnvAndPixId(orderId);
    
    console.log("[pushinpay-get-status] Checking status:", { orderId, environment, pixId });
    
    const baseURL =
      environment === "sandbox"
        ? "https://api-sandbox.pushinpay.com.br/api"
        : "https://api.pushinpay.com.br/api";

    const res = await fetch(`${baseURL}/pix/consult/${pixId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      return withCorsError(req, `PushinPay status error: ${errText}`, 502);
    }

    const status = await res.json(); // { status: "created" | "paid" | "expired" | "canceled" ... }

    await updateOrderStatusFromGateway(orderId, status);

    return withCorsJson(req, { ok: true, status });
  } catch (e) {
    console.error("Status error:", e);
    const errorMsg = e instanceof Error ? e.message : JSON.stringify(e);
    return withCorsError(req, `Status error: ${errorMsg}`, 400);
  }
});
