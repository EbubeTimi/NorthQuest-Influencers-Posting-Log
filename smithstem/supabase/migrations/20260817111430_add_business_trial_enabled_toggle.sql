-- Trial is on by default for every business (Smith's explicit stated
-- default), but toggleable off per business. peek_business_by_slug now
-- also reports it so the link itself can show an honest state rather than
-- a form that would fail on submit; start_trial() is the actual gate.
alter table businesses add column trial_enabled boolean not null default true;

drop function public.peek_business_by_slug(text);
create function public.peek_business_by_slug(p_slug text)
returns table(business_id uuid, business_name text, trial_enabled boolean)
language sql
security definer
set search_path to 'public'
as $$
  select id, name, trial_enabled from businesses where slug = p_slug;
$$;

create or replace function public.start_trial(p_business_slug text, p_full_name text, p_tiktok_url text, p_insta_url text)
returns table(business_id uuid, creator_id uuid, business_name text)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_business_id uuid;
  v_bname text;
  v_trial_enabled boolean;
  v_creator_id uuid;
  v_email text;
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  if coalesce(trim(p_full_name), '') = '' then
    raise exception 'a name is required';
  end if;
  if coalesce(trim(p_tiktok_url), '') = '' and coalesce(trim(p_insta_url), '') = '' then
    raise exception 'at least one profile link is required';
  end if;
  if exists (select 1 from profiles where id = auth.uid()) then
    raise exception 'this account already has a profile';
  end if;

  select id, name, trial_enabled into v_business_id, v_bname, v_trial_enabled from businesses where slug = p_business_slug;
  if v_business_id is null then
    raise exception 'that business could not be found';
  end if;
  if not v_trial_enabled then
    raise exception 'trial sign-ups are not open for this business right now';
  end if;

  select email into v_email from auth.users where id = auth.uid();

  insert into profiles (id, business_id, role, full_name, email)
  values (auth.uid(), v_business_id, 'creator', p_full_name, v_email);

  insert into creators (profile_id, business_id, status, tiktok_profile_url, insta_profile_url)
  values (auth.uid(), v_business_id, 'trial', nullif(trim(p_tiktok_url), ''), nullif(trim(p_insta_url), ''))
  returning id into v_creator_id;

  return query select v_business_id, v_creator_id, v_bname;
end;
$function$;
