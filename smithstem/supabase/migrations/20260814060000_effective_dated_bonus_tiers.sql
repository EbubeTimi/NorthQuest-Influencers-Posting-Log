-- The bonus structure is not fixed — Smith changes it as the business changes,
-- and the new one starts this month. Without dates, editing a tier would
-- silently recompute months that were already paid: a claim approved in June at
-- the old rate would quietly become a different number. That is unacceptable
-- for money someone has already received.
--
-- So a tier now carries the date it came into force, and a claim is always
-- valued using the tiers that applied on the day of the claim.

alter table public.bonus_tiers
  add column if not exists effective_from date not null default '2000-01-01';

-- The old unique key assumed a threshold could only exist once per business,
-- which is precisely the assumption that a changing structure breaks.
alter table public.bonus_tiers
  drop constraint if exists bonus_tiers_business_id_min_views_key;

drop index if exists bonus_tiers_unique_threshold;
create unique index bonus_tiers_unique_threshold
  on public.bonus_tiers (business_id, effective_from, min_views);

update public.bonus_tiers set effective_from = '2026-04-01' where effective_from = '2000-01-01';

insert into public.bonus_tiers (business_id, min_views, amount, effective_from)
select b.id, v.min_views, v.amount, '2026-08-01'::date
from public.businesses b
cross join (values
  (100000,    50000),
  (500000,   100000),
  (1000000,  250000),
  (2000000,  500000),
  (5000000, 1000000),
  (10000000,2000000)
) as v(min_views, amount)
where b.slug = 'northquest'
on conflict (business_id, effective_from, min_views) do update set amount = excluded.amount;

create or replace function public.bonus_amount_for(p_business_id uuid, p_views bigint, p_on date default current_date)
returns numeric
language sql
stable
security definer
set search_path = public
as $fn$
  with active as (
    select max(effective_from) as ef
    from public.bonus_tiers
    where business_id = p_business_id and effective_from <= p_on
  )
  select coalesce(
    (select t.amount
       from public.bonus_tiers t, active a
      where t.business_id = p_business_id
        and t.effective_from = a.ef
        and t.min_views <= p_views
      order by t.min_views desc
      limit 1),
    0);
$fn$;

create or replace function public.recalc_perf_bonus(p_creator_id uuid, p_month date)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_business_id uuid;
  v_total numeric;
begin
  select business_id into v_business_id from public.creators where id = p_creator_id;
  if v_business_id is null then return; end if;

  select coalesce(sum(public.bonus_amount_for(v_business_id, bc.views, bc.claim_date)), 0)
  into v_total
  from public.bonus_claims bc
  where bc.creator_id = p_creator_id
    and bc.status = 'approved'
    and date_trunc('month', bc.claim_date)::date = p_month;

  if v_total = 0 and not exists (
    select 1 from public.payments where creator_id = p_creator_id and month = p_month
  ) then
    return;
  end if;

  insert into public.payments (business_id, creator_id, month, perf_bonus)
  values (v_business_id, p_creator_id, p_month, v_total)
  on conflict (creator_id, month) do update
    set perf_bonus = excluded.perf_bonus,
        updated_at = now();
end;
$fn$;
