-- =============================================================================
-- 020: Job applicants entered by staff
-- =============================================================================
-- job_postings and job_applications have existed since schema.sql but nothing
-- wrote to them: the Job Postings page kept new vacancies in memory and showed
-- hardcoded demo candidates. Staff will now add applicants who apply by phone,
-- walk-in or social media. This makes the table fit that:
--
--   * notes: the recruiter's evaluation notes (the page already shows them).
--   * 'Shortlisted' stage: the page offers it, the old check rejected it.
--     Order: Applied -> Screened -> Shortlisted -> Interview -> Hired / Rejected.
--   * candidate_email optional: walk-in candidates often give only a phone.
--   * posted_date defaults to today in Dhaka, not UTC (same as the visitors
--     table in 017), so a job posted before 06:00 is not dated yesterday.
--
-- Permissions are unchanged: any staff member can read and write both tables
-- (migration 011). No public access.
--
-- Run after 019.

alter table public.job_applications add column if not exists notes text;

alter table public.job_applications alter column candidate_email drop not null;

alter table public.job_applications drop constraint if exists job_applications_status_check;
alter table public.job_applications add constraint job_applications_status_check
  check (status in ('Applied', 'Screened', 'Shortlisted', 'Interview', 'Hired', 'Rejected'));

alter table public.job_postings
  alter column posted_date set default ((now() at time zone 'Asia/Dhaka')::date);

create index if not exists idx_job_applications_job on public.job_applications(job_id);
