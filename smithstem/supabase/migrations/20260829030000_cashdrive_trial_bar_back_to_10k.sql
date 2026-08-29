-- Correction from Smith, 29 Aug: the trial bar is 10,000 views across every
-- GrowthCooks brand, with no exceptions. CashDrive had been set to 5,000
-- earlier in August on the basis of its own content guide; that reading is
-- superseded by this direct instruction.
update public.businesses set trial_view_threshold = 10000 where slug = 'cashdrive';
