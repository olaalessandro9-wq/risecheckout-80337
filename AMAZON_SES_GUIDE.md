## 🚀 Guia Completo: Configurando Amazon SES para RiseCheckout

Este guia irá te ajudar a configurar o Amazon SES para enviar emails transacionais ilimitados e de alta confiabilidade para o seu sistema RiseCheckout. Vamos passar por cada etapa, desde a criação da conta até a configuração final no Supabase.

### Etapa 1: Criar uma Conta na AWS

Se você ainda não tem uma conta na AWS, este é o primeiro passo.

1.  **Acesse o site da AWS:** [https://aws.amazon.com/](https://aws.amazon.com/)
2.  **Crie uma conta:** Clique em "Criar uma conta da AWS" e siga as instruções. Você precisará de um cartão de crédito válido para o cadastro, mas o custo do SES é muito baixo, como vimos.
3.  **Faça login no Console da AWS:** Após criar a conta, acesse o console de gerenciamento.

### Etapa 2: Configurar o Amazon SES

Agora vamos configurar o serviço de email.

1.  **Acesse o Amazon SES:** No console da AWS, procure por "Simple Email Service" na barra de busca e acesse o serviço.
2.  **Verificar um Domínio:** No menu lateral, clique em "Verified identities" e depois em "Create identity".
3.  **Selecione "Domain"** e digite o seu domínio (ex: `risecheckout.com`).
4.  **Copie os registros CNAME:** O SES irá gerar 3 registros CNAME que você precisa adicionar na sua zona de DNS (na Hostinger).

### Etapa 3: Adicionar Registros DNS na Hostinger

Agora vamos para a Hostinger para verificar o seu domínio.

1.  **Acesse sua conta na Hostinger.**
2.  **Vá para a seção de DNS:** Encontre a zona de DNS do seu domínio.
3.  **Adicione os 3 registros CNAME:** Para cada um dos 3 registros CNAME fornecidos pelo SES, crie uma nova entrada na Hostinger:
    *   **Tipo:** CNAME
    *   **Nome:** Cole o valor da coluna "Name" do SES (algo como `_amazonses.risecheckout.com`)
    *   **Valor:** Cole o valor da coluna "Value" do SES (algo como `xxxxx.dkim.amazonses.com`)
4.  **Aguarde a propagação:** Pode levar de alguns minutos a algumas horas para que os registros DNS se propaguem. O status no painel do SES mudará para "Verified".

### Etapa 4: Sair do Modo Sandbox

Por padrão, sua conta SES começa em um ambiente "sandbox" (caixa de areia) que limita o envio de emails apenas para endereços verificados. Precisamos solicitar a saída desse modo.

1.  **Acesse "Account dashboard"** no menu do SES.
2.  **Clique em "Request production access".**
3.  **Preencha o formulário:**
    *   **Mail type:** `Transactional`
    *   **Website URL:** URL do seu site/plataforma
    *   **Use case description:** Descreva como você usará o SES. Exemplo:

        > "I will use Amazon SES to send transactional emails for my e-commerce checkout platform, RiseCheckout. This includes sending PIX payment slips and purchase confirmation emails to customers after they make a purchase. All emails are sent based on user actions and are not marketing-related."

4.  **Aguarde a aprovação:** A AWS geralmente aprova a solicitação em menos de 24 horas.

### Etapa 5: Criar Credenciais SMTP

Com o domínio verificado e fora do sandbox, vamos criar as credenciais para o Supabase.

1.  **Acesse "SMTP settings"** no menu do SES.
2.  **Clique em "Create SMTP credentials".**
3.  **Crie um usuário IAM:** Siga as instruções para criar um novo usuário no IAM (Identity and Access Management). Dê um nome como `risecheckout-ses-user`.
4.  **Copie as credenciais:** O IAM irá gerar um **SMTP Username** e um **SMTP Password**. **Guarde-os em um local seguro, pois a senha não será mostrada novamente.**

### Etapa 6: Configurar Variáveis de Ambiente no Supabase

Agora vamos usar as credenciais que criamos.

1.  **Acesse seu projeto no Supabase.**
2.  **Vá para "Project Settings" > "Edge Functions".**
3.  **Adicione as seguintes variáveis de ambiente:**
    *   `SMTP_HOST`: O endpoint do servidor SMTP do SES. Você encontra em "SMTP settings" no painel do SES (ex: `email-smtp.us-east-1.amazonaws.com`).
    *   `SMTP_PORT`: `587`
    *   `SMTP_USER`: O SMTP Username que você copiou.
    *   `SMTP_PASS`: O SMTP Password que você copiou.
    *   `SMTP_FROM`: Um email do seu domínio verificado (ex: `noreply@risecheckout.com`).

### Etapa 7: Deploy e Teste

Com tudo configurado, o último passo é fazer o deploy das funções e testar.

1.  **Faça o deploy das Edge Functions:**
    *   `send-pix-email`
    *   `send-confirmation-email`
    *   Redeploy: `pushinpay-create-pix`
    *   Redeploy: `pushinpay-get-status`
2.  **Teste o fluxo:** Faça uma compra de teste no seu sistema. Você deve receber o email com o PIX e, após o pagamento, o email de confirmação.

**Parabéns!** Seu sistema agora está configurado com um dos serviços de email mais robustos e econômicos do mercado.
