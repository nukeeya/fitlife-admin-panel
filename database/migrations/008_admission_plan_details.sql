-- Store structured display/package selections separately from the canonical plan slug.
alter table public.admission_submissions
  add column if not exists plan_details jsonb not null default '{}'::jsonb;
