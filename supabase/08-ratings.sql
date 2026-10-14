begin;
create table if not exists public.site_ratings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  stars smallint not null check (stars between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.site_ratings enable row level security;
revoke all on public.site_ratings from anon, authenticated;
grant select on public.site_ratings to authenticated;
grant insert(user_id, stars), update(stars, updated_at) on public.site_ratings to authenticated;
create policy site_ratings_read on public.site_ratings for select to authenticated
  using ((select private.is_student()));
create policy site_ratings_insert on public.site_ratings for insert to authenticated
  with check ((select private.is_student()) and user_id = (select auth.uid()));
create policy site_ratings_update on public.site_ratings for update to authenticated
  using ((select private.is_student()) and user_id = (select auth.uid()))
  with check ((select private.is_student()) and user_id = (select auth.uid()));
create view public.site_rating_counts with (security_invoker = true) as
  select stars, count(*)::integer as votes from public.site_ratings group by stars;
revoke all on public.site_rating_counts from anon, authenticated;
grant select on public.site_rating_counts to authenticated;
commit;
