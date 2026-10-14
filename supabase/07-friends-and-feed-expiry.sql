begin;

-- Friend requests are directional. Two reciprocal requests form a friendship.
create table if not exists public.friend_requests (
  requester_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (requester_id, recipient_id),
  check (requester_id <> recipient_id)
);
create index if not exists friend_requests_recipient on public.friend_requests(recipient_id, requester_id);
alter table public.friend_requests enable row level security;
revoke all on public.friend_requests from anon, authenticated;
grant select on public.friend_requests to authenticated;
grant insert(requester_id, recipient_id) on public.friend_requests to authenticated;
create policy friend_requests_read on public.friend_requests for select to authenticated
  using ((select private.is_student()) and ((select auth.uid()) = requester_id or (select auth.uid()) = recipient_id));
create policy friend_requests_insert on public.friend_requests for insert to authenticated
  with check ((select private.is_student()) and requester_id = (select auth.uid()));
alter publication supabase_realtime add table public.friend_requests;

-- The old rooms have no messages in the live project. Direct messages identify both participants.
drop policy if exists messages_read on public.messages;
drop policy if exists messages_insert on public.messages;
drop policy if exists messages_update on public.messages;
drop policy if exists messages_delete on public.messages;
alter table public.messages drop column room_id;
alter table public.messages add column recipient_id uuid not null references public.profiles(id) on delete cascade;
alter table public.messages add constraint messages_not_self check (author_id <> recipient_id);
create index messages_pair_cursor on public.messages(author_id, recipient_id, created_at desc, id desc);
drop table public.rooms;

create policy messages_read on public.messages for select to authenticated
  using ((select private.is_student()) and ((select auth.uid()) = author_id or (select auth.uid()) = recipient_id)
    and exists (select 1 from public.friend_requests a join public.friend_requests b
      on b.requester_id = a.recipient_id and b.recipient_id = a.requester_id
      where a.requester_id = messages.author_id and a.recipient_id = messages.recipient_id));
create policy messages_insert on public.messages for insert to authenticated
  with check ((select private.is_student()) and author_id = (select auth.uid())
    and exists (select 1 from public.friend_requests a join public.friend_requests b
      on b.requester_id = a.recipient_id and b.recipient_id = a.requester_id
      where a.requester_id = messages.author_id and a.recipient_id = messages.recipient_id));
create policy messages_update on public.messages for update to authenticated
  using ((select private.is_student()) and author_id = (select auth.uid()))
  with check ((select private.is_student()) and author_id = (select auth.uid()));
create policy messages_delete on public.messages for delete to authenticated
  using ((select private.is_student()) and author_id = (select auth.uid()));
revoke all on public.messages from anon, authenticated;
grant select on public.messages to authenticated;
grant insert(author_id, recipient_id, content) on public.messages to authenticated;
grant update(content), delete on public.messages to authenticated;

-- Purge the feed on a fixed two-hour cycle, including posts from the prior cycle.
create extension if not exists pg_cron with schema extensions;
select cron.schedule('mnchat-clear-feed-every-two-hours', '0 */2 * * *',
  'delete from public.posts');
commit;

