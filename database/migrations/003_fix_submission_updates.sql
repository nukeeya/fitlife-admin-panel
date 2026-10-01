-- =============================================================================
-- 003_fix_submission_updates.sql — make approve/reject writes actually persist
--
-- WHY: both "Approve" and "Reject" end in an UPDATE on public.admission_submissions,
-- and those updates were failing in the LIVE database, so applications never
-- left the Pending tab (the frontend rolls the optimistic change back).
--
-- Root cause found by read-only REST probe (1 Oct 2026):
--   * schema.sql attaches trigger trg_submissions_updated_at
--     (BEFORE UPDATE -> set_updated_at(), which runs `new.updated_at = now()`)
--   * public.admission_submissions had NO updated_at column in the live DB,
--     so every UPDATE errored with: record "new" has no field "updated_at"
--   * defense-in-depth: re-assert the RLS policies/grants the flow also needs
--     (in case only part of 002_live_sync.sql was run).
--
-- Idempotent: safe to run more than once. Run in the Supabase SQL Editor.
-- =============================================================================

-- 1. Give the table the column its update trigger expects
alter table public.admission_submissions
  add column if not exists updated_at timestamptz default now();

-- 2. Make sure the trigger function and trigger exist and are consistent
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_submissions_updated_at on public.admission_submissions;
create trigger trg_submissions_updated_at
  before update on public.admission_submissions
  for each row execute function public.set_updated_at();

-- 3. Staff read/update on submissions (approve & reject flow) + public form insert
drop policy if exists "anon insert admissions" on public.admission_submissions;
create policy "anon insert admissions"
  on public.admission_submissions
  for insert to anon
  with check (true);

drop policy if exists "authenticated all on admission_submissions" on public.admission_submissions;
create policy "authenticated all on admission_submissions"
  on public.admission_submissions
  for all to authenticated
  using (true) with check (true);

-- 4. Grants (no-op if already granted)
grant all on public.admission_submissions to authenticated;
grant insert on public.admission_submissions to anon;
grant usage, select on all sequences in schema public to authenticated;
