-- PM Finance Tracker -- planned transactions for cash-flow projection and
-- bill / due-date tracking. Covers two shapes in one table:
--   * recurring expenses (accountant 120€/month, ZZZS monthly, tax quarterly...)
--   * one-off bills with a due date (frequency = 'once', start_date = due date)
--
-- The UI generates virtual future occurrences from these rules; it never
-- materialises them into the transactions table. Actuals still come from
-- manual entry or PDF import.

create table if not exists public.planned_transactions (
  id              uuid primary key default gen_random_uuid(),
  description     text not null,
  funding_source  text not null check (funding_source in ('Cash', 'DH', 'Revolut')),
  category        text not null check (category in ('Income', 'Business', 'Travel', 'Transfer')),
  subcategory     text,
  amount          numeric not null,  -- signed: positive = expected income, negative = expected expense
  frequency       text not null check (frequency in ('once', 'monthly', 'quarterly', 'yearly')),
  start_date      date not null,     -- first occurrence; for 'once' this is the due date
  end_date        date,              -- optional, last occurrence (ignored for 'once')
  active          boolean not null default true,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_planned_active on public.planned_transactions(active);
create index if not exists idx_planned_start  on public.planned_transactions(start_date);

drop trigger if exists trg_planned_updated_at on public.planned_transactions;
create trigger trg_planned_updated_at
  before update on public.planned_transactions
  for each row execute function public.set_updated_at();

alter table public.planned_transactions enable row level security;

drop policy if exists "read_authenticated" on public.planned_transactions;
create policy "read_authenticated" on public.planned_transactions
  for select using (auth.role() = 'authenticated');

drop policy if exists "admin_write" on public.planned_transactions;
create policy "admin_write" on public.planned_transactions
  for all using (public.is_admin()) with check (public.is_admin());
