-- HIGH-01: RLS em profile_alerts
alter table if exists public.profile_alerts enable row level security;

create policy "profile_alerts_owner" on public.profile_alerts
  for all using (
    exists (
      select 1 from public.gmb_profiles
      where id = profile_alerts.profile_id
        and user_id = auth.uid()
    )
  );

-- HIGH-02: RLS em stripe_webhook_log
-- Tabela interna — apenas service role acessa. Bloqueia acesso direto via anon/authenticated.
alter table if exists public.stripe_webhook_log enable row level security;
-- Sem policies: service role bypassa RLS automaticamente. Usuários autenticados não têm acesso.

-- MED-01: remove policy anon INSERT em leads (app-layer já faz via service role com rate limit)
drop policy if exists "leads_insert_anon" on public.leads;
