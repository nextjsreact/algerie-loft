-- Vérifier le dernier backup
SELECT 
    id,
    backup_type,
    status,
    file_path,
    file_size,
    checksum,
    started_at,
    completed_at,
    error_message
FROM backup_records 
WHERE id = '51f761f9-55be-454f-86a0-bde8c9c3f140';

-- Voir tous les backups récents avec détails
SELECT 
    id,
    backup_type,
    status,
    file_path,
    file_size,
    started_at,
    completed_at
FROM backup_records 
ORDER BY started_at DESC 
LIMIT 5;
