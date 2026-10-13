-- รันหลัง 01–03 ผล RLS ต้องเป็น true ทุกแถว
select tablename, rowsecurity from pg_tables
where schemaname='public' and tablename in ('profiles','rooms','messages','posts','kudos');
-- ต้องมี policies ครบตามไฟล์ 02
select tablename, policyname, cmd from pg_policies where schemaname='public' order by tablename, policyname;
-- ต้องไม่มีสิทธิ์ insert/update/delete kudos จาก authenticated โดยตรง
select has_table_privilege('authenticated','public.kudos','INSERT') as can_insert_kudos,
has_table_privilege('authenticated','public.kudos','UPDATE') as can_update_kudos,
has_table_privilege('authenticated','public.kudos','DELETE') as can_delete_kudos;
-- ทั้งสามช่องด้านบนต้องเป็น false
select tablename from pg_publication_tables where pubname='supabase_realtime';
