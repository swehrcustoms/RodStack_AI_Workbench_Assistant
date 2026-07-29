-- Manual SQL alternative to: npm run admin:add-user-to-org
-- Run in Supabase SQL editor AS a privileged role (service role / dashboard).
-- Replace the placeholders before executing.

-- Example:
--   select public.add_user_to_organization(
--     'second.builder@shop.com',          -- target_email
--     '00000000-0000-0000-0000-000000000000', -- organization uuid (shop)
--     'builder',                          -- role: owner|admin|builder|viewer
--     true                                -- copy owner workspace snapshot to new member
--   );

select public.add_user_to_organization(
  'REPLACE_WITH_USER_EMAIL',
  'REPLACE_WITH_ORGANIZATION_UUID'::uuid,
  'builder'::public.org_role,
  true
);

-- Find organization ids:
-- select id, name, slug, owner_id from public.organizations order by created_at desc;

-- Find users:
-- select id, email, builder_name, shop_name from public.profiles order by created_at desc;
