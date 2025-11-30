-- Vérifier le dernier backup créé
SELECT 
    id,
    backup_type,
    status,
    file_path,
    file_size,
    started_at,
    completed_at,
    checksum
FROM backup_records 
WHERE id = 'a2925cc6-b223-4d4d-ba24-b138c501e520'
ORDER BY started_at DESC;

-- Voir tous les backups récents
SELECT 
    id,
    backup_type,
    status,
    file_path,
    file_size,
    started_at
FROM backup_records 
ORDER BY started_at DESC 
LIMIT 5;
