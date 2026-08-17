-- Real bug found while wiring trial promotion: creators has no self-UPDATE
-- RLS policy at all (only self-SELECT, self-INSERT, and admin ALL). Every
-- direct client .update() onboarding has ever tried to run against its own
-- creators row has silently affected zero rows — confirmed against the one
-- real creator in production today, whose contract_file_url never saved
-- despite the signature file existing in storage (repaired directly).
--
-- Rather than open a broad self-UPDATE policy (which would need its own
-- privilege-escalation guard, duplicating the trigger already protecting
-- profiles), onboarding completion goes through these two narrow,
-- SECURITY DEFINER entry points instead — consistent with how
-- redeem_creator_invite and start_trial already gate their writes.

-- Used by the plain-signup path, after the initial creators INSERT
-- (already RLS-safe) and after the signature upload (which needs an
-- existing creator id to satisfy storage's own RLS) — one-time only, so it
-- can't be replayed to swap out an already-set file later.
create function set_new_creator_contract_file(p_creator_id uuid, p_path text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  update creators set contract_file_url = p_path
  where id = p_creator_id and profile_id = auth.uid() and contract_file_url is null;
  if not found then
    raise exception 'could not attach the contract file';
  end if;
end;
$function$;

-- Used by the invited-creator and trial_approved-creator paths, where the
-- creators row already exists. This is also the actual trial→active
-- handover moment: the status flip only happens here, gated to accounts
-- that were either already active (re-signing/updating bank details) or
-- specifically trial_approved — a plain 'trial' creator cannot reach
-- 'active' through this function, only through Smith approving a crossing
-- first.
create function complete_creator_onboarding(p_creator_id uuid, p_bank_name text, p_acct_num text, p_acct_name text, p_contract_file_url text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_status creator_status;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;

  select status into v_status from creators where id = p_creator_id and profile_id = auth.uid();
  if not found then raise exception 'that creator record was not found'; end if;
  if v_status not in ('active', 'trial_approved') then
    raise exception 'onboarding is not open for this account yet';
  end if;

  update creators set
    bank_name = p_bank_name,
    acct_num = p_acct_num,
    acct_name = p_acct_name,
    contract_signed_at = now(),
    contract_file_url = p_contract_file_url,
    status = 'active'
  where id = p_creator_id and profile_id = auth.uid();
end;
$function$;
