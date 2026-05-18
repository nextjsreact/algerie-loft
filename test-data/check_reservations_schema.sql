-- Vérifier la structure de la table reservations
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    is_generated
FROM information_schema.columns
WHERE table_name = 'reservations'
AND column_name IN ('nights', 'check_in_date', 'check_out_date')
ORDER BY ordinal_position;
