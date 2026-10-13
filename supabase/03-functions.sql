begin;
create function private.check_school_email() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.email is null or lower(new.email) !~ '^[^[:space:]@]+@mh\.ac\.th$' then
    raise exception 'school_email';
  end if;
  return new;
end;
$$;
revoke all on function private.check_school_email() from public, anon, authenticated;
create trigger mnchat_school_email before insert or update of email on auth.users
  for each row execute function private.check_school_email();

create function private.create_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
declare username_value text; grade_value integer; full_name_value text;
begin
  username_value := btrim(coalesce(new.raw_user_meta_data ->> 'username',''));
  if username_value !~ '^[A-Za-z0-9_]{4,24}$' then raise exception 'username_invalid'; end if;
  if coalesce(new.raw_user_meta_data ->> 'grade','') !~ '^[1-6]$' then raise exception 'grade_invalid'; end if;
  grade_value := (new.raw_user_meta_data ->> 'grade')::integer;
  full_name_value := nullif(btrim(new.raw_user_meta_data ->> 'full_name'),'');
  if char_length(full_name_value) > 80 then raise exception 'full_name_invalid'; end if;
  insert into public.profiles(id, username, grade, full_name) values (new.id, username_value, grade_value, full_name_value);
  return new;
end;
$$;
revoke all on function private.create_profile() from public, anon, authenticated;
create trigger mnchat_create_profile after insert on auth.users
  for each row execute function private.create_profile();

-- advisory lock ทำให้คำขอพร้อมกันของผู้ใช้คนเดียวไม่หลุดข้อจำกัด
create function private.guard_content() returns trigger
language plpgsql security definer set search_path = '' as $$
declare recent_count integer; latest timestamptz;
begin
  if (select auth.uid()) is null or new.author_id <> (select auth.uid()) or not private.is_student() then
    raise exception 'school_email';
  end if;
  if new.content !~ '[^[:space:]]' then raise exception 'content_empty'; end if;
  new.content := btrim(new.content);
  perform pg_advisory_xact_lock(hashtextextended(new.author_id::text, 0));
  delete from private.rate_events where actor_id = new.author_id and created_at <= clock_timestamp()-interval '1 minute';
  select count(*), max(created_at) into recent_count, latest from private.rate_events where actor_id = new.author_id;
  if recent_count >= 30 or latest > clock_timestamp()-interval '1 second' then raise exception 'spam_rate_limit'; end if;
  insert into private.rate_events(actor_id) values(new.author_id);
  if tg_op = 'UPDATE' then new.author_id := old.author_id; new.created_at := old.created_at;
  else new.created_at := clock_timestamp(); end if;
  return new;
end;
$$;
revoke all on function private.guard_content() from public, anon, authenticated;
create trigger mnchat_guard_messages before insert or update on public.messages for each row execute function private.guard_content();
create trigger mnchat_guard_posts before insert or update on public.posts for each row execute function private.guard_content();

-- คะแนนมาจากจำนวนคำขอบคุณที่ผ่านข้อจำกัดเท่านั้น client ส่งคะแนนเองไม่ได้
create function private.award_kudos(recipient uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare sender uuid := (select auth.uid()); day_start timestamptz;
begin
  if sender is null or not private.is_student() then raise exception 'school_email'; end if;
  if sender = recipient then raise exception 'self_kudos'; end if;
  if not exists(select 1 from public.posts where author_id = recipient) then raise exception 'recipient_has_no_post'; end if;
  if not exists(select 1 from auth.users where id = recipient and email_confirmed_at is not null) then raise exception 'recipient_invalid'; end if;
  perform pg_advisory_xact_lock(hashtextextended(sender::text, 1));
  day_start := date_trunc('day',clock_timestamp() at time zone 'Asia/Bangkok') at time zone 'Asia/Bangkok';
  if exists(select 1 from public.kudos where sender_id = sender and recipient_id = recipient and created_at >= day_start) then raise exception 'daily_kudos'; end if;
  if (select count(*) from public.kudos where sender_id = sender and created_at >= day_start) >= 5 then raise exception 'daily_kudos_limit'; end if;
  insert into public.kudos(sender_id,recipient_id) values(sender,recipient);
end;
$$;
revoke all on function private.award_kudos(uuid) from public, anon, authenticated;
grant execute on function private.award_kudos(uuid) to authenticated;
create function public.give_kudos(recipient uuid) returns void
language sql security invoker set search_path = '' as $$ select private.award_kudos(recipient); $$;
revoke all on function public.give_kudos(uuid) from public, anon, authenticated;
grant execute on function public.give_kudos(uuid) to authenticated;

-- เปิด Realtime เฉพาะตารางที่ใช้จริง
do $$
begin
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='messages') then
    alter publication supabase_realtime add table public.messages;
  end if;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='posts') then
    alter publication supabase_realtime add table public.posts;
  end if;
end;
$$;
commit;
