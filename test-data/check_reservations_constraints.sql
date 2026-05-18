-- Vérifier toutes les contraintes NOT NULL de la table reservations
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'reservations'
ORDER BY ordinal_position;
