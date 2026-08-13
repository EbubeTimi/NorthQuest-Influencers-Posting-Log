-- Approving a claim has to change what the creator is owed, otherwise the
-- approval queue is theatre. perf_bonus is recomputed from the approved claims
-- for that month rather than incremented, so un-approving or deleting a claim
-- corrects the figure instead of leaving money stranded.
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
  if v_business_id is null then
    return;
  end if;

  select coalesce(sum(public.bonus_amount_for(v_business_id, bc.views)), 0)
  into v_total
  from public.bonus_claims bc
  where bc.creator_id = p_creator_id
    and bc.status = 'approved'
    and date_trunc('month', bc.claim_date)::date = p_month;

  -- Nothing approved and no existing row means there is nothing to say yet.
  -- Do not manufacture an empty payment row for a month that has not started.
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

create or replace function public.bonus_claim_touch_payments()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if tg_op = 'DELETE' then
    perform public.recalc_perf_bonus(old.creator_id, date_trunc('month', old.claim_date)::date);
    return old;
  end if;

  perform public.recalc_perf_bonus(new.creator_id, date_trunc('month', new.claim_date)::date);

  -- A claim moved between months, or to another creator, leaves the old month
  -- overstated unless it is recomputed too.
  if tg_op = 'UPDATE' and (
       old.creator_id <> new.creator_id
       or date_trunc('month', old.claim_date) <> date_trunc('month', new.claim_date)
     ) then
    perform public.recalc_perf_bonus(old.creator_id, date_trunc('month', old.claim_date)::date);
  end if;

  return new;
end;
$fn$;

drop trigger if exists bonus_claim_payments_sync on public.bonus_claims;
create trigger bonus_claim_payments_sync
  after insert or update or delete on public.bonus_claims
  for each row execute function public.bonus_claim_touch_payments();
