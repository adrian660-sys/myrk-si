-- PM category catalog (editable in Settings). Transactions still store category/subcategory as text.
-- Drops rigid CHECK constraints so new category names from Settings are allowed.

create table if not exists public.pm_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.pm_subcategories (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.pm_categories(id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now(),
  unique (category_id, name)
);

create index if not exists idx_pm_subcategories_category on public.pm_subcategories(category_id);

-- Seed defaults (matches former constants.ts)
insert into public.pm_categories (name, sort_order) values
  ('Income', 1),
  ('Business', 2),
  ('Travel', 3),
  ('Transfer', 4)
on conflict (name) do nothing;

insert into public.pm_subcategories (category_id, name)
select c.id, s.name
from public.pm_categories c
cross join (values
  ('Income', 'Balance'),
  ('Income', 'Research Payment'),
  ('Business', 'Health Contribution'),
  ('Business', 'Social Contribution'),
  ('Business', 'Tax'),
  ('Business', 'Accounting'),
  ('Business', 'Banking'),
  ('Travel', 'Transport'),
  ('Travel', 'Accommodation'),
  ('Travel', 'Per Diem'),
  ('Travel', 'Remote Work'),
  ('Travel', 'Miscellaneous')
) as s(cat, name)
where c.name = s.cat
on conflict (category_id, name) do nothing;

-- Allow any category name on existing PM tables (validated in app + catalog).
alter table public.transactions drop constraint if exists transactions_category_check;
alter table public.planned_transactions drop constraint if exists planned_transactions_category_check;

alter table public.pm_categories enable row level security;
alter table public.pm_subcategories enable row level security;

drop policy if exists "pm_catalog_admin_all" on public.pm_categories;
create policy "pm_catalog_admin_all" on public.pm_categories
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "pm_catalog_admin_all" on public.pm_subcategories;
create policy "pm_catalog_admin_all" on public.pm_subcategories
  for all using (public.is_admin()) with check (public.is_admin());

-- Guests may read catalog (for dropdowns) but not edit.
drop policy if exists "pm_catalog_read" on public.pm_categories;
create policy "pm_catalog_read" on public.pm_categories
  for select using (auth.role() = 'authenticated');

drop policy if exists "pm_catalog_read" on public.pm_subcategories;
create policy "pm_catalog_read" on public.pm_subcategories
  for select using (auth.role() = 'authenticated');
