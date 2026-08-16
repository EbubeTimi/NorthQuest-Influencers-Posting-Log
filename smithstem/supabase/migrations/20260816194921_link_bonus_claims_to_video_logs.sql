-- A creator's bonus claim must point at one specific video they already
-- logged, instead of a free-typed link that nothing checks against. This is
-- the structural fix for duplicate claims: the database itself refuses a
-- second non-rejected claim on the same video, rather than relying on the
-- app to notice.
alter table bonus_claims
  add column video_log_id uuid references video_logs(id) on delete set null;

-- Partial so it only governs claims made through the new flow (existing rows
-- keep video_log_id null and are untouched) and so a claim that was
-- rejected can be resubmitted against the same video without collision.
create unique index bonus_claims_one_active_per_video
  on bonus_claims (video_log_id)
  where video_log_id is not null and status <> 'rejected';

-- Self-insert now requires a video_log_id, and it must actually belong to
-- the inserting creator's own video — otherwise a client could point a
-- claim at someone else's logged video.
drop policy bonus_claims_self_insert on bonus_claims;
create policy bonus_claims_self_insert on bonus_claims
  for insert
  with check (
    creator_id = auth_creator_id()
    and submitted_by = 'creator'
    and status = 'pending'
    and video_log_id is not null
    and exists (
      select 1 from video_logs vl
      where vl.id = video_log_id and vl.creator_id = auth_creator_id()
    )
  );
