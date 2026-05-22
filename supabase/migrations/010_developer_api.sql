-- 010_developer_api.sql
-- Production-ready developer API: extends vendor_api_keys, adds request logs,
-- and gives every vendor an outbound webhook channel. Safe to re-run.

-- ---------------------------------------------------------------------------
-- Extend vendor_api_keys with operational metadata
-- ---------------------------------------------------------------------------
ALTER TABLE vendor_api_keys
  ADD COLUMN IF NOT EXISTS last_used_ip    TEXT,
  ADD COLUMN IF NOT EXISTS expires_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS revoked_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS total_requests  BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_by      UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_vendor_api_keys_active
  ON vendor_api_keys(active)
  WHERE active = TRUE;

CREATE INDEX IF NOT EXISTS idx_vendor_api_keys_hash
  ON vendor_api_keys(key_hash);

-- ---------------------------------------------------------------------------
-- Per-request audit log (powers vendor's "Recent API calls" tab)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vendor_api_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id       UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  key_id          UUID REFERENCES vendor_api_keys(id) ON DELETE SET NULL,
  key_prefix      TEXT,                       -- denormalized for log readability after key delete
  endpoint        TEXT NOT NULL,              -- e.g. "POST /api/v1/orders"
  method          TEXT NOT NULL,
  http_status     INT NOT NULL,
  duration_ms     INT,
  ip              TEXT,
  user_agent      TEXT,
  request_body    JSONB,                      -- redacted (no secrets)
  response_summary JSONB,                     -- e.g. { reference, total } — no PII beyond what came in
  error           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendor_api_logs_vendor_created
  ON vendor_api_logs(vendor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vendor_api_logs_key
  ON vendor_api_logs(key_id);

ALTER TABLE vendor_api_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS vendor_api_logs_vendor_select ON vendor_api_logs;
CREATE POLICY vendor_api_logs_vendor_select ON vendor_api_logs
  FOR SELECT
  USING (
    vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS vendor_api_logs_admin_select ON vendor_api_logs;
CREATE POLICY vendor_api_logs_admin_select ON vendor_api_logs
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'ops'))
  );

-- ---------------------------------------------------------------------------
-- Outbound webhook per vendor (single endpoint with HMAC signing)
-- ---------------------------------------------------------------------------
ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS api_webhook_url     TEXT,
  ADD COLUMN IF NOT EXISTS api_webhook_secret  TEXT,
  ADD COLUMN IF NOT EXISTS api_webhook_enabled BOOLEAN NOT NULL DEFAULT TRUE;

-- Webhook delivery log (separate from request log — these are outbound)
CREATE TABLE IF NOT EXISTS vendor_webhook_deliveries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id       UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  event           TEXT NOT NULL,              -- order.fulfilled | order.failed | order.processing
  reference       TEXT,                       -- order/wholesale reference
  target_url      TEXT NOT NULL,
  http_status     INT,
  ok              BOOLEAN,
  attempts        INT NOT NULL DEFAULT 1,
  payload         JSONB NOT NULL,
  response_body   TEXT,
  error           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendor_webhook_deliveries_vendor
  ON vendor_webhook_deliveries(vendor_id, created_at DESC);

ALTER TABLE vendor_webhook_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS vendor_webhook_deliveries_vendor_select ON vendor_webhook_deliveries;
CREATE POLICY vendor_webhook_deliveries_vendor_select ON vendor_webhook_deliveries
  FOR SELECT
  USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));
