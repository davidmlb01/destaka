-- EPIC-010: Smart Alerts - tabela de alertas enviados
-- Rastreia alertas enviados para evitar duplicatas

CREATE TABLE IF NOT EXISTS alerts_sent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  alert_type TEXT NOT NULL, -- 'negative_review' | 'token_disconnected'
  reference_id TEXT, -- review_id or null
  sent_at TIMESTAMPTZ DEFAULT now(),
  email_to TEXT NOT NULL
);

CREATE INDEX idx_alerts_sent_org_type ON alerts_sent (organization_id, alert_type, sent_at);
