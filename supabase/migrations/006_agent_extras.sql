-- Agent extras: promos, rewards, complaints, API keys, MTN AFA, product lines

ALTER TABLE wholesale_bundles
  ADD COLUMN IF NOT EXISTS product_line TEXT
  CHECK (product_line IS NULL OR product_line IN ('standard', 'ishare', 'bigtime'));

UPDATE wholesale_bundles
SET product_line = 'ishare'
WHERE network = 'at'
  AND product_line IS NULL
  AND (name ILIKE '%ishare%' OR sku ILIKE '%ishare%');

UPDATE wholesale_bundles
SET product_line = 'bigtime'
WHERE network = 'at'
  AND product_line IS NULL
  AND (name ILIKE '%bigtime%' OR sku ILIKE '%bigtime%');

UPDATE wholesale_bundles
SET product_line = 'standard'
WHERE network = 'at' AND product_line IS NULL;

UPDATE wholesale_bundles
SET product_line = 'standard'
WHERE network IN ('mtn', 'telecel') AND product_line IS NULL;

ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS reward_balance NUMERIC(12, 2) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  max_redemptions INT,
  redemption_count INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS promo_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (promo_code_id, vendor_id)
);

CREATE TABLE IF NOT EXISTS reward_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  momo_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS vendor_complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  admin_reply TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vendor_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Default',
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vendor_mtn_afa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL UNIQUE REFERENCES vendors(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'verified', 'rejected')),
  admin_note TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_promo_redemptions_vendor ON promo_redemptions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_reward_withdrawals_vendor ON reward_withdrawals(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_complaints_vendor ON vendor_complaints(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_api_keys_vendor ON vendor_api_keys(vendor_id);

ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_mtn_afa ENABLE ROW LEVEL SECURITY;

CREATE POLICY promo_redemptions_vendor_select ON promo_redemptions
  FOR SELECT USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

CREATE POLICY reward_withdrawals_vendor_select ON reward_withdrawals
  FOR SELECT USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

CREATE POLICY vendor_complaints_vendor_all ON vendor_complaints
  FOR ALL USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()))
  WITH CHECK (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

CREATE POLICY vendor_api_keys_vendor_select ON vendor_api_keys
  FOR SELECT USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

CREATE POLICY vendor_mtn_afa_vendor_select ON vendor_mtn_afa
  FOR SELECT USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

-- Demo welcome promo (agents can claim once)
INSERT INTO promo_codes (code, amount, max_redemptions, active)
VALUES ('DCS-WELCOME-50', 50.00, 1000, TRUE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO promo_codes (code, amount, max_redemptions, active, expires_at)
VALUES ('DCS-CLAIMIT-10', 10.00, NULL, TRUE, now() + interval '1 year')
ON CONFLICT (code) DO NOTHING;
