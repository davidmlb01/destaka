-- Migration 010: Surpass Plans
-- Plano de superacao com timeline semanal

CREATE TABLE IF NOT EXISTS surpass_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) NOT NULL,
  current_score integer NOT NULL,
  competitor_max_score integer,
  target_score integer NOT NULL,
  steps jsonb NOT NULL DEFAULT '[]',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '60 days')
);

CREATE INDEX IF NOT EXISTS idx_surpass_plans_org_active
  ON surpass_plans(organization_id) WHERE status = 'active';

ALTER TABLE surpass_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own surpass plans"
  ON surpass_plans FOR SELECT
  USING (organization_id IN (
    SELECT p.organization_id FROM professionals p WHERE p.user_id = auth.uid()
  ));
