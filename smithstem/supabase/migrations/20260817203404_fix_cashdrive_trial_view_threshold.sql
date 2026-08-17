-- CashDrive Cars' real trial guide (attached by Smith) states the trial bar
-- is 5,000 views on a single video, not the 10,000 default every other
-- business happens to share. Correcting the seeded value to match source.
update public.businesses set trial_view_threshold = 5000 where slug = 'cashdrive';
