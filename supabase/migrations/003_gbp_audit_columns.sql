-- Migração 002: colunas para Story 002 (GBP Audit Engine)

-- gbp_location_id na organizacao (resource name do GBP)
alter table organizations add column if not exists gbp_location_id text;

-- audit_report em gbp_profiles (resultado do runAudit)
alter table gbp_profiles add column if not exists audit_report jsonb;

-- benchmark_report em gbp_profiles (Story 003: análise competitiva)
alter table gbp_profiles add column if not exists benchmark_report jsonb;
