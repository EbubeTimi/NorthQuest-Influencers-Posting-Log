-- Facebook is auto-linked to Instagram per the trial guides (every Instagram
-- post also goes to Facebook automatically), but it's still a distinct post
-- with its own URL and its own view count, so it needs its own place to log
-- and report, same shape as TikTok/Instagram.
alter table public.video_logs add column facebook_url text;

alter table public.video_view_reports drop constraint video_view_reports_platform_check;
alter table public.video_view_reports add constraint video_view_reports_platform_check
  check (platform in ('tiktok', 'instagram', 'facebook'));
