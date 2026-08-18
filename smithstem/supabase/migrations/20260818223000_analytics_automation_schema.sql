-- Schema for the Apify/analytics automation Smith specced: creators
-- self-report weekly view increases already (the check-in gate); this adds
-- the plumbing to (a) auto-collate that self-reported data into a Sheet at
-- every gate boundary, and (b) run a real Apify scrape once a month for the
-- official numbers. Both write into each business's real ANALYTICS folder,
-- in a month subfolder, matching the folder structure already in Drive.
alter table public.businesses add column drive_analytics_folder_id text;

update public.businesses set drive_analytics_folder_id = '1sgQbQ4gkj2Dy0fpaWCT5sQj7QYBdJRL-' where slug = 'northquest';
update public.businesses set drive_analytics_folder_id = '12AiVq_fr0jDVAvY1lnTISlGj-jU9IXGE' where slug = 'cashdrive';
update public.businesses set drive_analytics_folder_id = '1lqEqh9Y7xvQVbU6rRKwiBZ3zlFlcAI-7' where slug = 'aura';

-- One row per report actually produced. The unique constraint is the
-- idempotency guard — a cron that double-fires (or is re-run by hand)
-- cannot silently produce two reports, or burn Apify credits twice, for
-- the same business and period.
create table public.analytics_runs (
  id bigint generated always as identity primary key,
  business_id uuid not null references public.businesses(id),
  kind text not null check (kind in ('weekly', 'monthly')),
  period_start date not null,
  period_end date not null,
  status text not null default 'pending' check (status in ('pending', 'done', 'failed')),
  drive_file_id text,
  apify_run_ids jsonb,
  error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (business_id, kind, period_start)
);

alter table public.analytics_runs enable row level security;

create policy analytics_runs_admin_select on public.analytics_runs
  for select to authenticated
  using (exists (
    select 1 from public.business_memberships bm
    where bm.profile_id = auth.uid() and bm.business_id = analytics_runs.business_id and bm.role = 'admin'
  ));

-- Same pattern as get_drive_service_account(): vault isn't reachable over
-- PostgREST, so a narrow service-role-only door for the one secret each
-- function needs, nothing else in Vault.
create or replace function public.get_apify_token()
returns text
language sql
security definer
set search_path = public, vault
as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'apify_api_token' limit 1;
$$;

revoke all on function public.get_apify_token() from public, anon, authenticated;
grant execute on function public.get_apify_token() to service_role;

-- These two functions are invoked by pg_cron, not a signed-in user, so they
-- run with verify_jwt off and check this shared secret instead — generated
-- here, kept only in Vault, read directly by both the cron SQL (native
-- Postgres call, not through PostgREST) and the function itself (via this
-- same narrow RPC).
do $$
begin
  if not exists (select 1 from vault.decrypted_secrets where name = 'cron_shared_secret') then
    perform vault.create_secret(encode(gen_random_bytes(32), 'hex'), 'cron_shared_secret', 'Shared secret pg_cron sends to analytics Edge Functions, since they are not called by a signed-in user.');
  end if;
end $$;

create or replace function public.get_cron_secret()
returns text
language sql
security definer
set search_path = public, vault
as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'cron_shared_secret' limit 1;
$$;

revoke all on function public.get_cron_secret() from public, anon, authenticated;
grant execute on function public.get_cron_secret() to service_role;
