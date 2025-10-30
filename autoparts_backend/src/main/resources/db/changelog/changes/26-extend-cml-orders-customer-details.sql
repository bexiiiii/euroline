--liquibase formatted sql
--changeset autoparts:26-extend-cml-orders-customer-details
ALTER TABLE cml_orders
    ADD COLUMN customer_first_name VARCHAR(255),
    ADD COLUMN customer_last_name VARCHAR(255),
    ADD COLUMN customer_middle_name VARCHAR(255),
    ADD COLUMN customer_state VARCHAR(255),
    ADD COLUMN customer_type VARCHAR(255),
    ADD COLUMN customer_office_address VARCHAR(500),
    ADD COLUMN customer_user_id BIGINT;
