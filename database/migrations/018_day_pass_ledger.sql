-- =============================================================================
-- 018: Day passes in the money ledger (invoices/payments for visitors)
-- =============================================================================
-- Trial guests are visitors, not members, but their fees must reach Finance.
-- Instead of a separate sales table, invoices and payments can now belong to
-- a visitor: Today Collected, Monthly Revenue and Finance already count
-- payments, so day-pass money shows up there without extra queries.
--
-- - invoices / payments: member_id becomes optional and visitor_id is added.
--   A check makes every row belong to exactly one member OR one visitor.
-- - visitor_id uses "on delete restrict": a visitor who paid cannot be
--   deleted, so money history is never lost.
-- - plans.kind separates membership plans from day-pass packages. Membership
--   screens (admission, renewal) will only offer kind = 'membership'.
-- - The existing '1-day-trial' plan (seeded in 004) becomes the first day-pass
--   package; the client sets real packages and prices on Subscription Plans.
-- - The service_start trigger (014) skips the members lookup for visitor
--   invoices; they start on their invoice date.
--
-- Selling a pass (invoice + payment in one transaction) comes in the next
-- migration.
--
-- Run after 017.

begin;

-- Plans: membership or day pass ------------------------------------------------
alter table public.plans
  add column if not exists kind text not null default 'membership';

alter table public.plans drop constraint if exists plans_kind_check;
alter table public.plans
  add constraint plans_kind_check check (kind in ('membership', 'day_pass'));

update public.plans
   set kind = 'day_pass',
       updated_at = now()
 where code = '1-day-trial';

-- Invoices: member or visitor ----------------------------------------------------
alter table public.invoices alter column member_id drop not null;
alter table public.invoices
  add column if not exists visitor_id bigint references public.visitors(id) on delete restrict;

alter table public.invoices drop constraint if exists invoices_member_or_visitor;
alter table public.invoices
  add constraint invoices_member_or_visitor
  check ((member_id is null) <> (visitor_id is null));

create index if not exists idx_invoices_visitor on public.invoices(visitor_id);

-- Payments: member or visitor ----------------------------------------------------
alter table public.payments alter column member_id drop not null;
alter table public.payments
  add column if not exists visitor_id bigint references public.visitors(id) on delete restrict;

alter table public.payments drop constraint if exists payments_member_or_visitor;
alter table public.payments
  add constraint payments_member_or_visitor
  check ((member_id is null) <> (visitor_id is null));

create index if not exists idx_payments_visitor on public.payments(visitor_id);

-- service_start: only member invoices look at members.joined -------------------
create or replace function public.set_invoice_service_start()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.service_start is null then
    -- Only a member's first invoice (admission) starts on members.joined.
    if new.member_id is not null
       and not exists (select 1 from public.invoices where member_id = new.member_id) then
      select joined into new.service_start from public.members where id = new.member_id;
    end if;
    new.service_start := coalesce(new.service_start, new.invoice_date, current_date);
  end if;
  return new;
end;
$$;

commit;
