-- Platform-wide JSON settings (agent tier prices, rules, etc.)
CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE platform_settings IS 'Key-value store for admin-configurable platform rules';
