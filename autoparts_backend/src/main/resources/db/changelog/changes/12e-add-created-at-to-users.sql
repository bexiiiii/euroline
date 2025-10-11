--liquibase formatted sql

--changeset autoparts:add-created-at-to-users
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

--rollback ALTER TABLE users DROP COLUMN IF EXISTS created_at;
