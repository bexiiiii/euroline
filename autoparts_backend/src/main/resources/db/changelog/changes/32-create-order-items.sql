-- The JPA order model has always used order_items, while the earliest schema
-- only created order_products. Preserve any legacy rows during the transition.
CREATE TABLE IF NOT EXISTS order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id),
    sku VARCHAR(100),
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id);

INSERT INTO order_items (order_id, product_id, quantity, price)
SELECT op.order_id, op.product_id, op.quantity, op.price
FROM order_products op
WHERE NOT EXISTS (
    SELECT 1
    FROM order_items oi
    WHERE oi.order_id = op.order_id AND oi.product_id = op.product_id
);
