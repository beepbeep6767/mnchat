begin;
create table public.calls (
  id uuid primary key default gen_random_uuid(),
  initiator_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('audio', 'video')),
  status text not null default 'active' check (status in ('active', 'ended')),
  created_at timestamptz not null default now(),
  ended_at timestamptz
);
create table public.call_members (
  call_id uuid not null references public.calls(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('invited', 'joined', 'declined', 'left')),
  updated_at timestamptz not null default now(),
  primary key (call_id,user_id)
);
create index call_members_user_status on public.call_members(user_id,status,updated_at desc);
alter table public.calls enable row level security;
alter table public.call_members enable row level security;
revoke all on public.calls,public.call_members from anon,authenticated;
grant select on public.calls,public.call_members to authenticated;
create policy call_members_own on public.call_members for select to authenticated
  using ((select private.is_student()) and user_id=(select auth.uid()));
create policy calls_member on public.calls for select to authenticated
  using ((select private.is_student()) and exists (
    select 1 from public.call_members m where m.call_id=calls.id and m.user_id=(select auth.uid())
  ));
create function public.start_friend_call(invitees uuid[], call_kind text) returns uuid
language plpgsql security definer set search_path='' as $$
declare caller uuid := auth.uid(); new_id uuid; invitee uuid;
begin
  if caller is null or not private.is_student() then raise exception 'Not authorized'; end if;
  if call_kind not in ('audio','video') then raise exception 'Invalid call type'; end if;
  if invitees is null or cardinality(invitees) < 1 or cardinality(invitees) > 3
     or (select count(distinct x) from unnest(invitees) x) <> cardinality(invitees)
     or caller=any(invitees) then raise exception 'Choose 1–3 distinct friends'; end if;
  foreach invitee in array invitees loop
    if invitee is null or not exists (
      select 1 from public.friend_requests a join public.friend_requests b
        on b.requester_id=a.recipient_id and b.recipient_id=a.requester_id
      where a.requester_id=caller and a.recipient_id=invitee
    ) then raise exception 'Invitees must be friends'; end if;
  end loop;
  insert into public.calls(initiator_id,kind) values(caller,call_kind) returning id into new_id;
  insert into public.call_members(call_id,user_id,status) values(new_id,caller,'joined');
  insert into public.call_members(call_id,user_id,status)
    select new_id,x,'invited' from unnest(invitees) x;
  return new_id;
end; $$;
create function public.respond_friend_call(target_call uuid, accept_call boolean) returns void
language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null or not private.is_student() then raise exception 'Not authorized'; end if;
  update public.call_members m set status=case when accept_call then 'joined' else 'declined' end, updated_at=now()
  from public.calls c where m.call_id=target_call and m.user_id=auth.uid() and m.status='invited'
    and c.id=m.call_id and c.status='active' and c.created_at>now()-interval '2 hours';
  if not found then raise exception 'Call invitation unavailable'; end if;
end; $$;
create function public.leave_friend_call(target_call uuid) returns void
language plpgsql security definer set search_path='' as $$
declare owner_id uuid;
begin
  if auth.uid() is null or not private.is_student() then raise exception 'Not authorized'; end if;
  select initiator_id into owner_id from public.calls where id=target_call and status='active';
  if owner_id is null or not exists(select 1 from public.call_members where call_id=target_call and user_id=auth.uid() and status='joined')
    then raise exception 'Call unavailable'; end if;
  if owner_id=auth.uid() then
    update public.calls set status='ended',ended_at=now() where id=target_call;
    update public.call_members set status='left',updated_at=now() where call_id=target_call and status in ('joined','invited');
  else
    update public.call_members set status='left',updated_at=now() where call_id=target_call and user_id=auth.uid();
  end if;
end; $$;
revoke all on function public.start_friend_call(uuid[],text),public.respond_friend_call(uuid,boolean),public.leave_friend_call(uuid) from public,anon;
grant execute on function public.start_friend_call(uuid[],text),public.respond_friend_call(uuid,boolean),public.leave_friend_call(uuid) to authenticated;
alter publication supabase_realtime add table public.calls;
alter publication supabase_realtime add table public.call_members;
select cron.schedule('mnchat-expire-calls', '*/10 * * * *',
  'update public.calls set status=''ended'',ended_at=now() where status=''active'' and created_at<now()-interval ''2 hours''');
commit;
