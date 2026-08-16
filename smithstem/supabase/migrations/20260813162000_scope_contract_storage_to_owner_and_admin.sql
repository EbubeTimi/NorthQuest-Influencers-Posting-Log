-- The contracts bucket was readable and writable by any signed-in user, so one
-- creator could fetch another's signed contract, or overwrite it with their
-- own. Objects are stored at "<creator_id>/signature.png", so the owning
-- creator is the first path segment.
drop policy if exists contracts_own_read on storage.objects;
drop policy if exists contracts_own_write on storage.objects;

create policy contracts_own_write on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'contracts'
    and (storage.foldername(name))[1] = public.auth_creator_id()::text
  );

-- Onboarding uploads with upsert, which needs update as well as insert.
create policy contracts_own_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'contracts'
    and (storage.foldername(name))[1] = public.auth_creator_id()::text
  )
  with check (
    bucket_id = 'contracts'
    and (storage.foldername(name))[1] = public.auth_creator_id()::text
  );

create policy contracts_own_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'contracts'
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
