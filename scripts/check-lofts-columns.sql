-- Script pour voir TOUTES les colonnes de la table lofts
-- Exécutez ce script dans Supabase SQL Editor

SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'lofts'
ORDER BY ordinal_position;
