begin;

update public.plans
set code = case code
      when 'basic' then '1-month'
      when 'standard' then '3-months'
      when 'premium' then '6-months'
    end,
    name = case code
      when 'basic' then '1 Month'
      when 'standard' then '3 Months'
      when 'premium' then '6 Months'
    end,
    billing_period = 'monthly',
    duration_days = case code
      when 'basic' then 30
      when 'standard' then 90
      when 'premium' then 180
    end,
    base_price = case code
      when 'basic' then 7000.00
      when 'standard' then 18000.00
      when 'premium' then 30000.00
    end,
    is_popular = (code = 'standard'),
    updated_at = now()
where code in ('basic', 'standard', 'premium');

insert into public.plans (code, name, billing_period, duration_days, base_price, vat_percentage, is_popular)
values
  ('1-month', '1 Month', 'monthly', 30, 7000.00, 5.00, false),
  ('3-months', '3 Months', 'monthly', 90, 18000.00, 5.00, true),
  ('6-months', '6 Months', 'monthly', 180, 30000.00, 5.00, false),
  ('1-year', '1 Year', 'monthly', 365, 50000.00, 5.00, false),
  ('1-day-trial', '1 Day Trial', 'monthly', 1, 500.00, 5.00, false)
on conflict (code) do update set
  name = excluded.name,
  billing_period = excluded.billing_period,
  duration_days = excluded.duration_days,
  base_price = excluded.base_price,
  is_popular = excluded.is_popular,
  updated_at = now();

delete from public.plan_features
where plan_id in (
  select id from public.plans
  where code in ('1-month', '3-months', '6-months', '1-year', '1-day-trial')
);

insert into public.plan_features (plan_id, feature_name)
select id, 'No Admission Fee'
from public.plans
where code = '1-day-trial'
on conflict (plan_id, feature_name) do nothing;

commit;
