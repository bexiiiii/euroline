--liquibase formatted sql

--changeset author:initial-schema id:02-create-basic-tables
-- Products table
CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100),
    description TEXT,
    brand VARCHAR(100),
    external_code VARCHAR(100),
    image_url VARCHAR(500),
    price DECIMAL(19, 2),
    stock INTEGER DEFAULT 0
);

-- Product Properties table
CREATE TABLE IF NOT EXISTS product_properties (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL,
    property_name VARCHAR(100) NOT NULL,
    property_value VARCHAR(255),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    customer_email VARCHAR(255) NOT NULL,
    total_amount DECIMAL(19, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'NEW',
    payment_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order Products junction table
CREATE TABLE IF NOT EXISTS order_products (
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price DECIMAL(19, 2) NOT NULL,
    PRIMARY KEY (order_id, product_id),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Generated Reports table
CREATE TABLE IF NOT EXISTS generated_reports (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    format VARCHAR(20) NOT NULL,
    path VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    avatar_url VARCHAR(500),
    bio TEXT,
    preferences JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add sample products
INSERT INTO products (name, code, description, brand, external_code, image_url, price, stock)
VALUES 
    ('Моторное масло 5W-30', 'OIL-5W30', 'Синтетическое моторное масло для легковых автомобилей', 'Mobil', 'MOB-5W30', '/images/products/oil-5w30.jpg', 25.99, 100),
    ('Воздушный фильтр', 'FILT-AIR-1', 'Высококачественный воздушный фильтр для легковых автомобилей', 'Mann', 'MN-AF-100', '/images/products/air-filter-1.jpg', 12.50, 50),
    ('Тормозные колодки передние', 'BRAKE-F-1', 'Передние тормозные колодки для Toyota Camry', 'Brembo', 'BRB-TC-F', '/images/products/brake-pads-1.jpg', 45.00, 30),
    ('Аккумулятор 60Ah', 'BAT-60AH', '12V аккумулятор 60Ah для легковых автомобилей', 'Bosch', 'BS-BAT-60', '/images/products/battery-60ah.jpg', 89.99, 15)
ON CONFLICT DO NOTHING;

-- Add sample product properties
INSERT INTO product_properties (product_id, property_name, property_value)
VALUES 
    (1, 'Вязкость', '5W-30'),
    (1, 'Объем', '4 литра'),
    (1, 'Тип', 'Синтетическое'),
    (2, 'Размеры', '280x180x40 мм'),
    (2, 'Применимость', 'Toyota, Honda, Nissan'),
    (3, 'Применимость', 'Toyota Camry 2018-2023'),
    (3, 'Материал', 'Керамика'),
    (4, 'Емкость', '60 Ah'),
    (4, 'Напряжение', '12V'),
    (4, 'Полярность', 'Прямая')
ON CONFLICT DO NOTHING;

--rollback DROP TABLE IF EXISTS user_profiles;
--rollback DROP TABLE IF EXISTS generated_reports;
--rollback DROP TABLE IF EXISTS order_products;
--rollback DROP TABLE IF EXISTS orders;
--rollback DROP TABLE IF EXISTS product_properties;
--rollback DROP TABLE IF EXISTS products;
