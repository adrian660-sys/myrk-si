-- Invoicing module: business settings, bank accounts, clients, invoices, invoice lines.
--
-- Issuer info, bank accounts and clients are admin-managed reference data.
-- Invoices are sequentially numbered per (type, year): "2025-001" for invoices
-- and "P2025-001" for proforma. The sequence is derived from existing rows
-- at insertion time via a trigger.

-- ─────────────────────────────────────────────────────────────
-- Business / issuer settings — singleton row (id = 1).
-- ─────────────────────────────────────────────────────────────

create table if not exists public.business_settings (
  id                int  primary key default 1,
  legal_name        text not null,
  display_name      text not null,
  address_line1     text not null,
  address_line2     text,
  postal_code       text not null,
  city              text not null,
  country           text not null default 'Slovenija',
  tax_id            text not null,         -- davčna številka
  registration_id   text,                  -- matična številka
  email             text,
  phone             text,
  website           text,
  vat_notice        text not null default 'Nismo davčni zavezanci po 1. odstavku 94. člena ZDDV-1.',
  place_of_issue    text not null default 'Ljubljana',
  default_due_days  int  not null default 14,
  default_bank_account_id uuid,            -- FK set after bank_accounts table created
  updated_at        timestamptz not null default now(),
  check (id = 1)
);

-- Seed Adrian's MYRK row.
insert into public.business_settings (
  id, legal_name, display_name, address_line1, postal_code, city,
  tax_id, registration_id, email
) values (
  1,
  'MYRK, poslovno svetovanje in druge storitve, Adrian Džeka s.p.',
  'MYRK, Adrian Džeka, s.p.',
  'Tivolska cesta 38',
  '1000',
  'Ljubljana',
  '77355474',
  '8983097000',
  'adrian@myrk.si'
)
on conflict (id) do nothing;

alter table public.business_settings enable row level security;

drop policy if exists "bs_read" on public.business_settings;
create policy "bs_read" on public.business_settings
  for select using (auth.role() = 'authenticated');

drop policy if exists "bs_admin_write" on public.business_settings;
create policy "bs_admin_write" on public.business_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- Bank accounts — the IBANs you can pick from when issuing an invoice.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.bank_accounts (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,         -- "DH", "Revolut", "N26"
  iban          text not null,
  bic           text,
  bank_name     text,
  bank_address  text,
  is_active     boolean not null default true,
  position      int not null default 0,
  created_at    timestamptz not null default now()
);

-- Seed Adrian's three accounts.
insert into public.bank_accounts (name, iban, bic, bank_name, bank_address, position)
values
  ('DH',      'SI56 6100 0003 0396 364',     'HDELSI22',    'Delavska hranilnica d.d.', 'Miklošičeva 5, 1000 Ljubljana',                       1),
  ('Revolut', 'LT10 3250 0171 6588 5025',    'REVOLT21',    'Revolut Bank UAB',         'Konstitucijos ave. 21B, 08130, Vilnius, Lithuania',  2),
  ('N26',     'DE91 1001 1001 2624 5165 06', 'NTSBDEB1XXX', 'N26 Bank SE',              'Klosterstraße 62, 10179 Berlin, Germany',            3)
on conflict do nothing;

-- Link default to DH if not yet set.
update public.business_settings
   set default_bank_account_id = (select id from public.bank_accounts where name = 'DH' limit 1)
 where id = 1 and default_bank_account_id is null;

alter table public.business_settings
  add constraint business_settings_default_bank_fk
  foreign key (default_bank_account_id)
  references public.bank_accounts(id)
  on delete set null;

alter table public.bank_accounts enable row level security;

drop policy if exists "ba_read" on public.bank_accounts;
create policy "ba_read" on public.bank_accounts
  for select using (auth.role() = 'authenticated');

drop policy if exists "ba_admin_write" on public.bank_accounts;
create policy "ba_admin_write" on public.bank_accounts
  for all using (public.is_admin()) with check (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- Clients — customers / partners you bill.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.clients (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  is_company      boolean not null default true,
  address_line1   text,
  address_line2   text,
  postal_code     text,
  city            text,
  country         text default 'Slovenija',
  tax_id          text,            -- davčna številka (if company)
  registration_id text,            -- matična številka (if company)
  email           text,
  phone           text,
  notes           text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_clients_name on public.clients(name);

alter table public.clients enable row level security;

drop policy if exists "clients_read" on public.clients;
create policy "clients_read" on public.clients
  for select using (auth.role() = 'authenticated');

drop policy if exists "clients_admin_write" on public.clients;
create policy "clients_admin_write" on public.clients
  for all using (public.is_admin()) with check (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- Invoices — header row. Numbering is per (type, year).
-- ─────────────────────────────────────────────────────────────

create table if not exists public.invoices (
  id                  uuid primary key default gen_random_uuid(),
  type                text not null check (type in ('invoice', 'proforma')),
  invoice_number      text unique not null,            -- "2025-001" or "P2025-001"
  sequence_year       int not null,                    -- 2025
  sequence_in_year    int not null,                    -- 1, 2, 3 …
  client_id           uuid not null references public.clients(id) on delete restrict,
  bank_account_id     uuid not null references public.bank_accounts(id) on delete restrict,
  issue_date          date not null default current_date,
  service_date        date not null default current_date,
  due_date            date not null,
  status              text not null default 'draft'
                          check (status in ('draft', 'sent', 'paid', 'cancelled')),
  subtotal            numeric(12, 2) not null default 0,
  discount_total      numeric(12, 2) not null default 0,
  total               numeric(12, 2) not null default 0,
  reference_number    text,                            -- "SI00 2025001"
  place_of_issue      text not null default 'Ljubljana',
  vat_notice          text,                            -- snapshot at issue time
  notes               text,
  paid_on             date,
  transaction_id      uuid references public.transactions(id) on delete set null,
  project_receipt_id  uuid references public.project_receipts(id) on delete set null,
  sent_at             timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_invoices_client     on public.invoices(client_id);
create index if not exists idx_invoices_status     on public.invoices(status);
create index if not exists idx_invoices_issue_date on public.invoices(issue_date);
create index if not exists idx_invoices_tx         on public.invoices(transaction_id);
create index if not exists idx_invoices_receipt    on public.invoices(project_receipt_id);

create unique index if not exists uq_invoices_seq
  on public.invoices(type, sequence_year, sequence_in_year);

alter table public.invoices enable row level security;

drop policy if exists "invoices_read" on public.invoices;
create policy "invoices_read" on public.invoices
  for select using (auth.role() = 'authenticated');

drop policy if exists "invoices_admin_write" on public.invoices;
create policy "invoices_admin_write" on public.invoices
  for all using (public.is_admin()) with check (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- Invoice lines — one row per item on the invoice.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.invoice_lines (
  id            uuid primary key default gen_random_uuid(),
  invoice_id    uuid not null references public.invoices(id) on delete cascade,
  position      int not null default 0,
  description   text not null,
  quantity      numeric(12, 3) not null default 1,
  unit          text default 'kos',
  unit_price    numeric(12, 2) not null default 0,
  discount_pct  numeric(5, 2) not null default 0,
  total         numeric(12, 2) not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists idx_invoice_lines_invoice on public.invoice_lines(invoice_id);

alter table public.invoice_lines enable row level security;

drop policy if exists "il_read" on public.invoice_lines;
create policy "il_read" on public.invoice_lines
  for select using (auth.role() = 'authenticated');

drop policy if exists "il_admin_write" on public.invoice_lines;
create policy "il_admin_write" on public.invoice_lines
  for all using (public.is_admin()) with check (public.is_admin());
