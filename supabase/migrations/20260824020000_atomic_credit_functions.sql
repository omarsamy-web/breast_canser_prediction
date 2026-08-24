-- Atomic credit operations used by the payment controller (race-safe).
create or replace function public.decrement_credits(p_user_id uuid)
returns void
language sql
as $$
  update public.app_users
     set credits = credits - 1
   where id = p_user_id and credits >= 1;
$$;

create or replace function public.increment_credits(p_user_id uuid, p_amount int default 1)
returns void
language sql
as $$
  update public.app_users
     set credits = greatest(credits + p_amount, 0)
   where id = p_user_id;
$$;
