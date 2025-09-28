-- SQL script to update topup receiptUrl values to match renamed files

-- Update specific problematic topup receipt URLs
UPDATE top_ups 
SET receipt_url = '/files/receipts/topups/topup_11_1757936753572__Pngtree_black_metal_texture_dna_sequence_5333174.png'
WHERE receipt_url LIKE '%topup_11_1757936753572_%' AND receipt_url LIKE '%Pngtree%';

UPDATE top_ups 
SET receipt_url = '/files/receipts/topups/topup_10_1757866533959_2025-09-09_15.08.28.jpg'
WHERE receipt_url LIKE '%topup_10_1757866533959_%' AND receipt_url LIKE '%2025-09-09%15.08.28%';

UPDATE top_ups 
SET receipt_url = '/files/receipts/topups/topup_7_1757852791503_2025-09-09_15.08.28.jpg'
WHERE receipt_url LIKE '%topup_7_1757852791503_%' AND receipt_url LIKE '%2025-09-09%15.08.28%';

UPDATE top_ups 
SET receipt_url = '/files/receipts/topups/topup_8_1757852933536_2025-09-09_15.08.28.jpg'
WHERE receipt_url LIKE '%topup_8_1757852933536_%' AND receipt_url LIKE '%2025-09-09%15.08.28%';

UPDATE top_ups 
SET receipt_url = '/files/receipts/topups/topup_9_1757853404525_2025-09-09_15.08.28.jpg'
WHERE receipt_url LIKE '%topup_9_1757853404525_%' AND receipt_url LIKE '%2025-09-09%15.08.28%';

-- Show current topup records with receipt URLs
SELECT id, client_id, amount, status, receipt_url 
FROM top_ups 
WHERE receipt_url IS NOT NULL 
ORDER BY id;