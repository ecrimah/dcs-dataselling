-- Agent tier system: starter (Agent), verified (Super Agent), pro (Pro Agent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vendor_tier') THEN
    CREATE TYPE vendor_tier AS ENUM ('starter', 'verified', 'pro');
  END IF;
END $$;

ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS tier vendor_tier NOT NULL DEFAULT 'starter';

ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS tier_manual BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN vendors.tier IS 'Agent tier: starter=Agent, verified=Super Agent, pro=Pro Agent';
COMMENT ON COLUMN vendors.tier_manual IS 'When true, tier was set by admin and auto-promotion skips this vendor';
