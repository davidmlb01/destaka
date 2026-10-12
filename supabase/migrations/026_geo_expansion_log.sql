-- Migration 026: Geo Expansion Log
-- Tracks automated actions taken to expand geographic reach

CREATE TABLE IF NOT EXISTS geo_expansion_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  week_start DATE NOT NULL,
  actions_taken JSONB NOT NULL DEFAULT '[]',
  target_regions TEXT[] NOT NULL DEFAULT '{}',
  previous_radius_km NUMERIC,
  current_radius_km NUMERIC,
  zones_before INTEGER,
  zones_after INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_geo_expansion_log_org ON geo_expansion_log (organization_id, week_start DESC);
