-- =====================================================
-- SCRIPT DE TEST : Tracking des Visiteurs
-- =====================================================
-- Ce script teste le système de tracking et crée des données de démonstration

-- =====================================================
-- PARTIE 1 : VÉRIFICATION DU SYSTÈME
-- =====================================================

-- 1. Vérifier que les tables existent
SELECT 
  'Tables' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 2 THEN '✅ OK'
    ELSE '❌ ERREUR'
  END as status
FROM information_schema.tables 
WHERE table_name IN ('visitors', 'page_views');

-- 2. Vérifier que les fonctions existent
SELECT 
  'Functions' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) >= 3 THEN '✅ OK'
    ELSE '❌ ERREUR'
  END as status
FROM information_schema.routines 
WHERE routine_name IN ('get_visitor_stats', 'get_visitor_trends', 'record_visitor');

-- 3. Vérifier les index
SELECT 
  'Indexes' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) >= 7 THEN '✅ OK'
    ELSE '⚠️ ATTENTION'
  END as status
FROM pg_indexes 
WHERE tablename IN ('visitors', 'page_views');

-- =====================================================
-- PARTIE 2 : ÉTAT ACTUEL
-- =====================================================

-- Statistiques actuelles
SELECT 
  '📊 STATISTIQUES ACTUELLES' as section,
  total_visitors as "Total Visiteurs",
  today_visitors as "Visiteurs Aujourd'hui",
  unique_today as "Nouveaux Aujourd'hui",
  total_page_views as "Total Pages Vues",
  today_page_views as "Pages Vues Aujourd'hui",
  ROUND(avg_session_duration::numeric, 2) as "Durée Moy. (secondes)"
FROM get_visitor_stats();

-- Derniers visiteurs
SELECT 
  '👥 DERNIERS VISITEURS' as section,
  session_id as "Session",
  device_type as "Appareil",
  browser as "Navigateur",
  landing_page as "Page d'arrivée",
  first_visit as "Première visite",
  visit_count as "Nb visites"
FROM visitors
ORDER BY first_visit DESC
LIMIT 5;

-- =====================================================
-- PARTIE 3 : CRÉER DES DONNÉES DE TEST
-- =====================================================

-- Créer 20 visiteurs de test réalistes
DO $$
DECLARE
  v_session_id TEXT;
  v_date TIMESTAMP;
  v_device TEXT;
  v_browser TEXT;
  v_os TEXT;
  v_referrer TEXT;
  v_landing TEXT;
BEGIN
  FOR i IN 1..20 LOOP
    -- Générer des données variées
    v_session_id := 'demo-session-' || gen_random_uuid()::text;
    v_date := NOW() - (i || ' hours')::interval;
    
    -- Varier les appareils (60% mobile, 30% desktop, 10% tablet)
    v_device := CASE 
      WHEN i % 10 < 6 THEN 'mobile'
      WHEN i % 10 < 9 THEN 'desktop'
      ELSE 'tablet'
    END;
    
    -- Varier les navigateurs
    v_browser := CASE i % 4
      WHEN 0 THEN 'Chrome'
      WHEN 1 THEN 'Safari'
      WHEN 2 THEN 'Firefox'
      ELSE 'Edge'
    END;
    
    -- Varier les OS
    v_os := CASE 
      WHEN v_device = 'mobile' THEN 
        CASE i % 2 WHEN 0 THEN 'Android' ELSE 'iOS' END
      WHEN v_device = 'tablet' THEN 'iOS'
      ELSE CASE i % 3 WHEN 0 THEN 'Windows' WHEN 1 THEN 'MacOS' ELSE 'Linux' END
    END;
    
    -- Varier les sources
    v_referrer := CASE i % 5
      WHEN 0 THEN 'https://google.com'
      WHEN 1 THEN 'https://facebook.com'
      WHEN 2 THEN 'https://instagram.com'
      WHEN 3 THEN NULL  -- Direct
      ELSE 'https://twitter.com'
    END;
    
    -- Varier les pages d'arrivée
    v_landing := CASE i % 4
      WHEN 0 THEN '/fr'
      WHEN 1 THEN '/en'
      WHEN 2 THEN '/ar'
      ELSE '/fr/lofts'
    END;
    
    -- Insérer le visiteur
    INSERT INTO visitors (
      session_id,
      ip_address,
      user_agent,
      referrer,
      landing_page,
      device_type,
      browser,
      os,
      first_visit,
      last_visit,
      visit_count,
      created_at,
      updated_at
    ) VALUES (
      v_session_id,
      ('192.168.' || (i % 255) || '.' || ((i * 7) % 255))::inet,
      'Mozilla/5.0 (' || v_os || ') ' || v_browser || '/120.0.0.0',
      v_referrer,
      v_landing,
      v_device,
      v_browser,
      v_os,
      v_date,
      v_date,
      1,
      v_date,
      v_date
    );
    
    -- Ajouter quelques pages vues (50% des visiteurs)
    IF i % 2 = 0 THEN
      INSERT INTO page_views (
        visitor_id,
        session_id,
        page_url,
        page_title,
        duration_seconds,
        viewed_at,
        created_at
      ) VALUES (
        (SELECT id FROM visitors WHERE session_id = v_session_id),
        v_session_id,
        v_landing,
        'Loft Algérie - Location de Lofts',
        60 + (i * 10),  -- Entre 60 et 260 secondes
        v_date,
        v_date
      );
    END IF;
  END LOOP;
  
  RAISE NOTICE '✅ 20 visiteurs de test créés avec succès !';
