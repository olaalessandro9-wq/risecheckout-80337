# 📧 Configuração de Envio Automático de Emails - RiseCheckout

Este documento explica como configurar o envio automático de emails para clientes após geração do PIX e confirmação de pagamento.

## 🎯 O que Foi Implementado

O sistema RiseCheckout agora envia **automaticamente** dois tipos de emails para os clientes:

### 1. Email de PIX Gerado
- **Quando:** Assim que o cliente finaliza o checkout e o PIX é gerado
- **Conteúdo:**
  - QR Code do PIX (imagem)
  - Código PIX para copiar e colar
  - Valor a pagar
  - Nome do produto

### 2. Email de Pagamento Confirmado
- **Quando:** Assim que o pagamento do PIX é confirmado
- **Conteúdo:**
  - Confirmação de pagamento
  - Link para acessar o produto
  - Valor pago
  - Informações do produto

## ⚙️ Como Configurar

### Opção 1: SendGrid (Recomendado para Iniciantes)

**Vantagens:**
- ✅ Grátis até 100 emails/dia
- ✅ Fácil de configurar
- ✅ Interface amigável

**Passos:**

1. Crie uma conta em: https://sendgrid.com
2. Acesse: **Settings → API Keys**
3. Clique em **Create API Key**
4. Escolha **Full Access**
5. Copie a API Key gerada

**Variáveis de Ambiente:**
```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxxxxxxxxxxxxxxxxxxx (sua API Key)
SMTP_FROM=noreply@seudominio.com
```

### Opção 2: Amazon SES (Recomendado para Escala)

**Vantagens:**
- ✅ Muito barato ($0.10 por 1000 emails)
- ✅ Alta capacidade de envio
- ✅ Infraestrutura confiável da AWS

**Passos:**

1. Acesse: https://console.aws.amazon.com/ses
2. Vá em **SMTP Settings**
3. Clique em **Create My SMTP Credentials**
4. Copie o **SMTP Username** e **SMTP Password**

**Variáveis de Ambiente:**
```
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=AKIAXXXXXXXXXX (SMTP Username)
SMTP_PASS=xxxxxxxxxxxxxxxxxxxxxxxxx (SMTP Password)
SMTP_FROM=noreply@seudominio.com
```

### Opção 3: Gmail (Apenas para Testes)

**⚠️ NÃO recomendado para produção!**

**Passos:**

1. Ative a verificação em 2 etapas na sua conta Google
2. Gere uma senha de app: https://myaccount.google.com/apppasswords
3. Use a senha gerada

**Variáveis de Ambiente:**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seuemail@gmail.com
SMTP_PASS=xxxxxxxxxxxxxxxx (senha de app)
SMTP_FROM=seuemail@gmail.com
```

## 🔧 Adicionar Variáveis no Supabase

1. Acesse o painel do Supabase
2. Vá em **Project Settings → Edge Functions**
3. Role até **Environment Variables**
4. Adicione as 5 variáveis:
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USER`
   - `SMTP_PASS`
   - `SMTP_FROM`

## 🚀 Deploy das Edge Functions

Você precisa fazer deploy das 2 novas Edge Functions:

### Via Painel do Supabase:

1. **send-pix-email:**
   - Acesse: Edge Functions → Deploy a new function → Via Editor
   - Nome: `send-pix-email`
   - Cole o código de: `supabase/functions/send-pix-email/index.ts`
   - Clique em **Deploy function**

2. **send-confirmation-email:**
   - Acesse: Edge Functions → Deploy a new function → Via Editor
   - Nome: `send-confirmation-email`
   - Cole o código de: `supabase/functions/send-confirmation-email/index.ts`
   - Clique em **Deploy function**

### Via CLI (Alternativa):

```bash
npx supabase login
npx supabase link --project-ref wivbtmtgpsxupfjwwovf
npx supabase functions deploy send-pix-email
npx supabase functions deploy send-confirmation-email
npx supabase functions deploy pushinpay-create-pix
npx supabase functions deploy pushinpay-get-status
```

## ✅ Como Testar

1. **Configure as variáveis SMTP** no Supabase
2. **Faça deploy das Edge Functions**
3. **Crie um pedido de teste** no checkout
4. **Verifique o email** do cliente

**Logs para Debug:**

- Acesse: Edge Functions → send-pix-email → Logs
- Acesse: Edge Functions → send-confirmation-email → Logs

## 🎨 Personalização dos Emails

Os templates de email estão em:
- `supabase/functions/send-pix-email/index.ts` (linha ~95)
- `supabase/functions/send-confirmation-email/index.ts` (linha ~95)

Você pode personalizar:
- Cores e design
- Logo da empresa
- Textos e mensagens
- Layout

## 📋 Checklist de Configuração

- [ ] Criar conta no SendGrid ou Amazon SES
- [ ] Obter credenciais SMTP
- [ ] Adicionar variáveis de ambiente no Supabase
- [ ] Deploy da função `send-pix-email`
- [ ] Deploy da função `send-confirmation-email`
- [ ] Redeploy da função `pushinpay-create-pix`
- [ ] Redeploy da função `pushinpay-get-status`
- [ ] Testar com pedido real
- [ ] Verificar logs em caso de erro

## 🆘 Troubleshooting

### Email não está sendo enviado

1. **Verifique as variáveis de ambiente:**
   - Todas as 5 variáveis estão configuradas?
   - Os valores estão corretos?

2. **Verifique os logs:**
   - Edge Functions → send-pix-email → Logs
   - Procure por erros de SMTP

3. **Verifique o spam:**
   - Emails podem cair na caixa de spam
   - Configure SPF, DKIM e DMARC no DNS

### Email cai no spam

**Configure DNS do seu domínio:**

1. **SPF Record:**
   ```
   v=spf1 include:sendgrid.net ~all
   ```

2. **DKIM:** Configure no painel do SendGrid

3. **DMARC Record:**
   ```
   v=DMARC1; p=none; rua=mailto:dmarc@seudominio.com
   ```

## 📞 Suporte

Se precisar de ajuda, verifique:
- Logs das Edge Functions no Supabase
- Documentação do SendGrid: https://docs.sendgrid.com
- Documentação do Amazon SES: https://docs.aws.amazon.com/ses

---

**Desenvolvido por RiseCheckout** 🚀
