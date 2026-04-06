-- =============================================================================
-- DESTAKA — Migration 002: Tokens Google OAuth criptografados
-- Executar no Supabase SQL Editor após configurar Google OAuth
-- =============================================================================

alter table public.users
  add column if not exists google_access_token_enc  text,
  add column if not exists google_refresh_token_enc text;

comment on column public.users.google_access_token_enc  is 'Access token Google OAuth criptografado (AES-256-GCM). Formato: iv:authTag:ciphertext em hex.';
comment on column public.users.google_refresh_token_enc is 'Refresh token Google OAuth criptografado (AES-256-GCM). Formato: iv:authTag:ciphertext em hex.';
