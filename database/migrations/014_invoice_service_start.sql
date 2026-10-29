-- =============================================================================
-- 014: Membership start date on each invoice (for monthly revenue split)
-- =============================================================================
-- Revenue is split across the months a membership covers, so each invoice
-- needs the day its membership starts. Since 013 that can differ from the
-- invoice date (staff choose the start when approving), but it was only kept
-- on the member (members.joined).
--
-- service_start is filled automatically on insert: a member's first invoice
-- uses members.joined (create_member_with_invoice() inserts the member with
-- joined = start before the invoice, so it needs no change); later invoices
-- use their invoice date. A future renewal function should pass
-- service_start itself (usually the old expiry).
--
-- Run after 013.

alter table public.invoices add column if not exists service_start date;

-- Existing rows: a member's first invoice is their admission, which started
-- on members.joined. Any later invoice falls back to its own date.
update public.invoices i
set service_start = case
  when i.id = (select min(i2.id) from public.invoices i2 where i2.member_id = i.member_id)
    then coalesce(m.joined, i.invoice_date)
  else i.invoice_date
end
from public.members m
where m.id = i.member_id
  and i.service_start is null;

create or replace function public.set_invoice_service_start()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.service_start is null then
    -- Only the first invoice (admission) starts on members.joined.
    if not exists (select 1 from public.invoices where member_id = new.member_id) then
      select joined into new.service_start from public.members where id = new.member_id;
    end if;
    new.service_start := coalesce(new.service_start, new.invoice_date, current_date);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_invoices_service_start on public.invoices;
create trigger trg_invoices_service_start
  before insert on public.invoices
  for each row execute function public.set_invoice_service_start();
