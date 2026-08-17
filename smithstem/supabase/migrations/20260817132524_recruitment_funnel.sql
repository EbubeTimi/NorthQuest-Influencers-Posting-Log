-- Task #7: the recruitment funnel, built to the prototype Smith approved —
-- public job page → application → Ella's queue with a real reply thread →
-- approve (trial link emailed) / reject (note emailed). Applicants are
-- never authenticated — the whole entry form is a public write, same trust
-- model as any public contact form; everything after submission is
-- admin-gated the same way every other admin surface in this schema is.
create table public.applicants (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id),
  full_name text not null,
  email text not null,
  phone text,
  content_mode text not null check (content_mode in ('link', 'upload')),
  content_link text,
  content_file_path text,
  question text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  review_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id)
);
create index applicants_business_idx on public.applicants (business_id, created_at desc);

alter table public.applicants enable row level security;

create policy applicants_public_insert on public.applicants
  for insert to anon, authenticated
  with check (
    coalesce(trim(full_name), '') <> '' and coalesce(trim(email), '') <> ''
    and (content_mode = 'link' and coalesce(trim(content_link), '') <> '' or content_mode = 'upload' and coalesce(trim(content_file_path), '') <> '')
  );

create policy applicants_admin_all on public.applicants
  for all to authenticated
  using (public.auth_role() = 'admin' and business_id = public.auth_business_id())
  with check (public.auth_role() = 'admin' and business_id = public.auth_business_id());

-- The applicant's own question lives on the row above; this table is only
-- the admin's side of the conversation, since an unauthenticated applicant
-- has no session to write a reply back into — their replies arrive as
-- ordinary email, out of band, until inbound routing exists.
create table public.applicant_messages (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references public.applicants(id) on delete cascade,
  business_id uuid not null references public.businesses(id),
  body text not null,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id)
);
create index applicant_messages_applicant_idx on public.applicant_messages (applicant_id, created_at);

alter table public.applicant_messages enable row level security;
create policy applicant_messages_admin_all on public.applicant_messages
  for all to authenticated
  using (public.auth_role() = 'admin' and business_id = public.auth_business_id())
  with check (public.auth_role() = 'admin' and business_id = public.auth_business_id());

-- Anonymous uploads are bounded at the bucket level (size + type) since
-- there's no authenticated identity to scope a folder-ownership check
-- against — same trust model as the rest of this public form.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('applicant-videos', 'applicant-videos', false, 104857600, array['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v'])
on conflict (id) do nothing;

create policy applicant_videos_public_upload on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'applicant-videos');

create policy applicant_videos_admin_read on storage.objects
  for select to authenticated
  using (bucket_id = 'applicant-videos' and public.auth_role() = 'admin' and (storage.foldername(name))[1] = public.auth_business_id()::text);

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
begin
  if public.auth_role() <> 'admin' then
    raise exception 'only an admin can review applicants' using errcode = '42501';
  end if;
  select * into v_applicant from public.applicants where id = p_applicant_id and business_id = public.auth_business_id();
  if not found then raise exception 'that applicant is not in your business'; end if;

  update public.applicants set status = 'approved', reviewed_at = now(), reviewed_by = auth.uid() where id = p_applicant_id;

  select name, slug into v_business_name, v_trial_slug from public.businesses where id = v_applicant.business_id;
  select value into v_app_url from public.app_config where key = 'app_url';

  perform public.send_email(
    v_applicant.email,
    'You''re in — start your trial with ' || v_business_name,
    public.email_shell(
      'Welcome to ' || v_business_name,
      '<p style="margin:0 0 12px">Hi ' || coalesce(split_part(v_applicant.full_name, ' ', 1), 'there') || ',</p>' ||
      '<p style="margin:0 0 12px">Your application looked great — you''re ready to start your trial.</p>' ||
      '<p style="margin:0">Tap below to get going. Your accounts stay yours, nothing is handed over yet.</p>',
      'Start my trial',
      coalesce(v_app_url, 'https://smithstem.vercel.app') || '/trial/' || v_trial_slug
    ),
    'applicant_approved'
  );
end;
$fn$;
revoke all on function public.approve_applicant(uuid) from public, anon;
grant execute on function public.approve_applicant(uuid) to authenticated;

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
  select * into v_applicant from public.applicants where id = p_applicant_id and business_id = public.auth_business_id();
  if not found then raise exception 'that applicant is not in your business'; end if;

  update public.applicants set status = 'rejected', review_note = p_note, reviewed_at = now(), reviewed_by = auth.uid() where id = p_applicant_id;

  select name into v_business_name from public.businesses where id = v_applicant.business_id;

  perform public.send_email(
    v_applicant.email,
    'About your application to ' || v_business_name,
    public.email_shell(
      'Your application wasn''t successful this time',
      '<p style="margin:0 0 12px">Hi ' || coalesce(split_part(v_applicant.full_name, ' ', 1), 'there') || ',</p>' ||
      '<p style="margin:0 0 12px">Thanks for applying to ' || v_business_name || ' — it wasn''t a fit this time.</p>' ||
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
  select * into v_applicant from public.applicants where id = p_applicant_id and business_id = public.auth_business_id();
  if not found then raise exception 'that applicant is not in your business'; end if;

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

-- Same shape as notify_bonus_claim_submitted — a new applicant is the one
-- event on this table that genuinely needs a human to look.
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
    select email from public.profiles where business_id = new.business_id and role = 'admin' and email is not null
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
        '<p style="margin:0">Review their content and answer any questions from the Applicants tab.</p>',
        'Review the application',
        coalesce(v_app_url, 'https://smithstem.vercel.app') || '/admin'
      ),
      'applicant_submitted'
    );
  end loop;
  return new;
end;
$fn$;
drop trigger if exists applicant_submitted_email on public.applicants;
create trigger applicant_submitted_email
  after insert on public.applicants
  for each row execute function public.notify_new_applicant();
