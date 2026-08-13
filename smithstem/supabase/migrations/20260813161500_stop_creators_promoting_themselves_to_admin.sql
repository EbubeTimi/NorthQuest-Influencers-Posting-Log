-- A signed-in creator could run `update profiles set role='admin'` against the
-- API and become an admin of their own business. From there they could read
-- every creator's bank details and contracts, and approve their own bonus
-- claims. Confirmed by driving it as an ordinary authenticated user.
--
-- Row Level Security cannot express "this column may not change" — a policy's
-- WITH CHECK sees only the new row, never the old one — so the rule is enforced
-- by a trigger instead.

create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if new.role is distinct from old.role
     or new.business_id is distinct from old.business_id then
    -- auth.uid() is null for backend, service-role and SQL-editor sessions.
    -- Anything arriving with an end-user token is refused, without exception.
    if auth.uid() is not null then
      raise exception 'role and business_id cannot be changed by the account holder'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$fn$;

drop trigger if exists profiles_guard_privileges on public.profiles;
create trigger profiles_guard_privileges
  before update on public.profiles
  for each row execute function public.guard_profile_privileges();

-- Signing up must not be a way to arrive as an admin either. Onboarding always
-- creates a creator; admins are made deliberately, out of band.
drop policy if exists profiles_self_insert on public.profiles;
create policy profiles_self_insert on public.profiles
  for insert to authenticated
  with check (id = auth.uid() and role = 'creator');

-- base_pay decides what someone is owed, so it is not the new creator's to set.
-- Onboarding does not send it; this makes sending it fail rather than be
-- silently honoured. Admins set pay afterwards through creators_admin_all.
drop policy if exists creators_self_insert on public.creators;
create policy creators_self_insert on public.creators
  for insert to authenticated
  with check (
    profile_id = auth.uid()
    and business_id = public.auth_business_id()
    and base_pay = 150000
    and status = 'active'
  );
