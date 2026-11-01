-- products.price для товаров из 1С = только розничная цена ("Прайс-лист").
-- Раньше туда попадала последняя цена любого вида, в т.ч. "Приходная цена" (закупочная).
-- GUID вида цены совпадает с onec.prices.retail-type-ref-key по умолчанию.
UPDATE products p
SET price = (
    SELECT op.amount::int
    FROM onec_prices op
    WHERE op.product_ref_key = p.onec_ref_key
      AND op.price_type_ref_key = '08430c1c-5f35-11f1-9248-7c214aee94f8'
      AND op.amount > 0
    ORDER BY op.updated_at DESC
    LIMIT 1
)
WHERE p.onec_ref_key IS NOT NULL;
