-- Security hardening found during the 29 August 2026 read-only live audit.
--
-- The three scrape-job tables are internal queues. The application has no
-- direct caller for them, and the service role used by background automation
-- bypasses RLS. NorthQuest was the only queue with RLS disabled, which exposed
-- creator names and scrape inputs through PostgREST. Keep all three queues
-- service-only and make the migration safe to replay before those legacy
-- integration-created tables exist.

do $security$
declare
  protected_table text;
begin
  foreach protected_table in array array[
    '_nq_scrape_jobs',
    '_cd_scrape_jobs',
    '_aura_scrape_jobs',
    'app_settings'
  ]
  loop
    if to_regclass(format('public.%I', protected_table)) is not null then
      execute format('alter table public.%I enable row level security', protected_table);
      execute format('revoke all privileges on table public.%I from anon, authenticated', protected_table);
      execute format('grant all privileges on table public.%I to service_role', protected_table);
    end if;
  end loop;
end
$security$;

-- RLS policies depend on these helpers for signed-in users. They must remain
-- executable by authenticated, but anonymous callers do not need direct access.
revoke all on function public.auth_role() from public, anon;
grant execute on function public.auth_role() to authenticated, service_role;

revoke all on function public.auth_business_id() from public, anon;
grant execute on function public.auth_business_id() to authenticated, service_role;

revoke all on function public.auth_creator_id() from public, anon;
grant execute on function public.auth_creator_id() to authenticated, service_role;

-- These onboarding RPCs are called by a signed-in creator. Their bodies already
-- bind the requested creator row to auth.uid(); remove the accidental default
-- PUBLIC/anonymous EXECUTE grant while preserving the intended caller.
revoke all on function public.set_new_creator_contract_file(uuid, text) from public, anon;
grant execute on function public.set_new_creator_contract_file(uuid, text) to authenticated, service_role;

revoke all on function public.complete_creator_onboarding(uuid, text, text, text, text) from public, anon;
grant execute on function public.complete_creator_onboarding(uuid, text, text, text, text) to authenticated, service_role;

-- Trigger functions and payment helpers run from trusted database code. They
-- are not public RPC endpoints and do not need direct app-role execution.
revoke all on function public.bonus_claim_touch_payments() from public, anon, authenticated;
grant execute on function public.bonus_claim_touch_payments() to service_role;

revoke all on function public.guard_profile_privileges() from public, anon, authenticated;
grant execute on function public.guard_profile_privileges() to service_role;

revoke all on function public.notify_new_applicant() from public, anon, authenticated;
grant execute on function public.notify_new_applicant() to service_role;

revoke all on function public.notify_trial_crossing() from public, anon, authenticated;
grant execute on function public.notify_trial_crossing() to service_role;

revoke all on function public.profile_creates_membership() from public, anon, authenticated;
grant execute on function public.profile_creates_membership() to service_role;

revoke all on function public.bonus_amount_for(uuid, bigint) from public, anon, authenticated;
grant execute on function public.bonus_amount_for(uuid, bigint) to service_role;

revoke all on function public.bonus_amount_for(uuid, bigint, date) from public, anon, authenticated;
grant execute on function public.bonus_amount_for(uuid, bigint, date) to service_role;

revoke all on function public.recalc_perf_bonus(uuid, date) from public, anon, authenticated;
grant execute on function public.recalc_perf_bonus(uuid, date) to service_role;

-- email_shell is an internal HTML renderer called by database-owned notification
-- functions. Pin its lookup path and remove the default RPC grant.
alter function public.email_shell(text, text, text, text) set search_path = pg_catalog, public;
revoke all on function public.email_shell(text, text, text, text) from public, anon, authenticated;
grant execute on function public.email_shell(text, text, text, text) to service_role;

-- The external heartbeat now calls this through a server-only service-role
-- client. A browser or arbitrary signed-in account must not write heartbeat rows.
revoke all on function public.ping_external() from public, anon, authenticated;
grant execute on function public.ping_external() to service_role;

-- ping only returns the database clock; it needs no owner privileges.
alter function public.ping() security invoker;
revoke all on function public.ping() from public;
grant execute on function public.ping() to anon, authenticated, service_role;

-- Existing-creator migration was retired when the September launch switched to
-- a fresh start. The shared roster leaked pending invite labels and is no longer
-- an application entry point. Keep the routines service-only for audit/recovery.
revoke all on function public.list_pending_migration_invites(text) from public, anon, authenticated;
grant execute on function public.list_pending_migration_invites(text) to service_role;

revoke all on function public.peek_migration_invite(text, text, text) from public, anon, authenticated;
grant execute on function public.peek_migration_invite(text, text, text) to service_role;

revoke all on function public.redeem_migration_invite(text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.redeem_migration_invite(text, text, text, text, text) to service_role;
