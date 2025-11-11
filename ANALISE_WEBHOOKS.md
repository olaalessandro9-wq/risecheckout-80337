# Análise e Plano de Implementação de Webhooks - RiseCheckout

**Data:** 11 de Novembro de 2025
**Autor:** Manus AI

## 1. Resumo Executivo

Este documento detalha a análise do estado atual do projeto RiseCheckout em relação à funcionalidade de webhooks e apresenta um plano de ação completo para sua implementação. O objetivo é permitir que o sistema notifique serviços externos, como o N8n, sobre eventos importantes, como a aprovação de um pagamento, para automatizar a entrega de produtos.

A análise revelou que **a infraestrutura de banco de dados para webhooks já existe**, o que acelera significativamente o desenvolvimento. No entanto, a lógica de disparo dos webhooks e a interface de usuário para gerenciá-los ainda precisam ser implementadas.

## 2. Análise do Estado Atual

Após uma investigação detalhada do código-fonte no repositório GitHub e da estrutura do banco de dados Supabase, o seguinte cenário foi identificado:

### 2.1. Banco de Dados (Supabase)

O sistema já possui um esquema de banco de dados robusto e preparado para a funcionalidade de webhooks de saída (*outbound webhooks*).

- **Tabela `outbound_webhooks`:** Esta tabela está pronta para armazenar as configurações dos webhooks dos vendedores. Seus campos principais são:
  - `url`: O endereço (endpoint) para onde o webhook será enviado.
  - `events`: Um array de strings que define quais eventos (ex: `purchase_approved`) devem acionar o webhook.
  - `secret`: Uma chave secreta para assinar as requisições, garantindo a autenticidade.
  - `vendor_id`: Associa o webhook a um vendedor específico.
  - `active`: Um booleano para ativar ou desativar o webhook.

- **Tabela `webhook_deliveries`:** Esta tabela foi projetada para registrar cada tentativa de entrega de um webhook. Isso é crucial para monitoramento e depuração. Seus campos incluem:
  - `webhook_id`: Referência ao webhook que foi disparado.
  - `order_id`: Referência ao pedido que gerou o evento.
  - `event_type`: O tipo de evento que ocorreu.
  - `payload`: O JSON com os dados enviados no corpo da requisição.
  - `status`: O status da entrega (ex: `success`, `failed`, `pending`).
  - `attempts`: O número de tentativas de envio.
  - `response_status` e `response_body`: O código de status HTTP e o corpo da resposta recebida do endpoint, para depuração.

### 2.2. Código-Fonte (Frontend e Backend)

- **Interface de Usuário (UI):**
  - **Não existe** uma interface para que os usuários (vendedores) possam configurar seus webhooks.
  - A página `/integracoes` (`src/pages/Integracoes.tsx`) atualmente gerencia apenas as integrações com UTMify e Facebook Pixel.
  - A página `/config` (`src/pages/Config.tsx`) é um placeholder e não contém funcionalidades.

- **Lógica de Backend (Edge Functions):**
  - **Não há lógica implementada** para disparar os webhooks.
  - A função `pushinpay-get-status/index.ts`, que confirma o pagamento de um PIX e atualiza o status do pedido para `paid`, é o local ideal para iniciar o gatilho, mas atualmente ela não executa nenhuma ação relacionada a webhooks.
  - A função `pushinpay-create-pix/index.ts` contém um campo `webhook_url: null`, indicando que a integração direta com o webhook da PushinPay foi considerada mas não utilizada, em favor da implementação customizada mais flexível já presente no banco de dados.
  - Nenhuma outra função ou componente no projeto faz referência ou utiliza as tabelas `outbound_webhooks` ou `webhook_deliveries`.

## 3. Conclusão da Análise

O projeto está em uma excelente posição para a implementação de webhooks. A base de dados já está pronta, o que representa uma parte significativa do trabalho. O esforço restante está concentrado em duas áreas principais:

1.  **Desenvolvimento Backend:** Criar a lógica para consultar as configurações de webhook e disparar as requisições HTTP quando um evento relevante ocorrer.
2.  **Desenvolvimento Frontend:** Construir a interface de usuário para que os vendedores possam gerenciar seus endpoints de webhook de forma autônoma.

## 4. Plano de Implementação Detalhado

A seguir, um plano passo a passo para construir a funcionalidade de webhooks.

### 4.1. Backend (Supabase Edge Functions)

#### Passo 1: Criar uma Nova Edge Function (`trigger-webhooks`)

Para manter o código organizado e desacoplado, criaremos uma função dedicada a processar e enviar webhooks. Isso evita sobrecarregar a função `pushinpay-get-status` e facilita a reutilização e manutenção.

