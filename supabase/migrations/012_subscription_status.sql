-- Coluna para cachear status da assinatura (evita chamar Stripe API no SSR)
-- Atualizada pelo webhook do Stripe em /api/stripe/webhook

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT NULL;

COMMENT ON COLUMN organizations.subscription_status IS 'active | cancelled | NULL (não verificado)';
