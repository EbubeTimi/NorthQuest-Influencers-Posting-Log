-- Smith's call: creators find out about a bonus by opening their dashboard,
-- not by receiving an email. Email is now only ever used to get into the
-- system the first time. That leaves the notification machinery as code that
-- would fire on every claim, do nothing useful, and quietly consume the
-- sending quota reserved for sign-in codes — so it goes.
--
-- The payments trigger is a different thing and stays: approving a claim still
-- adds the money automatically, which is what makes the dashboard worth
-- opening in the first place.

drop trigger if exists bonus_claim_submitted_email on public.bonus_claims;
drop trigger if exists bonus_claim_reviewed_email on public.bonus_claims;

drop function if exists public.notify_bonus_claim_submitted();
drop function if exists public.notify_bonus_claim_reviewed();
drop function if exists public.send_email(text, text, text, uuid);
drop function if exists public.email_shell(text, text);

drop table if exists public.email_log;
