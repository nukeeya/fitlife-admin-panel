-- =============================================================================
-- 019: Sell a day pass to a visitor (invoice + payment, all at once)
-- =============================================================================
-- sell_day_pass() is the visitor version of renew_membership(): one
-- transaction creates a paid invoice and its payment, linked to the visitor
-- (see 018). Finance and the Dashboard count the payment like any other.
--
-- - Any active staff member can sell a pass (front desk), same as renewals.
-- - Price comes from the plan, which must be an active day-pass package.
--   No discounts, no VAT, no partial payment: a day pass is paid in full.
-- - One pass per visit: a visitor row that already has an invoice is refused.
-- - service_start is the visit date, so the revenue lands on the day of the
--   visit even if the sale is recorded a day later.
-- - The visit becomes a One-Day Trial; an Inquiry becomes Checked In.
--
-- Run after 018.

create or replace function public.sell_day_pass(
  p_visitor_id      bigint,
  p_plan_id         bigint,
  p_payment_method  text default 'CASH',
  p_notes           text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_staff_id    bigint := public.current_staff_id();
  v_visitor     public.visitors%rowtype;
  v_plan        public.plans%rowtype;
  v_today       date := (now() at time zone 'Asia/Dhaka')::date;
  v_method      text := public.normalize_payment_method(p_payment_method);
  v_invoice_id  bigint;
  v_invoice_no  text;
begin
  if v_staff_id is null then
    raise exception 'Your account is not allowed to sell day passes.' using errcode = '42501';
  end if;

  if v_method is null then
    raise exception 'Select a valid payment method.';
  end if;

  -- Lock the visit so two sales at the same moment cannot both apply.
  select * into v_visitor from public.visitors where id = p_visitor_id for update;
  if not found then
    raise exception 'Visitor not found.';
  end if;

  if exists (select 1 from public.invoices where visitor_id = v_visitor.id) then
    raise exception 'A day pass has already been sold for this visit.';
  end if;

  select * into v_plan
  from public.plans
  where id = p_plan_id and status = 'Active' and kind = 'day_pass';
  if not found then
    raise exception 'Select an active day-pass package.';
  end if;

  v_invoice_no := 'INV-' || to_char(v_today, 'YYYY') || '-N' || lpad(nextval('public.invoice_number_seq')::text, 6, '0');

  insert into public.invoices (
    invoice_number, visitor_id, plan_id,
    base_amount, discount_amount, tax_amount, net_payable,
    paid_amount, due_amount, payment_status, payment_method,
    invoice_date, notes, service_start
  )
  values (
    v_invoice_no, v_visitor.id, v_plan.id,
    v_plan.base_price, 0, 0, v_plan.base_price,
    v_plan.base_price, 0, 'Paid', v_method,
    v_today,
    nullif(trim(coalesce(p_notes, '')), ''),
    v_visitor.visit_date
  )
  returning id into v_invoice_id;

  insert into public.payments (invoice_id, visitor_id, plan, amount, method, status, collected_by)
  values (v_invoice_id, v_visitor.id, v_plan.name, v_plan.base_price, v_method, 'Paid', v_staff_id);

  update public.visitors
     set visitor_type = 'One-Day Trial',
         status = case when status = 'Inquiry' then 'Checked In' else status end
   where id = v_visitor.id;

  return jsonb_build_object(
    'visitor_id', v_visitor.id,
    'invoice_id', v_invoice_id,
    'invoice_number', v_invoice_no,
    'plan', v_plan.name,
    'amount', v_plan.base_price,
    'payment_method', v_method
  );
end;
$$;

revoke all on function public.sell_day_pass(bigint, bigint, text, text) from public, anon;
grant execute on function public.sell_day_pass(bigint, bigint, text, text) to authenticated;
