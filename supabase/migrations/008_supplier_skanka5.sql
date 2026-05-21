-- 008_supplier_skanka5.sql
-- Adds supplier (Skanka5) fulfilment columns and a supplier_logs audit table.
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- Customer storefront orders (orders table)
-- ---------------------------------------------------------------------------
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS supplier               TEXT,
  ADD COLUMN IF NOT EXISTS supplier_reference     TEXT,
  ADD COLUMN IF NOT EXISTS supplier_order_code    TEXT,
  ADD COLUMN IF NOT EXISTS supplier_status        TEXT,
  ADD COLUMN IF NOT EXISTS supplier_response      JSONB,
  ADD COLUMN IF NOT EXISTS supplier_submitted_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS supplier_error         TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_supplier_reference
  ON orders(supplier_reference)
  WHERE supplier_reference IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_supplier_order_code
  ON orders(supplier_order_code)
  WHERE supplier_order_code IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Wholesale orders (vendor bulk purchases)
-- ---------------------------------------------------------------------------
ALTER TABLE wholesale_orders
  ADD COLUMN IF NOT EXISTS supplier               TEXT,
  ADD COLUMN IF NOT EXISTS supplier_reference     TEXT,
  ADD COLUMN IF NOT EXISTS supplier_status        TEXT,
  ADD COLUMN IF NOT EXISTS supplier_response      JSONB,
  ADD COLUMN IF NOT EXISTS supplier_submitted_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS supplier_error         TEXT;

CREATE INDEX IF NOT EXISTS idx_wholesale_orders_supplier_reference
  ON wholesale_orders(supplier_reference)
  WHERE supplier_reference IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Wholesale order line items
-- ---------------------------------------------------------------------------
ALTER TABLE wholesale_order_items
  ADD COLUMN IF NOT EXISTS supplier_order_code    TEXT,
  ADD COLUMN IF NOT EXISTS supplier_status        TEXT,
  ADD COLUMN IF NOT EXISTS supplier_response      JSONB,
  ADD COLUMN IF NOT EXISTS supplier_fulfilled_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS supplier_error         TEXT;

CREATE INDEX IF NOT EXISTS idx_wholesale_order_items_supplier_order_code
  ON wholesale_order_items(supplier_order_code)
  WHERE supplier_order_code IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Supplier audit log (every request / response / webhook event)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS supplier_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier        TEXT NOT NULL DEFAULT 'skanka5',
  event_type      TEXT NOT NULL,           -- submit_single | submit_bulk | status_poll | webhook
  scope           TEXT,                    -- customer_order | wholesale_order
  reference       TEXT,                    -- our internal reference
  supplier_reference TEXT,                 -- supplier reference (if known)
  http_status     INT,
  ok              BOOLEAN,
  error           TEXT,
  request_payload JSONB,
  response_payload JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_logs_created ON supplier_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_supplier_logs_reference ON supplier_logs(reference);
CREATE INDEX IF NOT EXISTS idx_supplier_logs_event_type ON supplier_logs(event_type);

ALTER TABLE supplier_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS supplier_logs_admin_select ON supplier_logs;
CREATE POLICY supplier_logs_admin_select ON supplier_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'ops')
    )
  );