- **Arquivo:** `supabase/functions/trigger-webhooks/index.ts`
- **Responsabilidade:** Receber um `order_id` e um `event_type`, encontrar os webhooks correspondentes, construir o payload, assinar a requisição e enviá-la. Também registrará a entrega na tabela `webhook_deliveries`.
- **Lógica principal:**
  1. Receber `{ order_id, event_type }` no corpo da requisição.
  2. Buscar os dados completos do pedido (`orders`) e do produto associado (`products`).
  3. Buscar o `vendor_id` do pedido.
  4. Consultar a tabela `outbound_webhooks` por webhooks ativos (`active = true`) que correspondam ao `vendor_id` e contenham o `event_type` em seu array de eventos.
  5. Para cada webhook encontrado:
     a. Construir um payload JSON detalhado com informações do pedido, cliente e produto.
     b. Gerar uma assinatura HMAC-SHA256 usando o `secret` do webhook e o payload.
     c. Fazer uma requisição `POST` para a `url` do webhook, incluindo o payload no corpo e a assinatura no cabeçalho (ex: `X-Rise-Signature`).
     d. Registrar a tentativa na tabela `webhook_deliveries` com o status da resposta.

#### Passo 2: Modificar a Edge Function `pushinpay-get-status`

Esta função será modificada para invocar a nova função `trigger-webhooks` assim que um pagamento for confirmado.

- **Arquivo:** `supabase/functions/pushinpay-get-status/index.ts`
- **Modificação:**
  - Dentro do bloco `if (statusData.status === "paid")`, após a atualização bem-sucedida do status do pedido no banco de dados (após a linha 122), adicionar uma chamada para invocar a função `trigger-webhooks` de forma assíncrona.
  - A chamada passará o `orderId` e o evento `purchase_approved`.

  ```typescript
  // Exemplo de código a ser adicionado
  if (updateError) {
    console.error("[pushinpay-get-status] Erro ao atualizar pedido:", updateError);
  } else {
    // Disparar webhook de forma assíncrona
    await supabaseClient.functions.invoke("trigger-webhooks", {
      body: { 
        order_id: orderId,
        event_type: "purchase_approved"
      }
    });
  }
  ```

### 4.2. Frontend (React + TypeScript)

#### Passo 3: Criar Componentes da UI de Webhooks

Desenvolveremos os componentes React necessários para gerenciar os webhooks na página de integrações.

- **Local:** `src/components/integrations/`
- **Novos Componentes:**
  - `WebhooksConfig.tsx`: Componente principal que orquestra a exibição da lista de webhooks e o formulário de criação/edição.
  - `WebhooksList.tsx`: Tabela que lista os webhooks configurados, mostrando a URL (parcialmente), status (ativo/inativo) e os eventos assinados. Incluirá botões para editar e deletar.
  - `WebhookForm.tsx`: Formulário para adicionar ou editar um webhook. Conterá campos para a URL, um seletor de eventos (checkboxes para `purchase_approved`, `pix_generated`, etc.) e um switch para ativar/desativar.

#### Passo 4: Integrar a UI na Página de Integrações

- **Arquivo:** `src/pages/Integracoes.tsx`
- **Modificação:**
  - Adicionar o novo componente `<WebhooksConfig />` à página, seguindo o mesmo padrão dos cards de UTMify e Facebook Pixel.
  - Implementar as funções para carregar, salvar e deletar as configurações de webhook, interagindo com a tabela `outbound_webhooks` através do cliente Supabase.

## 5. Recomendações Adicionais

- **Segurança:** Ao exibir o `secret` do webhook na UI, ele deve ser mostrado apenas uma vez, no momento da criação. Depois disso, deve ser mascarado ou ter um botão para "revelar".
- **Eventos:** Inicialmente, focaremos nos eventos `purchase_approved` e `pix_generated`. A arquitetura permitirá adicionar mais eventos no futuro facilmente.
- **Payload do Webhook:** O payload enviado deve ser rico e consistente. Um exemplo de estrutura:

  ```json
  {
    "event_id": "evt_12345...",
    "event_type": "purchase_approved",
    "created_at": "2025-11-11T10:00:00Z",
    "data": {
      "order": {
        "id": "ord_67890...",
        "status": "paid",
        "amount_cents": 5000,
        "currency": "BRL",
        "paid_at": "2025-11-11T09:59:58Z"
      },
      "customer": {
        "name": "João da Silva",
        "email": "joao.silva@example.com"
      },
      "product": {
        "id": "prod_abcde...",
        "name": "Curso de N8n Avançado"
      }
    }
  }
  ```

Com este plano, a funcionalidade de webhooks será implementada de forma robusta, segura e escalável, atendendo plenamente aos requisitos do projeto.
