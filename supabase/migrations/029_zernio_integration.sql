ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS zernio_profile_id TEXT,
  ADD COLUMN IF NOT EXISTS zernio_account_id TEXT;
