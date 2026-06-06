-- Agent wallet top-up via MoMo direct (ClaimIt): generate code + SMS match + manual txn claim

ALTER TABLE wallet_topups
  ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'paystack'
    CHECK (payment_method IN ('paystack', 'momo_direct'));

ALTER TABLE momo_sms
  ADD COLUMN IF NOT EXISTS matched_wallet_topup_id UUID REFERENCES wallet_topups(id);

CREATE INDEX IF NOT EXISTS idx_momo_sms_matched_wallet_topup
  ON momo_sms(matched_wallet_topup_id);

CREATE INDEX IF NOT EXISTS idx_wallet_topups_pending_momo
  ON wallet_topups(vendor_id, created_at DESC)
  WHERE status = 'pending' AND payment_method = 'momo_direct';

COMMENT ON COLUMN wallet_topups.payment_method IS
  'paystack = online checkout; momo_direct = send MoMo with reference code (ClaimIt)';
