-- A video keeps earning views after its bonus is approved. Smith does not want
-- a second claim for the same video — she wants the existing one re-verified
-- and, once she approves, the same row simply moves to the higher amount. So
-- this is not a new claim: it is the same row, updated in place, going through
-- Smith once more before the new figure counts.

alter table public.bonus_claims
  add column if not exists revised_views bigint,
  add column if not exists revision_status text,
  add column if not exists revision_requested_at timestamptz,
  add column if not exists revision_reviewed_at timestamptz,
  add column if not exists revision_reviewed_by uuid references public.profiles(id);

alter table public.bonus_claims
  drop constraint if exists bonus_claims_revision_status_check;
alter table public.bonus_claims
  add constraint bonus_claims_revision_status_check
  check (revision_status is null or revision_status = 'pending');

create or replace function public.request_bonus_revision(p_claim_id uuid, p_new_views bigint)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_claim public.bonus_claims;
  v_old_amount numeric;
  v_new_amount numeric;
begin
  select * into v_claim from public.bonus_claims where id = p_claim_id;
  if not found or v_claim.creator_id <> public.auth_creator_id() then
    raise exception 'claim not found';
  end if;
  if v_claim.status <> 'approved' then
    raise exception 'only an approved claim can report growth';
  end if;
  if v_claim.revision_status = 'pending' then
    raise exception 'an update is already waiting on Smith for this claim';
  end if;
  if p_new_views <= v_claim.views then
    raise exception 'the new view count must be higher than what was already approved';
  end if;

  v_old_amount := public.bonus_amount_for(v_claim.business_id, v_claim.views, v_claim.claim_date);
  v_new_amount := public.bonus_amount_for(v_claim.business_id, p_new_views, v_claim.claim_date);
  if v_new_amount <= v_old_amount then
    raise exception 'that view count has not reached a higher bonus tier yet';
  end if;

  update public.bonus_claims
     set revised_views = p_new_views,
         revision_status = 'pending',
         revision_requested_at = now()
   where id = p_claim_id;
end;
$fn$;

revoke all on function public.request_bonus_revision(uuid, bigint) from public, anon;
grant execute on function public.request_bonus_revision(uuid, bigint) to authenticated;

create or replace function public.review_bonus_revision(p_claim_id uuid, p_approve boolean)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare v_claim public.bonus_claims;
begin
  if public.auth_role() <> 'admin' then
    raise exception 'only an admin can review a revision' using errcode = '42501';
  end if;
  select * into v_claim from public.bonus_claims where id = p_claim_id;
  if not found or v_claim.business_id <> public.auth_business_id() then
    raise exception 'claim not found';
  end if;
  if v_claim.revision_status <> 'pending' then
    raise exception 'no update is waiting on this claim';
  end if;

  if p_approve then
    update public.bonus_claims
       set views = revised_views, revised_views = null, revision_status = null,
           revision_reviewed_at = now(), revision_reviewed_by = auth.uid()
     where id = p_claim_id;
  else
    update public.bonus_claims
       set revised_views = null, revision_status = null,
           revision_reviewed_at = now(), revision_reviewed_by = auth.uid()
     where id = p_claim_id;
  end if;
end;
$fn$;

revoke all on function public.review_bonus_revision(uuid, boolean) from public, anon;
grant execute on function public.review_bonus_revision(uuid, boolean) to authenticated;
