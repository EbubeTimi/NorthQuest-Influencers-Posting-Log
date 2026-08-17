-- Task: TDT Technologies unified recruitment funnel, approved after several
-- rounds of prototype review. One public /apply link replaces business-
-- specific-only entry; applicants land unassigned and an admin places them
-- with a brand before the existing reply/approve/reject flow continues.

-- 1. Applicants can now exist with no business yet.
alter table public.applicants alter column business_id drop not null;

-- 2. Public insert: phone is now required (used for the WhatsApp group
-- invite), and business_id is deliberately left out of the check — the
-- unified apply page never sets it.
drop policy if exists applicants_public_insert on public.applicants;
create policy applicants_public_insert on public.applicants
  for insert to anon, authenticated
  with check (
    coalesce(trim(full_name), '') <> '' and coalesce(trim(email), '') <> '' and coalesce(trim(phone), '') <> ''
    and (content_mode = 'link' and coalesce(trim(content_link), '') <> '' or content_mode = 'upload' and coalesce(trim(content_file_path), '') <> '')
  );

-- 3. Admin visibility: unassigned applicants are visible to any admin (so
-- whoever picks up the queue can place them), and once assigned, visibility
-- follows real business membership rather than whichever business happens
-- to be selected in the switcher right now — the Applicants tab shows every
-- business an admin actually runs, not just the currently active one.
drop policy if exists applicants_admin_all on public.applicants;
create policy applicants_admin_all on public.applicants
  for all to authenticated
  using (
    public.auth_role() = 'admin'
    and (
      business_id is null
      or exists (select 1 from public.business_memberships bm where bm.profile_id = auth.uid() and bm.business_id = applicants.business_id and bm.role = 'admin')
    )
  )
  with check (
    public.auth_role() = 'admin'
    and (
      business_id is null
      or exists (select 1 from public.business_memberships bm where bm.profile_id = auth.uid() and bm.business_id = applicants.business_id and bm.role = 'admin')
    )
  );

drop policy if exists applicant_messages_admin_all on public.applicant_messages;
create policy applicant_messages_admin_all on public.applicant_messages
  for all to authenticated
  using (
    public.auth_role() = 'admin'
    and exists (select 1 from public.business_memberships bm where bm.profile_id = auth.uid() and bm.business_id = applicant_messages.business_id and bm.role = 'admin')
  )
  with check (
    public.auth_role() = 'admin'
    and exists (select 1 from public.business_memberships bm where bm.profile_id = auth.uid() and bm.business_id = applicant_messages.business_id and bm.role = 'admin')
  );

-- 4. Uploaded videos no longer sit under a business-id folder — there's no
-- business yet at upload time for the unified page. Read access follows the
-- same any-admin rule as the unassigned queue itself; the old per-business
-- folder convention still works fine, it's just no longer load-bearing.
drop policy if exists applicant_videos_admin_read on storage.objects;
create policy applicant_videos_admin_read on storage.objects
  for select to authenticated
  using (bucket_id = 'applicant-videos' and public.auth_role() = 'admin');

-- 5. Per-business WhatsApp group invite link — fixed, admin-set once,
-- pulled into the approval email automatically. Not a WhatsApp API
-- integration, just a stored URL.
alter table public.businesses add column whatsapp_group_link text;

