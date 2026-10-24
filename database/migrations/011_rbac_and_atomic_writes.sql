-- =============================================================================
-- 011 — ROLE-BASED ACCESS CONTROL + ATOMIC MEMBER / PAYMENT WRITES
-- =============================================================================
-- Before this migration every signed-in Supabase user (including anyone who
-- self-registered through the public auth API) had full read/write access to
-- every table. This migration:
--
--   1. Links YOUR admin account to the 'Super Admin' role (EDIT THE EMAIL BELOW).
--   2. Adds helper functions: is_staff(), is_super_admin(), staff_can(flag).
--      "Staff" = a public.users row linked to auth.uid(), status 'Active',
--      with a role assigned. New sign-ups get a users row with NO role, so they
--      have no access until a Super Admin assigns one.
--   3. Replaces every "authenticated: using (true)" policy with role checks.
--   4. Locks the public admission form down to Pending submissions only.
--   5. Adds create_member_with_invoice() and collect_payment() RPCs so money
--      is calculated on the server and multi-table writes are all-or-nothing.
--
-- Run the whole file in the Supabase SQL Editor. It runs in one transaction:
-- if the admin email is not found, NOTHING is changed.
--
-- Also do this in the dashboard (cannot be done from SQL):
--   Authentication → Sign In / Providers → turn OFF "Allow new users to sign up".
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. BOOTSTRAP THE FIRST SUPER ADMIN
-- -----------------------------------------------------------------------------
do $$
declare
  -- >>> EDIT THIS: the email you log in to the admin panel with <<<
  v_admin_email text := 'YOUR_ADMIN_EMAIL@example.com';
  v_auth_uid uuid;
  v_role_id bigint;
begin
  select id into v_auth_uid from auth.users where lower(email) = lower(v_admin_email);
  if v_auth_uid is null then
    raise exception 'No Supabase Auth user with email "%". Edit v_admin_email at the top of migration 011 and run it again.', v_admin_email;
  end if;

  select id into v_role_id from public.roles where name = 'Super Admin';
  if v_role_id is null then
    raise exception 'Role "Super Admin" is missing from public.roles.';
  end if;

  -- The profile row may be missing (auth user created before the trigger
  -- existed) or may exist by email without auth_uid.
  update public.users
     set auth_uid = v_auth_uid
   where lower(email) = lower(v_admin_email) and auth_uid is null;

  insert into public.users (auth_uid, email, name)
  values (v_auth_uid, v_admin_email, split_part(v_admin_email, '@', 1))
  on conflict do nothing;

  update public.users
     set role_id = v_role_id, status = 'Active'
   where auth_uid = v_auth_uid;

  if not found then
    raise exception 'Could not link "%" to a public.users row (is the email used by another profile row?).', v_admin_email;
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 2. HELPER FUNCTIONS
-- -----------------------------------------------------------------------------
-- security definer so policies on public.users / public.roles can call these
-- without recursing into their own RLS.

create or replace function public.current_staff_id()
returns bigint
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select u.id
  from public.users u
  where u.auth_uid = auth.uid()
    and u.status = 'Active'
    and u.role_id is not null;
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.current_staff_id() is not null;
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.users u
    join public.roles r on r.id = u.role_id
    where u.auth_uid = auth.uid()
      and u.status = 'Active'
      and r.name = 'Super Admin'
  );
$$;

