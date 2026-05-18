-- Vérifier la structure complète de la table transactions
-- À exécuter dans Supabase SQL Editor

-- 1. Voir toutes les colonnes de la table transactions
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'transactions'
ORDER BY ordinal_position;

-- 2. Chercher spécifiquement les colonnes liées aux catégories
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'transactions'
  AND (
    column_name LIKE '%categ%'
    OR column_name LIKE '%type%'
  )
ORDER BY column_name;
