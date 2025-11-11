import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_id } = await req.json();

    if (!order_id) {
      return new Response(
        JSON.stringify({ ok: false, error: "order_id é obrigatório" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log("[send-pix-email] Processando envio de email PIX para pedido:", order_id);

    // Criar cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Buscar dados do pedido
    const { data: order, error: orderError } = await supabaseClient
      .from("orders")
      .select(`
        *,
        product:products (name, description),
        customer:customers (name, email)
      `)
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      console.error("[send-pix-email] Erro ao buscar pedido:", orderError);
      return new Response(
        JSON.stringify({ ok: false, error: "Pedido não encontrado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Verificar se tem dados do PIX
    if (!order.pix_qr_code) {
      console.error("[send-pix-email] Pedido não tem QR Code do PIX");
      return new Response(
        JSON.stringify({ ok: false, error: "Pedido não tem QR Code do PIX" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const customerEmail = order.customer?.email || order.customer_email;
    const customerName = order.customer?.name || order.customer_name || "Cliente";
    const productName = order.product?.name || "Produto";
    const amount = (order.amount_cents / 100).toFixed(2);

    if (!customerEmail) {
      console.error("[send-pix-email] Pedido não tem email do cliente");
      return new Response(
        JSON.stringify({ ok: false, error: "Pedido não tem email do cliente" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Configurar SMTP
    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "587");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPass = Deno.env.get("SMTP_PASS");
    const smtpFrom = Deno.env.get("SMTP_FROM") || "noreply@risecheckout.com";

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.error("[send-pix-email] Credenciais SMTP não configuradas");
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: "SMTP não configurado. Configure as variáveis: SMTP_HOST, SMTP_USER, SMTP_PASS" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Template de email HTML
    const emailHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Seu PIX foi gerado - RiseCheckout</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">RiseCheckout</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Seu PIX foi gerado com sucesso!</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Olá <strong>${customerName}</strong>,
              </p>
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Seu pedido foi criado com sucesso! Para finalizar a compra, realize o pagamento via PIX.
              </p>

              <!-- Order Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <tr>
                  <td>
                    <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0;">Produto:</p>
                    <p style="color: #333333; font-size: 16px; font-weight: bold; margin: 0 0 15px 0;">${productName}</p>
                    
                    <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0;">Valor:</p>
                    <p style="color: #667eea; font-size: 24px; font-weight: bold; margin: 0;">R$ ${amount}</p>
                  </td>
                </tr>
              </table>

              <!-- QR Code -->
              <div style="text-align: center; margin: 30px 0;">
                <p style="color: #333333; font-size: 16px; font-weight: bold; margin: 0 0 15px 0;">Escaneie o QR Code:</p>
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(order.pix_qr_code)}" 
                     alt="QR Code PIX" 
                     style="width: 200px; height: 200px; border: 2px solid #667eea; border-radius: 8px;">
              </div>

              <!-- PIX Code -->
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0; text-align: center;">Ou copie o código PIX:</p>
                <p style="color: #333333; font-size: 12px; word-break: break-all; text-align: center; margin: 0; font-family: monospace; background-color: #ffffff; padding: 10px; border-radius: 4px;">
                  ${order.pix_qr_code}
                </p>
              </div>

              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0; text-align: center;">
                Após a confirmação do pagamento, você receberá um email com o acesso ao produto.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px; text-align: center;">
              <p style="color: #999999; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} RiseCheckout. Todos os direitos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Enviar email
    const client = new SMTPClient({
      connection: {
        hostname: smtpHost,
        port: smtpPort,
        tls: true,
        auth: {
          username: smtpUser,
          password: smtpPass,
        },
      },
    });

    await client.send({
      from: smtpFrom,
      to: customerEmail,
      subject: `🔔 Seu PIX foi gerado - ${productName}`,
      content: "Seu PIX foi gerado! Acesse o email em HTML para visualizar.",
      html: emailHTML,
    });

    await client.close();

    console.log("[send-pix-email] Email enviado com sucesso para:", customerEmail);

    return new Response(
      JSON.stringify({ ok: true, message: "Email enviado com sucesso" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[send-pix-email] Erro ao enviar email:", error);
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
