--liquibase formatted sql

--changeset codex:15-update-user-activity-table
-- Add new columns to user_activity table for enhanced activity tracking
ALTER TABLE user_activity 
    ADD COLUMN IF NOT EXISTS user_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS module VARCHAR(100),
    ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45),
    ADD COLUMN IF NOT EXISTS user_agent TEXT,
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'success';

-- Update existing records to have default values
UPDATE user_activity SET status = 'success' WHERE status IS NULL;
UPDATE user_activity SET module = 'system' WHERE module IS NULL OR module = '';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity (user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity (created_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_status ON user_activity (status);
CREATE INDEX IF NOT EXISTS idx_user_activity_module ON user_activity (module);

--rollback DROP INDEX IF EXISTS idx_user_activity_module;
--rollback DROP INDEX IF EXISTS idx_user_activity_status;
--rollback DROP INDEX IF EXISTS idx_user_activity_created_at;
--rollback DROP INDEX IF EXISTS idx_user_activity_user_id;
--rollback ALTER TABLE user_activity DROP COLUMN IF EXISTS status;
--rollback ALTER TABLE user_activity DROP COLUMN IF EXISTS user_agent;
--rollback ALTER TABLE user_activity DROP COLUMN IF EXISTS ip_address;
--rollback ALTER TABLE user_activity DROP COLUMN IF EXISTS module;
--rollback ALTER TABLE user_activity DROP COLUMN IF EXISTS user_name;