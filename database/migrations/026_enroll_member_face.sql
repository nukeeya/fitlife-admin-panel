-- =============================================================================
-- 026: One-click face enrollment from the app
-- =============================================================================
-- enroll_member_face() creates the member on the machine if needed, gives them
-- door access, links them, and starts the face scan on the machine. Proven on
-- our SenseFace 3A on 8 Nov 2026.
--
-- The machine says "success" and reports the scan as done even when no face was
-- stored, so face_saved_at is only set once the machine has accepted the face
-- returned to it (migration 025). That is what the app shows as "saved".
--
-- Scans start on the first enabled machine. Same permission and member rules as
-- send_member_to_machine().
--
-- Run after 025.

begin;

alter table public.device_commands
  add column if not exists enroll_member_id bigint references public.members(id) on delete set null,
  add column if not exists parent_command_id bigint references public.device_commands(id) on delete set null,
  add column if not exists face_saved_at timestamptz;

create index if not exists idx_device_commands_enroll_member on public.device_commands(enroll_member_id);

-- Same as 025, and remembers which scan the face belongs to.
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
  v_scan_id   bigint;
begin
  select id into v_device_id
    from public.devices
   where serial_number = p_serial and enabled;

  if v_device_id is null then
    return false;
  end if;

  select id into v_scan_id
    from public.device_commands
   where device_id = v_device_id
     and status in ('sent', 'done')
     and sent_at > now() - interval '5 minutes'
     and command like 'ENROLL_BIO %'
     and position(E'\tPIN=' || p_pin || E'\t' in command) > 0
   order by id desc
   limit 1;

  if v_scan_id is null then
    return false;
  end if;

  insert into public.device_commands (device_id, command, sensitive, parent_command_id)
  values (v_device_id, p_command, true, v_scan_id);

  return true;
end;
$$;

-- Same as 023, and marks the scan saved when its face is accepted.
create or replace function public.record_device_command_result(
  p_serial      text,
  p_command_id  bigint,
  p_return_code int
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_parent_id bigint;
begin
  update public.device_commands c
     set status      = case when p_return_code = 0 then 'done' else 'failed' end,
         return_code = p_return_code,
         finished_at = now()
    from public.devices d
   where c.id = p_command_id
     and c.device_id = d.id
     and d.serial_number = p_serial
     and c.status = 'sent'
  returning c.parent_command_id into v_parent_id;

  if v_parent_id is not null and p_return_code = 0 then
    update public.device_commands set face_saved_at = now() where id = v_parent_id;
  end if;
end;
$$;

create or replace function public.enroll_member_face(p_member_id bigint)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_member    record;
  v_pin       text;
  v_device_id bigint;
begin
  if not public.staff_can('approve_members') then
    raise exception 'Your role is not allowed to give door access.' using errcode = '42501';
  end if;

  select id, status, device_user_id
    into v_member
    from public.members
   where id = p_member_id
     for update;

  if not found then
    raise exception 'Member not found.';
  end if;

  if v_member.status in ('Expired', 'Inactive') then
    raise exception 'This membership is not active, so it can''t be given door access.';
  end if;

  select id into v_device_id
    from public.devices
   where enabled
   order by id
   limit 1;

  if v_device_id is null then
    raise exception 'No door machine is enabled.';
  end if;

  v_pin := v_member.device_user_id;

  -- Create them unless they're already on the machine. A manually linked member
  -- has no commands, and exists there already.
  if v_pin is null or (
    exists (select 1 from public.device_commands where member_id = p_member_id)
    and (select count(*) from public.device_commands where member_id = p_member_id and status = 'done') < 2
  ) then
    v_pin := public.send_member_to_machine(p_member_id);
  end if;

  -- Clicking twice doesn't start a second scan.
  if exists (
    select 1 from public.device_commands
     where enroll_member_id = p_member_id
       and device_id = v_device_id
       and (status = 'queued' or (status = 'sent' and sent_at > now() - interval '2 minutes'))
  ) then
    return v_pin;
  end if;

  insert into public.device_commands (device_id, enroll_member_id, command)
  values (v_device_id, p_member_id, format(E'ENROLL_BIO TYPE=9\tNO=0\tPIN=%s\tRETRY=3\tOVERWRITE=1', v_pin));

  return v_pin;
end;
$$;

revoke all on function public.enroll_member_face(bigint) from public, anon;
grant execute on function public.enroll_member_face(bigint) to authenticated;

commit;
