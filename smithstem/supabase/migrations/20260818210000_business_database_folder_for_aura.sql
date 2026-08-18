-- The Drive sync creates a business's DATABASE doc on first use if one
-- doesn't exist yet (Aura's case at launch — its DATABASE folder is real
-- and already there, just empty). Needs the folder id to create into.
alter table public.businesses add column drive_database_folder_id text;

update public.businesses set drive_database_folder_id = '1ZfGU_T4Dxdlu8KOn4yw8431opkYAQ5_I'
  where slug = 'aura';
