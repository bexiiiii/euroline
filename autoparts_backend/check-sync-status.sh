#!/bin/bash

echo "=== Checking ProductSyncService execution ==="
echo ""

echo "1. Recent sync executions (last 500 lines):"
tail -500 /root/euroline/autoparts_backend/logs/application.log | grep "ProductSyncService" || echo "No ProductSyncService logs found"

echo ""
echo "2. Sync results (Updated prices and stocks):"
tail -500 /root/euroline/autoparts_backend/logs/application.log | grep "Updated prices and stocks" || echo "No sync results found"

echo ""
echo "3. Offers import completions (should trigger sync):"
tail -500 /root/euroline/autoparts_backend/logs/application.log | grep "Offers import completed" || echo "No offers import logs found"

echo ""
echo "4. Any sync-related errors:"
tail -500 /root/euroline/autoparts_backend/logs/application.log | grep -i "error\|exception" | grep -i "sync\|price\|product" || echo "No sync errors found"

echo ""
echo "=== Database check: Do cml_prices have data for problematic products? ==="
echo ""
echo "Run this SQL query in your database:"
echo ""
cat <<'SQL'
SELECT 
    p.id, 
    p.name, 
    p.external_code, 
    p.price as current_price,
    p.synced_with_1c,
    pr.value as cml_price, 
    COALESCE(st.total_stock, 0) as cml_stock
FROM products p
LEFT JOIN cml_prices pr ON pr.product_guid = p.external_code
LEFT JOIN (
    SELECT product_guid, SUM(quantity) as total_stock 
    FROM cml_stocks 
    GROUP BY product_guid
) st ON st.product_guid = p.external_code
WHERE p.id IN (495976, 19, 510232, 5, 6, 1, 2, 3, 4)
ORDER BY p.id;
SQL

echo ""
echo "=== Expected results interpretation ==="
echo "- If cml_price is NULL: 1C didn't send prices for this product"
echo "- If cml_price has value but current_price is NULL: Sync didn't run or failed"
echo "- If both have values: Sync worked correctly"
