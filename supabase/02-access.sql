begin;
-- อ่านข้อมูล auth เฉพาะในฟังก์ชันภายใน ไม่ใช้ user_metadata ตัดสินสิทธิ์
create function private.is_student() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from auth.users u
    where u.id = (select auth.uid())
      and lower(u.email) ~ '^[^[:space:]@]+@mh\.ac\.th$'
      and u.email_confirmed_at is not null
  );
$$;
revoke all on function private.is_student() from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.is_student() to authenticated;

revoke all on public.profiles, public.rooms, public.messages, public.posts, public.kudos from anon, authenticated;
grant select on public.profiles, public.rooms, public.messages, public.posts, public.kudos to authenticated;
grant update(full_name) on public.profiles to authenticated;
grant insert(room_id, author_id, content) on public.messages to authenticated;
grant insert(author_id, content) on public.posts to authenticated;
grant update(content), delete on public.messages, public.posts to authenticated;

create policy profiles_read on public.profiles for select to authenticated using ((select private.is_student()));
create policy profiles_update on public.profiles for update to authenticated
  using ((select private.is_student()) and id = (select auth.uid()))
  with check ((select private.is_student()) and id = (select auth.uid()));
create policy rooms_read on public.rooms for select to authenticated using ((select private.is_student()));
create policy messages_read on public.messages for select to authenticated using ((select private.is_student()));
create policy messages_insert on public.messages for insert to authenticated
  with check ((select private.is_student()) and author_id = (select auth.uid()));
create policy messages_update on public.messages for update to authenticated
  using ((select private.is_student()) and author_id = (select auth.uid()))
  with check ((select private.is_student()) and author_id = (select auth.uid()));
create policy messages_delete on public.messages for delete to authenticated
  using ((select private.is_student()) and author_id = (select auth.uid()));
create policy posts_read on public.posts for select to authenticated using ((select private.is_student()));
create policy posts_insert on public.posts for insert to authenticated
  with check ((select private.is_student()) and author_id = (select auth.uid()));
create policy posts_update on public.posts for update to authenticated
  using ((select private.is_student()) and author_id = (select auth.uid()))
  with check ((select private.is_student()) and author_id = (select auth.uid()));
create policy posts_delete on public.posts for delete to authenticated
  using ((select private.is_student()) and author_id = (select auth.uid()));
create policy kudos_read on public.kudos for select to authenticated using ((select private.is_student()));

create view public.leaderboard with (security_invoker = true) as
  select p.id, p.username, p.grade, (count(k.id) * 10)::integer as score
  from public.profiles p left join public.kudos k on k.recipient_id = p.id
  group by p.id, p.username, p.grade;
revoke all on public.leaderboard from anon, authenticated;
grant select on public.leaderboard to authenticated;
commit;
