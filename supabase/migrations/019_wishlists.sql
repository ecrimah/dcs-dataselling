-- Saved wholesale bundles for agents and platform admins

CREATE TABLE vendor_wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  wholesale_bundle_id UUID NOT NULL REFERENCES wholesale_bundles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (vendor_id, wholesale_bundle_id)
);

CREATE TABLE admin_wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  wholesale_bundle_id UUID NOT NULL REFERENCES wholesale_bundles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, wholesale_bundle_id)
);

CREATE INDEX idx_vendor_wishlist_vendor ON vendor_wishlist_items (vendor_id, created_at DESC);
CREATE INDEX idx_admin_wishlist_user ON admin_wishlist_items (user_id, created_at DESC);

ALTER TABLE vendor_wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_wishlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY vendor_wishlist_own ON vendor_wishlist_items
  FOR ALL USING (
    vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  )
  WITH CHECK (
    vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  );

CREATE POLICY admin_wishlist_own ON admin_wishlist_items
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
