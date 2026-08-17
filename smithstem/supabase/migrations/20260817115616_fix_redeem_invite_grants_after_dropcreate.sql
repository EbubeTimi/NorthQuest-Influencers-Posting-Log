-- The DROP FUNCTION + CREATE FUNCTION in the previous migration reset
-- privileges to Postgres's default (EXECUTE to PUBLIC, which includes
-- anon) — I forgot to re-apply the revoke/grant that every other
-- SECURITY DEFINER function in this schema carries. The function itself
-- was never actually exploitable (it raises immediately on auth.uid() is
-- null), but every other privileged RPC here is authenticated-only as a
-- matter of posture, not just as a backstop, so this closes the gap.
revoke all on function public.redeem_creator_invite(text, text, text, text) from public, anon;
grant execute on function public.redeem_creator_invite(text, text, text, text) to authenticated;
