--liquibase formatted sql

--changeset author:18-enhance-api-keys splitStatements:false
ALTER TABLE api_keys
    ADD COLUMN IF NOT EXISTS name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS created_by VARCHAR(255),
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS last_used_ip VARCHAR(64),
    ADD COLUMN IF NOT EXISTS request_count BIGINT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMP;

--changeset author:18-create-api-key-request-log splitStatements:false
CREATE TABLE IF NOT EXISTS api_key_request_log (
    id BIGSERIAL PRIMARY KEY,
    api_key_id BIGINT NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
    requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    request_path VARCHAR(512),
    request_method VARCHAR(16),
    response_status INT,
    client_ip VARCHAR(64)
);

CREATE INDEX IF NOT EXISTS idx_api_key_request_log_api_key_id ON api_key_request_log(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_key_request_log_requested_at ON api_key_request_log(requested_at);

--rollback ALTER TABLE api_keys DROP COLUMN IF EXISTS revoked_at;
--rollback ALTER TABLE api_keys DROP COLUMN IF EXISTS request_count;
--rollback ALTER TABLE api_keys DROP COLUMN IF EXISTS last_used_ip;
--rollback ALTER TABLE api_keys DROP COLUMN IF EXISTS last_used_at;
--rollback ALTER TABLE api_keys DROP COLUMN IF EXISTS description;
--rollback ALTER TABLE api_keys DROP COLUMN IF EXISTS created_by;
--rollback ALTER TABLE api_keys DROP COLUMN IF EXISTS name;
--rollback DROP TABLE IF EXISTS api_key_request_log;
