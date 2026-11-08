-- =============================================================================
-- 025: Return a remotely scanned face to the door machine
-- =============================================================================
-- After a remote scan (ENROLL_BIO) the machine uploads the face template and
-- doesn't keep it. The server has to send it back for the machine to store.
--
-- This is the only place face data touches the server, approved by the owner on
-- 8 Nov 2026 under these rules:
--
--   * Only the template, never the photo.
--   * Accepted only for a scan the server requested in the last 5 minutes.
--   * Erased the moment it is handed to the machine.
--   * Undelivered templates are erased within 10 minutes (scheduled job), even
--     if the machine goes offline.
--   * Staff can't read these rows. Never logged.
--
-- Run after 024.

begin;

alter table public.device_commands
  add column if not exists sensitive boolean not null default false;

-- Staff can no longer see sensitive rows.
drop policy if exists "staff read device commands" on public.device_commands;
create policy "staff read device commands" on public.device_commands
  for select to authenticated using (public.is_staff() and not sensitive);

-- Queue a template to go back. False if no matching scan was requested.
create or replace function public.queue_face_template_return(
  p_serial  text,
  p_pin     text,
  p_command text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_device_id bigint;
begin
  select id into v_device_id
    from public.devices
   where serial_number = p_serial and enabled;

  if v_device_id is null or not exists (
    select 1 from public.device_commands
     where device_id = v_device_id
       and status in ('sent', 'done')
       and sent_at > now() - interval '5 minutes'
       and command like 'ENROLL_BIO %'
       and position(E'\tPIN=' || p_pin || E'\t' in command) > 0
  ) then
    return false;
  end if;

  insert into public.device_commands (device_id, command, sensitive)
  values (v_device_id, p_command, true);

  return true;
end;
$$;

-- Same as 023, and a sensitive command is erased as it is handed over.
create or replace function public.next_device_command(p_serial text)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_device_id bigint;
  v_id        bigint;
  v_command   text;
begin
  select id into v_device_id
    from public.devices
   where serial_number = p_serial and enabled;

  if v_device_id is null then
    return null;
  end if;

  update public.device_commands
     set status      = 'expired',
         finished_at = now(),
         command     = case when sensitive then '[erased]' else command end
   where device_id = v_device_id
     and status = 'queued'
     and created_at < now() - interval '10 minutes';

  if exists (
    select 1 from public.device_commands
     where device_id = v_device_id
       and status = 'sent'
       and sent_at > now() - interval '2 minutes'
  ) then
    return null;
  end if;

  select id, command into v_id, v_command
    from public.device_commands
   where device_id = v_device_id and status = 'queued'
   order by id
   limit 1
   for update skip locked;

  if v_id is null then
    return null;
  end if;

  update public.device_commands
     set status  = 'sent',
         sent_at = now(),
         command = case when sensitive then '[erased]' else command end
   where id = v_id;

  return format('C:%s:%s', v_id, v_command);
end;
$$;

-- Runs every minute, so nothing undelivered survives past 10 minutes.
create or replace function public.erase_stale_face_templates()
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update public.device_commands
     set status = 'expired', finished_at = now(), command = '[erased]'
   where sensitive
     and status = 'queued'
     and created_at < now() - interval '9 minutes';
$$;

revoke all on function public.queue_face_template_return(text, text, text) from public, anon, authenticated;
revoke all on function public.erase_stale_face_templates() from public, anon, authenticated;
grant execute on function public.queue_face_template_return(text, text, text) to service_role;

do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.schedule(
      'erase-stale-face-templates',
      '* * * * *',
      'select public.erase_stale_face_templates()'
    );
  end if;
end;
$$;

commit;

-- Check (should return one row):
--   select jobname, schedule, active from cron.job where jobname = 'erase-stale-face-templates';
