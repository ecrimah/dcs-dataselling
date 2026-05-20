-- Vendor store creation fee (paid before onboarding submit)

CREATE TYPE setup_payment_status AS ENUM ('pending', 'paid', 'failed');

CREATE TABLE vendor_setup_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  business_name TEXT,
  amount DECIMAL(12,2) NOT NULL,
  reference TEXT NOT NULL UNIQUE,
  status setup_payment_status NOT NULL DEFAULT 'pending',
  payment_provider payment_provider,
  payment_reference TEXT,
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vendor_setup_payments_user ON vendor_setup_payments(user_id);
CREATE INDEX idx_vendor_setup_payments_status ON vendor_setup_payments(status);

ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS setup_fee_paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS setup_fee_reference TEXT;

ALTER TABLE vendor_setup_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own setup payments"
  ON vendor_setup_payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own setup payments"
  ON vendor_setup_payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Grandfather existing vendors
UPDATE vendors SET setup_fee_paid_at = created_at WHERE setup_fee_paid_at IS NULL;
