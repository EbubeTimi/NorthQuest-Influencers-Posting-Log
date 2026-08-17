-- Task #13 (reduced scope, per Smith): stand up CashDrive as a working
-- tenant now — recruitment page and Apify tracking follow once #7/#9 ship.
-- The businesses row, admins, and contract template already existed from
-- earlier testing this session. Two real gaps left: CashDrive had zero
-- bonus tiers (no bonus could ever be approved), and every business shared
-- one hardcoded base-pay default (150000) baked into redeem_creator_invite
-- — CashDrive creators should default to a flat 200000 per Smith, no bands.
alter table public.businesses add column default_base_pay numeric not null default 150000;
update public.businesses set default_base_pay = 200000 where slug = 'cashdrive';

-- Same tiers NorthQuest is actually live on today (2026-08-01 set), applied
-- to CashDrive from today — not backdated, since CashDrive has no claim
-- history yet for an earlier date to matter.
insert into public.bonus_tiers (business_id, min_views, amount, effective_from)
select id, v.min_views, v.amount, current_date
from public.businesses, (values
  (100000, 50000), (500000, 100000), (1000000, 250000),
  (2000000, 500000), (5000000, 1000000), (10000000, 2000000)
) as v(min_views, amount)
where slug = 'cashdrive';

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
  v_default_base_pay numeric;
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
$fn$;
