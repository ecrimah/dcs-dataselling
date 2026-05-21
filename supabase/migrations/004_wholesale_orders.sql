-- Vendor supply orders: agents buy data at wholesale from DCS

CREATE TABLE IF NOT EXISTS wholesale_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT UNIQUE NOT NULL,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'queued', 'processing', 'fulfilled', 'failed', 'cancelled')),
  total_amount NUMERIC(12, 2) NOT NULL,
  item_count INT NOT NULL DEFAULT 1,
  payment_provider TEXT,
  payment_reference TEXT,
  source TEXT NOT NULL DEFAULT 'single'
    CHECK (source IN ('single', 'bulk', 'manual')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ,
  fulfilled_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS wholesale_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wholesale_order_id UUID NOT NULL REFERENCES wholesale_orders(id) ON DELETE CASCADE,
  wholesale_bundle_id UUID NOT NULL REFERENCES wholesale_bundles(id),
  recipient_phone TEXT NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  line_total NUMERIC(12, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'queued', 'processing', 'fulfilled', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wholesale_orders_vendor ON wholesale_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_wholesale_orders_reference ON wholesale_orders(reference);
CREATE INDEX IF NOT EXISTS idx_wholesale_order_items_order ON wholesale_order_items(wholesale_order_id);

ALTER TABLE wholesale_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE wholesale_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY wholesale_orders_vendor_select ON wholesale_orders
  FOR SELECT USING (
    vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  );

CREATE POLICY wholesale_order_items_vendor_select ON wholesale_order_items
  FOR SELECT USING (
    wholesale_order_id IN (
      SELECT id FROM wholesale_orders
      WHERE vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
    )
  );
