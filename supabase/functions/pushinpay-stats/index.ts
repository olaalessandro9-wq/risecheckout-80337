import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.46.1";
import { handleOptions, withCorsError, withCorsJson } from "../_shared/cors.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

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

    const { data: orders, error: ordersErr } = await supabase
      .from("orders")
      .select("id, status, amount_cents, created_at")
      .eq("vendor_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (ordersErr) {
      return withCorsError(req, `Erro ao buscar pedidos: ${ordersErr.message}`, 500);
    }

    const totalTransactions = orders?.length || 0;
    const totalAmount = orders?.reduce((sum, o) => sum + (o.amount_cents || 0), 0) || 0;
    const lastTransaction = orders?.[0]?.created_at || null;

    const webhookStatus = "unknown";

    return withCorsJson(req, {
      totalTransactions,
      totalAmount,
      lastTransaction,
      webhookStatus
    });

  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    return withCorsError(req, `Erro inesperado: ${String(error)}`, 500);
  }
});