-- 6. The actual "place this applicant with a brand" action.
create or replace function public.assign_applicant_to_business(p_applicant_id uuid, p_business_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_applicant public.applicants;
begin
  if public.auth_role() <> 'admin' then
    raise exception 'only an admin can place an applicant' using errcode = '42501';
  end if;
  if not exists (select 1 from public.business_memberships bm where bm.profile_id = auth.uid() and bm.business_id = p_business_id and bm.role = 'admin') then
    raise exception 'you do not administer that business' using errcode = '42501';
  end if;
  select * into v_applicant from public.applicants where id = p_applicant_id;
  if not found then raise exception 'applicant not found'; end if;
  if v_applicant.business_id is not null then
    raise exception 'this applicant is already placed with a business';
  end if;
  update public.applicants set business_id = p_business_id where id = p_applicant_id;
end;
$fn$;
revoke all on function public.assign_applicant_to_business(uuid, uuid) from public, anon;
grant execute on function public.assign_applicant_to_business(uuid, uuid) to authenticated;

-- 7. Approval email now carries the WhatsApp group link alongside the
-- trial-start link, and matches the "you've been picked" framing Smith
-- dictated. Still one email, no DM.
create or replace function public.approve_applicant(p_applicant_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_applicant public.applicants;
  v_app_url text;
  v_business_name text;
  v_trial_slug text;
  v_wa_link text;
begin
  if public.auth_role() <> 'admin' then
    raise exception 'only an admin can review applicants' using errcode = '42501';
  end if;
  select * into v_applicant from public.applicants where id = p_applicant_id;
  if not found then raise exception 'applicant not found'; end if;
  if v_applicant.business_id is null then
    raise exception 'place this applicant with a business first';
  end if;
  if not exists (select 1 from public.business_memberships bm where bm.profile_id = auth.uid() and bm.business_id = v_applicant.business_id and bm.role = 'admin') then
    raise exception 'you do not administer that business' using errcode = '42501';
  end if;

  update public.applicants set status = 'approved', reviewed_at = now(), reviewed_by = auth.uid() where id = p_applicant_id;

  select name, slug, whatsapp_group_link into v_business_name, v_trial_slug, v_wa_link from public.businesses where id = v_applicant.business_id;
  select value into v_app_url from public.app_config where key = 'app_url';

  perform public.send_email(
    v_applicant.email,
    'You''ve been picked to join the ' || v_business_name || ' creator team',
    public.email_shell(
      'Welcome to ' || v_business_name,
      '<p style="margin:0 0 12px">Hi ' || coalesce(split_part(v_applicant.full_name, ' ', 1), 'there') || ',</p>' ||
      '<p style="margin:0 0 12px">Your application looked great — you''ve been picked to be a content creator for the ' || v_business_name || ' team. Here''s everything to get started.</p>' ||
      (case when v_wa_link is not null and trim(v_wa_link) <> ''
            then '<p style="margin:0 0 12px"><a href="' || v_wa_link || '" style="color:#0B6B4F">Join the ' || v_business_name || ' trial WhatsApp group →</a></p>'
            else '' end),
      'Start my trial',
      coalesce(v_app_url, 'https://smithstem.vercel.app') || '/trial/' || v_trial_slug
    ),
    'applicant_approved'
  );
end;
$fn$;
revoke all on function public.approve_applicant(uuid) from public, anon;
grant execute on function public.approve_applicant(uuid) to authenticated;

-- 8. reject_applicant / reply_to_applicant: same membership-based check
-- instead of auth_business_id(), so they work regardless of the admin's
-- active switcher selection.
create or replace function public.reject_applicant(p_applicant_id uuid, p_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_applicant public.applicants;
  v_business_name text;
begin
  if public.auth_role() <> 'admin' then
    raise exception 'only an admin can review applicants' using errcode = '42501';
  end if;
  select * into v_applicant from public.applicants where id = p_applicant_id;
  if not found then raise exception 'applicant not found'; end if;
  if v_applicant.business_id is not null and not exists (select 1 from public.business_memberships bm where bm.profile_id = auth.uid() and bm.business_id = v_applicant.business_id and bm.role = 'admin') then
    raise exception 'you do not administer that business' using errcode = '42501';
  end if;

  update public.applicants set status = 'rejected', review_note = p_note, reviewed_at = now(), reviewed_by = auth.uid() where id = p_applicant_id;

  select name into v_business_name from public.businesses where id = v_applicant.business_id;

  perform public.send_email(
    v_applicant.email,
    'About your application' || (case when v_business_name is not null then ' to ' || v_business_name else '' end),
    public.email_shell(
      'Your application wasn''t successful this time',
      '<p style="margin:0 0 12px">Hi ' || coalesce(split_part(v_applicant.full_name, ' ', 1), 'there') || ',</p>' ||
      '<p style="margin:0 0 12px">Thanks for applying' || (case when v_business_name is not null then ' to ' || v_business_name else '' end) || ' — it wasn''t a fit this time.</p>' ||
      case when p_note is not null and trim(p_note) <> ''
           then '<p style="margin:0 0 12px;padding:12px 14px;background:#f6f7f9;border-radius:10px">' || p_note || '</p>'
           else '' end ||
      '<p style="margin:0">We appreciate the time you put in.</p>',
      null, null
    ),
    'applicant_rejected'
  );
end;
$fn$;
revoke all on function public.reject_applicant(uuid, text) from public, anon;
grant execute on function public.reject_applicant(uuid, text) to authenticated;

create or replace function public.reply_to_applicant(p_applicant_id uuid, p_body text)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_applicant public.applicants;
  v_business_name text;
begin
  if public.auth_role() <> 'admin' then
    raise exception 'only an admin can reply to applicants' using errcode = '42501';
  end if;
  if coalesce(trim(p_body), '') = '' then
    raise exception 'the reply cannot be empty';
  end if;
  select * into v_applicant from public.applicants where id = p_applicant_id;
  if not found then raise exception 'applicant not found'; end if;
  if v_applicant.business_id is null or not exists (select 1 from public.business_memberships bm where bm.profile_id = auth.uid() and bm.business_id = v_applicant.business_id and bm.role = 'admin') then
    raise exception 'place this applicant with a business first' using errcode = '42501';
  end if;

  insert into public.applicant_messages (applicant_id, business_id, body, created_by)
  values (p_applicant_id, v_applicant.business_id, p_body, auth.uid());

  select name into v_business_name from public.businesses where id = v_applicant.business_id;

  perform public.send_email(
    v_applicant.email,
    'Reply from ' || v_business_name,
    public.email_shell(
      'You''ve got a reply',
      '<p style="margin:0 0 12px">Hi ' || coalesce(split_part(v_applicant.full_name, ' ', 1), 'there') || ',</p>' ||
      '<p style="margin:0">' || p_body || '</p>',
      null, null
    ),
    'applicant_reply'
  );
end;
$fn$;
revoke all on function public.reply_to_applicant(uuid, text) from public, anon;
grant execute on function public.reply_to_applicant(uuid, text) to authenticated;

-- 9. New-applicant notification now reaches every admin across every
-- business, not just profiles.business_id = new.business_id — which
-- wouldn't match anything while the applicant is unassigned.
create or replace function public.notify_new_applicant()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_app_url text;
  admin_row record;
begin
  select value into v_app_url from public.app_config where key = 'app_url';
  for admin_row in
    select distinct p.email from public.business_memberships bm
    join public.profiles p on p.id = bm.profile_id
    where bm.role = 'admin' and p.email is not null
  loop
    perform public.send_email(
      admin_row.email,
      new.full_name || ' applied to join',
      public.email_shell(
        'A new application is waiting for you',
        '<p style="margin:0 0 12px"><strong>' || new.full_name || '</strong> (' || new.email || ') just applied.</p>' ||
        (case when new.question is not null and trim(new.question) <> ''
              then '<p style="margin:0 0 12px;padding:12px 14px;background:#f6f7f9;border-radius:10px">' || new.question || '</p>'
              else '' end) ||
        '<p style="margin:0">Place them with a brand and review from the Applicants tab.</p>',
        'Review the application',
        coalesce(v_app_url, 'https://smithstem.vercel.app') || '/admin'
      ),
      'applicant_submitted'
    );
  end loop;
  return new;
end;
$fn$;
