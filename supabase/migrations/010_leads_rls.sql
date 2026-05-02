-- Migration 010: RLS na tabela leads (LGPD)
-- Leads são dados de visitantes anônimos — apenas INSERT público.
-- SELECT/UPDATE/DELETE bloqueados para anon. Service role bypassa RLS.

alter table public.leads enable row level security;

-- Permite que visitantes anônimos insiram leads (fluxo do lead magnet)
create policy "leads_insert_anon"
  on public.leads
  for insert
  to anon
  with check (true);

-- Bloqueia leitura pública de leads (proteção LGPD)
-- Nenhuma policy SELECT = negação implícita para anon e authenticated
