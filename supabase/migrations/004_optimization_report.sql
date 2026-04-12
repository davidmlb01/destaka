-- Migração 004: coluna para Story 006 (GBP Optimization Engine)
alter table gbp_profiles add column if not exists optimization_report jsonb;
