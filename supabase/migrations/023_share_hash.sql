-- Migration 023: Add share_hash column to organizations
-- Eliminates O(n) full table scan on public diagnostico/[hash] endpoint
-- Hash is computed as sha256(orgId + ENCRYPTION_KEY).slice(0, 16)

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS share_hash TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_share_hash ON organizations (share_hash)
  WHERE share_hash IS NOT NULL;

-- Backfill will be done via application code (needs ENCRYPTION_KEY from env)
-- Run: POST /api/admin/backfill-share-hash after deploy
