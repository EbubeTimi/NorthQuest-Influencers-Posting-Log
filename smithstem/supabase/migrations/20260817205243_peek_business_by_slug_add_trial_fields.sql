-- Needs trial_view_threshold (the trial-start page shouldn't hardcode
-- 10,000 — CashDrive's real bar is 5,000) and whatsapp_group_link (so the
-- trial-start page can offer it too, same link as the approval email).
drop function if exists public.peek_business_by_slug(text);
create function public.peek_business_by_slug(p_slug text)
returns table(business_id uuid, business_name text, trial_enabled boolean, trial_view_threshold int, whatsapp_group_link text)
language sql
security definer
set search_path = public
as $fn$
  select id, name, trial_enabled, trial_view_threshold, whatsapp_group_link from businesses where slug = p_slug;
$fn$;
-- Intentionally public: applicants and trial-starters call this before
-- they have any session at all.
grant execute on function public.peek_business_by_slug(text) to anon, authenticated;
