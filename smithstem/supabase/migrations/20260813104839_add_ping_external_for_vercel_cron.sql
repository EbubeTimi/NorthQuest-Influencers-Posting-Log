-- The external (Vercel Cron) ping logs itself, so both defences show up in the
-- same heartbeat table and it is obvious at a glance whether each one is alive.
-- Callable by anon because Vercel Cron authenticates at the route, not here.
-- Abuse is bounded by only recording one row per hour: anyone hammering it
-- still just keeps the database awake, which is the entire point of it.
create or replace function public.ping_external()
returns timestamptz
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if not exists (
    select 1 from public.system_heartbeat
    where source = 'vercel' and ran_at > now() - interval '1 hour'
  ) then
    insert into public.system_heartbeat (source) values ('vercel');
  end if;
  return now();
end;
$fn$;

revoke all on function public.ping_external() from public;
grant execute on function public.ping_external() to anon, authenticated;
