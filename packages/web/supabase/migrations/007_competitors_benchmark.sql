-- Migration 007: competitor benchmark data
alter table public.competitors
  add column if not exists photo_count integer not null default 0,
  add column if not exists categories text[] not null default '{}',
  add column if not exists has_website boolean not null default false,
  add column if not exists benchmark_data jsonb;

comment on column public.competitors.benchmark_data is 'Analise Claude: pontos fortes, gaps, alertas, insights';
