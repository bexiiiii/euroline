--liquibase formatted sql

--changeset author:api-keys-creation id:03-create-api-keys runOnChange:true splitStatements:false
-- Create API Keys table if not exists
CREATE TABLE IF NOT EXISTS api_keys (
    id BIGSERIAL PRIMARY KEY,
    key_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    active BOOLEAN DEFAULT true,
    description VARCHAR(255)
);

-- Add a default API key for development (you can replace with your own hashed key)
INSERT INTO api_keys (key_hash, active, description)
SELECT '$2a$10$dYqbMu5jVSTJ2mP1qW8.0Oc0hV1VLF8VBqLH9wdX/dX80ym9dXx2e', true, 'Default API Key'
WHERE NOT EXISTS (
    SELECT 1 FROM api_keys LIMIT 1
);

--rollback DROP TABLE IF EXISTS api_keys;
