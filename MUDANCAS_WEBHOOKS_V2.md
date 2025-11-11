# 🎨 Webhooks V2 - Refatoração Estilo Cakto

**Data:** 11 de Novembro de 2025
**Versão:** 2.0

## 📋 Resumo das Mudanças

O sistema de webhooks foi completamente refatorado para seguir o padrão da plataforma Cakto, tornando a experiência mais intuitiva e profissional.

## ✅ Mudanças Implementadas

### 1. **Banco de Dados**

**Novos Campos na Tabela `outbound_webhooks`:**
- ✅ `product_id` - Vincula cada webhook a um produto específico
- ✅ `name` - Nome personalizado para identificar o webhook

**Migration SQL Executada:**
```sql
ALTER TABLE outbound_webhooks 
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS name TEXT;
```

### 2. **Interface de Usuário (React)**

#### **WebhookForm** (Modal Lateral)
- ✅ Removido campo "Secret" da interface (gerado automaticamente no backend)
- ✅ Adicionado campo "Nome" para identificação
- ✅ Adicionado seletor de "Produto" (obrigatório)
- ✅ Simplificados eventos para: **Compra aprovada**, **Reembolso**, **Chargeback**
- ✅ Eventos exibidos como botões toggle (não checkboxes)
- ✅ Layout limpo e compacto

#### **WebhooksList** (Listagem)
- ✅ Layout em grid compacto (Nome + URL)
- ✅ Dropdown de ações (⋮) para Editar/Excluir
- ✅ Removida tabela complexa, substituída por cards simples
- ✅ Suporte a filtro por produto

#### **WebhooksConfig** (Container Principal)
- ✅ Adicionada barra de busca
- ✅ Adicionado filtro dropdown por produto
- ✅ Botão "Adicionar" no canto superior direito
- ✅ Modal lateral (Sheet) ao invés de formulário inline
- ✅ Layout responsivo e moderno

### 3. **Backend (Edge Functions)**

#### **trigger-webhooks**
- ✅ Atualizado para filtrar webhooks por `product_id`
- ✅ Apenas webhooks vinculados ao produto da compra são disparados
- ✅ Secret continua sendo usado para assinatura HMAC (segurança mantida)

#### **Lógica de Disparo**
```typescript
// Busca webhooks do vendedor + produto + evento
.eq("vendor_id", order.vendor_id)
.eq("product_id", order.product_id)
.eq("active", true)
.contains("events", [event_type])
```

## 🎯 Como Funciona Agora

### Fluxo de Configuração

1. **Usuário acessa Integrações → Webhooks**
2. **Clica em "Adicionar"**
3. **Preenche o formulário:**
   - Nome: "N8N Produto X"
   - URL: `http://seu-n8n.com/webhook/produto-x`
   - Produto: Seleciona da lista de produtos ativos
   - Eventos: Seleciona "Compra aprovada" (ou outros)
4. **Salva**

### Fluxo de Disparo

1. **Cliente compra o Produto X**
2. **Pagamento é aprovado**
3. **Sistema busca webhooks:**
   - Vendedor = dono do produto
   - Produto = Produto X
   - Evento = "purchase_approved"
4. **Dispara webhook para a URL configurada**
5. **N8n recebe e processa (envia email, libera acesso, etc.)**

## 🔐 Segurança

- **Secret** continua sendo gerado e armazenado no banco
- **Secret** é usado para assinar requisições (HMAC-SHA256)
- **Secret** NÃO é exibido na interface (apenas gerado automaticamente)
- **Validação** deve ser feita no N8n usando o header `X-Rise-Signature`

## 📊 Estrutura do Payload (Inalterada)

```json
{
  "event_id": "evt_...",
  "event_type": "purchase_approved",
  "created_at": "2025-11-11T10:00:00Z",
  "data": {
    "order": {
      "id": "ord_...",
      "status": "paid",
      "amount_cents": 5000,
      "currency": "BRL",
      "paid_at": "2025-11-11T09:59:58Z"
    },
    "customer": {
      "name": "João da Silva",
      "email": "joao@example.com"
    },
    "product": {
      "id": "prod_...",
      "name": "Curso de N8n",
      "price": 5000
    }
  }
}
```

## 🎨 Diferenças Visuais (Antes vs Depois)

### Antes
- ❌ Formulário inline expandido
- ❌ Secret visível e copiável
- ❌ Eventos com checkboxes
- ❌ Sem filtro por produto
- ❌ Tabela complexa
- ❌ Webhook global (não vinculado a produto)

### Depois (Estilo Cakto)
- ✅ Modal lateral (Sheet)
- ✅ Secret oculto (gerado automaticamente)
- ✅ Eventos com botões toggle
- ✅ Filtro por produto
- ✅ Grid compacto com dropdown de ações
- ✅ Webhook vinculado a produto específico

## 🚀 Benefícios

1. **Organização:** Cada produto tem seus próprios webhooks
2. **Flexibilidade:** Diferentes URLs para diferentes produtos
3. **Segurança:** Secret oculto do usuário final
4. **UX Melhorada:** Interface mais limpa e intuitiva
5. **Escalabilidade:** Fácil gerenciar múltiplos webhooks

## 📝 Próximos Passos

1. ✅ **Implementação concluída**
2. ⏳ **Testar criação de webhook via interface**
3. ⏳ **Fazer compra teste e verificar disparo**
4. ⏳ **Configurar N8n para receber e processar**
5. ⏳ **Configurar email SMTP (SendGrid ou Amazon SES)**

## 🔧 Arquivos Modificados

- `supabase/functions/trigger-webhooks/index.ts`
- `src/components/webhooks/WebhookForm.tsx`
- `src/components/webhooks/WebhooksList.tsx`
- `src/components/webhooks/WebhooksConfig.tsx`
- `src/pages/Integracoes.tsx`

## 📦 Commit

```
refactor: Refatorar webhooks seguindo padrão Cakto

- Adicionar campos product_id e name na tabela outbound_webhooks
- Remover exibição de secret para o usuário
- Implementar seleção de produto por webhook
- Simplificar eventos (Compra aprovada, Reembolso, Chargeback)
- Criar layout em modal lateral (Sheet) estilo Cakto
- Adicionar filtro por produto na listagem
- Layout compacto com dropdown de ações
- Atualizar trigger-webhooks para filtrar por product_id
```

---

**Desenvolvido por:** Manus AI
**Versão:** 2.0
**Data:** 11 de Novembro de 2025
