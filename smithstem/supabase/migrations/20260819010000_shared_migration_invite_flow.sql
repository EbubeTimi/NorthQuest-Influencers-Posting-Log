-- One shared link per business instead of one link per person — a creator
-- picks their own name from the still-pending migration roster, instead of
-- Smith individually messaging 47 separate links. Mirrors peek/redeem
-- _creator_invite exactly, just keyed by (business, label) instead of a
-- token, since there's no per-person link to carry a token in.
create or replace function public.list_pending_migration_invites(p_business_slug text)
returns table(label text, needs_phone boolean)
language sql
security definer
set search_path to 'public'
as $$
  select ci.label, (ci.phone_last4 is not null)
  from public.creator_invites ci
  join public.businesses b on b.id = ci.business_id
  where b.slug = p_business_slug
    and ci.creator_id is null
    and ci.used_at is null
    and ci.revoked_at is null
    and ci.expires_at > now()
  order by ci.label;
$$;

revoke all on function public.list_pending_migration_invites(text) from public;
grant execute on function public.list_pending_migration_invites(text) to anon, authenticated;

create or replace function public.peek_migration_invite(p_business_slug text, p_label text, p_phone_last4 text default null)
returns table(valid boolean, reason text, needs_phone boolean, business_name text)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_row public.creator_invites;
begin
  select ci.* into v_row
    from public.creator_invites ci
    join public.businesses b on b.id = ci.business_id
   where b.slug = p_business_slug
     and lower(trim(ci.label)) = lower(trim(p_label))
     and ci.creator_id is null
   order by ci.created_at desc
   limit 1;

  if not found then
    return query select false, 'invalid'::text, false, null::text; return;
  end if;
  if v_row.revoked_at is not null then
    return query select false, 'revoked'::text, false, null::text; return;
  end if;
  if v_row.used_at is not null then
    return query select false, 'used'::text, false, null::text; return;
  end if;
  if v_row.expires_at < now() then
    return query select false, 'expired'::text, false, null::text; return;
  end if;
  if v_row.phone_last4 is not null and (p_phone_last4 is null or p_phone_last4 <> v_row.phone_last4) then
    return query select false, 'needs_phone'::text, true,
      (select b.name from public.businesses b where b.id = v_row.business_id);
    return;
  end if;

  return query select true, null::text, false,
    (select b.name from public.businesses b where b.id = v_row.business_id);
end;
$function$;

revoke all on function public.peek_migration_invite(text, text, text) from public;
grant execute on function public.peek_migration_invite(text, text, text) to anon, authenticated;

create or replace function public.redeem_migration_invite(p_business_slug text, p_label text, p_phone_last4 text, p_full_name text, p_phone text)
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
  v_default_base_pay numeric;
  v_has_profile boolean;
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;

  select ci.* into v_row
    from public.creator_invites ci
    join public.businesses b on b.id = ci.business_id
   where b.slug = p_business_slug
     and lower(trim(ci.label)) = lower(trim(p_label))
     and ci.creator_id is null
   order by ci.created_at desc
   limit 1;

  if not found then raise exception 'that invite is not valid'; end if;
  if v_row.revoked_at is not null then raise exception 'that invite has been cancelled'; end if;
  if v_row.used_at is not null then raise exception 'that invite has already been used'; end if;
  if v_row.expires_at < now() then raise exception 'that invite has expired'; end if;
  if v_row.phone_last4 is not null and (p_phone_last4 is null or p_phone_last4 <> v_row.phone_last4) then
    raise exception 'those last four digits do not match';
  end if;

  select name, default_base_pay into v_bname, v_default_base_pay from public.businesses where id = v_row.business_id;
  v_has_profile := exists (select 1 from public.profiles where id = auth.uid());

  if v_has_profile then
    if exists (select 1 from public.business_memberships where profile_id = auth.uid() and business_id = v_row.business_id) then
      raise exception 'this account is already part of that business';
    end if;
    insert into public.business_memberships (profile_id, business_id, role) values (auth.uid(), v_row.business_id, 'creator');
    insert into public.creators (profile_id, business_id, status, base_pay, tiktok_profile_url, insta_profile_url, joined_at)
    values (
      auth.uid(), v_row.business_id, 'active',
      coalesce(v_row.migration_base_pay, v_default_base_pay),
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
      coalesce(v_row.migration_base_pay, v_default_base_pay),
      v_row.migration_tiktok_url, v_row.migration_insta_url,
      coalesce(v_row.migration_joined_at, current_date)
    )
    returning id into v_creator_id;
  end if;

  update public.creator_invites set used_at = now(), used_by = auth.uid() where id = v_row.id;

  return query select v_row.business_id, v_creator_id, v_bname;
end;
$function$;

revoke all on function public.redeem_migration_invite(text, text, text, text, text) from public;
grant execute on function public.redeem_migration_invite(text, text, text, text, text) to anon, authenticated;
