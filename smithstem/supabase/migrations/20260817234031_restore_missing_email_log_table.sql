-- Found while checking Vault for the Apify token: send_email() has always
-- referenced public.email_log, but the table itself was never actually
-- present in the live database (the original migration file exists in git,
-- but this table doesn't exist here) — every insert into email_log was
-- throwing an error, which meant send_email() didn't just skip quietly, it
-- threw, which meant every caller (applicant inserts, approve/reject/reply,
-- bonus claim notifications, trial-crossing alerts) was failing outright.
-- Recreating exactly what the original migration specified.
create table if not exists public.email_log (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  to_email text not null,
  subject text not null,
  kind text,
  request_id bigint,
  skipped_reason text
);

create index if not exists email_log_created_at_idx on public.email_log (created_at desc);

alter table public.email_log enable row level security;

drop policy if exists email_log_admin_select on public.email_log;
create policy email_log_admin_select on public.email_log
  for select to authenticated
  using (public.auth_role() = 'admin');
