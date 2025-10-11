--liquibase formatted sql

--changeset autoparts:create-event-logs-table
CREATE TABLE IF NOT EXISTS event_logs (
    id BIGSERIAL PRIMARY KEY,
    event_type VARCHAR(100),
    entity_type VARCHAR(50),
    entity_id BIGINT,
    user_id BIGINT,
    user_name VARCHAR(255),
    description TEXT,
    details TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    session_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_event_logs_event_type ON event_logs (event_type);
CREATE INDEX IF NOT EXISTS idx_event_logs_entity_type ON event_logs (entity_type);
CREATE INDEX IF NOT EXISTS idx_event_logs_user_id ON event_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_event_logs_created_at ON event_logs (created_at);
CREATE INDEX IF NOT EXISTS idx_event_logs_success ON event_logs (success);

--rollback DROP INDEX IF EXISTS idx_event_logs_success;
--rollback DROP INDEX IF EXISTS idx_event_logs_created_at;
--rollback DROP INDEX IF EXISTS idx_event_logs_user_id;
--rollback DROP INDEX IF EXISTS idx_event_logs_entity_type;
--rollback DROP INDEX IF EXISTS idx_event_logs_event_type;
--rollback DROP TABLE IF EXISTS event_logs;
