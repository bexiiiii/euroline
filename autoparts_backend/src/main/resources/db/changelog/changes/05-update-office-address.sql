-- Обновление записей пользователей, у которых office_address = NULL
UPDATE users 
SET office_address = 'Не указан' 
WHERE office_address IS NULL;
