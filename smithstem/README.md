# Smithstem

A creator-operations platform. NorthQuest is the first business running on it;
the schema is multi-tenant from the ground up so another agency (CashDrive) can
be added without touching any of NorthQuest's data.

Live: https://smithstem.vercel.app
Database: Supabase project `zuuhlowjqniadtcpdypv` (eu-west-1)

## Running it locally

```
npm install
npm run dev
```

The Supabase URL and anon key are compiled in with sensible defaults, so it runs
without a `.env` file. Override them with `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY` when pointing at a test project.

The anon key is public by design and is safe in source control. Row Level
Security is the access boundary, not key secrecy. The **service role** key is a
different thing entirely and must never appear in this repository.

## Keeping the database awake

Supabase's free tier pauses a project after roughly a week without activity.
When that happens the whole platform goes offline silently — creators cannot log
in, admins cannot approve bonuses, and nothing announces it. This has already
happened once.

The pause is judged on requests arriving at the project's API, so a query that
never leaves the database does not count. There are two independent defences:

**1. In-database (live now, no hosting required).** `pg_cron` runs
`public.keepalive_tick()` daily at 06:17 UTC. That function uses `pg_net` to
make a real outbound HTTPS call to the project's own `/rest/v1/rpc/ping`
endpoint, which arrives back as a genuine inbound API request. Every run is
recorded in `public.system_heartbeat`.

To confirm it is working:

```sql
select h.ran_at, r.status_code, r.content
from public.system_heartbeat h
left join net._http_response r on r.id = h.request_id
order by h.ran_at desc
limit 10;
```

A healthy row is `status_code = 200` with a timestamp in `content`.

**2. External (`/api/keepalive`, needs a deploy).** A Vercel Cron declared in
`vercel.json` hits the same `ping()` from outside the database. This is the
stronger of the two, because it keeps working even in situations where the
database's own scheduler is not running. It activates automatically once this
directory is deployed to Vercel from git.

The gap neither one closes: if the project ever does pause, `pg_cron` stops with
it and cannot wake itself. Recovery from a full pause still needs a human, or an
external watchdog with permission to call Supabase's restore API.

## Deploying

Point a Vercel project at this repository with **Root Directory** set to
`smithstem`. Vercel reads `vercel.json` and registers the cron on the production
deployment. Framework preset is Next.js; no build overrides are needed.

## Layout

```
app/            Next.js App Router pages
  page.js         sign-in (also handles the ?code= exchange Supabase redirects to)
  verify/         8-digit email code entry with expiry countdown
  onboarding/     details -> bank -> read contract -> draw signature
  dashboard/      creator view
  admin/          admin view: creators, approvals, payments register
  api/keepalive/  external cron target
components/     Header, SignaturePad
lib/            supabase client, domain helpers, contract text
supabase/migrations/  SQL applied to the project, newest last
```
