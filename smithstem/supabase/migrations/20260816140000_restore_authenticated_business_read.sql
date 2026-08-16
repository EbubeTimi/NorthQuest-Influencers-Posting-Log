-- Onboarding reads a business's id/slug/name before the creator has any
-- profile or membership row linking them to it — that link is exactly what
-- onboarding is in the middle of creating. The membership-scoped select
-- policies added for multi-business switching cannot satisfy that read, so
-- every brand-new signup stalled on "Setting things up..." forever with no
-- error, because .single() returned zero rows under RLS and the failure was
-- silently swallowed.
--
-- A business's name and slug are not sensitive — they are already visible on
-- public /join/[token] links to anyone with the URL. Restoring open read
-- access for any authenticated user closes the gap without reopening
-- anything that was actually private (bonus_tiers, creators, payments all
-- keep their own, unchanged, business-scoped policies).
create policy businesses_authenticated_select on public.businesses
  for select
  to authenticated
  using (true);
