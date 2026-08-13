-- Supabase's free tier pauses a project after roughly a week without activity,
-- which silently takes Smithstem offline. The pause is judged on requests
-- arriving at the project's API, so an internal query is not enough: the ping
-- has to leave the database and come back in through PostgREST as a real
-- request. pg_net makes that outbound call, pg_cron schedules it.
--
-- The key below is the anon key, which is public by design and safe in source.
-- Row Level Security, not key secrecy, is the access boundary.
create or replace function public.keepalive_tick()
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_request_id bigint;
begin
  select net.http_post(
    url := 'https://zuuhlowjqniadtcpdypv.supabase.co/rest/v1/rpc/ping',
    body := '{}'::jsonb,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1dWhsb3dqcW5pYWR0Y3BkeXB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3Nzc4MTUsImV4cCI6MjEwMTM1MzgxNX0.jVwib7vyA0rL-Ra7BfIOG97b6zOSkNzk4MaJjux0_uo',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1dWhsb3dqcW5pYWR0Y3BkeXB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3Nzc4MTUsImV4cCI6MjEwMTM1MzgxNX0.jVwib7vyA0rL-Ra7BfIOG97b6zOSkNzk4MaJjux0_uo'
    ),
    timeout_milliseconds := 8000
  ) into v_request_id;

  insert into public.system_heartbeat (source, request_id)
  values ('pg_cron', v_request_id);

  -- Keep the log honest but bounded.
  delete from public.system_heartbeat where ran_at < now() - interval '90 days';
end;
$fn$;

-- Nothing outside the scheduler should be able to fire this.
revoke all on function public.keepalive_tick() from public;
revoke all on function public.keepalive_tick() from anon, authenticated;

select cron.unschedule('smithstem-keepalive')
where exists (select 1 from cron.job where jobname = 'smithstem-keepalive');

select cron.schedule('smithstem-keepalive', '17 6 * * *', $job$select public.keepalive_tick()$job$);
