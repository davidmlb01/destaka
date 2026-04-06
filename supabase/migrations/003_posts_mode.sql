-- Story 1.7: adiciona modo de posts automáticos ao perfil
alter table public.gmb_profiles
  add column if not exists auto_post_mode text not null default 'approval'
    check (auto_post_mode in ('automatic', 'approval'));
