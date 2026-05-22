-- PM Finance Tracker — initial schema
-- Run in the Supabase SQL editor or via `supabase db push`.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.trips (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  city        text not null,
  start_date  date not null,
  end_date    date not null,
  notes       text,
  created_at  timestamptz not null default now()
);

create table if not exists public.transactions (
  id               uuid primary key default gen_random_uuid(),
  date             date,
  description      text not null,
  funding_source   text not null check (funding_source in ('Cash', 'DH', 'Revolut')),
  category         text not null check (category in ('Income', 'Business', 'Travel', 'Transfer')),
  subcategory      text,
  amount           numeric not null,
  notes            text,
  bill_status      text not null default '/' check (bill_status in ('📎 Bill', '/', '')),
  trip_id          uuid references public.trips(id) on delete set null,
  import_source    text check (import_source in ('DH_PDF', 'Revolut_PDF', 'CSV', 'manual')),
  import_batch_id  uuid,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.cash_received (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references public.trips(id) on delete cascade,
  amount      numeric not null,
  date        date not null,
  notes       text,
  created_at  timestamptz not null default now()
);

create table if not exists public.import_logs (
  id                    uuid primary key default gen_random_uuid(),
  source                text not null check (source in ('DH_PDF', 'Revolut_PDF', 'CSV')),
  filename              text,
  rows_imported         integer not null default 0,
  rows_skipped          integer not null default 0,
  supabase_storage_path text,
  google_drive_file_id  text,
  google_drive_url      text,
  uploaded_by           text,
  created_at            timestamptz not null default now()
);

create index if not exists idx_transactions_date on public.transactions(date);
create index if not exists idx_transactions_trip on public.transactions(trip_id);
create index if not exists idx_transactions_batch on public.transactions(import_batch_id);
create index if not exists idx_cash_received_trip on public.cash_received(trip_id);

-- Keep updated_at fresh on transactions.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_transactions_updated_at on public.transactions;
create trigger trg_transactions_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Everyone authenticated may read. Only the admin email may write.
-- ---------------------------------------------------------------------------

alter table public.trips          enable row level security;
alter table public.transactions   enable row level security;
alter table public.cash_received  enable row level security;
alter table public.import_logs    enable row level security;

create or replace function public.is_admin()
returns boolean language sql stable as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'adrian@myrk.si';
$$;

do $$
declare t text;
begin
  foreach t in array array['trips', 'transactions', 'cash_received'] loop
    execute format('drop policy if exists "read_authenticated" on public.%I;', t);
    execute format('drop policy if exists "admin_write" on public.%I;', t);
    execute format(
      'create policy "read_authenticated" on public.%I for select using (auth.role() = ''authenticated'');', t);
    execute format(
      'create policy "admin_write" on public.%I for all using (public.is_admin()) with check (public.is_admin());', t);
  end loop;
end $$;

-- import_logs: authenticated may read; both admin and guest may insert
-- (guests are allowed to upload statements), but only admin may modify/delete.
drop policy if exists "read_authenticated" on public.import_logs;
drop policy if exists "insert_authenticated" on public.import_logs;
drop policy if exists "admin_modify" on public.import_logs;

create policy "read_authenticated" on public.import_logs
  for select using (auth.role() = 'authenticated');
create policy "insert_authenticated" on public.import_logs
  for insert with check (auth.role() = 'authenticated');
create policy "admin_modify" on public.import_logs
  for update using (public.is_admin()) with check (public.is_admin());
create policy "admin_delete" on public.import_logs
  for delete using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage bucket for uploaded bank statements (private, 6-month+ retention).
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('bank-statements', 'bank-statements', false)
on conflict (id) do nothing;

drop policy if exists "statements_read" on storage.objects;
drop policy if exists "statements_insert" on storage.objects;

create policy "statements_read" on storage.objects
  for select using (bucket_id = 'bank-statements' and auth.role() = 'authenticated');
create policy "statements_insert" on storage.objects
  for insert with check (bucket_id = 'bank-statements' and auth.role() = 'authenticated');
