--liquibase formatted sql
--changeset autoparts:add-notification-fields

ALTER TABLE admin_notifications
    ADD COLUMN IF NOT EXISTS image_url VARCHAR(512);

ALTER TABLE admin_notifications
    ADD COLUMN IF NOT EXISTS target VARCHAR(32);
