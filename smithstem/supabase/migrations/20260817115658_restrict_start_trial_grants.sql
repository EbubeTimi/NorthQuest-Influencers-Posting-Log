-- start_trial has carried default PUBLIC/anon EXECUTE since it was first
-- created — never actually exploitable (it raises immediately when
-- auth.uid() is null, and the client only calls it right after signUp()
-- succeeds, by which point the session is 'authenticated' not 'anon'), but
-- every other privileged RPC in this schema is authenticated-only as a
-- matter of posture, not just as a backstop. Found while auditing grants
-- after catching the same gap on redeem_creator_invite moments ago.
revoke all on function public.start_trial(text, text, text, text) from public, anon;
grant execute on function public.start_trial(text, text, text, text) to authenticated;
