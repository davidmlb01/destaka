-- Migration 008: leads do lead magnet (auditoria GBP gratuita)
create table if not exists public.leads (
  id           uuid primary key default gen_random_uuid(),
  email        text not null,
  place_name   text,
  score        integer,
  top_gaps     jsonb not null default '[]',
  ip_hash      text,
  lgpd_consent boolean not null default false,
  email_sent   boolean not null default false,
  created_at   timestamptz not null default now()
);

create index if not exists idx_leads_email on public.leads(email);
create index if not exists idx_leads_created on public.leads(created_at desc);

-- Sem RLS: tabela interna, acesso apenas via service role
