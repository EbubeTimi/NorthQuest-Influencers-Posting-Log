-- Shared shell so every Smithstem email looks like the same product.
create or replace function public.email_shell(p_heading text, p_body_html text, p_cta_label text default null, p_cta_url text default null)
returns text
language sql
immutable
as $fn$
  select
    '<div style="font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,sans-serif;background:#f6f7f9;padding:32px 16px">' ||
      '<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;padding:32px">' ||
        '<div style="font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#7c5cff;margin-bottom:20px">Smithstem</div>' ||
        '<h1 style="margin:0 0 16px;font-size:20px;line-height:1.35;color:#12141a">' || p_heading || '</h1>' ||
        '<div style="font-size:15px;line-height:1.6;color:#3d4250">' || p_body_html || '</div>' ||
        coalesce(
          '<div style="margin-top:28px"><a href="' || p_cta_url || '" style="display:inline-block;background:#7c5cff;color:#fff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:10px">' || p_cta_label || '</a></div>',
          ''
        ) ||
      '</div>' ||
      '<p style="max-width:520px;margin:16px auto 0;font-size:12px;color:#8b909d;text-align:center">You are receiving this because you have a Smithstem account.</p>' ||
    '</div>'
  from (select 1) _
$fn$;

-- Money for a given view count, using the same tiers the app reads. Highest
-- qualifying tier wins, matching how bonuses are actually paid.
create or replace function public.bonus_amount_for(p_business_id uuid, p_views bigint)
returns numeric
language sql
stable
security definer
set search_path = public
as $fn$
  select coalesce(max(amount), 0)
  from public.bonus_tiers
  where business_id = p_business_id and min_views <= p_views
$fn$;

-- A creator submitting a claim is the one event that genuinely needs a human.
-- Nobody should have to open the admin panel on the off-chance.
create or replace function public.notify_bonus_claim_submitted()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_creator_name text;
  v_amount numeric;
  v_app_url text;
  admin_row record;
begin
  if new.status <> 'pending' then
    return new;
  end if;

  select p.full_name into v_creator_name
  from public.creators c join public.profiles p on p.id = c.profile_id
  where c.id = new.creator_id;

  v_amount := public.bonus_amount_for(new.business_id, new.views);
  select value into v_app_url from public.app_config where key = 'app_url';

  for admin_row in
    select email from public.profiles
    where business_id = new.business_id and role = 'admin' and email is not null
  loop
    perform public.send_email(
      admin_row.email,
      coalesce(v_creator_name, 'A creator') || ' claimed a ' || to_char(new.views, 'FM999,999,999') || ' view bonus',
      public.email_shell(
        'A bonus claim is waiting for you',
        '<p style="margin:0 0 12px"><strong>' || coalesce(v_creator_name, 'A creator') || '</strong> submitted a claim for <strong>' ||
          to_char(new.views, 'FM999,999,999') || ' views</strong>, which is worth <strong>&#8358;' ||
          to_char(v_amount, 'FM999,999,999') || '</strong> at the current tiers.</p>' ||
        case when new.video_url is not null and new.video_url <> ''
             then '<p style="margin:0 0 12px">Video: <a href="' || new.video_url || '" style="color:#7c5cff">' || new.video_url || '</a></p>'
             else '' end ||
        '<p style="margin:0">It stays pending, and unpaid, until someone approves it.</p>',
        'Review the claim',
        coalesce(v_app_url, 'https://smithstem.vercel.app') || '/admin'
      ),
      'bonus_claim_submitted'
    );
  end loop;

  return new;
end;
$fn$;

-- The creator finding out is the whole point of the approval queue existing.
create or replace function public.notify_bonus_claim_reviewed()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_email text;
  v_name text;
  v_amount numeric;
  v_app_url text;
begin
  if new.status = old.status or new.status = 'pending' then
    return new;
  end if;

  select p.email, p.full_name into v_email, v_name
  from public.creators c join public.profiles p on p.id = c.profile_id
  where c.id = new.creator_id;

  v_amount := public.bonus_amount_for(new.business_id, new.views);
  select value into v_app_url from public.app_config where key = 'app_url';

  if new.status = 'approved' then
    perform public.send_email(
      v_email,
      'Your &#8358;' || to_char(v_amount, 'FM999,999,999') || ' bonus was approved',
      public.email_shell(
        'Your bonus was approved',
        '<p style="margin:0 0 12px">Hi ' || coalesce(split_part(v_name, ' ', 1), 'there') || ',</p>' ||
        '<p style="margin:0 0 12px">Your claim for <strong>' || to_char(new.views, 'FM999,999,999') ||
          ' views</strong> has been approved, and <strong>&#8358;' || to_char(v_amount, 'FM999,999,999') ||
          '</strong> has been added to your payments.</p>' ||
        '<p style="margin:0">It will go out with your next monthly payment.</p>',
        'See your payments',
        coalesce(v_app_url, 'https://smithstem.vercel.app') || '/dashboard'
      ),
      'bonus_claim_approved'
    );
  else
    perform public.send_email(
      v_email,
      'About your bonus claim',
      public.email_shell(
        'Your bonus claim was not approved',
        '<p style="margin:0 0 12px">Hi ' || coalesce(split_part(v_name, ' ', 1), 'there') || ',</p>' ||
        '<p style="margin:0 0 12px">Your claim for <strong>' || to_char(new.views, 'FM999,999,999') ||
          ' views</strong> was not approved this time.</p>' ||
        case when new.review_note is not null and new.review_note <> ''
             then '<p style="margin:0 0 12px;padding:12px 14px;background:#f6f7f9;border-radius:10px">' || new.review_note || '</p>'
             else '' end ||
        '<p style="margin:0">If you think this is wrong, reply to this email and we will take another look.</p>',
        'Open Smithstem',
        coalesce(v_app_url, 'https://smithstem.vercel.app') || '/dashboard'
      ),
      'bonus_claim_rejected'
    );
  end if;

  return new;
end;
$fn$;

drop trigger if exists bonus_claim_submitted_email on public.bonus_claims;
create trigger bonus_claim_submitted_email
  after insert on public.bonus_claims
  for each row execute function public.notify_bonus_claim_submitted();

drop trigger if exists bonus_claim_reviewed_email on public.bonus_claims;
create trigger bonus_claim_reviewed_email
  after update of status on public.bonus_claims
  for each row execute function public.notify_bonus_claim_reviewed();
