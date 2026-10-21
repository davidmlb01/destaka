-- =============================================================================
-- DESTAKA — Migration 028: Programa de Indicacao
-- Board decision: 2026-10-20
-- 5 tabelas: referral_codes, partners, referrals, rewards, stripe_events
-- =============================================================================

-- =============================================================================
-- TABELA: partners
-- Parceiros (influenciadores, comerciais) e instituicoes que indicam
-- =============================================================================
create table public.partners (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  email           text not null,
  whatsapp        text,
  pix_key         text,
  logo_url        text,
  type            text not null default 'influencer' check (type in ('influencer', 'commercial', 'institution')),
  reward_rule     text not null default 'commission' check (reward_rule in ('none', 'commission', 'report')),
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger set_updated_at_partners
  before update on public.partners
  for each row execute function public.handle_updated_at();

-- =============================================================================
-- TABELA: referral_codes
-- Codigos de indicacao com tres tipos de dono: cliente, parceiro, instituicao
-- =============================================================================
create table public.referral_codes (
  id                  uuid primary key default uuid_generate_v4(),
  code                text not null unique,
  owner_type          text not null check (owner_type in ('client', 'partner', 'institution')),
  owner_user_id       uuid references public.users(id) on delete set null,
  owner_partner_id    uuid references public.partners(id) on delete set null,
  stripe_coupon_id    text,
  landing_slug        text unique,
  active              boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint referral_codes_owner_check check (
    (owner_type = 'client' and owner_user_id is not null and owner_partner_id is null) or
    (owner_type in ('partner', 'institution') and owner_partner_id is not null and owner_user_id is null)
  )
);

create index idx_referral_codes_code on public.referral_codes(code);
create index idx_referral_codes_owner_user on public.referral_codes(owner_user_id) where owner_user_id is not null;
create index idx_referral_codes_owner_partner on public.referral_codes(owner_partner_id) where owner_partner_id is not null;
create index idx_referral_codes_landing_slug on public.referral_codes(landing_slug) where landing_slug is not null;

create trigger set_updated_at_referral_codes
  before update on public.referral_codes
  for each row execute function public.handle_updated_at();

-- =============================================================================
-- TABELA: referrals
-- Registro de cada indicacao (quem foi indicado, por qual codigo)
-- =============================================================================
create table public.referrals (
  id                      uuid primary key default uuid_generate_v4(),
  referral_code_id        uuid not null references public.referral_codes(id) on delete restrict,
  referred_user_id        uuid not null references public.users(id) on delete cascade,
  referred_org_id         uuid references public.organizations(id) on delete set null,
  stripe_subscription_id  text,
  status                  text not null default 'pending' check (status in ('pending', 'active', 'cancelled')),
  activated_at            timestamptz,
  cancelled_at            timestamptz,
  created_at              timestamptz not null default now()
);

create index idx_referrals_code on public.referrals(referral_code_id);
create index idx_referrals_referred_user on public.referrals(referred_user_id);
create index idx_referrals_status on public.referrals(status);

-- =============================================================================
-- TABELA: rewards
-- Recompensas geradas (desconto para cliente, comissao para parceiro)
-- =============================================================================
create table public.rewards (
  id                  uuid primary key default uuid_generate_v4(),
  referral_id         uuid not null references public.referrals(id) on delete cascade,
  type                text not null check (type in ('discount', 'commission')),
  stripe_invoice_id   text,
  amount_cents        integer not null default 0,
  status              text not null default 'pending' check (status in ('pending', 'applied', 'paid', 'reversed')),
  paid_at             timestamptz,
  reversed_at         timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_rewards_referral on public.rewards(referral_id);
create index idx_rewards_status on public.rewards(status);
create index idx_rewards_invoice on public.rewards(stripe_invoice_id) where stripe_invoice_id is not null;

create trigger set_updated_at_rewards
  before update on public.rewards
  for each row execute function public.handle_updated_at();

-- =============================================================================
-- TABELA: stripe_events
-- Idempotencia: cada evento do Stripe e processado uma unica vez
-- =============================================================================
create table public.stripe_events (
  id              text primary key,
  event_type      text not null,
  processed_at    timestamptz not null default now()
);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
alter table public.partners enable row level security;
alter table public.referral_codes enable row level security;
alter table public.referrals enable row level security;
alter table public.rewards enable row level security;
alter table public.stripe_events enable row level security;

-- partners: somente admin (service_role) gerencia
create policy "partners_service_only" on public.partners
  for all using (false);

-- referral_codes: cliente ve seu proprio codigo; service_role gerencia todos
create policy "referral_codes_own" on public.referral_codes
  for select using (owner_user_id = auth.uid());

-- referrals: usuario ve suas proprias indicacoes (como indicador)
create policy "referrals_as_referrer" on public.referrals
  for select using (
    exists (
      select 1 from public.referral_codes rc
      where rc.id = referrals.referral_code_id
      and rc.owner_user_id = auth.uid()
    )
  );

-- referrals: usuario ve que foi indicado
create policy "referrals_as_referred" on public.referrals
  for select using (referred_user_id = auth.uid());

-- rewards: usuario ve recompensas das suas indicacoes
create policy "rewards_own" on public.rewards
  for select using (
    exists (
      select 1 from public.referrals r
      join public.referral_codes rc on rc.id = r.referral_code_id
      where r.id = rewards.referral_id
      and rc.owner_user_id = auth.uid()
    )
  );

-- stripe_events: somente service_role
create policy "stripe_events_service_only" on public.stripe_events
  for all using (false);

-- =============================================================================
-- FUNCAO HELPER: contar indicados ativos de um usuario
-- Usada pelo webhook para recalcular o cupom
-- =============================================================================
create or replace function public.count_active_referrals(p_user_id uuid)
returns integer as $$
  select count(*)::integer
  from public.referrals r
  join public.referral_codes rc on rc.id = r.referral_code_id
  where rc.owner_user_id = p_user_id
  and rc.owner_type = 'client'
  and r.status = 'active';
$$ language sql stable;
