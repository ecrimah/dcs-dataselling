-- Additional demo vendors to fill the vendors page grid

INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
SELECT v.uid::uuid, u.instance_id, u.aud, u.role, v.email, u.encrypted_password, now(), now(), now(), '{}'::jsonb, v.meta::jsonb
FROM auth.users u
CROSS JOIN (VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', 'megadata@dcs.demo', '{"full_name":"MegaData Owner"}'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6', 'nkomo@dcs.demo', '{"full_name":"Nkomo Owner"}'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7', 'accra-data@dcs.demo', '{"full_name":"Accra Data Owner"}'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa8', 'volthub@dcs.demo', '{"full_name":"VoltHub Owner"}')
) AS v(uid, email, meta)
WHERE u.id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'
ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, email, full_name, role) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', 'megadata@dcs.demo', 'MegaData Owner', 'vendor'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6', 'nkomo@dcs.demo', 'Nkomo Owner', 'vendor'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7', 'accra-data@dcs.demo', 'Accra Data Owner', 'vendor'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa8', 'volthub@dcs.demo', 'VoltHub Owner', 'vendor')
ON CONFLICT (id) DO NOTHING;

INSERT INTO vendors (id, user_id, slug, business_name, tagline, status, verified, rating, total_orders, fulfilment_minutes, commission_rate, featured) VALUES
  ('55555555-5555-5555-5555-555555555555', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', 'megadata-gh', 'MegaData GH', 'MTN & Telecel at wholesale speed', 'approved', true, 4.9, 9800, 3, 8, false),
  ('66666666-6666-6666-6666-666666666666', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6', 'nkomo-bundles', 'Nkomo Bundles', 'Student-friendly data packs', 'approved', true, 4.6, 4100, 5, 9, false),
  ('77777777-7777-7777-7777-777777777777', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7', 'accra-data-shop', 'Accra Data Shop', 'Same-day AT & MTN delivery', 'approved', true, 4.7, 5500, 4, 8, false),
  ('88888888-8888-8888-8888-888888888888', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa8', 'volthub-mobile', 'VoltHub Mobile', 'Night & weekend bundles', 'approved', false, 4.4, 1800, 6, 10, false)
ON CONFLICT (id) DO NOTHING;
