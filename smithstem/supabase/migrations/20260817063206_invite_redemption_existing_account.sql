-- Real gap: an invite for a second business always rejected outright if the
-- account already had a profile — the exact case of a NorthQuest creator
-- also being invited to CashDrive. Now it adds the membership + creator row
-- for the new business instead, and switches their active business to it
-- (they can switch back with the existing business switcher any time) —
-- safe because guard_profile_privileges already allows a business_id change
-- onto any business a membership row exists for, which this creates first.
-- The brand-new-signup branch is unchanged.
create or replace function public.redeem_creator_invite(p_token text, p_phone_last4 text, p_full_name text, p_phone text)
returns table(business_id uuid, creator_id uuid, business_name text)
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
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
    insert into public.creators (profile_id, business_id, status)
    values (auth.uid(), v_row.business_id, 'active')
    returning id into v_creator_id;
    update public.profiles set business_id = v_row.business_id where id = auth.uid();
  else
    select email into v_email from auth.users where id = auth.uid();
    insert into public.profiles (id, business_id, role, full_name, email, phone)
    values (auth.uid(), v_row.business_id, 'creator', p_full_name, v_email, p_phone);
    insert into public.creators (profile_id, business_id, status)
    values (auth.uid(), v_row.business_id, 'active')
    returning id into v_creator_id;
  end if;

  update public.creator_invites set used_at = now(), used_by = auth.uid() where id = v_row.id;

  return query select v_row.business_id, v_creator_id, v_bname;
end;
$function$;
