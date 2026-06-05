-- Vendor referral program: unique codes, invite tracking, first-sale rewards

ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS referral_code TEXT,
  ADD COLUMN IF NOT EXISTS referred_by_vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS vendors_referral_code_unique
  ON vendors (referral_code)
  WHERE referral_code IS NOT NULL;

CREATE TABLE IF NOT EXISTS vendor_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  referred_vendor_id UUID NOT NULL UNIQUE REFERENCES vendors(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'rewarded', 'invalid')),
  reward_amount NUMERIC(12, 2) NOT NULL DEFAULT 10,
  first_sale_kind TEXT CHECK (first_sale_kind IS NULL OR first_sale_kind IN ('customer', 'wholesale')),
  first_sale_reference TEXT,
  rewarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (referrer_vendor_id <> referred_vendor_id)
);

CREATE INDEX IF NOT EXISTS idx_vendor_referrals_referrer
  ON vendor_referrals (referrer_vendor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vendors_referred_by
  ON vendors (referred_by_vendor_id)
  WHERE referred_by_vendor_id IS NOT NULL;

-- Backfill referral codes for existing vendors
UPDATE vendors
SET referral_code = UPPER(
  REGEXP_REPLACE(
    COALESCE(NULLIF(TRIM(slug), ''), SUBSTRING(REPLACE(id::text, '-', ''), 1, 8)),
    '[^A-Z0-9]',
    '',
    'g'
  )
)
WHERE referral_code IS NULL OR TRIM(referral_code) = '';

-- Resolve rare slug collisions
UPDATE vendors v
SET referral_code = 'DCS' || UPPER(SUBSTRING(REPLACE(v.id::text, '-', ''), 1, 6))
WHERE referral_code IN (
  SELECT referral_code FROM vendors GROUP BY referral_code HAVING COUNT(*) > 1
);

ALTER TABLE vendor_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY vendor_referrals_referrer_select ON vendor_referrals
  FOR SELECT USING (
    referrer_vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  );
