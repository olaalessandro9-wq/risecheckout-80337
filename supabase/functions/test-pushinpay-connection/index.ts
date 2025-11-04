import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.46.1";
import { decrypt } from "../_shared/crypto.ts";
import { handleOptions, withCorsError, withCorsJson } from "../_shared/cors.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const BASE_PROD = "https://api.pushinpay.com.br/api";
const BASE_SANDBOX = "https://api-sandbox.pushinpay.com.br/api";

serve(async (req) => {
  if (req.method === "OPTIONS") return handleOptions(req);
  if (req.method !== "POST") return withCorsError(req, "Method not allowed", 405);

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return withCorsError(req, "Não autenticado", 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return withCorsError(req, "Token inválido", 401);
    }

    const { data: settings, error: settingsErr } = await supabase
      .from("payment_gateway_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (settingsErr || !settings) {
      return withCorsJson(req, {
        ok: false,
        environment: "sandbox",
        message: "Configuração não encontrada. Configure seu token em Financeiro."
      });
    }

    const token = await decrypt(settings.token_encrypted);
    const environment = settings.environment as "sandbox" | "production";
    const baseURL = environment === "production" ? BASE_PROD : BASE_SANDBOX;

    const response = await fetch(`${baseURL}/account`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        return withCorsJson(req, {
          ok: false,
          environment,
          message: "Token inválido ou expirado. Verifique suas credenciais."
        });
      }

      return withCorsJson(req, {
        ok: false,
        environment,
        message: `Erro ao conectar: ${response.status} ${response.statusText}`
      });
    }

    const accountData = await response.json();

    return withCorsJson(req, {
      ok: true,
      environment,
      message: "Conexão estabelecida com sucesso!",
      details: {
        accountId: accountData.id || "N/A",
        apiVersion: accountData.api_version || "1.0",
        permissions: accountData.permissions || []
      }
    });

  } catch (error) {
    console.error("Erro ao testar conexão:", error);
    return withCorsError(req, `Erro inesperado: ${String(error)}`, 500);
  }
});
