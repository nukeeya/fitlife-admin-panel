-- =============================================================================
-- 021: "Handle payments" permission (keeps Trainers out of money)
-- =============================================================================
-- Until now any staff member could see every invoice, payment, discount, coffee
-- shop sale and salary, and could take money: add a member, renew, collect a
-- payment, sell a day pass, ring up a coffee shop sale. The client wants
-- Trainers kept out of money matters.
--
-- New role switch roles.can_handle_payments (on for every role except Trainer).
-- staff_can('payments') is true for Super Admin, for roles with this switch,
-- and for finance roles.
--
--   * Reading invoices, payments, discounts, coffee shop sales and employees
--     (salaries) needs it.
--   * Every new invoice, payment or coffee shop sale needs it. This is a
--     trigger on the tables, so all the money functions (add member, approve,
--     renew, collect payment, sell day pass, coffee shop sale) are covered
--     without rewriting them. The SQL Editor has no signed-in user
--     (auth.uid() is null) and is not affected.
--
-- Not covered: trainers.monthly_salary is still readable by all staff because
-- trainers need the coach list. Moving salaries out of that table is a later
-- task.
--
-- Run after 020.

begin;

-- 1. The switch -----------------------------------------------------------------
alter table public.roles add column if not exists can_handle_payments boolean not null default true;

update public.roles set can_handle_payments = false where name = 'Trainer';

-- 2. staff_can('payments') ------------------------------------------------------
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
      when 'payments'        then coalesce(r.can_handle_payments, false) or coalesce(r.can_manage_finances, false)
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

-- 3. Reading money ---------------------------------------------------------------
drop policy if exists "staff read invoices" on public.invoices;
create policy "staff read invoices" on public.invoices
  for select to authenticated using (public.staff_can('payments'));

drop policy if exists "staff read payments" on public.payments;
create policy "staff read payments" on public.payments
  for select to authenticated using (public.staff_can('payments'));

drop policy if exists "staff read discounts" on public.discounts;
create policy "staff read discounts" on public.discounts
  for select to authenticated using (public.staff_can('payments'));

drop policy if exists "staff read coffee shop sales" on public.coffee_shop_sales;
create policy "staff read coffee shop sales" on public.coffee_shop_sales
  for select to authenticated using (public.staff_can('payments'));

drop policy if exists "staff read employees" on public.employees;
create policy "staff read employees" on public.employees
  for select to authenticated using (public.staff_can('payments'));

-- 4. Taking money ------------------------------------------------------------------
create or replace function public.require_payments_permission()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is not null and not public.staff_can('payments') then
    raise exception 'Your role is not allowed to handle payments.' using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke all on function public.require_payments_permission() from public, anon, authenticated;

drop trigger if exists trg_invoices_require_payments on public.invoices;
create trigger trg_invoices_require_payments
  before insert on public.invoices
  for each row execute function public.require_payments_permission();

drop trigger if exists trg_payments_require_payments on public.payments;
create trigger trg_payments_require_payments
  before insert on public.payments
  for each row execute function public.require_payments_permission();

drop trigger if exists trg_coffee_sales_require_payments on public.coffee_shop_sales;
create trigger trg_coffee_sales_require_payments
  before insert on public.coffee_shop_sales
  for each row execute function public.require_payments_permission();

commit;

-- Check (should list every role; only Trainer = false):
--   select name, can_handle_payments from public.roles order by id;
