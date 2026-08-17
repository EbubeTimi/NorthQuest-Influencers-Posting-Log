-- Same problem bonus_tiers already solved: base_pay on creators is a single
-- mutable field, so moving someone from a 100k tier to 200k would silently
-- reprice any past week that ever gets recomputed (e.g. a claim deleted two
-- months later triggers recalcPaymentForMonth with today's base_pay, not
-- August's). This table is the effective-dated record; creators.base_pay
-- stays as the current-state convenience field (still what onboarding sets
-- and what shows in Manage Creators), but anything valuing a past period
-- must look up the rate that was actually in force on that date instead.
create table creator_base_pay_history (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id),
  creator_id uuid not null references creators(id) on delete cascade,
  base_pay numeric not null,
  effective_from date not null default current_date,
  created_at timestamptz not null default now()
);
create index creator_base_pay_history_creator_idx on creator_base_pay_history (creator_id, effective_from);

alter table creator_base_pay_history enable row level security;
create policy creator_base_pay_history_admin_all on creator_base_pay_history
  for all using (auth_role() = 'admin' and business_id = auth_business_id());
