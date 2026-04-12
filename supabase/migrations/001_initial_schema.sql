-- Destaka: schema inicial
-- Migracao 001: tabelas core com RLS

create extension if not exists "uuid-ossp";

-- Organizations (consultórios)
create table organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  specialty text not null check (specialty in ('dentista','medico','fisioterapeuta','psicologo','nutricionista','outro')),
  tone text not null default 'formal' check (tone in ('formal','proximo','tecnico')),
  automation_preference text not null default 'manual' check (automation_preference in ('manual','automatico')),
  service_areas text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Professionals
create table professionals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  organization_id uuid references organizations(id) on delete cascade,
  email text not null,
  name text not null,
  role text not null default 'owner' check (role in ('owner','admin')),
  created_at timestamptz default now()
);

-- GBP Profiles
create table gbp_profiles (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade,
  location_id text not null,
  name text,
  categories text[] default '{}',
  attributes jsonb default '{}',
  services jsonb default '[]',
  description text,
  phone text,
  address jsonb,
  hours jsonb,
  photo_count integer default 0,
  last_synced_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(organization_id, location_id)
);

-- Competitors
create table competitors (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade,
  name text not null,
  place_id text not null,
  categories text[] default '{}',
  attributes jsonb default '{}',
  review_count integer default 0,
  avg_rating numeric(3,2),
  post_frequency_per_week numeric(4,2),
  last_tracked_at timestamptz,
  created_at timestamptz default now(),
  unique(organization_id, place_id)
);

-- Reviews
create table reviews (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade,
  review_id text not null unique,
  author_name text,
  rating integer not null check (rating between 1 and 5),
  comment text,
  published_at timestamptz,
  response_text text,
  response_published_at timestamptz,
  created_at timestamptz default now()
);

-- Review Responses (geradas por IA)
create table review_responses (
  id uuid primary key default uuid_generate_v4(),
  review_id uuid references reviews(id) on delete cascade,
  organization_id uuid references organizations(id) on delete cascade,
  generated_text text not null,
  status text not null default 'pending' check (status in ('pending','approved','published','rejected')),
  published_at timestamptz,
  created_at timestamptz default now()
);

-- Posts
create table posts (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade,
  content text not null,
  post_type text not null check (post_type in ('educativo','procedimento','bairro','review_highlight','equipe')),
  status text not null default 'pending' check (status in ('pending','approved','published','rejected')),
  scheduled_at timestamptz,
  published_at timestamptz,
  gbp_post_id text,
  photo_suggestion text,
  created_at timestamptz default now()
);

-- Score Destaka (snapshots diários)
create table scores (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade,
  total integer not null check (total between 0 and 100),
  gmb_completude integer not null check (gmb_completude between 0 and 25),
  reputacao integer not null check (reputacao between 0 and 25),
  visibilidade integer not null check (visibilidade between 0 and 20),
  retencao integer not null check (retencao between 0 and 20),
  conversao integer not null check (conversao between 0 and 10),
  faixa text not null check (faixa in ('fraca','funcional','forte','perfeita')),
  tendencia text not null default 'estavel' check (tendencia in ('melhorando','estavel','declinando')),
  snapshot_date date not null default current_date,
  created_at timestamptz default now(),
  unique(organization_id, snapshot_date)
);

-- Reports (mensais)
create table reports (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade,
  month integer not null check (month between 1 and 12),
  year integer not null,
  data jsonb not null,
  sent_at timestamptz,
  email_status text,
  created_at timestamptz default now(),
  unique(organization_id, month, year)
);

-- Google Tokens (OAuth)
create table google_tokens (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade unique,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS: habilitar em todas as tabelas
alter table organizations enable row level security;
alter table professionals enable row level security;
alter table gbp_profiles enable row level security;
alter table competitors enable row level security;
alter table reviews enable row level security;
alter table review_responses enable row level security;
alter table posts enable row level security;
alter table scores enable row level security;
alter table reports enable row level security;
alter table google_tokens enable row level security;

-- Helper: retorna organization_id do usuario autenticado
create or replace function get_user_organization_id()
returns uuid
language sql
security definer
as $$
  select organization_id from professionals where user_id = auth.uid() limit 1;
$$;

-- Policies
create policy "org_owner" on organizations
  for all using (id = get_user_organization_id());

create policy "own_professional" on professionals
  for all using (user_id = auth.uid());

create policy "own_gbp" on gbp_profiles
  for all using (organization_id = get_user_organization_id());

create policy "own_competitors" on competitors
  for all using (organization_id = get_user_organization_id());

create policy "own_reviews" on reviews
  for all using (organization_id = get_user_organization_id());

create policy "own_review_responses" on review_responses
  for all using (organization_id = get_user_organization_id());

create policy "own_posts" on posts
  for all using (organization_id = get_user_organization_id());

create policy "own_scores" on scores
  for all using (organization_id = get_user_organization_id());

create policy "own_reports" on reports
  for all using (organization_id = get_user_organization_id());

create policy "own_google_tokens" on google_tokens
  for all using (organization_id = get_user_organization_id());
