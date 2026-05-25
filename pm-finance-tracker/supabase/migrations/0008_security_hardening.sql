-- Security hardening:
--   * is_admin() now reads app_metadata.role (server-controlled) instead of email
--   * import_logs INSERT restricted to admin (was: any authenticated user)
--   * storage bucket INSERT restricted to admin (was: any authenticated user)
--
-- BEFORE running this migration, give your admin user the role in app_metadata.
-- Run ONCE in Supabase SQL editor:
--
--   update auth.users
--   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
--                           || '{"role":"admin"}'::jsonb
--   where email = 'adrian@myrk.si';
--
-- Then sign out and back in so a fresh JWT is issued.

-- ---------------------------------------------------------------------------
-- is_admin(): read role from JWT app_metadata (server-set, user cannot modify)
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
as $func$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin';
$func$;

-- ---------------------------------------------------------------------------
-- import_logs: only admin may insert (was: any authenticated user)
-- ---------------------------------------------------------------------------

drop policy if exists "insert_authenticated" on public.import_logs;
create policy "admin_insert" on public.import_logs
  for insert with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage bucket: only admin may upload (was: any authenticated user)
-- ---------------------------------------------------------------------------

drop policy if exists "statements_insert" on storage.objects;
create policy "statements_insert" on storage.objects
  for insert with check (bucket_id = 'bank-statements' and public.is_admin());
