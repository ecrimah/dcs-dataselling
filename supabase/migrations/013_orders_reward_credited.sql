-- Track when a customer order's reward has been paid to the vendor so that
-- duplicate webhook deliveries / manual admin fulfilment cannot double-credit.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS reward_credited_at TIMESTAMPTZ;

COMMENT ON COLUMN orders.reward_credited_at IS
  'Set when vendor reward (markup * tier reward rate) was credited. Idempotency guard.';
