-- Task #34: the bonus-claim flow already emails admin the moment a creator
-- needs a decision (notify_bonus_claim_submitted). The trial-crossing queue
-- never got the same treatment — right now the only way Smith finds out a
-- trial creator's video crossed the view threshold is by opening the Trial
-- tab and looking. Same pattern as bonus claims: fire once, the moment it
-- actually becomes true, not on every report after.
alter table public.video_logs add column trial_crossing_notified_at timestamptz;

create or replace function public.notify_trial_crossing()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_video record;
  v_threshold bigint;
  v_combined bigint;
  v_creator_name text;
  v_app_url text;
  admin_row record;
begin
  select vl.id, vl.log_date, vl.post_number, vl.business_id, vl.trial_review_dismissed_at, vl.trial_crossing_notified_at,
         c.status as creator_status, p.full_name as creator_name
    into v_video
  from public.video_logs vl
  join public.creators c on c.id = vl.creator_id
  join public.profiles p on p.id = c.profile_id
  where vl.id = new.video_log_id;

  if v_video.creator_status <> 'trial' then return new; end if;
  if v_video.trial_review_dismissed_at is not null then return new; end if;
  if v_video.trial_crossing_notified_at is not null then return new; end if;

  select trial_view_threshold into v_threshold from public.businesses where id = v_video.business_id;

  select coalesce(sum(platform_max), 0) into v_combined
  from (
    select platform, max(views) as platform_max
    from public.video_view_reports
    where video_log_id = new.video_log_id
    group by platform
  ) per_platform;

  if v_combined < v_threshold then return new; end if;

  select value into v_app_url from public.app_config where key = 'app_url';

  for admin_row in
    select email from public.profiles
    where business_id = v_video.business_id and role = 'admin' and email is not null
  loop
    perform public.send_email(
      admin_row.email,
      coalesce(v_video.creator_name, 'A trial creator') || ' crossed ' || to_char(v_threshold, 'FM999,999,999') || ' views',
      public.email_shell(
        'A trial crossing is waiting for you',
        '<p style="margin:0 0 12px"><strong>' || coalesce(v_video.creator_name, 'A trial creator') ||
          '</strong>''s video from ' || to_char(v_video.log_date, 'DD Mon YYYY') || ' (post ' || v_video.post_number ||
          ') has reached <strong>' || to_char(v_combined, 'FM999,999,999') || ' views</strong>, past the ' ||
          to_char(v_threshold, 'FM999,999,999') || '-view threshold.</p>' ||
        '<p style="margin:0">Approving unlocks their "Complete your onboarding" step — it does not move them to active by itself.</p>',
        'Review the crossing',
        coalesce(v_app_url, 'https://smithstem.vercel.app') || '/admin'
      ),
      'trial_crossing'
    );
  end loop;

  update public.video_logs set trial_crossing_notified_at = now() where id = new.video_log_id;

  return new;
end;
$fn$;

drop trigger if exists trial_crossing_email on public.video_view_reports;
create trigger trial_crossing_email
  after insert on public.video_view_reports
  for each row execute function public.notify_trial_crossing();
