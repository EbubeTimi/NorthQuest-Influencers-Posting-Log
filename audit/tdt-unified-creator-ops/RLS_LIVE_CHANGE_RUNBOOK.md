# Supabase RLS live-change runbook

Status: prepared only. Production execution requires explicit approval at the
final action. Project: Smithstem (`zuuhlowjqniadtcpdypv`).

## Purpose

Close the confirmed exposure on `public._nq_scrape_jobs`, keep all three
business scrape queues and `app_settings` server-only, and narrow execution of
privileged database routines without breaking creator onboarding or database
triggers.

The reviewed migration is:

`smithstem/supabase/migrations/20260829010000_harden_public_scrape_jobs_and_routines.sql`

It has already been replayed twice in a disposable PostgreSQL-compatible
database. Static and runtime security checks pass.

## Gate 1 — private logical backup

The Free plan has no downloadable managed backup. Before the live change, take
a logical export using the Supabase CLI and a connection string copied privately
from Supabase. Never paste the connection string or database password into chat,
source control or evidence files.

Create three files in a private folder outside the repository:

```powershell
supabase db dump --db-url "<PRIVATE_CONNECTION_STRING>" -f roles.sql --role-only
supabase db dump --db-url "<PRIVATE_CONNECTION_STRING>" -f schema.sql
supabase db dump --db-url "<PRIVATE_CONNECTION_STRING>" -f data.sql --use-copy --data-only -x "storage.buckets_vectors" -x "storage.vector_indexes"
```

Confirm all three commands exit successfully and all three files are non-empty.
The database backup contains sensitive business and creator information; keep it
private and encrypted. Storage objects such as uploaded videos are not contained
in a database dump and require a separate storage-retention plan.

## Gate 2 — deployment configuration

Before deploying code that removes repository fallbacks, privately add these
Vercel project variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `CRON_SECRET`

Use Supabase's publishable key in the browser variable and a separately named
secret key in the server-only variable. Never use a secret/service-role value in
a `NEXT_PUBLIC_` variable. Adding variables does not update an existing Vercel
deployment; deployment remains a separate approval gate.

## Gate 3 — read-only preflight

Immediately before applying the migration, verify the target and capture the
current security state in the Supabase SQL Editor:

```sql
select current_database(), current_user, now();

select c.relname, c.relrowsecurity, c.relacl
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    '_nq_scrape_jobs',
    '_cd_scrape_jobs',
    '_aura_scrape_jobs',
    'app_settings'
  )
order by c.relname;

select p.proname,
       pg_get_function_identity_arguments(p.oid) as arguments,
       p.prosecdef,
       p.proacl
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'auth_role', 'auth_business_id', 'auth_creator_id',
    'set_new_creator_contract_file', 'complete_creator_onboarding',
    'bonus_claim_touch_payments', 'guard_profile_privileges',
    'notify_new_applicant', 'notify_trial_crossing',
    'profile_creates_membership', 'bonus_amount_for',
    'recalc_perf_bonus', 'email_shell', 'ping_external', 'ping',
    'list_pending_migration_invites', 'peek_migration_invite',
    'redeem_migration_invite'
  )
order by p.proname, arguments;
```

Stop if the project identity, tables or function signatures differ from the
reviewed migration assumptions.

## Gate 4 — apply the reviewed migration

Apply only the reviewed migration file in the Supabase SQL Editor. Do not mix it
with unrelated schema changes. This is the live production action and requires
explicit approval immediately before execution.

## Gate 5 — immediate verification

Run the preflight queries again, then confirm:

- RLS is enabled on every queue and `app_settings` table that exists.
- `PUBLIC`, `anon` and `authenticated` have no table privileges on them.
- `service_role` retains the required queue access.
- `anon` cannot call `ping_external` or the retired migration-roster routines.
- `authenticated` can still use the identity helpers and creator-onboarding
  routines.
- database triggers still fire through normal inserts/updates.
- a creator cannot see another creator or another business.
- a management account can still review evidence and onboarding.
- the Supabase Security Advisor no longer reports RLS disabled on
  `_nq_scrape_jobs`.

## Recovery rule

Do not disable RLS or restore anonymous access as an emergency shortcut. If a
verified caller breaks, restore only the single documented permission that
caller needs, record it in the audit log, add a regression test, and rerun the
advisor. Restore the logical backup only for actual data/schema loss, not for a
normal permission error.

## Completion evidence

Record the backup timestamp (not its path or password), migration result,
postflight query results, tested roles, Security Advisor result and any failure.
Do not record secret values or applicant/creator data.
