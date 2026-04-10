-- =============================================================================
-- DESTAKA — Migration 005: Instrumentação de Produto
-- North Star Metric, Activation Events e Churn Prevention
-- Data Squad diagnosis — 2026-04-09
-- =============================================================================

-- =============================================================================
-- TABELA: user_events
-- Rastreia eventos de ativação e engajamento (append-only)
-- Permite calcular activation rate, aha moment e funil de conversão
-- =============================================================================
create table if not exists public.user_events (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.users(id) on delete cascade,
  profile_id  uuid references public.gmb_profiles(id) on delete set null,
  event_type  text not null check (event_type in (
    'gmb_connected',        -- perfil GMB conectado com sucesso
    'score_viewed',         -- usuário viu o score pela primeira vez
    'first_optimization',   -- primeira otimização automática executada (Aha Moment)
    'checklist_started',    -- usuário abriu o checklist guiado
    'plan_upgraded',        -- usuário fez upgrade de plano
    'dashboard_visited',    -- visita ao dashboard (engajamento)
    'review_responded',     -- resposta a avaliação publicada
    'post_published'        -- post semanal publicado
  )),
  metadata    jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

comment on table public.user_events is 'Eventos de ativação e engajamento — append-only, nunca deletar';
comment on column public.user_events.event_type is 'first_optimization = Aha Moment definitivo do produto';
comment on column public.user_events.metadata is 'Dados contextuais: score_antes, score_depois, optimization_type, etc.';

-- =============================================================================
-- TABELA: score_history
-- Série temporal do score por perfil — base da North Star Metric
-- "Perfis ativos com score aumentando semana a semana"
-- =============================================================================
create table if not exists public.score_history (
  id          uuid primary key default uuid_generate_v4(),
  profile_id  uuid not null references public.gmb_profiles(id) on delete cascade,
  score       integer not null check (score >= 0 and score <= 100),
  measured_at timestamptz not null default now(),
  unique (profile_id, measured_at)
);

comment on table public.score_history is 'Série temporal do score GMB por perfil — North Star Metric';
comment on column public.score_history.score is 'Score 0-100 calculado no momento da medição';

-- =============================================================================
-- TABELA: user_sessions
-- Uma linha por usuário — rastreia última atividade para churn prevention
-- Query de risco: SELECT * FROM user_sessions WHERE last_seen_at < now() - interval 14 days
-- =============================================================================
create table if not exists public.user_sessions (
  user_id       uuid primary key references public.users(id) on delete cascade,
  last_seen_at  timestamptz not null default now(),
  session_count integer not null default 1,
  updated_at    timestamptz not null default now()
);

comment on table public.user_sessions is 'Última atividade por usuário — base para triggers de churn prevention';
comment on column public.user_sessions.last_seen_at is 'Atualizar em cada request autenticado via middleware ou server action';

-- =============================================================================
-- ÍNDICES
-- =============================================================================

-- user_events: consultas de ativação (ex: "usuário já executou first_optimization?")
create index if not exists idx_user_events_user_type
  on public.user_events(user_id, event_type);

-- user_events: feed de eventos recentes por usuário
create index if not exists idx_user_events_user_created
  on public.user_events(user_id, created_at desc);

-- user_events: análise de funil por tipo de evento (sem filtro de usuário)
create index if not exists idx_user_events_type_created
  on public.user_events(event_type, created_at desc);

-- score_history: série temporal por perfil (North Star queries)
create index if not exists idx_score_history_profile_measured
  on public.score_history(profile_id, measured_at desc);

-- user_sessions: detecção de usuários inativos (churn risk scan)
create index if not exists idx_user_sessions_last_seen
  on public.user_sessions(last_seen_at);

-- =============================================================================
-- TRIGGER: updated_at em user_sessions
-- =============================================================================
create trigger set_updated_at_user_sessions
  before update on public.user_sessions
  for each row execute function public.handle_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
alter table public.user_events enable row level security;
alter table public.score_history enable row level security;
alter table public.user_sessions enable row level security;

-- user_events: usuário só lê/insere os próprios eventos
create policy "user_events_owner" on public.user_events
  for all using (auth.uid() = user_id);

-- score_history: usuário acessa via perfil próprio
create policy "score_history_owner" on public.score_history
  for all using (
    exists (
      select 1 from public.gmb_profiles
      where id = score_history.profile_id
        and user_id = auth.uid()
    )
  );

-- user_sessions: usuário acessa apenas a própria sessão
create policy "user_sessions_owner" on public.user_sessions
  for all using (auth.uid() = user_id);

-- =============================================================================
-- ROLLBACK (executar em caso de reversão)
-- =============================================================================
-- drop trigger if exists set_updated_at_user_sessions on public.user_sessions;
-- drop table if exists public.user_sessions;
-- drop table if exists public.score_history;
-- drop table if exists public.user_events;
