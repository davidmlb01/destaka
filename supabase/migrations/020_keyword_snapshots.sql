-- Migration 014: Keyword Snapshots
-- Story 6.6: Snapshot semanal de keywords de busca do GBP

CREATE TABLE IF NOT EXISTS keyword_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES gmb_profiles(id) ON DELETE CASCADE,
  keyword text NOT NULL,
  impressions integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  week_start date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint para deduplicacao (cron retries)
ALTER TABLE keyword_snapshots ADD CONSTRAINT uq_keyword_snapshots_org_week_kw
  UNIQUE (org_id, week_start, keyword);

CREATE INDEX IF NOT EXISTS idx_keyword_snapshots_org_week
  ON keyword_snapshots(org_id, week_start DESC);

ALTER TABLE keyword_snapshots ENABLE ROW LEVEL SECURITY;

-- Users see own org keywords
CREATE POLICY "Users see own org keyword snapshots" ON keyword_snapshots
  FOR SELECT USING (
    org_id IN (SELECT organization_id FROM professionals WHERE user_id = auth.uid())
  );

-- Service role inserts only
CREATE POLICY "Service role inserts keyword snapshots" ON keyword_snapshots
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role'
  );
