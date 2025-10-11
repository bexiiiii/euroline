--liquibase formatted sql

--changeset autoparts:create-user-activity-table
CREATE TABLE IF NOT EXISTS user_activity (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    user_name VARCHAR(255),
    action VARCHAR(255),
    module VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent TEXT,
    status VARCHAR(20) DEFAULT 'success',
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity (user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity (created_at);

--rollback DROP INDEX IF EXISTS idx_user_activity_created_at;
--rollback DROP INDEX IF EXISTS idx_user_activity_user_id;
--rollback DROP TABLE IF EXISTS user_activity;
