-- The unified /apply page has to match the real Google Form Smith and
-- Ella already use (screenshotted directly), not a rewritten version of
-- it: camera-access and editing-skill yes/no questions, a required video
-- upload (not a link-or-upload choice), and a city field. Added here so
-- the real form's answers land in real columns instead of being lost.
alter table public.applicants add column has_camera boolean;
alter table public.applicants add column has_editing_skills boolean;
alter table public.applicants add column location_city text;

-- Small global (not per-business) config store — first use is remembering
-- the Google Sheet the apply-sync function creates on its first real
-- submission, and the TDT root folder to create it in. Not a secret, so a
-- plain table rather than Vault; only the service role touches it.
create table public.app_settings (
  key text primary key,
  value text
);
alter table public.app_settings enable row level security;

insert into public.app_settings (key, value) values ('tdt_root_folder_id', '1_AJQaijZCt0byX2maD4X08UQQDfOOZl_');
