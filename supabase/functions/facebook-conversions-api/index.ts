import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Edge Function: facebook-conversions-api
 * 
 * Envia eventos de conversão para a API de Conversões do Facebook
 * 
 * Documentação: https://developers.facebook.com/docs/marketing-api/conversions-api
 */

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { vendor_id, event_name, event_data } = await req.json();

    if (!vendor_id || !event_name) {
      return new Response(
        JSON.stringify({ error: "vendor_id and event_name are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar configuração do Facebook Pixel do vendedor
    const { data: integration, error: integrationError } = await supabaseClient
      .from("vendor_integrations")
      .select("config, active")
      .eq("vendor_id", vendor_id)
      .eq("integration_type", "FACEBOOK_PIXEL")
      .eq("active", true)
      .maybeSingle();

    if (integrationError || !integration) {
      console.error("[Facebook Conversions API] Integration not found:", integrationError);
      return new Response(
        JSON.stringify({ error: "Facebook Pixel integration not configured" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { pixel_id, access_token } = integration.config as {
      pixel_id: string;
      access_token?: string;
    };

    if (!access_token) {
      console.log("[Facebook Conversions API] Access token not configured, skipping server event");
      return new Response(
        JSON.stringify({ ok: true, message: "Access token not configured, event not sent" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Preparar evento para API de Conversões
    const event = {
      event_name,
      event_time: Math.floor(Date.now() / 1000),
      action_source: "website",
      event_source_url: event_data?.event_source_url || "",
      user_data: {
        client_ip_address: req.headers.get("x-forwarded-for") || "",
        client_user_agent: req.headers.get("user-agent") || "",
        em: event_data?.email ? await hashSHA256(event_data.email) : undefined,
      },
      custom_data: {
        value: event_data?.value,
        currency: event_data?.currency || "BRL",
        content_name: event_data?.content_name,
        content_ids: event_data?.content_ids,
        content_type: event_data?.content_type,
      },
    };

    // Enviar para API de Conversões do Facebook
    const fbResponse = await fetch(
      `https://graph.facebook.com/v18.0/${pixel_id}/events`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: [event],
          access_token,
        }),
      }
    );

    const fbData = await fbResponse.json();

    if (!fbResponse.ok) {
      console.error("[Facebook Conversions API] Error:", fbData);
      return new Response(
        JSON.stringify({ error: "Failed to send event to Facebook", details: fbData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[Facebook Conversions API] Event sent successfully:", event_name);

    return new Response(
      JSON.stringify({ ok: true, facebook_response: fbData }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Facebook Conversions API] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * Hash SHA256 para dados sensíveis (email, telefone, etc.)
 */
async function hashSHA256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
