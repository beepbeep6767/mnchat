-- รันไฟล์ 01, 02, 03 ตามลำดับใน Supabase > SQL Editor ของโปรเจกต์ใหม่เท่านั้น
begin;
create schema if not exists private;
revoke all on schema private from public;
create table private.rate_events (
  actor_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default clock_timestamp()
);
create index rate_events_actor_date on private.rate_events(actor_id,created_at);
alter table private.rate_events enable row level security;
revoke all on private.rate_events from public, anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[A-Za-z0-9_]{4,24}$'),
  grade smallint not null check (grade between 1 and 6),
  full_name text check (char_length(full_name) <= 80),
  created_at timestamptz not null default now()
);
create unique index profiles_username_case_insensitive on public.profiles(lower(username));
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 80),
  description text not null default '' check (char_length(description) <= 200),
  created_at timestamptz not null default now()
);
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(btrim(content)) between 1 and 2000 and content ~ '[^[:space:]]'),
  created_at timestamptz not null default now()
);
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(btrim(content)) between 1 and 5000 and content ~ '[^[:space:]]'),
  created_at timestamptz not null default now()
);
create table public.kudos (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (sender_id <> recipient_id)
);
create index messages_room_cursor on public.messages(room_id, created_at desc, id desc);
create index messages_author_rate on public.messages(author_id, created_at desc);
create index posts_cursor on public.posts(created_at desc, id desc);
create index posts_author_rate on public.posts(author_id, created_at desc);
create index kudos_recipient on public.kudos(recipient_id);
create index kudos_sender_date on public.kudos(sender_id, created_at);
create unique index kudos_once_daily on public.kudos(sender_id, recipient_id, ((created_at at time zone 'Asia/Bangkok')::date));

alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.messages enable row level security;
alter table public.posts enable row level security;
alter table public.kudos enable row level security;

insert into public.rooms(name,description) values
('ห้องรวม MNChat','ทักทายเพื่อน ๆ ทุกระดับชั้น'),
('ช่วยกันเรียน','ถามการบ้าน แบ่งปันความรู้ และติวกับเพื่อน'),
('กิจกรรมโรงเรียน','พูดคุยเรื่องชมรมและกิจกรรม');
commit;
