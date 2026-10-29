-- =============================================================================
-- 015: Renew a membership (invoice + first payment + new expiry, all at once)
-- =============================================================================
-- renew_membership() is the renewal version of create_member_with_invoice():
-- same price, discount and role rules, but for an existing member. Everything
-- happens in one transaction, so a failure saves nothing.
--
-- - Start date: by default the day the current membership expires, or today
--   if it has already expired. Staff may choose another day, from 30 days back
--   up to 90 days after that default.
-- - Price comes from the plan; any reduction must be a discount (role limit).
-- - No VAT, same as admission.
-- - The invoice's service_start is the membership start (see 014), so the
--   monthly revenue split covers the right months.
-- - The member's plan, expiry and status are updated. Lockers are not touched.
--
-- Run after 014.

create or replace function public.renew_membership(
  p_member_id        bigint,
  p_plan_id          bigint,
  p_start_date       date default null,
  p_discount_type    text default 'flat',
  p_discount_value   numeric default 0,
  p_discount_reason  text default null,
  p_paid_amount      numeric default null,
  p_payment_method   text default 'CASH',
  p_due_date         date default null,
  p_notes            text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_staff_id     bigint := public.current_staff_id();
  v_role         public.roles%rowtype;
  v_member       public.members%rowtype;
  v_plan         public.plans%rowtype;
  v_today        date := (now() at time zone 'Asia/Dhaka')::date;
  v_default      date;
  v_start        date;
  v_expiry       date;
  v_method       text := public.normalize_payment_method(p_payment_method);
  v_disc_type    text := coalesce(p_discount_type, 'flat');
  v_disc_value   numeric := coalesce(p_discount_value, 0);
  v_disc_amount  numeric(10, 2) := 0;
  v_net          numeric(10, 2);
  v_paid         numeric(10, 2);
  v_due          numeric(10, 2);
  v_discount_id  bigint;
  v_invoice_id   bigint;
  v_invoice_no   text;
begin
  if v_staff_id is null then
    raise exception 'Your account is not allowed to renew memberships.' using errcode = '42501';
  end if;
  select r.* into v_role
  from public.users u join public.roles r on r.id = u.role_id
  where u.id = v_staff_id;

  if v_method is null then
    raise exception 'Select a valid payment method.';
  end if;

  -- Lock the member so two renewals at the same moment cannot both apply.
  select * into v_member from public.members where id = p_member_id for update;
  if not found then
    raise exception 'Member not found.';
  end if;

  select * into v_plan from public.plans where id = p_plan_id and status = 'Active';
  if not found then
    raise exception 'Select an active membership plan.';
  end if;

  -- Continue from the current expiry if it is still running, else from today.
  v_default := greatest(coalesce(v_member.expiry, v_today), v_today);
  v_start := coalesce(p_start_date, v_default);
  if v_start < v_today - 30 or v_start > v_default + 90 then
    raise exception 'Start date must be between % and %.', v_today - 30, v_default + 90;
  end if;

  v_expiry := v_start + coalesce(v_plan.duration_days, 30);
  if v_member.expiry is not null and v_expiry <= v_member.expiry then
    raise exception 'This renewal would end on %, which is not after the current expiry (%).', v_expiry, v_member.expiry;
  end if;

  -- Discount: same formula and limits as create_member_with_invoice().
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

  -- VAT-free, same as admission.
  v_net := round(v_plan.base_price - v_disc_amount);
  v_paid := coalesce(p_paid_amount, v_net);
  if v_paid < 0 or v_paid > v_net then
    raise exception 'Paid amount must be between 0 and %.', v_net;
  end if;
  v_due := v_net - v_paid;

  if v_disc_amount > 0 then
    insert into public.discounts (discount_type, discount_value, discount_amount, reason_note, applied_by)
    values (v_disc_type, v_disc_value, v_disc_amount, coalesce(nullif(trim(p_discount_reason), ''), 'Discount'), v_staff_id)
    returning id into v_discount_id;
  end if;

  v_invoice_no := 'INV-' || to_char(v_today, 'YYYY') || '-N' || lpad(nextval('public.invoice_number_seq')::text, 6, '0');

  insert into public.invoices (
    invoice_number, member_id, plan_id, discount_id,
    base_amount, discount_amount, tax_amount, net_payable,
    paid_amount, due_amount, payment_status, payment_method,
    invoice_date, due_date, notes, service_start
  )
  values (
    v_invoice_no, v_member.id, v_plan.id, v_discount_id,
    v_plan.base_price, v_disc_amount, 0, v_net,
    v_paid, v_due,
    case when v_due = 0 then 'Paid' when v_paid > 0 then 'Partial' else 'Due' end,
    v_method,
    v_today,
    case when v_due > 0 then p_due_date end,
    nullif(trim(coalesce(p_notes, '')), ''),
    v_start
  )
  returning id into v_invoice_id;

  if v_paid > 0 then
    insert into public.payments (invoice_id, member_id, plan, amount, method, status, collected_by)
    values (v_invoice_id, v_member.id, v_plan.name, v_paid, v_method, 'Paid', v_staff_id);
  end if;

  update public.members
     set plan = v_plan.name,
         expiry = v_expiry,
         status = 'Active'
   where id = v_member.id;

  return jsonb_build_object(
    'member_id', v_member.id,
    'invoice_id', v_invoice_id,
    'invoice_number', v_invoice_no,
    'start_date', v_start,
    'expiry', v_expiry,
    'base_amount', v_plan.base_price,
    'discount_amount', v_disc_amount,
    'net_payable', v_net,
    'paid_amount', v_paid,
    'due_amount', v_due
  );
end;
$$;

revoke all on function public.renew_membership(
  bigint, bigint, date, text, numeric, text, numeric, text, date, text
) from public, anon;
grant execute on function public.renew_membership(
  bigint, bigint, date, text, numeric, text, numeric, text, date, text
) to authenticated;
