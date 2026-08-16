alter table public.bonus_claims add column if not exists screenshot_url text;

alter table public.bonus_claims drop constraint if exists bonus_claims_has_evidence;
alter table public.bonus_claims add constraint bonus_claims_has_evidence
  check (video_url is not null or screenshot_url is not null);

insert into storage.buckets (id, name, public)
values ('bonus-evidence', 'bonus-evidence', false)
on conflict (id) do nothing;

create policy bonus_evidence_own_write on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'bonus-evidence'
    and (storage.foldername(name))[1] = public.auth_creator_id()::text
  );

create policy bonus_evidence_own_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'bonus-evidence'
    and (
      (storage.foldername(name))[1] = public.auth_creator_id()::text
      or (
        public.auth_role() = 'admin'
        and exists (
          select 1 from public.creators c
          where c.id::text = (storage.foldername(name))[1]
            and c.business_id = public.auth_business_id()
        )
      )
    )
  );
