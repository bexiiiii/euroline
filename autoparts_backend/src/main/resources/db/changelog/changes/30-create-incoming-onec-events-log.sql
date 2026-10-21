CREATE TABLE IF NOT EXISTS incoming_1c_events (
    event_id UUID PRIMARY KEY,
    event_type VARCHAR(100),
    source VARCHAR(100),
    http_status INTEGER NOT NULL,
    error_message TEXT,
    payload JSONB,
    received_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_incoming_1c_events_received_at
    ON incoming_1c_events (received_at DESC);

INSERT INTO incoming_1c_events (event_id, event_type, source, http_status, payload, received_at, processed_at)
SELECT event_id, event_type, source, 200, payload, processed_at, processed_at
FROM onec_integration_events
ON CONFLICT (event_id) DO NOTHING;
