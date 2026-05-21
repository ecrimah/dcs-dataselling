-- 009_remove_seed_wallet.sql
-- Removes any remaining seed/demo wallet ledger entries and recalculates
-- vendor wallet balances so they exactly match real activity. Safe to re-run.

-- 1. Capture which vendors had seed entries so we can rebalance just them.
CREATE TEMP TABLE IF NOT EXISTS _affected_wallets AS
SELECT DISTINCT vendor_id
FROM wallet_ledger
WHERE reference LIKE 'DCS-SEED%'
   OR note ILIKE '%demo%'
   OR note ILIKE '%seed%';

-- 2. Delete the seed ledger entries.
DELETE FROM wallet_ledger
WHERE reference LIKE 'DCS-SEED%'
   OR note ILIKE '%demo%'
   OR note ILIKE '%seed%';

-- 3. Rebuild each affected wallet from the remaining ledger.
--    For every entry type, the ledger row's `amount` is the signed delta
--    (credits positive, debits negative), so SUM() is the true balance.
UPDATE wallets w
SET balance = COALESCE(real.total, 0),
    updated_at = NOW()
FROM _affected_wallets a
LEFT JOIN (
  SELECT vendor_id, SUM(amount) AS total
  FROM wallet_ledger
  GROUP BY vendor_id
) real ON real.vendor_id = a.vendor_id
WHERE w.vendor_id = a.vendor_id;

DROP TABLE IF EXISTS _affected_wallets;
