--liquibase formatted sql

--changeset author:admin-creation-changeset id:01-create-admin-user runOnChange:true
-- Check if the users table exists, create it if it doesn't
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    client_name VARCHAR(255),
    country VARCHAR(255),
    state VARCHAR(255),
    city VARCHAR(255),
    office_address VARCHAR(255),
    type VARCHAR(50),
    surname VARCHAR(255),
    name VARCHAR(255),
    fathername VARCHAR(255),
    phone VARCHAR(50),
    banned BOOLEAN DEFAULT false
);

-- First admin user
INSERT INTO users (email, password, role, client_name, name, surname, phone, banned, country, state, city)
SELECT 'admin@example.com', 
       '$2a$10$zZKseK6k3ZKfUpcIFsddduKj1blZkMytY5HnL0Y0hD8P1FzG1N2bi', -- This is the existing password hash
       'ADMIN',
       'Admin Store',
       'Admin',
       'Adminov',
       '+77000000000',
       false,
       'Kazakhstan',
       'Akmola',
       'Astana'
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'admin@example.com'
);

-- Second admin user
INSERT INTO users (email, password, role, client_name, name, surname, phone, banned, country)
SELECT 'admin@autoparts.local', 
       '$2a$10$y/FBOKqWWtCLLEAewq93B.V4RIS29r9RvG6CesEWt.9xKAc1Xzf6C', -- This is the existing password hash
       'ADMIN',
       'Administrator',
       'System',
       'Admin',
       '0000000000',
       false,
       'KZ'
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'admin@autoparts.local'
);

--rollback DROP TABLE IF EXISTS users;
