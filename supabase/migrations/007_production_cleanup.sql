-- 007_production_cleanup.sql
-- Production readiness migration:
--   1. SMS event log (powers the admin SMS debugger)
--   2. Cleanup of all seeded demo vendors (DataHub, SwiftData, ConnectPlus, Prime,
--      MegaData, Nkomo, AccraData, VoltHub)
--   3. Removal of seeded demo promo codes
-- Safe to re-run (uses IF NOT EXISTS / DELETE WHERE).

-- ---------------------------------------------------------------------------
-- SMS event log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template TEXT NOT NULL,                  -- e.g. order_payment_received, order_fulfilled, admin_test
  recipient TEXT NOT NULL,                 -- normalized 233XXXXXXXXX
  message TEXT NOT NULL,
  status TEXT NOT NULL,                    -- sent | failed | skipped
  provider TEXT NOT NULL DEFAULT 'arkesel',
  provider_response JSONB,
  error TEXT,
  triggered_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  context JSONB,                           -- order_id, reference, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_logs_created ON sms_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_logs_status ON sms_logs(status);
CREATE INDEX IF NOT EXISTS idx_sms_logs_recipient ON sms_logs(recipient);

ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sms_logs_admin_select ON sms_logs;
CREATE POLICY sms_logs_admin_select ON sms_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'ops')
    )
  );

-- ---------------------------------------------------------------------------
-- Remove all seeded demo vendors (cascades to wallets, listings, kyc, etc.)
-- ---------------------------------------------------------------------------
DELETE FROM vendors
WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555',
  '66666666-6666-6666-6666-666666666666',
  '77777777-7777-7777-7777-777777777777',
  '88888888-8888-8888-8888-888888888888'
);

DELETE FROM profiles
WHERE id IN (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa8'
);

DELETE FROM auth.users
WHERE email LIKE '%@dcs.demo';

-- ---------------------------------------------------------------------------
-- Remove seeded demo promo codes (admins create real ones via /admin/agent-ops)
-- ---------------------------------------------------------------------------
DELETE FROM promo_codes WHERE code IN ('DCS-WELCOME-50', 'DCS-CLAIMIT-10');

-- ---------------------------------------------------------------------------
-- promo_codes had RLS enabled without a policy — give admin/ops full access.
-- (Server-side writes already use the service client and bypass RLS, but this
-- closes the lint warning and lets authenticated admin reads work.)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS promo_codes_admin_all ON promo_codes;
CREATE POLICY promo_codes_admin_all ON promo_codes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'ops')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'ops')
    )
  );
