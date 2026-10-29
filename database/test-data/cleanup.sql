-- Removes the test records imported from database/test-data/*.csv.
-- All test rows use ids 9001+ and names/codes starting with "Test" / "TEST".
-- Order matters because of foreign keys.
delete from public.attendance    where id between 9001 and 9999;
delete from public.payments      where id between 9001 and 9999;
delete from public.invoices      where id between 9001 and 9999;
delete from public.members       where id between 9001 and 9999;
delete from public.plan_features where id between 9001 and 9999;
delete from public.plans         where id between 9001 and 9999;
