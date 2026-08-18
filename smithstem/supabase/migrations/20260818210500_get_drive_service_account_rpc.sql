-- vault.decrypted_secrets is not exposed over PostgREST, even to service_role
-- — the drive-sync Edge Function needs a narrow, service-role-only door to
-- read the one secret it needs, nothing else in Vault.
create or replace function public.get_drive_service_account()
returns text
language sql
security definer
set search_path = public, vault
as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'google_drive_service_account_json' limit 1;
$$;

revoke all on function public.get_drive_service_account() from public, anon, authenticated;
grant execute on function public.get_drive_service_account() to service_role;
