-- Correction to the migration-fields pass moments ago: I reconstructed the
-- existing-account branch from memory and got it wrong — I added an explicit
-- business_memberships insert on the brand-new-signup branch, duplicating
-- the one profiles_create_membership already fires automatically on any
-- profiles insert. Restoring that branch to exactly its prior shape (no
-- manual membership insert there — only the has-profile branch needs one,
-- since that's an UPDATE-only profiles path the trigger never sees) and
-- carrying the staged migration fields onto the creators insert in both
-- branches, since a migrated creator could in principle already have an
-- account in another business.
create or replace function public.redeem_creator_invite(
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
  v_has_profile boolean;
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

  select name into v_bname from public.businesses where id = v_row.business_id;
  v_has_profile := exists (select 1 from public.profiles where id = auth.uid());

  if v_has_profile then
    if exists (select 1 from public.business_memberships where profile_id = auth.uid() and business_id = v_row.business_id) then
      raise exception 'this account is already part of that business';
    end if;
    insert into public.business_memberships (profile_id, business_id, role) values (auth.uid(), v_row.business_id, 'creator');
    insert into public.creators (profile_id, business_id, status, base_pay, tiktok_profile_url, insta_profile_url, joined_at)
    values (
      auth.uid(), v_row.business_id, 'active',
      coalesce(v_row.migration_base_pay, 150000),
      v_row.migration_tiktok_url, v_row.migration_insta_url,
      coalesce(v_row.migration_joined_at, current_date)
    )
    returning id into v_creator_id;
    update public.profiles set business_id = v_row.business_id where id = auth.uid();
  else
    select email into v_email from auth.users where id = auth.uid();
    insert into public.profiles (id, business_id, role, full_name, email, phone)
    values (auth.uid(), v_row.business_id, 'creator', p_full_name, v_email, p_phone);
    insert into public.creators (profile_id, business_id, status, base_pay, tiktok_profile_url, insta_profile_url, joined_at)
    values (
      auth.uid(), v_row.business_id, 'active',
      coalesce(v_row.migration_base_pay, 150000),
      v_row.migration_tiktok_url, v_row.migration_insta_url,
      coalesce(v_row.migration_joined_at, current_date)
    )
    returning id into v_creator_id;
  end if;

  update public.creator_invites set used_at = now(), used_by = auth.uid() where id = v_row.id;

  return query select v_row.business_id, v_creator_id, v_bname;
end;
$fn$;
