-- =============================================================================
-- 016: Emergency contact relationship and medical conditions on members
-- =============================================================================
-- The public admission form already collects both (admission_submissions.
-- emergency_relation / medical_conditions), but approval only copied the
-- emergency name and phone to the member. This adds the two columns to
-- members (same names as on the application), fills them for members who were
-- approved from an application, and makes create_member_with_invoice() copy
-- them from now on. Staff can edit both on the member's profile.
--
-- create_member_with_invoice() below is the 013 version with only the two new
-- columns added to the member insert; its parameters are unchanged, so the
-- existing grants stay in place.
--
-- Run after 015.

alter table public.members add column if not exists emergency_relation text;
alter table public.members add column if not exists medical_conditions text;

-- Existing members: copy from the application they were approved from.
update public.members m
set emergency_relation = coalesce(m.emergency_relation, s.emergency_relation),
    medical_conditions = coalesce(m.medical_conditions, s.medical_conditions)
from public.admission_submissions s
where s.id = m.submission_id
  and (m.emergency_relation is null or m.medical_conditions is null);

create or replace function public.create_member_with_invoice(
  p_plan_id          bigint,
  p_name             text default null,
  p_phone            text default null,
  p_email            text default null,
  p_gender           text default null,
  p_discount_type    text default 'flat',
  p_discount_value   numeric default 0,
  p_discount_reason  text default null,
  p_paid_amount      numeric default null,
  p_payment_method   text default 'CASH',
  p_trainer_id       bigint default null,
  p_locker_id        bigint default null,
  p_avatar           text default null,
  p_submission_id    bigint default null,
  p_due_date         date default null,
  p_notes            text default null,
  p_start_date       date default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_staff_id     bigint := public.current_staff_id();
  v_role         public.roles%rowtype;
  v_plan         public.plans%rowtype;
  v_sub          public.admission_submissions%rowtype;
  v_locker       public.lockers%rowtype;
  v_today        date := (now() at time zone 'Asia/Dhaka')::date;
  v_start        date := coalesce(p_start_date, (now() at time zone 'Asia/Dhaka')::date);
  v_first        text;
  v_last         text;
  v_parts        text[];
  v_method       text := public.normalize_payment_method(p_payment_method);
  v_disc_type    text := coalesce(p_discount_type, 'flat');
  v_disc_value   numeric := coalesce(p_discount_value, 0);
  v_disc_amount  numeric(10, 2) := 0;
  v_net          numeric(10, 2);
  v_paid         numeric(10, 2);
  v_due          numeric(10, 2);
  v_member_id    bigint;
  v_member_code  text;
  v_discount_id  bigint;
  v_invoice_id   bigint;
  v_invoice_no   text;
begin
  if v_staff_id is null then
    raise exception 'Your account is not allowed to add members.' using errcode = '42501';
  end if;
  select r.* into v_role
  from public.users u join public.roles r on r.id = u.role_id
  where u.id = v_staff_id;

  if v_method is null then
    raise exception 'Select a valid payment method.';
  end if;

  -- Membership may start up to 30 days back (late approvals) or 90 days ahead.
  if v_start < v_today - 30 or v_start > v_today + 90 then
    raise exception 'Start date must be within 30 days before or 90 days after today.';
  end if;

  select * into v_plan from public.plans where id = p_plan_id and status = 'Active';
  if not found then
    raise exception 'Select an active membership plan.';
  end if;

  -- Personal details: from the submission when approving, else from params.
  if p_submission_id is not null then
    select * into v_sub from public.admission_submissions where id = p_submission_id for update;
    if not found then
      raise exception 'Application not found.';
    end if;
    if v_sub.status <> 'Pending' then
      raise exception 'This application was already reviewed. Refresh the list.';
    end if;
    v_first := v_sub.first_name;
    v_last := v_sub.last_name;
  else
    if char_length(trim(coalesce(p_name, ''))) not between 2 and 120 then
      raise exception 'Enter the member''s name.';
    end if;
    if char_length(trim(coalesce(p_phone, ''))) not between 6 and 30 then
      raise exception 'Enter a valid phone number.';
    end if;
    -- Same split as splitName() in src/lib/supabaseData.js
    v_parts := regexp_split_to_array(trim(p_name), '\s+');
    v_first := v_parts[1];
    v_last := coalesce(nullif(array_to_string(v_parts[2:], ' '), ''), v_parts[1]);
  end if;

  -- Discount: same formula as calculatePricing() in GymDataContext.
  if v_disc_type not in ('percentage', 'flat') then
    raise exception 'Invalid discount type.';
  end if;
  if v_disc_value < 0 then
    raise exception 'Discount cannot be negative.';
  end if;
  if v_disc_type = 'percentage' then
    v_disc_amount := v_plan.base_price * least(v_disc_value, 100) / 100;
  else
    v_disc_amount := least(v_disc_value, v_plan.base_price);
  end if;

  if v_disc_amount > 0 then
    if not public.staff_can('discount') then
      raise exception 'Your role is not allowed to apply discounts.' using errcode = '42501';
    end if;
    if v_role.name <> 'Super Admin'
       and v_disc_amount > v_plan.base_price * coalesce(v_role.max_discount_percentage, 0) / 100 then
      raise exception 'Discount exceeds your role limit of % percent.', coalesce(v_role.max_discount_percentage, 0);
    end if;
  end if;

  -- Admission invoices are VAT-free (matches vatPercent: 0 in the UI).
  v_net := round(v_plan.base_price - v_disc_amount);
  v_paid := coalesce(p_paid_amount, v_net);
  if v_paid < 0 or v_paid > v_net then
    raise exception 'Paid amount must be between 0 and %.', v_net;
  end if;
  v_due := v_net - v_paid;

  if p_trainer_id is not null and not exists (select 1 from public.trainers where id = p_trainer_id) then
    raise exception 'Selected trainer was not found.';
  end if;

  if p_locker_id is not null then
    if not public.staff_can('lockers') then
      raise exception 'Your role is not allowed to assign lockers.' using errcode = '42501';
    end if;
    select * into v_locker from public.lockers where id = p_locker_id for update;
    if not found or v_locker.status <> 'Available' then
      raise exception 'That locker is no longer available. Refresh and choose another.';
    end if;
  end if;

  -- Member (the submission trigger marks the application Approved).
  insert into public.members (
    submission_id, first_name, last_name, email, phone, gender, dob, address,
    blood_group, height, weight, plan, branch, trainer_id, locker_id, avatar,
    status, joined, expiry, visits, emergency_name, emergency_phone,
    emergency_relation, medical_conditions
  )
  values (
    p_submission_id,
    v_first,
    v_last,
    case when p_submission_id is null then nullif(trim(coalesce(p_email, '')), '') else v_sub.email end,
    case when p_submission_id is null then trim(p_phone) else v_sub.phone end,
    case when p_submission_id is null then p_gender else initcap(v_sub.gender) end,
    v_sub.date_of_birth,
    v_sub.address,
    v_sub.blood_group,
    v_sub.height,
    v_sub.weight,
    v_plan.name,
    v_sub.branch,
    p_trainer_id,
    p_locker_id,
    coalesce(p_avatar, v_sub.avatar),
    'Active',
    v_start,
    v_start + coalesce(v_plan.duration_days, 30),
    0,
    v_sub.emergency_name,
    v_sub.emergency_phone,
    v_sub.emergency_relation,
    v_sub.medical_conditions
  )
  returning id into v_member_id;

  select member_code into v_member_code from public.members where id = v_member_id;

  if v_disc_amount > 0 then
    insert into public.discounts (discount_type, discount_value, discount_amount, reason_note, applied_by)
    values (v_disc_type, v_disc_value, v_disc_amount, coalesce(nullif(trim(p_discount_reason), ''), 'Discount'), v_staff_id)
    returning id into v_discount_id;
  end if;

  -- 'N' keeps server-generated numbers distinct from legacy client-made ones.
  v_invoice_no := 'INV-' || to_char(v_today, 'YYYY') || '-N' || lpad(nextval('public.invoice_number_seq')::text, 6, '0');

  insert into public.invoices (
    invoice_number, member_id, plan_id, discount_id,
    base_amount, discount_amount, tax_amount, net_payable,
    paid_amount, due_amount, payment_status, payment_method,
    invoice_date, due_date, notes
  )
  values (
    v_invoice_no, v_member_id, v_plan.id, v_discount_id,
    v_plan.base_price, v_disc_amount, 0, v_net,
    v_paid, v_due,
    case when v_due = 0 then 'Paid' when v_paid > 0 then 'Partial' else 'Due' end,
    v_method,
    v_today,
    case when v_due > 0 then p_due_date end,
    nullif(trim(coalesce(p_notes, '')), '')
  )
  returning id into v_invoice_id;

  if v_paid > 0 then
    insert into public.payments (invoice_id, member_id, plan, amount, method, status, collected_by)
    values (v_invoice_id, v_member_id, v_plan.name, v_paid, v_method, 'Paid', v_staff_id);
  end if;

  if p_locker_id is not null then
    update public.lockers set status = 'Occupied' where id = p_locker_id;
    insert into public.locker_assignments (locker_id, member_id, expiry_date)
    values (p_locker_id, v_member_id, v_start + coalesce(v_plan.duration_days, 30));
  end if;

  return jsonb_build_object(
    'member_id', v_member_id,
    'member_code', v_member_code,
    'invoice_id', v_invoice_id,
    'invoice_number', v_invoice_no,
    'base_amount', v_plan.base_price,
    'discount_amount', v_disc_amount,
    'net_payable', v_net,
    'paid_amount', v_paid,
    'due_amount', v_due
  );
end;
$$;
