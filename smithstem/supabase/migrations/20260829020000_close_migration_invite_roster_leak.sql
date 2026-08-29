-- Live security fix. list_pending_migration_invites was granted to anon so the
-- shared /join/business/[slug] page could read the roster before sign-in — but
-- that made every pending invite label (51 real creators' full names) readable
-- by anyone on the internet with no account at all. Found by the 29 Aug
-- read-only audit on the codex/unified-tdt-creator-ops-prototype branch.
--
-- Narrow fix only: this closes the roster leak and locks app_settings. It
-- deliberately does NOT include the rest of that audit's migration
-- (20260829010000_harden_public_scrape_jobs_and_routines.sql), because
-- revoking ping_external from authenticated requires the matching keepalive
-- route change that lives on that same branch; applying it alone would let the
-- free-tier database pause and take the whole app down.
revoke all on function public.list_pending_migration_invites(text) from public, anon, authenticated;
grant execute on function public.list_pending_migration_invites(text) to service_role;

revoke all on function public.peek_migration_invite(text, text, text) from public, anon, authenticated;
grant execute on function public.peek_migration_invite(text, text, text) to service_role;

revoke all on function public.redeem_migration_invite(text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.redeem_migration_invite(text, text, text, text, text) to service_role;

do $security$
begin
  if to_regclass('public.app_settings') is not null then
    execute 'alter table public.app_settings enable row level security';
    execute 'revoke all privileges on table public.app_settings from public, anon, authenticated';
    execute 'grant all privileges on table public.app_settings to service_role';
  end if;
end
$security$;
