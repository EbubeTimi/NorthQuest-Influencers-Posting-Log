-- NorthQuest and CashDrive's weekly check-in gate resets on the 1st of the
-- month (1-7, 8-14, ...). Aura's cohort launched mid-month on a Monday, and
-- per direction its gate stays a plain Monday-to-Sunday week off its own
-- launch day, permanently — not calendar-month-anchored like the others.
alter table public.businesses add column gate_anchor text not null default 'calendar_month'
  check (gate_anchor in ('calendar_month', 'weekly_monday'));

update public.businesses set gate_anchor = 'weekly_monday' where slug = 'aura';
