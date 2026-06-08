-- API-only vendor accounts: developer API access without a public storefront.
--
-- These accounts get a vendor row (so the existing wallet / API key / pricing
-- machinery works) but are never listed publicly and skip the store setup fee.
-- They require admin approval (status = 'approved') before their API keys work.

ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS api_only BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN vendors.api_only IS
  'API-only account: developer API access only, no public storefront. Requires admin approval before keys work; setup fee is waived.';

-- Keep API-only vendors out of public reads even after they are approved.
-- (The marketplace_bundles view additionally filters on kyc_status = ''verified'',
-- which API-only accounts never receive.)
DROP POLICY IF EXISTS "Public read approved vendors" ON vendors;
CREATE POLICY "Public read approved vendors" ON vendors
  FOR SELECT USING (status = 'approved' AND api_only = false);
