-- Receipts storage bucket + receipt_path on transactions.

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

drop policy if exists "receipts_read"   on storage.objects;
create policy "receipts_read" on storage.objects
  for select using (bucket_id = 'receipts' and auth.role() = 'authenticated');

drop policy if exists "receipts_insert" on storage.objects;
create policy "receipts_insert" on storage.objects
  for insert with check (bucket_id = 'receipts' and public.is_admin());

drop policy if exists "receipts_delete" on storage.objects;
create policy "receipts_delete" on storage.objects
  for delete using (bucket_id = 'receipts' and public.is_admin());

alter table public.transactions
  add column if not exists receipt_path text;
