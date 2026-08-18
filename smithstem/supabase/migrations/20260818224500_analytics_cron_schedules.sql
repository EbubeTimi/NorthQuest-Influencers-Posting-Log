-- Weekly collation fires the morning after each business's own gate closes;
-- northquest/cashdrive are calendar-month-anchored (2nd/9th/16th/23rd/30th
-- covers every block, including the shorter trailing one — cron silently
-- skips days that don't exist in a given month), aura fires every Tuesday
-- (the morning after its Monday-Sunday week). Monthly Apify scrape starts
-- once a month for every business, then a second cron collects the results
-- roughly an hour later once the Apify runs have finished — already-done
-- businesses are skipped, so a slow month just gets picked up next tick.
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'analytics-weekly-northquest', '0 1 2,9,16,23,30 * *',
  $$ select net.http_post(
    url := 'https://zuuhlowjqniadtcpdypv.supabase.co/functions/v1/analytics-weekly?business=northquest',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_shared_secret'))
  ); $$
);

select cron.schedule(
  'analytics-weekly-cashdrive', '0 1 2,9,16,23,30 * *',
  $$ select net.http_post(
    url := 'https://zuuhlowjqniadtcpdypv.supabase.co/functions/v1/analytics-weekly?business=cashdrive',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_shared_secret'))
  ); $$
);

select cron.schedule(
  'analytics-weekly-aura', '0 1 * * 2',
  $$ select net.http_post(
    url := 'https://zuuhlowjqniadtcpdypv.supabase.co/functions/v1/analytics-weekly?business=aura',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_shared_secret'))
  ); $$
);

select cron.schedule(
  'analytics-monthly-start', '0 2 1 * *',
  $$ select net.http_post(
    url := 'https://zuuhlowjqniadtcpdypv.supabase.co/functions/v1/analytics-monthly?phase=start',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_shared_secret'))
  ); $$
);

select cron.schedule(
  'analytics-monthly-collect', '0 3 1,2,3,4,5 * *',
  $$ select net.http_post(
    url := 'https://zuuhlowjqniadtcpdypv.supabase.co/functions/v1/analytics-monthly?phase=collect',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_shared_secret'))
  ); $$
);
