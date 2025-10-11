--liquibase formatted sql

--changeset autoparts:create-cml-processed-messages
CREATE TABLE IF NOT EXISTS cml_processed_messages (
    id VARCHAR(128) PRIMARY KEY,
    processed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    type VARCHAR(64) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cml_processed_messages_processed_at ON cml_processed_messages (processed_at);

--rollback DROP INDEX IF EXISTS idx_cml_processed_messages_processed_at;
--rollback DROP TABLE IF EXISTS cml_processed_messages;
