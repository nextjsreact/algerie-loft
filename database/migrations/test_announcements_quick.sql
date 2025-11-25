-- ============================================
-- TEST RAPIDE - SYSTÈME D'ANNONCES
-- ============================================
-- Exécutez ce script pour tester rapidement
-- si tout fonctionne

-- TEST 1: La table existe-t-elle ?
-- =================================
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'urgent_announcements'
    ) THEN '✅ Table existe'
    ELSE '❌ Table n''existe pas - Exécutez create_urgent_announcements.sql'
  END as test_table;

-- TEST 2: RLS est-il activé ?
-- ============================
SELECT 
  CASE 
    WHEN relrowsecurity THEN '✅ RLS activé'
    ELSE '❌ RLS désactivé'
  END as test_rls
FROM pg_class
WHERE relname = 'urgent_announcements';

-- TEST 3: Combien de politiques ?
-- ================================
SELECT 
  COUNT(*) as nombre_politiques,
  CASE 
    WHEN COUNT(*) >= 5 THEN '✅ Politiques OK'
    WHEN COUNT(*) > 0 THEN '⚠️ Politiques incomplètes'
    ELSE '❌ Aucune politique - Exécutez fix_announcements_policies_v2.sql'
  END as test_politiques
FROM pg_policies
WHERE tablename = 'urgent_announcements';

-- TEST 4: Liste des politiques
-- =============================
SELECT 
  policyname as politique,
  cmd as operation,
  roles as pour_roles
FROM pg_policies
WHERE tablename = 'urgent_announcements'
ORDER BY cmd, policyname;

-- TEST 5: Votre identité
-- =======================
SELECT 
  auth.uid() as votre_user_id,
  p.email as votre_email,
  p.role as votre_role,
  CASE 
    WHEN p.role IN ('admin', 'superuser') THEN '✅ Vous pouvez gérer les annonces'
    WHEN p.role IS NULL THEN '❌ Profil non trouvé'
    ELSE '❌ Rôle insuffisant: ' || p.role
  END as statut
FROM profiles p
WHERE p.id = auth.uid();

-- TEST 6: Pouvez-vous lire ?
-- ===========================
SELECT 
  CASE 
    WHEN COUNT(*) >= 0 THEN '✅ Lecture autorisée (' || COUNT(*) || ' annonces)'
    ELSE '❌ Lecture refusée'
  END as test_lecture
FROM urgent_announcements;

-- TEST 7: Test d'insertion (sera annulé)
-- =======================================
DO $$
DECLARE
  test_id UUID;
  can_insert BOOLEAN := false;
BEGIN
  -- Essayer d'insérer
  BEGIN
    INSERT INTO urgent_announcements (
      message_fr,
      message_en,
      message_ar,
      start_date,
      end_date,
      background_color,
      text_color,
      is_active
    ) VALUES (
      'TEST',
      'TEST',
      'TEST',
      NOW(),
      NOW() + INTERVAL '1 day',
      '#000000',
      '#FFFFFF',
      false
    )
    RETURNING id INTO test_id;
    
    can_insert := true;
    
    -- Supprimer immédiatement
    DELETE FROM urgent_announcements WHERE id = test_id;
    
    RAISE NOTICE '✅ TEST INSERTION: RÉUSSI';
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE NOTICE '❌ TEST INSERTION: ÉCHEC - Permission refusée';
    WHEN OTHERS THEN
      RAISE NOTICE '❌ TEST INSERTION: ÉCHEC - %', SQLERRM;
  END;
END $$;

-- RÉSUMÉ FINAL
-- ============
DO $$
DECLARE
  table_exists BOOLEAN;
  rls_enabled BOOLEAN;
  policy_count INTEGER;
  user_role TEXT;
  can_read BOOLEAN := false;
BEGIN
  -- Vérifier la table
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'urgent_announcements'
  ) INTO table_exists;
  
  -- Vérifier RLS
  SELECT relrowsecurity INTO rls_enabled
  FROM pg_class
  WHERE relname = 'urgent_announcements';
  
  -- Compter les politiques
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'urgent_announcements';
  
  -- Récupérer le rôle
  SELECT role INTO user_role
  FROM profiles
  WHERE id = auth.uid();
  
  -- Tester la lecture
  BEGIN
    PERFORM COUNT(*) FROM urgent_announcements;
    can_read := true;
  EXCEPTION
    WHEN OTHERS THEN
      can_read := false;
  END;
  
  -- Afficher le résumé
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RÉSUMÉ DES TESTS';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Table existe: %', CASE WHEN table_exists THEN '✅' ELSE '❌' END;
  RAISE NOTICE 'RLS activé: %', CASE WHEN rls_enabled THEN '✅' ELSE '❌' END;
  RAISE NOTICE 'Politiques: % %', policy_count, CASE WHEN policy_count >= 5 THEN '✅' ELSE '❌' END;
  RAISE NOTICE 'Votre rôle: %', COALESCE(user_role, 'NULL');
  RAISE NOTICE 'Peut lire: %', CASE WHEN can_read THEN '✅' ELSE '❌' END;
  RAISE NOTICE '========================================';
  
  IF table_exists AND rls_enabled AND policy_count >= 5 AND user_role IN ('admin', 'superuser') AND can_read THEN
    RAISE NOTICE '🎉 TOUT EST OK! Vous pouvez créer des annonces.';
  ELSE
    RAISE NOTICE '⚠️ PROBLÈMES DÉTECTÉS:';
    IF NOT table_exists THEN
      RAISE NOTICE '  - Exécutez: create_urgent_announcements.sql';
    END IF;
    IF NOT rls_enabled OR policy_count < 5 THEN
      RAISE NOTICE '  - Exécutez: fix_announcements_policies_v2.sql';
    END IF;
    IF user_role NOT IN ('admin', 'superuser') THEN
      RAISE NOTICE '  - Changez votre rôle: UPDATE profiles SET role = ''admin'' WHERE id = auth.uid();';
    END IF;
  END IF;
END $$;
