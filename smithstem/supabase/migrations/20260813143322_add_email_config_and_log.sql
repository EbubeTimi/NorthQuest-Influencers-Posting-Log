-- Settings that change without a code change: the sending identity, and the
-- master switch. The Resend API key is NOT here — it lives in Vault.
create table if not exists public.app_config (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

alter table public.app_config enable row level security;

drop policy if exists app_config_admin_all on public.app_config;
create policy app_config_admin_all on public.app_config
  for all to authenticated
  using (public.auth_role() = 'admin')
  with check (public.auth_role() = 'admin');

insert into public.app_config (key, value) values
  ('email_from',     'Smithstem <notifications@example.com>'),
  ('email_reply_to', 'smithonyekwereh1@gmail.com'),
  ('email_enabled',  'false'),
  ('app_url',        'https://smithstem.vercel.app')
on conflict (key) do nothing;

-- Every send attempt is recorded. Email that silently fails is worse than no
-- email at all, because everyone assumes it went out.
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
