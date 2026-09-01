-- Per-business Apify accounts.
--
-- New rule from Smith (1 Sept): each brand scrapes with its OWN Apify account,
-- not one shared token. The account we have today is NorthQuest's alone. Aura
-- and CashDrive will each get a separate Apify account later; until their token
-- is loaded, they must pull nothing at all — no error, just skipped.
--
-- Tokens stay in Vault (never in a table, never in git), one secret per brand,
-- named apify_api_token_<slug> e.g. apify_api_token_northquest. This RPC returns
-- the token for one business, or NULL when that brand has no account configured
-- yet. The monthly function treats NULL as "skip this brand".
--
-- Same shape as get_apify_token()/get_drive_service_account(): SECURITY DEFINER,
-- vault in search_path, execute granted to service_role only. plpgsql (not sql)
-- so the NorthQuest legacy fallback can be expressed.
create or replace function public.get_business_apify_token(p_business_id uuid)
returns text
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_slug  text;
  v_token text;
begin
  select slug into v_slug from public.businesses where id = p_business_id;
  if v_slug is null then
    return null;
  end if;

  select decrypted_secret into v_token
  from vault.decrypted_secrets
  where name = 'apify_api_token_' || v_slug
  limit 1;

  -- The original single-account token predates this split and belonged to
  -- NorthQuest. Fall back to it so NorthQuest keeps scraping the moment this
  -- ships, without Smith having to re-enter anything. Remove the fallback once
  -- the NorthQuest token has been re-saved under its per-brand name.
  if v_token is null and v_slug = 'northquest' then
    select decrypted_secret into v_token
    from vault.decrypted_secrets
    where name = 'apify_api_token'
    limit 1;
  end if;

  return v_token;
end;
$$;

-- DROP/CREATE resets grants, so set them explicitly (the project's standing
-- gotcha). Never reachable by anon or authenticated — only the Edge Functions,
-- which run as service_role.
revoke all on function public.get_business_apify_token(uuid) from public, anon, authenticated;
grant execute on function public.get_business_apify_token(uuid) to service_role;

-- The old global getter is now only NorthQuest's fallback source. Leave it in
-- place (the new RPC calls its underlying secret) but it should no longer be
-- called directly by the monthly function.
comment on function public.get_apify_token() is
  'Legacy single-account Apify token (NorthQuest only). Prefer get_business_apify_token(business_id), which scopes per brand and returns NULL for brands with no account yet.';
