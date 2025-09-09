# 🚀 Configuração do Stripe para EventsEnroll

## 📋 Variáveis de Ambiente Necessárias

Adicione as seguintes variáveis ao seu arquivo `.env`:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
FRONTEND_URL=http://localhost:5000
```

## 🔑 Como Obter as Chaves do Stripe

### 1. **STRIPE_SECRET_KEY**
1. Acesse [dashboard.stripe.com](https://dashboard.stripe.com)
2. Faça login na sua conta
3. Vá para **Developers > API keys**
4. Copie a **Secret key** (começa com `sk_test_` para teste, `sk_live_` para produção)

### 2. **STRIPE_WEBHOOK_SECRET**
1. No dashboard do Stripe, vá para **Developers > Webhooks**
2. Clique em **Add endpoint**
3. Configure:
   - **Endpoint URL**: `https://seu-dominio.com/api/webhooks/stripe`
   - **Events to send**: Selecione:
     - `checkout.session.completed`
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
4. Clique em **Add endpoint**
5. Copie o **Signing secret** (começa com `whsec_`)

## 🧪 Testando Localmente

Para testar localmente, use o Stripe CLI:

```bash
# Instalar Stripe CLI
npm install -g @stripe/stripe-cli

# Login no Stripe
stripe login

# Forward webhooks para localhost
stripe listen --forward-to localhost:5000/api/webhooks/stripe
```

## 💳 Cartões de Teste

Use estes cartões para testar:

- **Sucesso**: `4242 4242 4242 4242`
- **Falha**: `4000 0000 0000 0002`
- **Autenticação 3D**: `4000 0025 0000 3155`

## 🔄 Fluxo de Pagamento

1. **Usuário seleciona ingressos** → Frontend
2. **Sistema cria Payment Link** → Stripe
3. **Usuário é redirecionado** → Stripe Checkout
4. **Pagamento processado** → Stripe
5. **Webhook recebido** → Backend
6. **Inscrição confirmada** → Banco de dados
7. **Usuário redirecionado** → Página de confirmação

## 🚨 Importante

- **Nunca commite** as chaves do Stripe no Git
- Use **test keys** para desenvolvimento
- Use **live keys** apenas em produção
- Configure **webhooks** corretamente
- Teste com **Stripe CLI** antes de fazer deploy
