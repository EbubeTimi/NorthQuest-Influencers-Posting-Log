-- Third tenant, same reduced scope as CashDrive: core business record only,
-- recruitment page and Apify tracking wait for #7/#9. Smith confirmed the
-- number directly: flat ₦150,000 base pay, no bonus program at all.
insert into public.businesses (name, slug, default_base_pay, bonus_enabled, trial_enabled)
values ('Aura by Antroph', 'aura', 150000, false, true);

insert into public.business_memberships (profile_id, business_id, role)
select '10e666ef-2971-46d6-9307-8e907eecf9a2', id, 'admin' from public.businesses where slug = 'aura';
