-- Task #32: bringing the ~35 real NorthQuest creators across from the old
-- spreadsheet system. Normal invite redemption already skips trial and goes
-- straight to 'active' + full onboarding (bank + contract) — that part
-- needed nothing new. The actual gap: a migrated creator's real base pay,
-- socials, and tenure (joined_at) had nowhere to travel from "admin fills
-- this in when creating the invite" to "the creators row that gets created
-- when they redeem it." Everything defaulted (150000, null, null, today).
--
-- These columns are staged data on the invite itself, not a new table —
-- an invite is already a one-shot, expiring, single-use envelope, which is
-- exactly the right lifetime for "this data is waiting for one specific
-- person to claim it." Historical video logs are deliberately out of scope
-- here (task #10, separate, blocked on Smith's actual old-system export) —
-- this is only about getting the person into the system as themselves,
-- with their real pay rate and tenure intact, so they can keep posting.
alter table public.creator_invites
  add column migration_base_pay numeric,
  add column migration_tiktok_url text,
  add column migration_insta_url text,
  add column migration_joined_at date;

drop function public.create_creator_invite(text, text, uuid);
create function public.create_creator_invite(
  p_label text,
  p_phone_last4 text default null,
  p_creator_id uuid default null,
  p_migration_base_pay numeric default null,
  p_migration_tiktok_url text default null,
  p_migration_insta_url text default null,
  p_migration_joined_at date default null
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
  if p_migration_base_pay is not null and p_migration_base_pay <= 0 then
    raise exception 'base pay must be greater than zero';
  end if;

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
    (business_id, label, phone_last4, token_hash, created_by, expires_at, creator_id,
     migration_base_pay, migration_tiktok_url, migration_insta_url, migration_joined_at)
  values
    (public.auth_business_id(), trim(p_label), p_phone_last4,
     encode(extensions.digest(v_token, 'sha256'), 'hex'),
     auth.uid(), v_expires, p_creator_id,
     p_migration_base_pay, nullif(trim(p_migration_tiktok_url), ''), nullif(trim(p_migration_insta_url), ''),
     p_migration_joined_at);

  return query select v_token, v_expires;
end;
$fn$;

revoke all on function public.create_creator_invite(text, text, uuid, numeric, text, text, date) from public, anon;
grant execute on function public.create_creator_invite(text, text, uuid, numeric, text, text, date) to authenticated;

drop function public.redeem_creator_invite(text, text, text, text);
create function public.redeem_creator_invite(
  p_token text,
  p_phone_last4 text,
  p_full_name text,
  p_phone text
)
returns table (business_id uuid, creator_id uuid, business_name text)
language plpgsql
security definer
set search_path = public, extensions
as $fn$
declare
  v_row public.creator_invites;
  v_creator_id uuid;
  v_email text;
  v_bname text;
  v_existing_profile public.profiles;
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;

  select * into v_row from public.creator_invites
   where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex');

  if not found then raise exception 'that link is not valid'; end if;
  if v_row.revoked_at is not null then raise exception 'that link has been cancelled'; end if;
  if v_row.used_at is not null then raise exception 'that link has already been used'; end if;
  if v_row.expires_at < now() then raise exception 'that link has expired'; end if;
  if v_row.phone_last4 is not null and (p_phone_last4 is null or p_phone_last4 <> v_row.phone_last4) then
    raise exception 'those last four digits do not match';
  end if;
  if v_row.creator_id is not null then
    raise exception 'this is a recovery link, not an invite';
  end if;

  select email into v_email from auth.users where id = auth.uid();
  select name into v_bname from public.businesses where id = v_row.business_id;

  select * into v_existing_profile from public.profiles where id = auth.uid();

  if v_existing_profile.id is not null then
    if exists (select 1 from public.business_memberships where profile_id = auth.uid() and business_id = v_row.business_id) then
      raise exception 'this account is already part of that business';
    end if;
    insert into public.business_memberships (profile_id, business_id, role)
    values (auth.uid(), v_row.business_id, 'creator');
    update public.profiles set business_id = v_row.business_id where id = auth.uid();
  else
    insert into public.profiles (id, business_id, role, full_name, email, phone)
    values (auth.uid(), v_row.business_id, 'creator', p_full_name, v_email, p_phone);
    insert into public.business_memberships (profile_id, business_id, role)
    values (auth.uid(), v_row.business_id, 'creator');
  end if;

  insert into public.creators (profile_id, business_id, status, base_pay, tiktok_profile_url, insta_profile_url, joined_at)
  values (
    auth.uid(), v_row.business_id, 'active',
    coalesce(v_row.migration_base_pay, 150000),
    v_row.migration_tiktok_url, v_row.migration_insta_url,
    coalesce(v_row.migration_joined_at, current_date)
  )
  returning id into v_creator_id;

  update public.creator_invites set used_at = now(), used_by = auth.uid() where id = v_row.id;

  return query select v_row.business_id, v_creator_id, v_bname;
end;
$fn$;

revoke all on function public.redeem_creator_invite(text, text, text, text) from public, anon;
grant execute on function public.redeem_creator_invite(text, text, text, text) to authenticated;
