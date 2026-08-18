-- Real folder/doc IDs discovered directly in Smith's Drive (not guessed, not
-- asked for again) — the exact shape task #36 needs to write contracts and
-- onboarding details to the right place for each business.
alter table public.businesses add column drive_signed_contracts_folder_id text;
alter table public.businesses add column drive_database_doc_id text;

update public.businesses set
  drive_signed_contracts_folder_id = '1rt1u3zsLXMcBr3jKwKMOAnpY4kUvy-Ww',
  drive_database_doc_id = '1HYDnzyZUuyZjNOobvzItIJou39nzhVWEUQlAnQn_dNo'
  where slug = 'northquest';

update public.businesses set
  drive_signed_contracts_folder_id = '10sFLQkchP7CNm9gMIp7CroJDTomqzJRf',
  drive_database_doc_id = '1VOUiG1As_Nhbq-R6oZ5oBjP164jK9q-dtHBNFJom4OM'
  where slug = 'cashdrive';

-- Aura's SIGNED CONTRACTS folder exists; its onboarding doc doesn't yet
-- (folder was empty at check time) — drive_database_doc_id stays null and
-- the sync creates it on first use, matching the NQ UGC DATABASE format.
update public.businesses set
  drive_signed_contracts_folder_id = '1IsBL2Xb_KfBCXsICc71e50dB5gSx4J7N'
  where slug = 'aura';

-- Bonus claim status changes surface as an in-app bell instead of an email
-- (there was never an email for this specifically — that path was already
-- removed earlier). Null until the creator has actually seen this claim's
-- current (non-pending) status.
alter table public.bonus_claims add column creator_seen_at timestamptz;
