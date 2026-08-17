-- A live gate, not effective-dated like bonus_tiers: whatever the value is
-- right now is what a self-reported view count gets checked against, on
-- every crossing-candidates query. Changing it takes effect immediately,
-- forward and backward, per business.
alter table businesses add column trial_view_threshold bigint not null default 10000;

-- businesses had no UPDATE policy at all — admin could read any business
-- (name/slug aren't sensitive) but never write one. Scoped the same way as
-- every other admin policy: their own active business only, never another
-- tenant's row.
create policy businesses_admin_update on businesses
  for update
  using (auth_role() = 'admin' and id = auth_business_id())
  with check (auth_role() = 'admin' and id = auth_business_id());
