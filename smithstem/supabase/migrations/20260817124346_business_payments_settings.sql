-- Task: build the approved Business & Payments Settings prototype for real.
-- create_business already existed (name+slug only, from earlier this
-- session) with a bare prompt()-based client. Extending it to accept the
-- same fields the prototype collected, plus a friendly duplicate-slug
-- error instead of a raw constraint violation reaching the UI.
drop function public.create_business(text, text);
create function public.create_business(
  p_name text,
  p_slug text,
  p_default_base_pay numeric default 150000,
  p_bonus_enabled boolean default true,
  p_trial_enabled boolean default true
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_id uuid;
begin
  if public.auth_role() <> 'admin' then
    raise exception 'only an admin can create a business' using errcode = '42501';
  end if;
  if coalesce(trim(p_name), '') = '' then
    raise exception 'a business needs a name';
  end if;
  if coalesce(trim(p_slug), '') = '' then
    raise exception 'a business needs a slug';
  end if;
  if p_default_base_pay <= 0 then
    raise exception 'default base pay must be greater than zero';
  end if;
  if exists (select 1 from public.businesses where slug = trim(p_slug)) then
    raise exception 'that slug is already taken by another business';
  end if;

  insert into public.businesses (name, slug, default_base_pay, bonus_enabled, trial_enabled)
  values (trim(p_name), trim(p_slug), p_default_base_pay, p_bonus_enabled, p_trial_enabled)
  returning id into v_id;
  insert into public.business_memberships (profile_id, business_id, role) values (auth.uid(), v_id, 'admin');
  return v_id;
end;
$function$;

revoke all on function public.create_business(text, text, numeric, boolean, boolean) from public, anon;
grant execute on function public.create_business(text, text, numeric, boolean, boolean) to authenticated;

-- Configurable Payments columns, per business. Null means "use the built-in
-- default order" so every existing business keeps working unchanged. Shape:
-- [{ key, label, type: 'text'|'number'|'currency'|'account', custom: bool }, ...]
alter table public.businesses add column payment_columns jsonb;

-- Where a custom column's per-creator-per-month value lives — the built-in
-- columns (base pay, videos, bonus, etc.) all already compute or store
-- their value elsewhere; a custom column has no such source, so it's typed
-- in by hand and kept here, same spirit as referral_bonus/oop_expense.
alter table public.payments add column custom_fields jsonb not null default '{}'::jsonb;
