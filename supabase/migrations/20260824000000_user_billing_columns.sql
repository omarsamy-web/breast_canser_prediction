-- Add patient billing columns to app_users
alter table app_users
  add column if not exists plan text not null default 'free',
  add column if not exists credits integer not null default 0,
  add column if not exists free_prediction_used boolean not null default false;
