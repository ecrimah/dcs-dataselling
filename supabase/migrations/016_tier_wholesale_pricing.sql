-- Per-role wholesale pricing matrix (cost / customer / agent tiers)
ALTER TABLE wholesale_bundles
  ADD COLUMN IF NOT EXISTS cost_price DECIMAL(12, 2),
  ADD COLUMN IF NOT EXISTS customer_price DECIMAL(12, 2),
  ADD COLUMN IF NOT EXISTS customer_pro_price DECIMAL(12, 2),
  ADD COLUMN IF NOT EXISTS agent_price DECIMAL(12, 2),
  ADD COLUMN IF NOT EXISTS agent_pro_price DECIMAL(12, 2),
  ADD COLUMN IF NOT EXISTS xpress_agent_price DECIMAL(12, 2);

-- Backfill from legacy columns
UPDATE wholesale_bundles
SET
  cost_price = COALESCE(cost_price, ROUND(wholesale_price * 0.93, 2)),
  customer_price = COALESCE(customer_price, suggested_retail),
  customer_pro_price = COALESCE(customer_pro_price, ROUND(suggested_retail * 0.93, 2)),
  agent_price = COALESCE(agent_price, wholesale_price),
  agent_pro_price = COALESCE(agent_pro_price, wholesale_price),
  xpress_agent_price = COALESCE(xpress_agent_price, wholesale_price)
WHERE cost_price IS NULL
   OR customer_price IS NULL
   OR customer_pro_price IS NULL
   OR agent_price IS NULL
   OR agent_pro_price IS NULL
   OR xpress_agent_price IS NULL;

COMMENT ON COLUMN wholesale_bundles.cost_price IS 'Supplier cost — admin only';
COMMENT ON COLUMN wholesale_bundles.customer_price IS 'Default retail price for non-agent buyers';
COMMENT ON COLUMN wholesale_bundles.customer_pro_price IS 'Discounted retail for premium customers';
COMMENT ON COLUMN wholesale_bundles.agent_price IS 'Buy price for Starter agents';
COMMENT ON COLUMN wholesale_bundles.agent_pro_price IS 'Buy price for Pro agents';
COMMENT ON COLUMN wholesale_bundles.xpress_agent_price IS 'Buy price for Super/Xpress agents (verified tier)';

-- Storefront uses customer_price + vendor markup
DROP VIEW IF EXISTS public.marketplace_bundles;

CREATE VIEW public.marketplace_bundles
WITH (security_invoker = true)
AS
SELECT
  vl.id,
  vl.vendor_id,
  vl.wholesale_bundle_id,
  wb.network,
  COALESCE(vl.custom_name, wb.name) AS name,
  wb.data_mb,
  wb.validity_days,
  COALESCE(wb.customer_price, wb.suggested_retail) + vl.markup_amount AS price,
  COALESCE(wb.customer_pro_price, wb.suggested_retail) AS original_price,
  wb.popular,
  vl.markup_amount = 0 OR vl.markup_amount <= wb.min_markup AS recommended,
  vl.sales_count,
  vl.created_at,
  v.slug AS vendor_slug,
  v.business_name AS vendor_name,
  v.verified AS vendor_verified,
  v.rating AS vendor_rating,
  v.fulfilment_minutes AS vendor_fulfilment_minutes,
  v.featured AS vendor_featured,
  v.theme_color AS vendor_theme,
  v.emoji AS vendor_emoji
FROM vendor_listings vl
JOIN wholesale_bundles wb ON wb.id = vl.wholesale_bundle_id
JOIN vendors v ON v.id = vl.vendor_id
WHERE vl.active = true
  AND wb.active = true
  AND v.status = 'approved'
  AND v.kyc_status = 'verified';
