-- EPIC-008: Patient Conversion Funnel
-- Tabela para armazenar metricas semanais de performance do GBP

CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  week_start DATE NOT NULL,
  impressions_direct INTEGER DEFAULT 0,
  impressions_indirect INTEGER DEFAULT 0,
  views_maps INTEGER DEFAULT 0,
  views_search INTEGER DEFAULT 0,
  actions_phone INTEGER DEFAULT 0,
  actions_directions INTEGER DEFAULT 0,
  actions_website INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, week_start)
);

-- RLS
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org performance_metrics"
  ON performance_metrics FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM professionals WHERE user_id = auth.uid()
    )
  );
