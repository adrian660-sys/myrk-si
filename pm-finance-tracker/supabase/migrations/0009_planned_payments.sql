-- planned_payments: records which planned occurrences have been paid.
-- One row per (planned_id, due_date). transaction_id is optional — null when
-- manually marked paid without linking a specific transaction.

create table if not exists public.planned_payments (
  id             uuid primary key default gen_random_uuid(),
  planned_id     uuid not null references public.planned_transactions(id) on delete cascade,
  due_date       date not null,
  paid_on        date not null default current_date,
  transaction_id uuid references public.transactions(id) on delete set null,
  created_at     timestamptz not null default now(),
  unique (planned_id, due_date)
);

create index if not exists idx_planned_payments_planned
  on public.planned_payments(planned_id);
create index if not exists idx_planned_payments_tx
  on public.planned_payments(transaction_id);

alter table public.planned_payments enable row level security;

drop policy if exists "pp_read_authenticated" on public.planned_payments;
create policy "pp_read_authenticated" on public.planned_payments
  for select using (auth.role() = 'authenticated');

drop policy if exists "pp_admin_write" on public.planned_payments;
create policy "pp_admin_write" on public.planned_payments
  for all using (public.is_admin()) with check (public.is_admin());
