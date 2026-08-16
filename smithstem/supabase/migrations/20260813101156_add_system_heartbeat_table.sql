-- Proof-of-life log. Admins can read it so a human can confirm at a glance that
-- the keep-alive is actually running, rather than trusting that it is.
create table if not exists public.system_heartbeat (
  id bigint generated always as identity primary key,
  ran_at timestamptz not null default now(),
  source text not null,
  request_id bigint
);

create index if not exists system_heartbeat_ran_at_idx
  on public.system_heartbeat (ran_at desc);

alter table public.system_heartbeat enable row level security;

drop policy if exists system_heartbeat_admin_select on public.system_heartbeat;
create policy system_heartbeat_admin_select on public.system_heartbeat
  for select to authenticated
  using (public.auth_role() = 'admin');
