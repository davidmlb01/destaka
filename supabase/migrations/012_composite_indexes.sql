-- Migration 012: índices compostos para performance
-- Otimiza queries frequentes nos crons e dashboard com 100+ usuários.

create index if not exists idx_diagnostics_profile_date
  on public.diagnostics(profile_id, created_at desc);

create index if not exists idx_gmb_reviews_profile_status_date
  on public.gmb_reviews(profile_id, reply_status, review_date desc);

create index if not exists idx_gmb_posts_profile_status_date
  on public.gmb_posts(profile_id, status, created_at desc);
