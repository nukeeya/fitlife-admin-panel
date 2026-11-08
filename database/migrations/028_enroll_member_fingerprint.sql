-- =============================================================================
-- 028: One-click fingerprint enrollment from the app
-- =============================================================================
-- Same flow as face enrollment (026), with the owner's approval on 8 Nov 2026
-- for fingerprint templates to be handled under the rules in 025: erased on
-- delivery or within 10 minutes, never logged, unreadable by staff.
--
-- Also removes the temporary notes from 027.
--
-- Run after 027.

begin;

create or replace function public.queue_member_enrollment(
  p_member_id bigint,
  p_type      int,
  p_no        int
)
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
  values (
    v_device_id, p_member_id,
    format(E'ENROLL_BIO TYPE=%s\tNO=%s\tPIN=%s\tRETRY=3\tOVERWRITE=1', p_type, p_no, v_pin)
  );

  return v_pin;
end;
$$;

create or replace function public.enroll_member_face(p_member_id bigint)
returns text
language sql
security definer
set search_path = public, pg_temp
as $$
  select public.queue_member_enrollment(p_member_id, 9, 0);
$$;

-- p_finger is 0 to 9, the machine's finger slot.
create or replace function public.enroll_member_fingerprint(p_member_id bigint, p_finger int default 6)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_finger is null or p_finger not between 0 and 9 then
    raise exception 'Choose a finger from the list.';
  end if;

  return public.queue_member_enrollment(p_member_id, 1, p_finger);
end;
$$;

revoke all on function public.queue_member_enrollment(bigint, int, int) from public, anon, authenticated;
revoke all on function public.enroll_member_fingerprint(bigint, int) from public, anon;
grant execute on function public.enroll_member_fingerprint(bigint, int) to authenticated;

drop function if exists public.note_bio_upload(text);
drop table if exists public.device_bio_upload_notes;

commit;
