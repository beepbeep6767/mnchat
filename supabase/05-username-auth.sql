begin;
-- บัญชีชื่อผู้ใช้ไม่มีระดับชั้นจนกว่าผู้ใช้จะระบุเอง
alter table public.profiles alter column grade drop not null;
create or replace function private.is_student() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from auth.users u where u.id = (select auth.uid())
    and u.email_confirmed_at is not null and (
      lower(u.email) ~ '^[^[:space:]@]+@mh\.ac\.th$'
      or (u.raw_app_meta_data ->> 'account_type' = 'username'
        and lower(u.email) ~ '^[a-z0-9_]{4,24}@accounts\.mnchat\.invalid$')
    ));
$$;
create or replace function private.check_school_email() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.email is null or not (
    lower(new.email) ~ '^[^[:space:]@]+@mh\.ac\.th$'
    or (coalesce(new.raw_app_meta_data ->> 'account_type' = 'username',false)
      and lower(new.email) ~ '^[a-z0-9_]{4,24}@accounts\.mnchat\.invalid$')
  ) then raise exception 'account_invalid'; end if;
  return new;
end;
$$;
create or replace function private.create_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
declare username_value text; grade_value integer; full_name_value text;
begin
  username_value := btrim(coalesce(new.raw_user_meta_data ->> 'username',''));
  if username_value !~ '^[A-Za-z0-9_]{4,24}$' then raise exception 'username_invalid'; end if;
  if new.raw_app_meta_data ->> 'account_type' = 'username' then
    if lower(new.email) <> lower(username_value) || '@accounts.mnchat.invalid' then
      raise exception 'account_invalid';
    end if;
    grade_value := null;
  else
    if coalesce(new.raw_user_meta_data ->> 'grade','') !~ '^[1-6]$' then raise exception 'grade_invalid'; end if;
    grade_value := (new.raw_user_meta_data ->> 'grade')::integer;
  end if;
  full_name_value := nullif(btrim(new.raw_user_meta_data ->> 'full_name'),'');
  if char_length(full_name_value) > 80 then raise exception 'full_name_invalid'; end if;
  insert into public.profiles(id,username,grade,full_name)
    values (new.id,username_value,grade_value,full_name_value);
  return new;
end;
$$;
create table private.auth_attempts (
  bucket text primary key check (bucket ~ '^[a-f0-9]{64}$'),
  window_start timestamptz not null,
  attempts integer not null check (attempts > 0)
);
alter table private.auth_attempts enable row level security;
revoke all on private.auth_attempts from public, anon, authenticated;
-- เรียกได้จาก Edge Function ฝั่งเซิร์ฟเวอร์เท่านั้น
create function public.consume_auth_attempt(bucket_key text, max_attempts integer)
returns boolean language plpgsql security definer set search_path = '' as $$
declare attempts_value integer;
begin
  if bucket_key !~ '^[a-f0-9]{64}$' or max_attempts not between 1 and 30 then
    raise exception 'invalid_rate_bucket';
  end if;
  delete from private.auth_attempts where window_start < now() - interval '1 day';
  insert into private.auth_attempts(bucket,window_start,attempts)
    values (bucket_key,now(),1)
  on conflict (bucket) do update set
    attempts = case when private.auth_attempts.window_start < now() - interval '10 minutes'
      then 1 else least(private.auth_attempts.attempts + 1,31) end,
    window_start = case when private.auth_attempts.window_start < now() - interval '10 minutes'
      then now() else private.auth_attempts.window_start end
  returning attempts into attempts_value;
  return attempts_value <= max_attempts;
end;
$$;
revoke all on function public.consume_auth_attempt(text,integer) from public,anon,authenticated;
grant execute on function public.consume_auth_attempt(text,integer) to service_role;
update auth.users u set email_confirmed_at = now()
where u.email_confirmed_at is null and lower(u.email) ~ '^[^[:space:]@]+@mh\.ac\.th$'
  and exists(select 1 from public.profiles p where p.id = u.id);
commit;
