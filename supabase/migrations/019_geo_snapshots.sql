-- Migration 013: Geo Snapshots + coordenadas no gmb_profiles
-- Story 6.2: Dashboard v2 - Mapa de Posicionamento Local

-- Adicionar coordenadas ao gmb_profiles (persistir lat/lng do negocio)
ALTER TABLE gmb_profiles
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision;

-- Tabela de snapshots geograficos (driving direction metrics)
CREATE TABLE IF NOT EXISTS geo_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES gmb_profiles(id) ON DELETE CASCADE,
  center_lat double precision NOT NULL,
  center_lng double precision NOT NULL,
  radius_km double precision,
  regions jsonb NOT NULL DEFAULT '[]',
  day_count integer NOT NULL DEFAULT 30,
  week_start date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint para deduplicacao (cron retries)
ALTER TABLE geo_snapshots ADD CONSTRAINT uq_geo_snapshots_org_week
  UNIQUE (org_id, week_start);

-- Index para queries rapidas por org + semana
CREATE INDEX IF NOT EXISTS idx_geo_snapshots_org_week
  ON geo_snapshots(org_id, week_start DESC);

-- RLS
ALTER TABLE geo_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own org geo snapshots" ON geo_snapshots
  FOR SELECT USING (
    org_id IN (
      SELECT organization_id FROM professionals WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role inserts geo snapshots" ON geo_snapshots
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role'
  );

CREATE POLICY "Service role updates geo snapshots" ON geo_snapshots
  FOR UPDATE USING (
    auth.role() = 'service_role'
  );
