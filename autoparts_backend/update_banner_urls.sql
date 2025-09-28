-- SQL script to update banner imageUrl values to match renamed files

-- Update banner_2 (foodsave fesign.png -> foodsave_fesign.png)
UPDATE banners 
SET image_url = '/files/banner_2_1759060150600_foodsave_fesign.png'
WHERE image_url LIKE '%banner_2_1759060150600_foodsave%';

-- Update banner_3 (вфываыаамфв.png -> ____________.png)
UPDATE banners 
SET image_url = '/files/banner_3_1759060489576____________.png'
WHERE image_url LIKE '%banner_3_1759060489576_%';

-- Show current banner records
SELECT id, title, image_url, status FROM banners ORDER BY id;