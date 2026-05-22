-- Seed data for local testing. Run after 0001_initial_schema.sql.

insert into public.trips (id, name, city, start_date, end_date, notes) values
  ('11111111-1111-1111-1111-111111111111', 'Zurich 2',   'Zurich',     '2025-02-03', '2025-02-07', 'Second Zurich trip'),
  ('22222222-2222-2222-2222-222222222222', 'Stockholm',  'Stockholm',  '2025-03-10', '2025-03-14', 'Spring research visit')
on conflict (id) do nothing;

insert into public.cash_received (trip_id, amount, date, notes) values
  ('11111111-1111-1111-1111-111111111111', 3800, '2025-02-03', 'Fresh cash Zurich 2'),
  ('22222222-2222-2222-2222-222222222222', 2000, '2025-03-10', 'Fresh cash Stockholm')
on conflict do nothing;

insert into public.transactions
  (date, description, funding_source, category, subcategory, amount, bill_status, trip_id, import_source) values
  ('2025-02-15', 'Research Payment — February', 'DH',      'Income',   'Research Payment',  2400,  '/',     null, 'manual'),
  ('2025-02-05', 'Hotel Zurich 4 nights',       'Cash',    'Travel',   'Accommodation',     -215,  '📎 Bill','11111111-1111-1111-1111-111111111111', 'manual'),
  ('2025-03-12', 'Train tickets Stockholm',     'Revolut', 'Travel',   'Transport',         -88,   '📎 Bill','22222222-2222-2222-2222-222222222222', 'manual'),
  (null,         'Accountant invoice Q1',       'DH',      'Business', 'Accounting',        -120,  '',      null, 'manual')
on conflict do nothing;
