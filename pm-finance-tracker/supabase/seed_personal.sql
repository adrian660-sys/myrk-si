-- Optional seed for personal_* tables (admin user must run migration 0006 first).

insert into public.personal_funding_sources (name) values
  ('Cash'),
  ('Revolut'),
  ('Bank Account'),
  ('Credit Card')
on conflict (name) do nothing;

insert into public.personal_categories (name, type) values
  ('Salary', 'income'),
  ('Other Income', 'income'),
  ('Housing', 'expense'),
  ('Food', 'expense'),
  ('Transport', 'expense'),
  ('Shopping', 'expense'),
  ('Health', 'expense'),
  ('Entertainment', 'expense'),
  ('Bills & Subscriptions', 'expense'),
  ('Other', 'expense'),
  ('Transfer', 'transfer')
on conflict (name, type) do nothing;

insert into public.personal_subcategories (category_id, name)
select c.id, s.name
from public.personal_categories c
cross join (values ('Rent'), ('Utilities'), ('Insurance')) as s(name)
where c.name = 'Housing' and c.type = 'expense'
on conflict (category_id, name) do nothing;

insert into public.personal_subcategories (category_id, name)
select c.id, s.name
from public.personal_categories c
cross join (values ('Groceries'), ('Restaurants'), ('Coffee')) as s(name)
where c.name = 'Food' and c.type = 'expense'
on conflict (category_id, name) do nothing;
