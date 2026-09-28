-- Migration 009: Competitive Analysis
-- Enriquece tabela competitors com dados textuais + cria tabela de analises

-- Campos novos na tabela competitors
ALTER TABLE competitors
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS review_keywords jsonb DEFAULT '[]';

-- Tabela de analises competitivas (resultado processado)
CREATE TABLE IF NOT EXISTS competitive_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) NOT NULL,
  gaps jsonb NOT NULL DEFAULT '[]',
  keyword_opportunities jsonb NOT NULL DEFAULT '[]',
  summary text,
  analyzed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_competitive_analyses_org
  ON competitive_analyses(organization_id);

CREATE INDEX IF NOT EXISTS idx_competitive_analyses_latest
  ON competitive_analyses(organization_id, analyzed_at DESC);

-- RLS
ALTER TABLE competitive_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own competitive analyses"
  ON competitive_analyses FOR SELECT
  USING (organization_id IN (
    SELECT p.organization_id FROM professionals p WHERE p.user_id = auth.uid()
  ));
