--liquibase formatted sql

--changeset codex:16-update-event-logs-table
-- Update event_logs table structure to match new EventLog entity
ALTER TABLE event_logs 
    DROP COLUMN IF EXISTS type,
    DROP COLUMN IF EXISTS payload;

ALTER TABLE event_logs 
    ADD COLUMN IF NOT EXISTS event_type VARCHAR(100),
    ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50),
    ADD COLUMN IF NOT EXISTS entity_id BIGINT,
    ADD COLUMN IF NOT EXISTS user_id BIGINT,
    ADD COLUMN IF NOT EXISTS user_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS details TEXT,
    ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45),
    ADD COLUMN IF NOT EXISTS user_agent TEXT,
    ADD COLUMN IF NOT EXISTS success BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS error_message TEXT,
    ADD COLUMN IF NOT EXISTS session_id VARCHAR(255);

-- Update existing records to have default values
UPDATE event_logs SET success = true WHERE success IS NULL;

-- Create indexes for performance
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
--rollback ALTER TABLE event_logs DROP COLUMN IF EXISTS session_id;
--rollback ALTER TABLE event_logs DROP COLUMN IF EXISTS error_message;
--rollback ALTER TABLE event_logs DROP COLUMN IF EXISTS success;
--rollback ALTER TABLE event_logs DROP COLUMN IF EXISTS user_agent;
--rollback ALTER TABLE event_logs DROP COLUMN IF EXISTS ip_address;
--rollback ALTER TABLE event_logs DROP COLUMN IF EXISTS details;
--rollback ALTER TABLE event_logs DROP COLUMN IF EXISTS description;
--rollback ALTER TABLE event_logs DROP COLUMN IF EXISTS user_name;
--rollback ALTER TABLE event_logs DROP COLUMN IF EXISTS user_id;
--rollback ALTER TABLE event_logs DROP COLUMN IF EXISTS entity_id;
--rollback ALTER TABLE event_logs DROP COLUMN IF EXISTS entity_type;
--rollback ALTER TABLE event_logs DROP COLUMN IF EXISTS event_type;
--rollback ALTER TABLE event_logs ADD COLUMN IF NOT EXISTS payload TEXT;
--rollback ALTER TABLE event_logs ADD COLUMN IF NOT EXISTS type VARCHAR(100);