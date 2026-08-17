-- Approved: the redesigned log form's optional "Any issues today?" field
-- (e.g. "Instagram was down") — context for admin that the log form had
-- nowhere to capture before.
alter table public.video_logs add column issue_note text;
