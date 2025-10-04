-- Script simple pour vérifier l'état des triggers d'audit
-- Exécutez ce script dans Supabase Dashboard > SQL Editor

-- 1. Vérifier tous les triggers d'audit existants
SELECT 
    trigger_name,
    event_object_table as table_name,
    string_agg(event_manipulation, ', ') as events,
    action_timing,
    CASE 
        WHEN trigger_name IS NOT NULL THEN '✅ ACTIF'
        ELSE '❌ MANQUANT'
    END as status
FROM information_schema.triggers 
WHERE trigger_name LIKE '%audit%'
  AND event_object_schema = 'public'
GROUP BY trigger_name, event_object_table, action_timing
ORDER BY event_object_table;

-- 2. Vérifier les tables qui DEVRAIENT avoir des triggers
WITH expected_tables AS (
    SELECT unnest(ARRAY['transactions', 'tasks', 'reservations', 'lofts']) as table_name
),
existing_triggers AS (
    SELECT DISTINCT event_object_table as table_name
    FROM information_schema.triggers 
    WHERE trigger_name LIKE '%audit%'
      AND event_object_schema = 'public'
)
SELECT 
    e.table_name,
    CASE 
        WHEN t.table_name IS NOT NULL THEN '✅ TRIGGER PRÉSENT'
        ELSE '❌ TRIGGER MANQUANT'
    END as status
FROM expected_tables e
LEFT JOIN existing_triggers t ON e.table_name = t.table_name
ORDER BY e.table_name;

-- 3. Vérifier les fonctions d'audit
SELECT 
    proname as function_name,
    pronamespace::regnamespace as schema_name,
    '✅ FONCTION PRÉSENTE' as status
FROM pg_proc 
WHERE proname LIKE '%audit%' 
  AND pronamespace::regnamespace::text = 'audit'
ORDER BY proname;

-- 4. Compter les logs d'audit par action pour voir l'activité
SELECT 
    action,
    COUNT(*) as count,
    MAX("timestamp") as last_activity
FROM audit.audit_logs 
WHERE table_name = 'transactions'
GROUP BY action
ORDER BY action;

-- 5. Résumé global
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_name LIKE '%audit%') >= 4 
        THEN '✅ SYSTÈME D''AUDIT COMPLET'
        ELSE '⚠️ SYSTÈME D''AUDIT INCOMPLET'
    END as system_status,
    (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_name LIKE '%audit%') as triggers_count,
    (SELECT COUNT(*) FROM audit.audit_logs WHERE "timestamp" >= NOW() - INTERVAL '24 hours') as recent_logs;

SELECT 'Vérification du statut des triggers terminée' as message;