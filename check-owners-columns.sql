-- =====================================================
-- Vérifier les colonnes de la table owners
-- =====================================================

-- 1. Lister toutes les colonnes de la table owners
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'owners'
ORDER BY ordinal_position;

-- 2. Vérifier spécifiquement les colonnes de statut
SELECT 
  column_name
FROM information_schema.columns
WHERE table_name = 'owners'
AND column_name IN (
  'verification_status',
  'approved_at',
  'approved_by',
  'rejected_at',
  'rejected_by',
  'rejection_reason',
  'admin_notes'
);

-- 3. Voir un exemple de données
SELECT 
  id,
  name,
  verification_status,
  user_id
FROM owners
WHERE user_id IS NOT NULL
LIMIT 3;
