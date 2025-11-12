# Guia de Deploy das Edge Functions de Webhook

## Pré-requisitos

1. **Instalar o Supabase CLI:**
   ```bash
   npm install -g supabase
   ```

2. **Fazer login no Supabase:**
   ```bash
   supabase login
   ```

## Passo 1: Fazer o Deploy da Edge Function `trigger-webhooks-internal`

Esta é a função principal que dispara os webhooks com a lógica corrigida.

```bash
cd risecheckout-80337
supabase functions deploy trigger-webhooks-internal --project-ref wivbtmtgpsxupfjwwovf
```

## Passo 2: (Opcional) Fazer o Deploy da Edge Function `get-webhook-logs`

Esta função permite buscar os logs de webhook via API (caso você queira usar no futuro).

```bash
supabase functions deploy get-webhook-logs --project-ref wivbtmtgpsxupfjwwovf
```

## Passo 3: Testar o Webhook

Após o deploy, você pode testar criando um novo pedido e verificando se o webhook é disparado corretamente.

### Como Testar:

1. Acesse o seu checkout
2. Crie um pedido de teste
3. Pague o PIX
4. Aguarde a confirmação do pagamento
5. Verifique se o webhook foi disparado no seu N8N
6. Verifique os logs no painel de webhooks do seu sistema

## Verificação de Logs

Você pode verificar os logs das Edge Functions no painel do Supabase:

1. Acesse: https://supabase.com/dashboard/project/wivbtmtgpsxupfjwwovf/functions
2. Clique na função `trigger-webhooks-internal`
3. Vá para a aba "Logs"

## Troubleshooting

### Problema: Edge Function não está sendo chamada

**Solução:** Verifique se o trigger `orders_webhook_trigger` está ativo no banco de dados:

```sql
SELECT * FROM information_schema.triggers WHERE event_object_table = 'orders';
```

### Problema: Webhook não está sendo disparado para um produto específico

**Solução:** Verifique se o produto está configurado no webhook:

```sql
SELECT * FROM webhook_products WHERE webhook_id = 'SEU_WEBHOOK_ID';
```

### Problema: Logs não estão aparecendo na interface

**Solução:** Verifique se a tabela `webhook_deliveries` tem os registros:

```sql
SELECT * FROM webhook_deliveries ORDER BY created_at DESC LIMIT 10;
```

## Notas Importantes

- A Edge Function `trigger-webhooks-internal` é chamada automaticamente pelo trigger do banco de dados quando um pedido é atualizado.
- Os logs são salvos automaticamente na tabela `webhook_deliveries`.
- A interface de logs já está atualizada e pronta para exibir os logs corretamente.

## Próximos Passos

Após o deploy, você pode:

1. Testar o webhook com um pedido real
2. Verificar os logs na interface
3. Ajustar a lógica de disparo conforme necessário

Se você encontrar algum problema, verifique os logs das Edge Functions no painel do Supabase.
