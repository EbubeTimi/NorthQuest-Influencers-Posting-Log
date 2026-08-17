-- A trial creator is identified only by name + their own existing
-- TikTok/Instagram profile link — nothing is handed over yet, so no bank
-- details and no contract at this stage.
alter table creators add column tiktok_profile_url text;
alter table creators add column insta_profile_url text;
-- Recorded when Smith approves a crossing, so the qualifying video can carry
-- forward as the creator's real first/Nth video once onboarding completes,
-- instead of being re-entered.
alter table creators add column trial_qualifying_video_id uuid references video_logs(id);
alter table creators add column trial_approved_at timestamptz;

-- Set when Smith dismisses a crossing without approving it, so that same
-- video stops resurfacing in her review queue. A different video from the
-- same creator can still cross and surface on its own.
alter table video_logs add column trial_review_dismissed_at timestamptz;

-- A trial creator's weekly self-reported view count on one of their own
-- videos. This is what crossing detection reads, and doubles as the raw
-- data for the weekly views register later — it is not a bonus claim, no
-- evidence or approval involved, just what they say the count is right now.
create table video_view_reports (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id),
  creator_id uuid not null references creators(id) on delete cascade,
  video_log_id uuid not null references video_logs(id) on delete cascade,
  views bigint not null,
  reported_at timestamptz not null default now()
);
create index video_view_reports_video_idx on video_view_reports (video_log_id);

alter table video_view_reports enable row level security;
create policy video_view_reports_self_select on video_view_reports
  for select using (creator_id = auth_creator_id());
create policy video_view_reports_self_insert on video_view_reports
  for insert with check (
    creator_id = auth_creator_id()
    and exists (select 1 from video_logs vl where vl.id = video_log_id and vl.creator_id = auth_creator_id())
  );
create policy video_view_reports_admin_all on video_view_reports
  for all using (auth_role() = 'admin' and business_id = auth_business_id());

-- Anonymous-safe lookup for the standing trial link — same shape as
-- peek_creator_invite, callable before anyone is signed in.
create function peek_business_by_slug(p_slug text)
returns table(business_id uuid, business_name text)
language sql
security definer
set search_path to 'public'
as $$
  select id, name from businesses where slug = p_slug;
$$;

-- Mirrors redeem_creator_invite's shape (requires an already-established
-- session, created the same signUp-with-throwaway-password way) but creates
-- a 'trial' creator instead of 'active', and requires at least one profile
-- link since that link is the only identity a trial creator has.
create function start_trial(p_business_slug text, p_full_name text, p_tiktok_url text, p_insta_url text)
returns table(business_id uuid, creator_id uuid, business_name text)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_business_id uuid;
  v_bname text;
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

  select id, name into v_business_id, v_bname from businesses where slug = p_business_slug;
  if v_business_id is null then
    raise exception 'that business could not be found';
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
