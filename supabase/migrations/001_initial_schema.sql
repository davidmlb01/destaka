-- =============================================================================
-- DESTAKA — Migration 001: Schema inicial
-- Executar no Supabase SQL Editor após criar o projeto
-- =============================================================================

-- Habilitar extensões necessárias
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- =============================================================================
-- TABELA: users
-- =============================================================================
create table public.users (
  id           uuid primary key default uuid_generate_v4(),
  email        text not null unique,
  name         text,
  avatar_url   text,
  plan         text not null default 'free' check (plan in ('free', 'essencial', 'pro', 'agencia')),
  stripe_customer_id text unique,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- =============================================================================
-- TABELA: gmb_profiles
-- =============================================================================
create table public.gmb_profiles (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references public.users(id) on delete cascade,
  google_location_id  text not null unique,
  name                text not null,
  address             text not null,
  phone               text,
  website             text,
  category            text,
  score               integer check (score >= 0 and score <= 100),
  last_synced_at      timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- =============================================================================
-- TABELA: diagnostics
-- =============================================================================
create table public.diagnostics (
  id                  uuid primary key default uuid_generate_v4(),
  profile_id          uuid not null references public.gmb_profiles(id) on delete cascade,
  score_total         integer not null check (score_total >= 0 and score_total <= 100),
  score_info_basica   integer not null default 0,
  score_fotos         integer not null default 0,
  score_avaliacoes    integer not null default 0,
  score_posts         integer not null default 0,
  score_servicos      integer not null default 0,
  score_atributos     integer not null default 0,
  issues              jsonb not null default '[]',
  created_at          timestamptz not null default now()
);

-- =============================================================================
-- TABELA: optimization_actions
-- =============================================================================
create table public.optimization_actions (
  id              uuid primary key default uuid_generate_v4(),
  profile_id      uuid not null references public.gmb_profiles(id) on delete cascade,
  diagnostic_id   uuid references public.diagnostics(id) on delete set null,
  type            text not null,
  status          text not null default 'pending' check (status in ('pending', 'in_progress', 'done', 'failed')),
  payload         jsonb not null default '{}',
  error_message   text,
  executed_at     timestamptz,
  created_at      timestamptz not null default now()
);

-- =============================================================================
-- TABELA: gmb_posts
-- =============================================================================
create table public.gmb_posts (
  id              uuid primary key default uuid_generate_v4(),
  profile_id      uuid not null references public.gmb_profiles(id) on delete cascade,
  google_post_id  text unique,
  content         text not null,
  type            text not null default 'update' check (type in ('update', 'event', 'offer')),
  status          text not null default 'draft' check (status in ('draft', 'published', 'scheduled', 'failed')),
  scheduled_for   timestamptz,
  published_at    timestamptz,
  created_at      timestamptz not null default now()
);

-- =============================================================================
-- TABELA: gmb_reviews
-- =============================================================================
create table public.gmb_reviews (
  id                uuid primary key default uuid_generate_v4(),
  profile_id        uuid not null references public.gmb_profiles(id) on delete cascade,
  google_review_id  text not null unique,
  author            text not null,
  rating            integer not null check (rating >= 1 and rating <= 5),
  text              text,
  reply             text,
  reply_status      text not null default 'pending' check (reply_status in ('pending', 'replied', 'ignored')),
  review_date       timestamptz not null,
  created_at        timestamptz not null default now()
);

-- =============================================================================
-- TABELA: gmb_metrics
-- =============================================================================
create table public.gmb_metrics (
  id                uuid primary key default uuid_generate_v4(),
  profile_id        uuid not null references public.gmb_profiles(id) on delete cascade,
  date              date not null,
  views_search      integer not null default 0,
  views_maps        integer not null default 0,
  clicks_website    integer not null default 0,
  clicks_call       integer not null default 0,
  clicks_directions integer not null default 0,
  unique (profile_id, date)
);

-- =============================================================================
-- TABELA: plans (planos Stripe)
-- =============================================================================
create table public.plans (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references public.users(id) on delete cascade unique,
  stripe_subscription_id text unique,
  stripe_price_id     text,
  status              text not null default 'inactive' check (status in ('active', 'inactive', 'canceled', 'past_due')),
  current_period_end  timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- =============================================================================
-- ÍNDICES
-- =============================================================================
create index idx_gmb_profiles_user_id on public.gmb_profiles(user_id);
create index idx_diagnostics_profile_id on public.diagnostics(profile_id);
create index idx_diagnostics_created_at on public.diagnostics(created_at desc);
create index idx_optimization_actions_profile_id on public.optimization_actions(profile_id);
create index idx_optimization_actions_status on public.optimization_actions(status);
create index idx_gmb_posts_profile_id on public.gmb_posts(profile_id);
create index idx_gmb_posts_status on public.gmb_posts(status);
create index idx_gmb_reviews_profile_id on public.gmb_reviews(profile_id);
create index idx_gmb_reviews_reply_status on public.gmb_reviews(reply_status);
create index idx_gmb_metrics_profile_date on public.gmb_metrics(profile_id, date desc);

-- =============================================================================
-- UPDATED_AT trigger
-- =============================================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at_users
  before update on public.users
  for each row execute function public.handle_updated_at();

create trigger set_updated_at_gmb_profiles
  before update on public.gmb_profiles
  for each row execute function public.handle_updated_at();

create trigger set_updated_at_plans
  before update on public.plans
  for each row execute function public.handle_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================
alter table public.users enable row level security;
alter table public.gmb_profiles enable row level security;
alter table public.diagnostics enable row level security;
alter table public.optimization_actions enable row level security;
alter table public.gmb_posts enable row level security;
alter table public.gmb_reviews enable row level security;
alter table public.gmb_metrics enable row level security;
alter table public.plans enable row level security;

-- users: só lê/edita o próprio perfil
create policy "users_self" on public.users
  for all using (auth.uid() = id);

-- gmb_profiles: só acessa os próprios
create policy "profiles_owner" on public.gmb_profiles
  for all using (auth.uid() = user_id);

-- diagnostics: acessa via profile
create policy "diagnostics_owner" on public.diagnostics
  for all using (
    exists (
      select 1 from public.gmb_profiles
      where id = diagnostics.profile_id and user_id = auth.uid()
    )
  );

-- optimization_actions: acessa via profile
create policy "actions_owner" on public.optimization_actions
  for all using (
    exists (
      select 1 from public.gmb_profiles
      where id = optimization_actions.profile_id and user_id = auth.uid()
    )
  );

-- gmb_posts: acessa via profile
create policy "posts_owner" on public.gmb_posts
  for all using (
    exists (
      select 1 from public.gmb_profiles
      where id = gmb_posts.profile_id and user_id = auth.uid()
    )
  );

-- gmb_reviews: acessa via profile
create policy "reviews_owner" on public.gmb_reviews
  for all using (
    exists (
      select 1 from public.gmb_profiles
      where id = gmb_reviews.profile_id and user_id = auth.uid()
    )
  );

-- gmb_metrics: acessa via profile
create policy "metrics_owner" on public.gmb_metrics
  for all using (
    exists (
      select 1 from public.gmb_profiles
      where id = gmb_metrics.profile_id and user_id = auth.uid()
    )
  );

-- plans: só acessa o próprio plano
create policy "plans_owner" on public.plans
  for all using (auth.uid() = user_id);
