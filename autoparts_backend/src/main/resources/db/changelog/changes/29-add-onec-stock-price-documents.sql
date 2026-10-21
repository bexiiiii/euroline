CREATE TABLE IF NOT EXISTS onec_stocks (
    product_ref_key VARCHAR(64) NOT NULL,
    warehouse_ref_key VARCHAR(64) NOT NULL,
    warehouse_name VARCHAR(255),
    quantity NUMERIC(19, 3) NOT NULL,
    payload JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (product_ref_key, warehouse_ref_key)
);

CREATE INDEX IF NOT EXISTS idx_onec_stocks_product_ref_key
    ON onec_stocks (product_ref_key);

CREATE TABLE IF NOT EXISTS onec_prices (
    product_ref_key VARCHAR(64) NOT NULL,
    price_type_ref_key VARCHAR(64) NOT NULL DEFAULT 'default',
    amount NUMERIC(19, 2),
    currency VARCHAR(16),
    payload JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (product_ref_key, price_type_ref_key)
);

CREATE INDEX IF NOT EXISTS idx_onec_prices_product_ref_key
    ON onec_prices (product_ref_key, updated_at DESC);

CREATE TABLE IF NOT EXISTS onec_documents (
    document_ref_key VARCHAR(64) PRIMARY KEY,
    document_kind VARCHAR(32) NOT NULL,
    document_status VARCHAR(32) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    source VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_onec_documents_kind_status
    ON onec_documents (document_kind, document_status, updated_at DESC);
