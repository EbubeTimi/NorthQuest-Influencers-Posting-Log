-- Views were one combined number per video; Smith wants TikTok and
-- Instagram tracked separately (a video posted to both platforms can earn a
-- bonus on each independently), summed only for the combined display/total.
-- Table has zero rows so far, so this is a plain NOT NULL add, no backfill.
alter table video_view_reports add column platform text not null check (platform in ('tiktok', 'instagram'));
