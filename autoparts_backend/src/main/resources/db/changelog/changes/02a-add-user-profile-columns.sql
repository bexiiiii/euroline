--liquibase formatted sql

--changeset autoparts:add-user-profile-columns
ALTER TABLE user_profiles
    ADD COLUMN IF NOT EXISTS client_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS country VARCHAR(255),
    ADD COLUMN IF NOT EXISTS state VARCHAR(255),
    ADD COLUMN IF NOT EXISTS city VARCHAR(255),
    ADD COLUMN IF NOT EXISTS office_address VARCHAR(255),
    ADD COLUMN IF NOT EXISTS type VARCHAR(50),
    ADD COLUMN IF NOT EXISTS surname VARCHAR(255),
    ADD COLUMN IF NOT EXISTS name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS fathername VARCHAR(255),
    ADD COLUMN IF NOT EXISTS email VARCHAR(255),
    ADD COLUMN IF NOT EXISTS phone VARCHAR(50);

--rollback ALTER TABLE user_profiles
--rollback     DROP COLUMN IF EXISTS phone,
--rollback     DROP COLUMN IF EXISTS email,
--rollback     DROP COLUMN IF EXISTS fathername,
--rollback     DROP COLUMN IF EXISTS name,
--rollback     DROP COLUMN IF EXISTS surname,
--rollback     DROP COLUMN IF EXISTS type,
--rollback     DROP COLUMN IF EXISTS office_address,
--rollback     DROP COLUMN IF EXISTS city,
--rollback     DROP COLUMN IF EXISTS state,
--rollback     DROP COLUMN IF EXISTS country,
--rollback     DROP COLUMN IF EXISTS client_name;
