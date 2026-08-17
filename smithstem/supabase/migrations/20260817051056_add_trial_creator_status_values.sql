-- Two new stages ahead of 'active': 'trial' (unproven, no pay, name + own
-- profile link only) and 'trial_approved' (a video crossed the threshold and
-- Smith reviewed it — unlocks the creator's own "Complete your onboarding"
-- step, it does not promote them by itself). Added in its own migration
-- because Postgres will not let a new enum value be used in the same
-- transaction that creates it.
alter type creator_status add value 'trial';
alter type creator_status add value 'trial_approved';