-- flag: 'finances' | 'approve_members' | 'lockers' | 'discount'
create or replace function public.staff_can(p_flag text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce((
    select r.name = 'Super Admin' or case p_flag
      when 'finances'        then coalesce(r.can_manage_finances, false)
      when 'approve_members' then coalesce(r.can_approve_members, false)
      when 'lockers'         then coalesce(r.can_manage_lockers, false)
      when 'discount'        then coalesce(r.can_apply_discount, false)
      else false
    end
    from public.users u
    join public.roles r on r.id = u.role_id
    where u.auth_uid = auth.uid()
      and u.status = 'Active'
  ), false);
$$;

revoke all on function public.current_staff_id() from public, anon;
revoke all on function public.is_staff() from public, anon;
revoke all on function public.is_super_admin() from public, anon;
revoke all on function public.staff_can(text) from public, anon;
grant execute on function public.current_staff_id() to authenticated;
grant execute on function public.is_staff() to authenticated;
grant execute on function public.is_super_admin() to authenticated;
grant execute on function public.staff_can(text) to authenticated;

-- -----------------------------------------------------------------------------
-- 3. DROP EVERY EXISTING POLICY FOR authenticated ON public TABLES
-- -----------------------------------------------------------------------------
do $$
declare p record;
begin
  for p in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and 'authenticated' = any(roles)
  loop
    execute format('drop policy %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- 4. NEW POLICIES
-- -----------------------------------------------------------------------------
-- Helper: create the standard select/insert/update/delete policies for a table.
--   read_check / write_check / delete_check are SQL boolean expressions.
create or replace function pg_temp.apply_policies(
  p_table text, read_check text, write_check text, delete_check text
) returns void
language plpgsql
as $$
begin
  execute format('alter table public.%I enable row level security', p_table);
  execute format('create policy "staff read %1$s" on public.%1$I for select to authenticated using (%2$s)', p_table, read_check);
  execute format('create policy "staff insert %1$s" on public.%1$I for insert to authenticated with check (%2$s)', p_table, write_check);
  execute format('create policy "staff update %1$s" on public.%1$I for update to authenticated using (%2$s) with check (%2$s)', p_table, write_check);
  execute format('create policy "staff delete %1$s" on public.%1$I for delete to authenticated using (%2$s)', p_table, delete_check);
end;
$$;

-- System configuration: everyone on staff reads, only Super Admin changes.
select pg_temp.apply_policies(t, 'public.is_staff()', 'public.is_super_admin()', 'public.is_super_admin()')
from unnest(array['roles', 'permissions', 'role_permissions', 'app_settings', 'branches']) as t;

-- Staff accounts: you can always read your own row (so the app can tell a
-- new sign-up "no role assigned yet"); only Super Admin manages accounts.
select pg_temp.apply_policies('users',
  'auth_uid = auth.uid() or public.is_staff()',
  'public.is_super_admin()',
  'public.is_super_admin()');

-- Pricing catalogue: managers with finance rights.
select pg_temp.apply_policies(t, 'public.is_staff()', 'public.staff_can(''finances'')', 'public.staff_can(''finances'')')
from unnest(array['plans', 'plan_features', 'plan_lockers']) as t;

-- Day-to-day operations: any staff member.
select pg_temp.apply_policies(t, 'public.is_staff()', 'public.is_staff()', 'public.is_staff()')
from unnest(array[
  'trainers', 'attendance', 'sms_campaigns',
  'ai_workout_plans', 'ai_diet_plans', 'progress_logs',
  'job_postings', 'job_applications', 'shop_products'
]) as t;

-- Members: any staff creates/edits; only Super Admin deletes.
select pg_temp.apply_policies('members', 'public.is_staff()', 'public.is_staff()', 'public.is_super_admin()');

-- Lockers: staff whose role can manage lockers.
select pg_temp.apply_policies(t, 'public.is_staff()', 'public.staff_can(''lockers'')', 'public.staff_can(''lockers'')')
from unnest(array['lockers', 'locker_assignments']) as t;

-- Money: staff can see invoices/payments (front desk needs balances), but only
-- finance roles write them directly. Normal admissions and payment collection
-- go through the RPCs below, which do their own permission checks.
select pg_temp.apply_policies(t, 'public.is_staff()', 'public.staff_can(''finances'')', 'public.is_super_admin()')
from unnest(array['invoices', 'payments', 'discounts']) as t;

-- Expenses, salaries and payroll: finance roles only.
select pg_temp.apply_policies(t, 'public.staff_can(''finances'')', 'public.staff_can(''finances'')', 'public.staff_can(''finances'')')
from unnest(array['expenses', 'employee_payrolls']) as t;

select pg_temp.apply_policies('employees', 'public.is_staff()', 'public.staff_can(''finances'')', 'public.staff_can(''finances'')');

-- SMS gateway settings: staff read the balance and decrement it when sending
-- a campaign. The gateway API key must never reach the browser, so the browser
-- role gets column-level grants only (a column revoke alone does not override
-- a table-level grant). Change the key/provider from the SQL editor.
select pg_temp.apply_policies('sms_settings', 'public.is_staff()', 'public.is_staff()', 'public.is_super_admin()');
revoke select, insert, update on public.sms_settings from authenticated;
grant select (id, provider_name, sender_id, remaining_balance, updated_at) on public.sms_settings to authenticated;
grant update (remaining_balance) on public.sms_settings to authenticated;

-- Admission submissions: staff review them; approving needs approval rights.
create policy "staff read admission_submissions" on public.admission_submissions
  for select to authenticated using (public.is_staff());
create policy "staff update admission_submissions" on public.admission_submissions
  for update to authenticated
  using (public.is_staff())
  with check (status <> 'Approved' or public.staff_can('approve_members'));
create policy "staff delete admission_submissions" on public.admission_submissions
  for delete to authenticated using (public.is_super_admin());

-- Shop orders (from migration 007): keep column grants, gate on staff.
create policy "staff read shop orders" on public.shop_orders
  for select to authenticated using (public.is_staff());
create policy "staff update shop order status" on public.shop_orders
  for update to authenticated
  using (public.is_staff())
  with check (public.is_staff() and status in ('New', 'Contacted', 'Completed', 'Cancelled'));

-- Coffee shop sales (from migration 009): read-only for staff; the RPC writes.
create policy "staff read coffee shop sales" on public.coffee_shop_sales
  for select to authenticated using (public.is_staff());

-- complete_coffee_shop_sale is security definer; make it require staff too.
do $$
begin
  -- Skip when already renamed (re-running this migration).
  if to_regprocedure('public.complete_coffee_shop_sale(jsonb, text, text)') is not null
     and to_regprocedure('public.complete_coffee_shop_sale_unchecked(jsonb, text, text)') is null then
    execute 'alter function public.complete_coffee_shop_sale(jsonb, text, text) rename to complete_coffee_shop_sale_unchecked';
    execute 'revoke all on function public.complete_coffee_shop_sale_unchecked(jsonb, text, text) from public, anon, authenticated';
  end if;
end $$;

create or replace function public.complete_coffee_shop_sale(
  p_items jsonb,
  p_payment_method text,
  p_customer_name text default null
)
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_staff() then
    raise exception 'Your account is not allowed to record sales.' using errcode = '42501';
  end if;
  return public.complete_coffee_shop_sale_unchecked(p_items, p_payment_method, p_customer_name);
end;
$$;

revoke all on function public.complete_coffee_shop_sale(jsonb, text, text) from public, anon;
grant execute on function public.complete_coffee_shop_sale(jsonb, text, text) to authenticated;

-- -----------------------------------------------------------------------------
-- 5. PUBLIC ADMISSION FORM — only brand-new Pending submissions
-- -----------------------------------------------------------------------------
drop policy if exists "anon insert admissions" on public.admission_submissions;
create policy "anon insert admissions"
  on public.admission_submissions
  for insert to anon
  with check (
    status = 'Pending'
    and reviewed_at is null
    and reviewed_by is null
    and rejection_reason is null
  );

-- -----------------------------------------------------------------------------
-- 6. STORAGE — profile photos for staff only
-- -----------------------------------------------------------------------------
drop policy if exists "Authenticated users can view profile photos" on storage.objects;
create policy "Authenticated users can view profile photos"
  on storage.objects for select to authenticated
  using (bucket_id = 'profile-photos' and public.is_staff());

drop policy if exists "Authenticated users can upload profile photos" on storage.objects;
create policy "Authenticated users can upload profile photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'profile-photos' and public.is_staff());

drop policy if exists "Authenticated users can update profile photos" on storage.objects;
create policy "Authenticated users can update profile photos"
  on storage.objects for update to authenticated
  using (bucket_id = 'profile-photos' and public.is_staff())
  with check (bucket_id = 'profile-photos' and public.is_staff());

drop policy if exists "Authenticated users can delete profile photos" on storage.objects;
create policy "Authenticated users can delete profile photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'profile-photos' and public.is_staff());

-- -----------------------------------------------------------------------------
-- 7. APPROVING A SUBMISSION IS PART OF CREATING THE MEMBER
-- -----------------------------------------------------------------------------
-- Inserting a member with submission_id marks that submission Approved in the
-- same statement, so a member can never exist for a still-Pending application
-- (and an application can never be Approved without its member).
create or replace function public.mark_submission_approved()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.submission_id is null then
    return new;
  end if;

  if not public.staff_can('approve_members') then
    raise exception 'Your role is not allowed to approve admissions.' using errcode = '42501';
  end if;

  update public.admission_submissions
     set status = 'Approved',
         reviewed_at = now(),
         reviewed_by = public.current_staff_id(),
         rejection_reason = null
   where id = new.submission_id
     and status = 'Pending';

  if not found then
    raise exception 'This application was already reviewed by someone else. Refresh the list.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_members_mark_submission_approved on public.members;
create trigger trg_members_mark_submission_approved
  after insert on public.members
  for each row execute function public.mark_submission_approved();

-- -----------------------------------------------------------------------------
-- 8. RPC: create_member_with_invoice
-- -----------------------------------------------------------------------------
-- Creates member + discount + invoice + first payment + locker assignment in
-- one transaction. Prices come from public.plans, discount limits from the
-- caller's role. When p_submission_id is given, personal details are copied
-- from the admission submission and it is marked Approved.
create sequence if not exists public.invoice_number_seq;

create or replace function public.normalize_payment_method(p_method text)
returns text
language sql
immutable
as $$
  select case upper(trim(coalesce(p_method, 'CASH')))
    when 'BKASH' then 'bKASH'
    when 'CASH' then 'CASH'
    when 'ROCKET' then 'ROCKET'
    when 'NAGAD' then 'NAGAD'
    when 'CARD' then 'CARD'
    when 'BANK' then 'BANK'
    when 'BANK TRANSFER' then 'BANK'
    else null
  end;
$$;

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
  v_plan         public.plans%rowtype;
  v_sub          public.admission_submissions%rowtype;
  v_locker       public.lockers%rowtype;
  v_today        date := (now() at time zone 'Asia/Dhaka')::date;
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
    status, joined, expiry, visits, emergency_name, emergency_phone
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
    v_today,
    v_today + coalesce(v_plan.duration_days, 30),
    0,
    v_sub.emergency_name,
    v_sub.emergency_phone
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
    values (p_locker_id, v_member_id, v_today + coalesce(v_plan.duration_days, 30));
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

revoke all on function public.create_member_with_invoice(
  bigint, text, text, text, text, text, numeric, text, numeric, text, bigint, bigint, text, bigint, date, text
) from public, anon;
grant execute on function public.create_member_with_invoice(
  bigint, text, text, text, text, text, numeric, text, numeric, text, bigint, bigint, text, bigint, date, text
) to authenticated;

-- -----------------------------------------------------------------------------
-- 9. RPC: collect_payment
-- -----------------------------------------------------------------------------
-- Locks the invoice row, so two people collecting at once cannot overpay it,
-- and recalculates paid/due on the server.
create or replace function public.collect_payment(
  p_invoice_id bigint,
  p_amount     numeric,
  p_method     text default 'CASH',
  p_reference  text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_staff_id  bigint := public.current_staff_id();
  v_invoice   public.invoices%rowtype;
  v_method    text := public.normalize_payment_method(p_method);
  v_amount    numeric(10, 2) := round(coalesce(p_amount, 0), 2);
  v_paid      numeric(10, 2);
  v_due       numeric(10, 2);
  v_plan_name text;
  v_payment_id bigint;
begin
  if v_staff_id is null then
    raise exception 'Your account is not allowed to collect payments.' using errcode = '42501';
  end if;
  if v_method is null then
    raise exception 'Select a valid payment method.';
  end if;

  select * into v_invoice from public.invoices where id = p_invoice_id for update;
  if not found then
    raise exception 'Invoice not found.';
  end if;
  if v_amount <= 0 then
    raise exception 'Payment amount must be greater than zero.';
  end if;
  if v_amount > v_invoice.due_amount then
    raise exception 'Payment of % is more than the outstanding due of %.', v_amount, v_invoice.due_amount;
  end if;

  v_paid := v_invoice.paid_amount + v_amount;
  v_due := greatest(v_invoice.net_payable - v_paid, 0);

  update public.invoices
     set paid_amount = v_paid,
         due_amount = v_due,
         payment_status = case when v_due = 0 then 'Paid' else 'Partial' end
   where id = v_invoice.id;

  select name into v_plan_name from public.plans where id = v_invoice.plan_id;

  insert into public.payments (invoice_id, member_id, plan, amount, method, status, transaction_reference, collected_by)
  values (
    v_invoice.id, v_invoice.member_id, coalesce(v_plan_name, 'Membership'), v_amount, v_method, 'Paid',
    nullif(trim(coalesce(p_reference, '')), ''), v_staff_id
  )
  returning id into v_payment_id;

  return jsonb_build_object(
    'payment_id', v_payment_id,
    'invoice_id', v_invoice.id,
    'paid_amount', v_paid,
    'due_amount', v_due
  );
end;
$$;

revoke all on function public.collect_payment(bigint, numeric, text, text) from public, anon;
grant execute on function public.collect_payment(bigint, numeric, text, text) to authenticated;

commit;
