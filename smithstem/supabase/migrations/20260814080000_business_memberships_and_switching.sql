-- One account, several businesses. profiles.business_id becomes "which
-- business is active right now" rather than a permanent single assignment.
-- auth_business_id() and auth_role() already read straight from that column,
-- so nothing elsewhere in the schema has to change — switching is just moving
-- the pointer, safely.

create table public.business_memberships (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  business_id uuid not null references public.businesses(id),
  role public.user_role not null,
  created_at timestamptz not null default now(),
  unique (profile_id, business_id)
);

alter table public.business_memberships enable row level security;

create policy memberships_self_select on public.business_memberships
  for select to authenticated
  using (profile_id = auth.uid());

insert into public.business_memberships (profile_id, business_id, role)
select id, business_id, role from public.profiles
on conflict (profile_id, business_id) do nothing;

create or replace function public.profile_creates_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  insert into public.business_memberships (profile_id, business_id, role)
  values (new.id, new.business_id, new.role)
  on conflict (profile_id, business_id) do nothing;
  return new;
end;
$fn$;

drop trigger if exists profiles_create_membership on public.profiles;
create trigger profiles_create_membership
  after insert on public.profiles
  for each row execute function public.profile_creates_membership();

create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare v_membership public.business_memberships;
begin
  if new.role is distinct from old.role or new.business_id is distinct from old.business_id then
    if auth.uid() is not null then
      select * into v_membership from public.business_memberships
       where profile_id = old.id and business_id = new.business_id;
      if not found then
        raise exception 'you can only switch into a business you belong to' using errcode = '42501';
      end if;
      new.role := v_membership.role;
    end if;
  end if;
  return new;
end;
$fn$;

drop policy if exists businesses_authed_select on public.businesses;
create policy businesses_via_membership_select on public.businesses
  for select to authenticated
  using (exists (
    select 1 from public.business_memberships m
    where m.business_id = businesses.id and m.profile_id = auth.uid()
  ));

alter table public.creators drop constraint if exists creators_profile_id_key;
alter table public.creators add constraint creators_profile_business_key unique (profile_id, business_id);

create or replace function public.auth_creator_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $fn$ select id from public.creators where profile_id = auth.uid() and business_id = public.auth_business_id() $fn$;

create or replace function public.create_business(p_name text, p_slug text)
returns uuid
language plpgsql
security definer
set search_path = public
as $fn$
declare v_id uuid;
begin
  if public.auth_role() <> 'admin' then
    raise exception 'only an admin can create a business' using errcode = '42501';
  end if;
  insert into public.businesses (name, slug) values (trim(p_name), trim(p_slug)) returning id into v_id;
  insert into public.business_memberships (profile_id, business_id, role) values (auth.uid(), v_id, 'admin');
  return v_id;
end;
$fn$;

revoke all on function public.create_business(text, text) from public, anon;
grant execute on function public.create_business(text, text) to authenticated;

create or replace function public.add_creator_to_current_business(p_email text, p_base_pay numeric)
returns uuid
language plpgsql
security definer
set search_path = public
as $fn$
declare v_profile_id uuid; v_business uuid; v_creator_id uuid;
begin
  if public.auth_role() <> 'admin' then
    raise exception 'only an admin can add a creator' using errcode = '42501';
  end if;
  v_business := public.auth_business_id();

  select id into v_profile_id from public.profiles where lower(email) = lower(trim(p_email));
  if not found then
    raise exception 'no Smithstem account with that email yet — send them an invite instead';
  end if;
  if exists (select 1 from public.business_memberships where profile_id = v_profile_id and business_id = v_business) then
    raise exception 'that person already belongs to this business';
  end if;

  insert into public.business_memberships (profile_id, business_id, role) values (v_profile_id, v_business, 'creator');
  insert into public.creators (profile_id, business_id, base_pay, status)
  values (v_profile_id, v_business, p_base_pay, 'active')
  returning id into v_creator_id;
  return v_creator_id;
end;
$fn$;

revoke all on function public.add_creator_to_current_business(text, numeric) from public, anon;
grant execute on function public.add_creator_to_current_business(text, numeric) to authenticated;
