-- =============================================================================
-- DESTAKA — Profile Snapshots + Alerts + google_place_id
-- Proteção de perfil: detecta alterações não autorizadas no Google Meu Negócio
-- =============================================================================

-- Coluna google_place_id em gmb_profiles (usada pelo QR code de reviews)
alter table public.gmb_profiles
  add column if not exists google_place_id text;

-- Snapshots do perfil (dados brutos da GBP API)
create table if not exists public.profile_snapshots (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.gmb_profiles(id) on delete cascade,
  snapshot_data jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_profile_snapshots_profile
  on public.profile_snapshots(profile_id, created_at desc);

-- Alertas de alteração detectada
create table if not exists public.profile_alerts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.gmb_profiles(id) on delete cascade,
  field text not null,
  old_value text,
  new_value text,
  acknowledged boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_profile_alerts_pending
  on public.profile_alerts(profile_id, acknowledged, created_at desc);
