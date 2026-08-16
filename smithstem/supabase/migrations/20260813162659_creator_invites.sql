-- Letting someone in over WhatsApp instead of email. The link itself is the
-- credential, so it is treated like a password: only its hash is stored, and
-- the raw token is returned exactly once, at the moment it is created. A copy
-- of this table is therefore useless to whoever takes it.

create table public.creator_invites (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id),
  -- Free text so Smith can tell one pending invite from another. Not an email:
  -- the creator chooses that themselves when they join.
  label text not null,
  -- Optional check against the number Smith already has in WhatsApp. Weak on
  -- its own, but it stops a casually forwarded link from working.
  phone_last4 text check (phone_last4 is null or phone_last4 ~ '^[0-9]{4}$'),
  token_hash text not null unique,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz,
  used_by uuid references public.profiles(id),
  revoked_at timestamptz,
  -- Null for an invite, which creates a new account. Set for a recovery link,
  -- which reopens an existing creator's account. This is what tells the two
  -- apart: the system never guesses, because the choice is made by which
  -- button Smith pressed.
  creator_id uuid references public.creators(id) on delete cascade
);

create index creator_invites_business_idx on public.creator_invites (business_id, created_at desc);

alter table public.creator_invites enable row level security;

-- Only admins of the business ever see these rows, and nobody sees a usable
-- token. Redemption does not read the table directly; it goes through the
-- functions below.
create policy invites_admin_all on public.creator_invites
  for all to authenticated
  using (business_id = public.auth_business_id() and public.auth_role() = 'admin')
  with check (business_id = public.auth_business_id() and public.auth_role() = 'admin');

-- Creating an invite. Returns the raw token once; only its hash is kept.
create or replace function public.create_creator_invite(
  p_label text,
  p_phone_last4 text default null,
  p_creator_id uuid default null
)
returns table (token text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public, extensions
as $fn$
declare
  v_token text;
  v_expires timestamptz;
begin
  if public.auth_role() <> 'admin' then
    raise exception 'only an admin can create an invite' using errcode = '42501';
  end if;
  if coalesce(trim(p_label), '') = '' then
    raise exception 'an invite needs a label so you can tell it apart';
  end if;

  -- A recovery link opens an account that already holds bank details and pay
  -- history, so it lives for minutes, not days, and must be tapped during the
  -- conversation that produced it.
  if p_creator_id is not null then
    if not exists (select 1 from public.creators c
                   where c.id = p_creator_id and c.business_id = public.auth_business_id()) then
      raise exception 'that creator is not in your business' using errcode = '42501';
    end if;
    v_expires := now() + interval '15 minutes';
  else
    v_expires := now() + interval '3 days';
  end if;

  v_token := encode(extensions.gen_random_bytes(24), 'hex');

  insert into public.creator_invites
    (business_id, label, phone_last4, token_hash, created_by, expires_at, creator_id)
  values
    (public.auth_business_id(), trim(p_label), p_phone_last4,
     encode(extensions.digest(v_token, 'sha256'), 'hex'),
     auth.uid(), v_expires, p_creator_id);

  return query select v_token, v_expires;
end;
$fn$;

revoke all on function public.create_creator_invite(text, text, uuid) from public, anon;
grant execute on function public.create_creator_invite(text, text, uuid) to authenticated;

-- Checking a link before asking anyone for their details. Says only whether the
-- link works and what it is for — never who it was made for, never anything
-- that would help someone guessing at tokens.
create or replace function public.peek_creator_invite(p_token text)
returns table (valid boolean, reason text, kind text, needs_phone boolean, business_name text)
language plpgsql
security definer
set search_path = public, extensions
as $fn$
declare v_row public.creator_invites;
begin
  select * into v_row from public.creator_invites
   where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex');

  if not found then
    return query select false, 'invalid'::text, null::text, false, null::text; return;
  end if;
  if v_row.revoked_at is not null then
    return query select false, 'revoked'::text, null::text, false, null::text; return;
  end if;
  if v_row.used_at is not null then
    return query select false, 'used'::text, null::text, false, null::text; return;
  end if;
  if v_row.expires_at < now() then
    return query select false, 'expired'::text, null::text, false, null::text; return;
  end if;

  return query
    select true,
           null::text,
           case when v_row.creator_id is null then 'invite' else 'recovery' end,
           v_row.phone_last4 is not null,
           (select b.name from public.businesses b where b.id = v_row.business_id);
end;
$fn$;

revoke all on function public.peek_creator_invite(text) from public;
grant execute on function public.peek_creator_invite(text) to anon, authenticated;
