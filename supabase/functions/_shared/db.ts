import { createClient } from "https://esm.sh/@supabase/supabase-js@2.46.1";
import { decrypt } from "./crypto.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")! // SERVICE_ROLE para bypass RLS
);

// Exemplo: resolva o dono da order, credenciais e taxa
export async function loadGatewaySettingsByOrder(orderId: string) {
  // 1) Descobre sellerId pelo orderId
  // Nota: Ajuste "orders" e "user_id" conforme sua estrutura
  const { data: order, error: e1 } = await supabase
    .from("orders")
    .select("user_id, amount_cents")
    .eq("id", orderId)
    .single();
  if (e1 || !order) throw new Error("Order not found");

  const { data: settings, error: e2 } = await supabase
    .from("payment_gateway_settings")
    .select("token_encrypted, environment")
    .eq("user_id", order.user_id)
    .single();
  if (e2 || !settings) throw new Error("Gateway settings not found");

  const platformAccountId = Deno.env.get("PLATFORM_PUSHINPAY_ACCOUNT_ID") ?? null;

  // Descriptografar token
  const token = await decrypt(settings.token_encrypted);

  return {
    token,
    environment: settings.environment,
    platformAccountId,
    amountCents: order.amount_cents,
  };
}

export async function savePaymentMapping(orderId: string, pixId: string) {
  const { error } = await supabase
    .from("payments_map")
    .upsert({ order_id: orderId, pix_id: pixId });
  if (error) throw error;
}

export async function loadTokenEnvAndPixId(orderId: string) {
  // Descobre seller e pixId
  const { data: map, error: e1 } = await supabase
    .from("payments_map")
    .select("pix_id")
    .eq("order_id", orderId)
    .single();
  if (e1 || !map) throw new Error("PIX not found for order");

  const { data: order, error: e2 } = await supabase
    .from("orders")
    .select("user_id")
    .eq("id", orderId)
    .single();
  if (e2 || !order) throw new Error("Order not found");

  const { data: settings, error: e3 } = await supabase
    .from("payment_gateway_settings")
    .select("token_encrypted, environment")
    .eq("user_id", order.user_id)
    .single();
  if (e3 || !settings) throw new Error("Gateway settings not found");

  // Descriptografar token
  const token = await decrypt(settings.token_encrypted);

  return {
    token,
    environment: settings.environment,
    pixId: map.pix_id,
  };
}

export async function updateOrderStatusFromGateway(
  orderId: string,
  payload: any
) {
  const normalized = payload?.status ?? payload?.data?.status ?? "created";
  const statusMap: Record<string, string> = {
    created: "PENDING",
    paid: "PAID",
    expired: "EXPIRED",
    canceled: "CANCELED",
  };
  const newStatus = statusMap[normalized] ?? "PENDING";

  const { error } = await supabase
    .from("orders")
    .update({ status: newStatus })
    .eq("id", orderId);
  if (error) throw error;
}

export async function findOrderByPixId(pixId: string) {
  const { data, error } = await supabase
    .from("payments_map")
    .select("order_id")
    .eq("pix_id", pixId)
    .single();
  if (error || !data) return null;
  return data.order_id;
}
