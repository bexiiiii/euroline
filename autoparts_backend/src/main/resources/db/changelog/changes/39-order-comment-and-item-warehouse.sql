-- Комментарий клиента к заказу (раньше склеивался в delivery_address)
-- и склад позиции, перенесённый из корзины.
ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS comment TEXT;

ALTER TABLE order_items
    ADD COLUMN IF NOT EXISTS warehouse_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS warehouse_ref_key VARCHAR(64);
