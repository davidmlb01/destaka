-- Migration 011: idempotência do webhook Stripe
-- Garante que eventos duplicados não sejam processados duas vezes.
-- stripe_event_id é PRIMARY KEY — segundo insert falha silenciosamente via ON CONFLICT DO NOTHING.

create table if not exists public.stripe_webhook_log (
  stripe_event_id  text primary key,
  processed_at     timestamptz not null default now()
);
