-- ============================================================================
-- Script: Vérification de Tous les Triggers d'Audit
-- Description: Vérifie que tous les triggers d'audit sont bien configurés
-- Date: 2026-03-10
-- ============================================================================

-- Vérifier tous les triggers d'audit sur les tables principales
SELECT 
    '📋 ÉTAT DES TRIGGERS D''AUDIT' as section,
    '' as spacer;

SELECT 
    c.relname as table_name,
    CASE 
        WHEN COUNT(t.tgname) > 0 THEN '✅ Configuré'
        ELSE '❌ Manquant'
    END as status,
    STRING_AGG(t.tgname, ', ') as trigger_names,
    COUNT(t.tgname) as trigger_count
FROM pg_class c
LEFT JOIN pg_trigger t ON t.tgrelid = c.oid AND NOT t.tgisinternal
LEFT JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname IN ('transactions', 'tasks', 'reservations', 'lofts', 'owners')
AND n.nspname = 'public'
GROUP BY c.relname
ORDER BY c.relname;

-- Vérifier les détails de chaque trigger
SELECT 
    '' as spacer,
    '🔍 DÉTAILS DES TRIGGERS' as section;

SELECT 
    n.nspname as schema_name,
    c.relname as table_name,
    t.tgname as trigger_name,
    CASE 
        WHEN t.tgtype & 2 = 2 THEN 'BEFORE'
        WHEN t.tgtype & 4 = 4 THEN 'AFTER'
        ELSE 'INSTEAD OF'
    END as timing,
    CASE 
        WHEN t.tgtype & 4 = 4 THEN 'INSERT'
        WHEN t.tgtype & 8 = 8 THEN 'DELETE'
        WHEN t.tgtype & 16 = 16 THEN 'UPDATE'
        ELSE 'MULTIPLE EVENTS'
    END as event_type,
    pg_get_functiondef(t.tgfoid) LIKE '%audit%' as is_audit_function
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname IN ('transactions', 'tasks', 'reservations', 'lofts', 'owners')
AND n.nspname = 'public'
AND NOT t.tgisinternal
ORDER BY c.relname, t.tgname;

-- Vérifier que la fonction d'audit existe
SELECT 
    '' as spacer,
    '🔧 FONCTION D''AUDIT' as section;

SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    '✅ Existe' as status,
    pg_get_function_identity_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'audit'
AND p.proname LIKE '%audit_trigger%'
ORDER BY p.proname;

-- Compter les logs d'audit récents par table
SELECT 
    '' as spacer,
    '📊 LOGS D''AUDIT RÉCENTS (dernières 24h)' as section;

-- Note: Cette requête nécessite d'avoir accès au schéma audit
-- Si elle échoue, c'est normal, cela signifie que vous n'avez pas les permissions
-- sur le schéma audit depuis le SQL Editor

-- Résumé final
SELECT 
    '' as spacer,
    '✅ RÉSUMÉ' as section;

SELECT 
    COUNT(DISTINCT c.relname) as tables_with_triggers,
    5 as expected_tables,
    CASE 
        WHEN COUNT(DISTINCT c.relname) = 5 THEN '✅ Tous les triggers sont configurés!'
        ELSE '⚠️ Certains triggers manquent'
    END as status
FROM pg_class c
JOIN pg_trigger t ON t.tgrelid = c.oid AND NOT t.tgisinternal
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname IN ('transactions', 'tasks', 'reservations', 'lofts', 'owners')
AND n.nspname = 'public'
AND t.tgname LIKE 'audit_trigger_%';

-- ============================================================================
-- Interprétation des Résultats:
-- ============================================================================
-- Si vous voyez 5 tables avec "✅ Configuré", tout fonctionne correctement!
-- Si une table montre "❌ Manquant", le trigger n'est pas configuré
-- ============================================================================
