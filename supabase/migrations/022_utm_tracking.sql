-- Migration 022: UTM tracking columns
-- Permite rastrear de onde veio cada lead e cada assinante

-- UTMs nos leads (diagnostico gratuito)
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS utm_content text,
  ADD COLUMN IF NOT EXISTS utm_term text;

-- UTMs nas organizations (signup via OAuth)
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text;

COMMENT ON COLUMN leads.utm_source IS 'Fonte do trafego (google, facebook, instagram, etc)';
COMMENT ON COLUMN leads.utm_medium IS 'Tipo de midia (cpc, organic, social, email)';
COMMENT ON COLUMN leads.utm_campaign IS 'Nome da campanha de ads';
COMMENT ON COLUMN organizations.utm_source IS 'Fonte do trafego que gerou o signup';
