ALTER TABLE products
    ADD COLUMN IF NOT EXISTS onec_ref_key VARCHAR(64);

CREATE UNIQUE INDEX IF NOT EXISTS uq_products_onec_ref_key
    ON products (onec_ref_key)
    WHERE onec_ref_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS onec_integration_events (
    event_id UUID PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    source VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_onec_integration_events_processed_at
    ON onec_integration_events (processed_at DESC);
