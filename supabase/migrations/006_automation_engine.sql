-- =============================================================================
-- DESTAKA — Migration 006: Automation Engine
-- Review auto-reply, competitor tracking, monthly reports
-- =============================================================================

-- ---------------------------------------------------------------------------
-- gmb_reviews: rascunho de resposta gerado por IA (aguarda aprovação)
-- ---------------------------------------------------------------------------
alter table public.gmb_reviews
  add column if not exists ai_reply_draft text;

comment on column public.gmb_reviews.ai_reply_draft is 'Rascunho de resposta gerado pelo Claude. NULL = não gerado ainda. Publicar via PATCH /api/reviews/[id]';

-- ---------------------------------------------------------------------------
-- TABELA: competitors
-- Recria com estrutura correta se colunas necessárias não existem
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'competitors'
      and column_name = 'profile_id'
  ) then
    drop table if exists public.competitors cascade;
    create table public.competitors (
      id              uuid primary key default gen_random_uuid(),
      profile_id      uuid not null references public.gmb_profiles(id) on delete cascade,
      place_id        text not null,
      name            text not null,
      avg_rating      numeric(3,1),
      review_count    integer not null default 0,
      address         text,
      last_tracked_at timestamptz not null default now(),
      unique (profile_id, place_id)
    );
  end if;
end $$;

create index if not exists idx_competitors_profile_id
  on public.competitors(profile_id);

alter table public.competitors enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'competitors' and policyname = 'competitors_owner'
  ) then
    execute $policy$
      create policy "competitors_owner" on public.competitors
        for all using (
          exists (
            select 1 from public.gmb_profiles
            where id = competitors.profile_id and user_id = auth.uid()
          )
        )
    $policy$;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- TABELA: monthly_reports
-- Relatórios mensais enviados por email
-- ---------------------------------------------------------------------------
create table if not exists public.monthly_reports (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  profile_id   uuid not null references public.gmb_profiles(id) on delete cascade,
  month        integer not null check (month >= 1 and month <= 12),
  year         integer not null,
  data         jsonb not null default '{}',
  sent_at      timestamptz,
  email_status text,
  unique (profile_id, month, year)
);

create index if not exists idx_monthly_reports_profile
  on public.monthly_reports(profile_id, year desc, month desc);

alter table public.monthly_reports enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'monthly_reports' and policyname = 'monthly_reports_owner'
  ) then
    execute $policy$
      create policy "monthly_reports_owner" on public.monthly_reports
        for all using (auth.uid() = user_id)
    $policy$;
  end if;
end $$;
