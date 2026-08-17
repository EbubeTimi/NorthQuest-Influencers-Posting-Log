-- Not every business pays a bonus at all — Smith confirmed CashDrive and
-- Aura by Antroph don't. Previously an empty bonus_tiers table would still
-- let a creator submit a claim that just silently computed to ₦0, which is
-- misleading rather than a real "no bonus" experience. This flag hides the
-- whole claim flow on the creator dashboard, and the tier editor on the
-- admin Payments tab, when off. Mirrors trial_enabled's exact shape.
alter table public.businesses add column bonus_enabled boolean not null default true;
update public.businesses set bonus_enabled = false where slug = 'cashdrive';

-- These were seeded in the prior pass on the "same as NorthQuest for now"
-- assumption, before Smith clarified CashDrive doesn't do bonuses at all.
-- No claims exist yet against them (CashDrive has no creators on the
-- platform yet), so a clean delete rather than leaving dead, confusing rows.
delete from public.bonus_tiers where business_id = (select id from public.businesses where slug = 'cashdrive');
