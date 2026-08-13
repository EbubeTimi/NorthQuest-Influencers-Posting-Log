-- Sends through Resend's HTTP API using pg_net. Living in the database means a
-- notification fires from whatever changed the row — creator dashboard, admin
-- panel, or anything added later — and does not depend on the web app running.
--
-- The API key is read from Vault, so it never appears in source or in a
-- migration. Nothing is sent until email_enabled is 'true' and a key exists,
-- and every outcome (sent or skipped, and why) lands in email_log.
create or replace function public.send_email(
  p_to text,
  p_subject text,
  p_html text,
  p_kind text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_key text;
  v_from text;
  v_reply_to text;
  v_enabled text;
  v_request_id bigint;
begin
  if p_to is null or p_to = '' then
    insert into public.email_log (to_email, subject, kind, skipped_reason)
    values (coalesce(p_to, ''), p_subject, p_kind, 'no recipient address');
    return;
  end if;

  select value into v_enabled from public.app_config where key = 'email_enabled';
  if coalesce(v_enabled, 'false') <> 'true' then
    insert into public.email_log (to_email, subject, kind, skipped_reason)
    values (p_to, p_subject, p_kind, 'email_enabled is not true');
    return;
  end if;

  select decrypted_secret into v_key
  from vault.decrypted_secrets where name = 'resend_api_key';

  if v_key is null then
    insert into public.email_log (to_email, subject, kind, skipped_reason)
    values (p_to, p_subject, p_kind, 'no resend_api_key in vault');
    return;
  end if;

  select value into v_from from public.app_config where key = 'email_from';
  select value into v_reply_to from public.app_config where key = 'email_reply_to';

  select net.http_post(
    url := 'https://api.resend.com/emails',
    body := jsonb_build_object(
      'from', v_from,
      'to', jsonb_build_array(p_to),
      'reply_to', v_reply_to,
      'subject', p_subject,
      'html', p_html
    ),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    timeout_milliseconds := 10000
  ) into v_request_id;

  insert into public.email_log (to_email, subject, kind, request_id)
  values (p_to, p_subject, p_kind, v_request_id);
end;
$fn$;

-- Only triggers and admins-by-way-of-triggers send mail. Never the browser.
revoke all on function public.send_email(text, text, text, text) from public;
revoke all on function public.send_email(text, text, text, text) from anon, authenticated;
