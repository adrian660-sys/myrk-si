-- Link each import_logs row to the batch of transactions it created, so the
-- UI can offer a one-click "undo this import" action.

alter table public.import_logs
  add column if not exists import_batch_id uuid;

create index if not exists idx_import_logs_batch on public.import_logs(import_batch_id);
