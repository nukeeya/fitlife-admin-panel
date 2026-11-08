-- =============================================================================
-- 024: Send a member to the door machine from the app
-- =============================================================================
-- send_member_to_machine() gives the member a machine user number, links it, and
-- queues two commands: create the user, and allow them through the door. Staff
-- then capture the face on the machine. Both commands were proven on our
-- SenseFace 3A on 8 Nov 2026.
--
-- Starting the face scan remotely is deliberately left out: the machine showed
-- the screen and said "success" but saved no face.
--
--   * Automatic numbers start at 1000, above numbers typed in on the machine,
--     and skip any number the machine has already reported.
--   * Clicking twice queues nothing extra. A send that failed or expired can be
--     repeated with the same number.
--   * A member already on the machine is refused: resending would blank a card
--     added there.
--
-- Needs the approve-members permission (Super Admin included), because this
-- gives someone door access. Expired or inactive members are refused.
--
-- Run after 023.

begin;

alter table public.device_commands
  add column if not exists member_id bigint references public.members(id) on delete set null;

create index if not exists idx_device_commands_member on public.device_commands(member_id);

create or replace function public.send_member_to_machine(p_member_id bigint)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_member  record;
  v_pin     text;
  v_name    text;
  v_device  record;
  v_queued  int := 0;
  v_pending int := 0;
begin
  if not public.staff_can('approve_members') then
    raise exception 'Your role is not allowed to give door access.' using errcode = '42501';
  end if;

  -- One at a time, so two sends can't pick the same number.
  perform pg_advisory_xact_lock(hashtextextended('device-user-numbers', 0));

  select id, first_name, last_name, status, device_user_id
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

  if v_member.device_user_id is not null
     and not exists (select 1 from public.device_commands where member_id = p_member_id) then
    raise exception 'This member is already linked to a machine user.';
  end if;

  if not exists (select 1 from public.devices where enabled) then
    raise exception 'No door machine is enabled.';
  end if;

  v_pin := coalesce(v_member.device_user_id, (
    select (greatest(999, coalesce(max(n), 0)) + 1)::text
      from (
        select device_user_id::bigint as n from public.members where device_user_id is not null
        union all
        select device_user_id::bigint from public.device_punches
      ) used
  ));

  -- Tabs and line breaks would corrupt the command, so they can't be in the name.
  v_name := left(btrim(regexp_replace(
    concat_ws(' ', v_member.first_name, v_member.last_name), '[[:cntrl:]]+', ' ', 'g'
  )), 24);

  for v_device in select id from public.devices where enabled order by id loop
    if exists (
      select 1 from public.device_commands
       where member_id = p_member_id
         and device_id = v_device.id
         and (status = 'queued' or (status = 'sent' and sent_at > now() - interval '5 minutes'))
    ) then
      v_pending := v_pending + 1;
      continue;
    end if;

    continue when v_member.device_user_id is not null and (
      select count(*) from public.device_commands
       where member_id = p_member_id and device_id = v_device.id and status = 'done'
    ) >= 2;

    insert into public.device_commands (device_id, member_id, command)
    values
      (v_device.id, p_member_id, format(
        E'DATA UPDATE user CardNo=\tPin=%s\tPassword=\tGroup=1\tStartTime=0\tEndTime=0\tName=%s\tPrivilege=0',
        v_pin, v_name
      )),
      (v_device.id, p_member_id, format(
        E'DATA UPDATE userauthorize Pin=%s\tAuthorizeTimezoneId=1\tAuthorizeDoorId=1',
        v_pin
      ));
    v_queued := v_queued + 1;
  end loop;

  if v_queued = 0 and v_pending = 0 then
    raise exception 'This member is already on the machine.';
  end if;

  update public.members
     set device_user_id = v_pin
   where id = p_member_id
     and device_user_id is distinct from v_pin;

  return v_pin;
end;
$$;

revoke all on function public.send_member_to_machine(bigint) from public, anon;
grant execute on function public.send_member_to_machine(bigint) to authenticated;

commit;