END $$;

-- =====================================================
-- PARTIE 4 : VÉRIFICATION APRÈS CRÉATION
-- =====================================================

-- Nouvelles statistiques
SELECT 
  '📊 NOUVELLES STATISTIQUES' as section,
  total_visitors as "Total Visiteurs",
  today_visitors as "Visiteurs Aujourd'hui",
  unique_today as "Nouveaux Aujourd'hui",
  total_page_views as "Total Pages Vues",
  today_page_views as "Pages Vues Aujourd'hui",
  ROUND(avg_session_duration::numeric, 2) as "Durée Moy. (secondes)"
FROM get_visitor_stats();

-- Répartition par appareil
SELECT 
  '📱 RÉPARTITION PAR APPAREIL' as section,
  device_type as "Appareil",
  COUNT(*) as "Nombre",
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as "Pourcentage"
FROM visitors
GROUP BY device_type
ORDER BY COUNT(*) DESC;

-- Répartition par navigateur
SELECT 
  '🌐 RÉPARTITION PAR NAVIGATEUR' as section,
  browser as "Navigateur",
  COUNT(*) as "Nombre",
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as "Pourcentage"
FROM visitors
GROUP BY browser
ORDER BY COUNT(*) DESC;

-- Sources de trafic
SELECT 
  '🔗 SOURCES DE TRAFIC' as section,
  COALESCE(referrer, 'Direct') as "Source",
  COUNT(*) as "Nombre",
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as "Pourcentage"
FROM visitors
GROUP BY referrer
ORDER BY COUNT(*) DESC;

-- Pages d'arrivée populaires
SELECT 
  '🏠 PAGES D''ARRIVÉE' as section,
  landing_page as "Page",
  COUNT(*) as "Nombre",
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as "Pourcentage"
FROM visitors
GROUP BY landing_page
ORDER BY COUNT(*) DESC;

-- Tendances des 7 derniers jours
SELECT 
  '📈 TENDANCES (7 JOURS)' as section,
  date as "Date",
  new_visitors as "Nouveaux",
  returning_visitors as "Retours",
  total_page_views as "Pages Vues"
FROM get_visitor_trends()
ORDER BY date DESC;

-- =====================================================
-- PARTIE 5 : COMMANDES UTILES
-- =====================================================

-- Pour supprimer TOUTES les données de test
-- ATTENTION : Ceci supprime TOUT !
-- UNCOMMENT POUR UTILISER :
-- DELETE FROM page_views;
-- DELETE FROM visitors;

-- Pour supprimer uniquement les données de test (avec 'demo-session')
-- DELETE FROM page_views WHERE session_id LIKE 'demo-session-%';
-- DELETE FROM visitors WHERE session_id LIKE 'demo-session-%';

-- Pour voir les détails d'un visiteur spécifique
-- SELECT * FROM visitors WHERE session_id = 'votre-session-id';

-- Pour voir toutes les pages vues d'un visiteur
-- SELECT * FROM page_views WHERE session_id = 'votre-session-id';

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================

SELECT 
  '✅ SCRIPT TERMINÉ' as status,
  'Consultez maintenant votre dashboard superuser !' as message;
