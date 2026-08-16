create or replace function public.peek_creator_invite(p_token text, p_phone_last4 text default null)
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
  if v_row.phone_last4 is not null and (p_phone_last4 is null or p_phone_last4 <> v_row.phone_last4) then
    return query select false, 'needs_phone'::text,
      case when v_row.creator_id is null then 'invite' else 'recovery' end,
      true,
      (select b.name from public.businesses b where b.id = v_row.business_id);
    return;
  end if;

  return query
    select true, null::text,
           case when v_row.creator_id is null then 'invite' else 'recovery' end,
           false,
           (select b.name from public.businesses b where b.id = v_row.business_id);
end;
$fn$;

revoke all on function public.peek_creator_invite(text, text) from public;
grant execute on function public.peek_creator_invite(text, text) to anon, authenticated;

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
  if exists (select 1 from public.profiles where id = auth.uid()) then
    raise exception 'this account already has a profile';
  end if;

  select email into v_email from auth.users where id = auth.uid();
  select name into v_bname from public.businesses where id = v_row.business_id;

  insert into public.profiles (id, business_id, role, full_name, email, phone)
  values (auth.uid(), v_row.business_id, 'creator', p_full_name, v_email, p_phone);

  insert into public.creators (profile_id, business_id, status)
  values (auth.uid(), v_row.business_id, 'active')
  returning id into v_creator_id;

  update public.creator_invites set used_at = now(), used_by = auth.uid() where id = v_row.id;

  return query select v_row.business_id, v_creator_id, v_bname;
end;
$fn$;

revoke all on function public.redeem_creator_invite(text, text, text, text) from public, anon;
grant execute on function public.redeem_creator_invite(text, text, text, text) to authenticated;
