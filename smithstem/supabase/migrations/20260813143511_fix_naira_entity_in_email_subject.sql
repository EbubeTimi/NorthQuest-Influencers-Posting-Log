-- Subject lines are plain text, not HTML: an entity there arrives literally as
-- "&#8358;100,000" in the inbox. The naira sign goes in as a real character.
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
      'Your ₦' || to_char(v_amount, 'FM999,999,999') || ' bonus was approved',
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
