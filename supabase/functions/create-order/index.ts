import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req.headers.get('origin')) });
  }

  try {
    // Validar método
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ ok: false, error: "Método não permitido" }),
        { status: 405, headers: { ...corsHeaders(req.headers.get('origin')), "Content-Type": "application/json" } }
      );
    }

    // Parse body
    const body = await req.json();
    const {
      vendor_id,
      product_id,
      customer_email,
      customer_name,
      amount_cents,
      currency = "BRL",
      payment_method = "pix",
      gateway = "pushinpay",
      status = "PENDING",
    } = body;

    // Validações
    if (!vendor_id || !product_id || !customer_email || !customer_name) {
      return new Response(
        JSON.stringify({ ok: false, error: "Campos obrigatórios faltando" }),
        { status: 422, headers: { ...corsHeaders(req.headers.get('origin')), "Content-Type": "application/json" } }
      );
    }

    if (typeof amount_cents !== "number" || amount_cents < 50) {
      return new Response(
        JSON.stringify({ ok: false, error: "Valor mínimo é R$ 0,50" }),
        { status: 422, headers: { ...corsHeaders(req.headers.get('origin')), "Content-Type": "application/json" } }
      );
    }

    // Criar cliente Supabase com service_role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Validar que o produto existe e está ativo
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, status, user_id")
      .eq("id", product_id)
      .single();

    if (productError || !product || product.status !== "active") {
      console.error("[create-order] Produto não encontrado:", productError);
      return new Response(
        JSON.stringify({ ok: false, error: "Produto não encontrado ou inativo" }),
        { status: 404, headers: { ...corsHeaders(req.headers.get('origin')), "Content-Type": "application/json" } }
      );
    }

    // Validar que vendor_id corresponde ao dono do produto
    if (product.user_id !== vendor_id) {
      console.error("[create-order] vendor_id não corresponde ao dono do produto");
      return new Response(
        JSON.stringify({ ok: false, error: "vendor_id inválido" }),
        { status: 403, headers: { ...corsHeaders(req.headers.get('origin')), "Content-Type": "application/json" } }
      );
    }

    // Inserir pedido (usando service_role - bypassa RLS)
    const { data: newOrder, error: orderError } = await supabase
      .from("orders")
      .insert({
        vendor_id,
        product_id,
        customer_email,
        customer_name,
        amount_cents,
        currency,
        payment_method,
        gateway,
        status,
      })
      .select()
      .single();

    if (orderError || !newOrder) {
      console.error("[create-order] Erro ao criar pedido:", orderError);
      return new Response(
        JSON.stringify({ ok: false, error: "Erro ao criar pedido no banco" }),
        { status: 500, headers: { ...corsHeaders(req.headers.get('origin')), "Content-Type": "application/json" } }
      );
    }

    console.log("[create-order] Pedido criado com sucesso:", { order_id: newOrder.id, amount_cents });

    // Retornar sucesso
    return new Response(
      JSON.stringify({ ok: true, order_id: newOrder.id }),
      { status: 200, headers: { ...corsHeaders(req.headers.get('origin')), "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[create-order] Erro inesperado:", error);
    return new Response(
      JSON.stringify({ ok: false, error: error.message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders(req.headers.get('origin')), "Content-Type": "application/json" } }
    );
  }
});
