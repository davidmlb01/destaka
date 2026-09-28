-- Migration 008: Adicionar campos phone e instagram_handle na tabela organizations
-- Necessario para onboarding capturar WhatsApp e Instagram do profissional

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS instagram_handle text;

COMMENT ON COLUMN organizations.phone IS 'WhatsApp do profissional, formato (DD) XXXXX-XXXX';
COMMENT ON COLUMN organizations.instagram_handle IS 'Handle do Instagram do consultorio, formato @handle';
