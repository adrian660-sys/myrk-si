-- Personal finance tables (prefixed) — same Supabase project as PM tracker.
-- Does NOT alter PM tables. RLS: only public.is_admin() (email) — guests cannot see personal data.
-- Run after 0001–0005. Safe to re-run policies with DROP IF EXISTS.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.personal_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  type        text not null check (type in ('expense', 'income', 'transfer')),
  created_at  timestamptz not null default now(),
  unique (name, type)
);

create table if not exists public.personal_subcategories (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.personal_categories(id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now(),
  unique (category_id, name)
);

create table if not exists public.personal_funding_sources (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  created_at  timestamptz not null default now()
);

create table if not exists public.personal_transactions (
  id                 uuid primary key default gen_random_uuid(),
  date               date not null,
  description        text not null,
  amount             numeric not null,
  category_id        uuid not null references public.personal_categories(id) on delete restrict,
  subcategory_id     uuid references public.personal_subcategories(id) on delete set null,
  funding_source_id  uuid not null references public.personal_funding_sources(id) on delete restrict,
  notes              text,
  import_source      text not null default 'manual',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table if not exists public.personal_planned_transactions (
  id                 uuid primary key default gen_random_uuid(),
  description        text not null,
  amount             numeric not null,
  category_id        uuid not null references public.personal_categories(id) on delete restrict,
  subcategory_id     uuid references public.personal_subcategories(id) on delete set null,
  funding_source_id  uuid not null references public.personal_funding_sources(id) on delete restrict,
  frequency          text not null check (frequency in ('once', 'monthly', 'quarterly', 'yearly')),
  start_date         date not null,
  end_date           date,
  active             boolean not null default true,
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists idx_personal_subcategories_category
  on public.personal_subcategories(category_id);
create index if not exists idx_personal_transactions_date
  on public.personal_transactions(date);
create index if not exists idx_personal_transactions_category
  on public.personal_transactions(category_id);
create index if not exists idx_personal_transactions_funding
  on public.personal_transactions(funding_source_id);
create index if not exists idx_personal_planned_active
  on public.personal_planned_transactions(active);
create index if not exists idx_personal_planned_start
  on public.personal_planned_transactions(start_date);

-- ---------------------------------------------------------------------------
-- updated_at triggers (reuses public.set_updated_at from 0001)
-- ---------------------------------------------------------------------------

drop trigger if exists trg_personal_transactions_updated_at on public.personal_transactions;
create trigger trg_personal_transactions_updated_at
  before update on public.personal_transactions
  for each row execute function public.set_updated_at();

drop trigger if exists trg_personal_planned_updated_at on public.personal_planned_transactions;
create trigger trg_personal_planned_updated_at
  before update on public.personal_planned_transactions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS — admin only (same is_admin() as PM; does not replace the function)
-- ---------------------------------------------------------------------------

alter table public.personal_categories enable row level security;
alter table public.personal_subcategories enable row level security;
alter table public.personal_funding_sources enable row level security;
alter table public.personal_transactions enable row level security;
alter table public.personal_planned_transactions enable row level security;

-- personal_categories
drop policy if exists "personal_admin_all" on public.personal_categories;
create policy "personal_admin_all" on public.personal_categories
  for all using (public.is_admin()) with check (public.is_admin());

-- personal_subcategories
drop policy if exists "personal_admin_all" on public.personal_subcategories;
create policy "personal_admin_all" on public.personal_subcategories
  for all using (public.is_admin()) with check (public.is_admin());

-- personal_funding_sources
drop policy if exists "personal_admin_all" on public.personal_funding_sources;
create policy "personal_admin_all" on public.personal_funding_sources
  for all using (public.is_admin()) with check (public.is_admin());

-- personal_transactions
drop policy if exists "personal_admin_all" on public.personal_transactions;
create policy "personal_admin_all" on public.personal_transactions
  for all using (public.is_admin()) with check (public.is_admin());

-- personal_planned_transactions
drop policy if exists "personal_admin_all" on public.personal_planned_transactions;
create policy "personal_admin_all" on public.personal_planned_transactions
  for all using (public.is_admin()) with check (public.is_admin());
