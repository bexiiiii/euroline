--liquibase formatted sql

--changeset autoparts:04-populate-user-profiles
INSERT INTO user_profile (user_id, client_name, country, state, city, office_address, type, surname, name, fathername, email, phone)
SELECT 
    u.id,
    u.client_name,
    u.country,
    u.state,
    u.city,
    u.office_address,
    u.type,
    u.surname,
    u.name,
    u.fathername,
    u.email,
    u.phone
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM user_profile up WHERE up.user_id = u.id
);
