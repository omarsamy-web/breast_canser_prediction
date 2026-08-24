-- Allow Patient role and normalize legacy staff roles
alter table public.app_users drop constraint if exists app_users_role_check;

update public.app_users set role = 'Admin' where role in ('Doctor', 'Researcher');

alter table public.app_users
  add constraint app_users_role_check check (role in ('Admin', 'Patient'));
