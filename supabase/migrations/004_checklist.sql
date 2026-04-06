-- Story 1.4: tabela de progresso do checklist guiado
create table if not exists public.checklist_progress (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.gmb_profiles(id) on delete cascade,
  item_key    text not null,
  done        boolean not null default false,
  done_at     timestamptz,
  created_at  timestamptz not null default now(),
  unique(profile_id, item_key)
);

create index if not exists idx_checklist_profile_id on public.checklist_progress(profile_id);

alter table public.checklist_progress enable row level security;

create policy "checklist_owner" on public.checklist_progress
  for all using (
    exists (
      select 1 from public.gmb_profiles
      where id = checklist_progress.profile_id and user_id = auth.uid()
    )
  );
