create extension if not exists "pgcrypto";

create table if not exists app_users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role text not null check (role in ('Admin', 'Doctor', 'Researcher')),
  created_at timestamptz not null default now()
);

create table if not exists datasets (
  id uuid primary key default gen_random_uuid(),
  filename text,
  original_name text,
  path text,
  uploaded_by uuid references app_users(id) on delete set null,
  stats jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references app_users(id) on delete set null,
  model text,
  result text,
  confidence double precision,
  risk_percentage double precision,
  features jsonb default '[]'::jsonb,
  recommendation text,
  created_at timestamptz not null default now()
);

create table if not exists model_metrics (
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

create index if not exists idx_predictions_user_created on predictions(user_id, created_at desc);
create index if not exists idx_datasets_uploaded_by on datasets(uploaded_by);
create index if not exists idx_model_metrics_best on model_metrics(is_best);

alter table app_users enable row level security;
alter table datasets enable row level security;
alter table predictions enable row level security;
alter table model_metrics enable row level security;

create policy "Users can read own profile"
  on app_users for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on app_users for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on app_users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can read own predictions"
  on predictions for select
  using (auth.uid() = user_id);

create policy "Users can insert own predictions"
  on predictions for insert
  with check (auth.uid() = user_id);
