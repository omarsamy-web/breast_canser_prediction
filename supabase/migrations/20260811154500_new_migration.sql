create extension if not exists "pgcrypto";

create table if not exists public.app_users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role text not null check (role in ('Admin', 'Doctor', 'Researcher')),
  created_at timestamptz not null default now()
);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'app_users'
      and column_name = 'password'
  ) then
    alter table public.app_users alter column password drop not null;
  end if;
end $$;

create table if not exists public.datasets (
  id uuid primary key default gen_random_uuid(),
  filename text,
  original_name text,
  path text,
  uploaded_by uuid references public.app_users(id) on delete set null,
  stats jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.app_users(id) on delete set null,
  model text,
  result text,
  confidence double precision,
  risk_percentage double precision,
  features jsonb default '[]'::jsonb,
  recommendation text,
  created_at timestamptz not null default now()
);

create table if not exists public.model_metrics (
  id uuid primary key default gen_random_uuid(),
  model_name text,
  accuracy double precision,
  precision double precision,
  recall double precision,
  f1_score double precision,
  roc_auc double precision,
  confusion_matrix jsonb default '[]'::jsonb,
  classification_report jsonb default '{}'::jsonb,
  feature_importance jsonb default '[]'::jsonb,
  is_best boolean default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_predictions_user_created on public.predictions(user_id, created_at desc);
create index if not exists idx_datasets_uploaded_by on public.datasets(uploaded_by);
create index if not exists idx_model_metrics_best on public.model_metrics(is_best);

alter table public.app_users enable row level security;
alter table public.datasets enable row level security;
alter table public.predictions enable row level security;
alter table public.model_metrics enable row level security;

drop policy if exists "Users can read own profile" on public.app_users;
drop policy if exists "Users can insert own profile" on public.app_users;
drop policy if exists "Users can update own profile" on public.app_users;

create policy "Users can read own profile"
  on public.app_users for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.app_users for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.app_users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can read own predictions" on public.predictions;
drop policy if exists "Users can insert own predictions" on public.predictions;

create policy "Users can read own predictions"
  on public.predictions for select
  using (auth.uid() = user_id);

create policy "Users can insert own predictions"
  on public.predictions for insert
  with check (auth.uid() = user_id);
