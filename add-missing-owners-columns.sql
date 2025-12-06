-- =====================================================
-- Ajouter les colonnes manquantes à la table owners
-- =====================================================

-- 1. Ajouter rejected_at si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'owners' AND column_name = 'rejected_at'
  ) THEN
    ALTER TABLE owners ADD COLUMN rejected_at TIMESTAMPTZ;
    RAISE NOTICE 'Colonne rejected_at ajoutée';
  ELSE
    RAISE NOTICE 'Colonne rejected_at existe déjà';
  END IF;
END $$;

-- 2. Ajouter rejected_by si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'owners' AND column_name = 'rejected_by'
  ) THEN
    ALTER TABLE owners ADD COLUMN rejected_by UUID REFERENCES profiles(id);
    RAISE NOTICE 'Colonne rejected_by ajoutée';
  ELSE
    RAISE NOTICE 'Colonne rejected_by existe déjà';
  END IF;
END $$;

-- 3. Ajouter rejection_reason si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'owners' AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE owners ADD COLUMN rejection_reason TEXT;
    RAISE NOTICE 'Colonne rejection_reason ajoutée';
  ELSE
    RAISE NOTICE 'Colonne rejection_reason existe déjà';
  END IF;
END $$;

-- 4. Ajouter approved_at si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'owners' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE owners ADD COLUMN approved_at TIMESTAMPTZ;
    RAISE NOTICE 'Colonne approved_at ajoutée';
  ELSE
    RAISE NOTICE 'Colonne approved_at existe déjà';
  END IF;
END $$;

-- 5. Ajouter approved_by si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'owners' AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE owners ADD COLUMN approved_by UUID REFERENCES profiles(id);
    RAISE NOTICE 'Colonne approved_by ajoutée';
  ELSE
    RAISE NOTICE 'Colonne approved_by existe déjà';
  END IF;
END $$;

-- 6. Ajouter admin_notes si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'owners' AND column_name = 'admin_notes'
  ) THEN
    ALTER TABLE owners ADD COLUMN admin_notes TEXT;
    RAISE NOTICE 'Colonne admin_notes ajoutée';
  ELSE
    RAISE NOTICE 'Colonne admin_notes existe déjà';
  END IF;
END $$;

-- 7. Ajouter verification_status si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'owners' AND column_name = 'verification_status'
  ) THEN
    ALTER TABLE owners ADD COLUMN verification_status TEXT DEFAULT 'pending';
    RAISE NOTICE 'Colonne verification_status ajoutée';
  ELSE
    RAISE NOTICE 'Colonne verification_status existe déjà';
  END IF;
END $$;

-- 8. Vérifier les colonnes ajoutées
SELECT 
  column_name,
  data_type,
  is_nullable
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
)
ORDER BY column_name;

-- =====================================================
-- RÉSULTAT ATTENDU
-- =====================================================
-- ✅ Toutes les colonnes nécessaires existent
-- ✅ Les fonctions RPC peuvent maintenant fonctionner
-- =====================================================
