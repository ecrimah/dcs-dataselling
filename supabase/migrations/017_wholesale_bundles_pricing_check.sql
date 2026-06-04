-- Fix wholesale_bundles_check: allow tier matrix saves and enforce retail headroom.

ALTER TABLE wholesale_bundles DROP CONSTRAINT IF EXISTS wholesale_bundles_check;

-- Backfill rows that only had legacy wholesale/suggested columns
UPDATE wholesale_bundles
SET
  agent_price = COALESCE(agent_price, wholesale_price),
  xpress_agent_price = COALESCE(xpress_agent_price, agent_price, wholesale_price),
  agent_pro_price = COALESCE(agent_pro_price, agent_price, wholesale_price),
  cost_price = COALESCE(cost_price, ROUND(wholesale_price * 0.93, 2)),
  customer_price = GREATEST(
    COALESCE(customer_price, suggested_retail),
    suggested_retail,
    COALESCE(agent_price, wholesale_price) + min_markup
  ),
  suggested_retail = GREATEST(
    suggested_retail,
    wholesale_price + min_markup
  )
WHERE agent_price IS NULL
   OR suggested_retail < wholesale_price + min_markup
   OR customer_price < suggested_retail;

UPDATE wholesale_bundles
SET
  suggested_retail = GREATEST(suggested_retail, wholesale_price + min_markup),
  customer_price = GREATEST(customer_price, suggested_retail)
WHERE suggested_retail < wholesale_price + min_markup
   OR customer_price < suggested_retail;

ALTER TABLE wholesale_bundles
  ADD CONSTRAINT wholesale_bundles_pricing_check CHECK (
    cost_price >= 0
    AND agent_price >= cost_price
    AND agent_pro_price >= cost_price
    AND agent_pro_price <= xpress_agent_price
    AND xpress_agent_price <= agent_price
    AND wholesale_price > 0
    AND suggested_retail >= wholesale_price
    AND customer_price >= suggested_retail
    AND suggested_retail >= wholesale_price + min_markup
  );
