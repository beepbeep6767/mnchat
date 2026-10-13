begin;
-- Supabase ใส่ app_metadata หลัง INSERT จึงใช้ตั๋วครั้งเดียวที่ออกจากเซิร์ฟเวอร์ก่อนสร้างบัญชี
create table private.signup_tickets (
  ticket uuid primary key default gen_random_uuid(),
  username text not null check (username ~ '^[a-z0-9_]{4,24}$'),
  created_at timestamptz not null default now()
);
alter table private.signup_tickets enable row level security;
revoke all on private.signup_tickets from public,anon,authenticated;
create function public.issue_signup_ticket(username_value text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare result uuid;
begin
  delete from private.signup_tickets where created_at < now() - interval '5 minutes';
  insert into private.signup_tickets(username) values(username_value) returning ticket into result;
  return result;
end;
$$;
revoke all on function public.issue_signup_ticket(text) from public,anon,authenticated;
grant execute on function public.issue_signup_ticket(text) to service_role;
create or replace function private.check_school_email() returns trigger
language plpgsql security definer set search_path = '' as $$
declare accepted uuid;
begin
  if new.email is null then raise exception 'account_invalid'; end if;
  if lower(new.email) ~ '^[^[:space:]@]+@mh\.ac\.th$' then return new; end if;
  if lower(new.email) !~ '^[a-z0-9_]{4,24}@accounts\.mnchat\.invalid$' then raise exception 'account_invalid'; end if;
  if tg_op = 'UPDATE' and old.email = new.email then return new; end if;
  delete from private.signup_tickets
    where ticket::text = new.raw_user_meta_data ->> 'signup_ticket'
      and username || '@accounts.mnchat.invalid' = lower(new.email)
      and created_at >= now() - interval '5 minutes'
    returning ticket into accepted;
  if accepted is null then raise exception 'account_invalid'; end if;
  return new;
end;
$$;
create or replace function private.create_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
declare username_value text; grade_value integer; full_name_value text;
begin
  username_value := btrim(coalesce(new.raw_user_meta_data ->> 'username',''));
  if username_value !~ '^[A-Za-z0-9_]{4,24}$' then raise exception 'username_invalid'; end if;
  if lower(new.email) ~ '^[a-z0-9_]{4,24}@accounts\.mnchat\.invalid$' then
    if lower(new.email) <> lower(username_value) || '@accounts.mnchat.invalid' then raise exception 'account_invalid'; end if;
    grade_value := null;
  else
    if coalesce(new.raw_user_meta_data ->> 'grade','') !~ '^[1-6]$' then raise exception 'grade_invalid'; end if;
    grade_value := (new.raw_user_meta_data ->> 'grade')::integer;
  end if;
  full_name_value := nullif(btrim(new.raw_user_meta_data ->> 'full_name'),'');
  if char_length(full_name_value) > 80 then raise exception 'full_name_invalid'; end if;
  insert into public.profiles(id,username,grade,full_name) values(new.id,username_value,grade_value,full_name_value);
  return new;
end;
$$;
commit;
