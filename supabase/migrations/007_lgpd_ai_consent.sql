-- Migration 007: LGPD AI Consent
-- Adiciona campos de consentimento LGPD para uso de dados em IA
-- Referência: LGPD Art. 11 — dados sensíveis de saúde requerem consentimento explícito
-- Integração: hasLgpdConsentForAi() em src/lib/ai/prompt-sanitizer.ts

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS lgpd_ai_consent BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS lgpd_consent_date TIMESTAMPTZ;

-- Garante que consent_date só existe quando consent = true
ALTER TABLE organizations
  ADD CONSTRAINT lgpd_consent_date_requires_consent
  CHECK (
    lgpd_ai_consent = FALSE
    OR (lgpd_ai_consent = TRUE AND lgpd_consent_date IS NOT NULL)
  );

COMMENT ON COLUMN organizations.lgpd_ai_consent IS
  'Consentimento explícito do profissional para uso de dados de avaliações em prompts de IA (LGPD Art. 11)';

COMMENT ON COLUMN organizations.lgpd_consent_date IS
  'Data e hora do consentimento LGPD para IA. NULL quando lgpd_ai_consent = false.';
