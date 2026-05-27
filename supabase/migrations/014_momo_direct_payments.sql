-- ============================================================================
-- MoMo Direct payments (SMS-forwarder receipt matching)
-- ----------------------------------------------------------------------------
-- Lets the platform accept Mobile Money payments by:
--   1. Customer sends MoMo to a merchant number (configured in platform_settings).
--   2. Telco SMS arrives on a dedicated Android phone running an SMS forwarder.
--   3. Forwarder app POSTs the SMS to /api/webhooks/momo-sms.
--   4. Customer types their transaction ID on the order page.
--   5. Backend matches txn ID + amount against momo_sms rows and flips the
--      order to `paid` + dispatches to Skanka5.
-- ============================================================================

-- 1) Allow `momo_direct` on the orders.payment_provider enum.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'payment_provider'::regtype AND enumlabel = 'momo_direct'
  ) THEN
    ALTER TYPE payment_provider ADD VALUE 'momo_direct';
  END IF;
END$$;

-- 2) Allow `awaiting_momo` order status so the order can sit pending while we
--    wait for the customer to submit their txn id (or the SMS to arrive).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'order_status'::regtype AND enumlabel = 'awaiting_momo'
  ) THEN
    ALTER TYPE order_status ADD VALUE 'awaiting_momo' BEFORE 'paid';
  END IF;
END$$;

-- 3) The momo_sms table — every forwarded SMS lands here.
CREATE TABLE IF NOT EXISTS momo_sms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_body TEXT NOT NULL,
  sender_id TEXT,
  network network_id,
  transaction_id TEXT,
  amount DECIMAL(12, 2),
  sender_name TEXT,
  sender_phone TEXT,
  reference_hint TEXT,
  received_at TIMESTAMPTZ,
  matched_order_id UUID REFERENCES orders(id),
  matched_at TIMESTAMPTZ,
  parse_status TEXT NOT NULL DEFAULT 'parsed' CHECK (parse_status IN ('parsed', 'unparsed', 'manual')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_momo_sms_txn_id
  ON momo_sms(transaction_id)
  WHERE transaction_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_momo_sms_matched ON momo_sms(matched_order_id);
CREATE INDEX IF NOT EXISTS idx_momo_sms_unmatched
  ON momo_sms(created_at DESC)
  WHERE matched_order_id IS NULL;

COMMENT ON TABLE momo_sms IS
  'Every forwarded MoMo confirmation SMS. Used to match customer-submitted transaction IDs.';

-- 4) Seed the platform_config row with merchant numbers + forwarder secret.
--    Admins can update these via /admin/settings.
INSERT INTO platform_settings (key, value)
VALUES (
  'platform_config',
  '{
    "vendorSetupFeeGhs": 50,
    "momoDirect": {
      "enabled": false,
      "merchantNumbers": {"mtn": "", "telecel": "", "at": ""},
      "merchantName": "",
      "smsForwarderSecret": ""
    }
  }'::jsonb
)
ON CONFLICT (key) DO UPDATE
SET value = platform_settings.value || EXCLUDED.value
WHERE platform_settings.value -> 'momoDirect' IS NULL;
