-- The cheapest possible endpoint that still proves the database answered.
-- Called through PostgREST at /rest/v1/rpc/ping.
create or replace function public.ping()
returns timestamptz
language sql
stable
security definer
set search_path = public
as $$ select now() $$;

revoke all on function public.ping() from public;
grant execute on function public.ping() to anon, authenticated;
