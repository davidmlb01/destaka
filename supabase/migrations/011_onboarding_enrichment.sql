-- Migration 011: Onboarding enrichment fields
-- Adds challenge, patient_volume, services, and differentials to organizations

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS challenge text,
  ADD COLUMN IF NOT EXISTS patient_volume text,
  ADD COLUMN IF NOT EXISTS services text[],
  ADD COLUMN IF NOT EXISTS differentials text;

COMMENT ON COLUMN organizations.challenge IS 'Primary challenge selected during onboarding: more_patients, more_reviews, more_visibility, all';
COMMENT ON COLUMN organizations.patient_volume IS 'Weekly patient volume range: under_10, 10_30, 30_60, over_60';
COMMENT ON COLUMN organizations.services IS 'Array of main services offered by the professional';
COMMENT ON COLUMN organizations.differentials IS 'Free-text differentials of the practice';
