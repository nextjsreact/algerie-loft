-- Script pour trouver dans quel schéma sont vos tables
-- Exécutez ce script dans Supabase Dashboard > SQL Editor

-- 1. Chercher les tables dans tous les schémas
SELECT 
    table_schema,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name IN ('transactions', 'tasks', 'reservations', 'lofts')
ORDER BY table_schema, table_name;

-- 2. Vérifier les triggers existants dans tous les schémas
SELECT 
    trigger_schema,
    trigger_name,
    event_object_schema,
    event_object_table,
    string_agg(event_manipulation, ', ') as events
FROM information_schema.triggers 
WHERE trigger_name LIKE '%audit%'
   OR event_object_table IN ('transactions', 'tasks', 'reservations', 'lofts')
GROUP BY trigger_schema, trigger_name, event_object_schema, event_object_table
ORDER BY event_object_schema, event_object_table;

-- 3. Vérifier spécifiquement dans le schéma auth
SELECT 
    'SCHÉMA AUTH' as info,
    table_name
FROM information_schema.tables 
WHERE table_schema = 'auth'
  AND table_name IN ('transactions', 'tasks', 'reservations', 'lofts');

-- 4. Vérifier spécifiquement dans le schéma public
SELECT 
    'SCHÉMA PUBLIC' as info,
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND table_name IN ('transactions', 'tasks', 'reservations', 'lofts');

-- 5. Voir tous les schémas disponibles
SELECT 
    schema_name,
    schema_owner
FROM information_schema.schemata 
WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
ORDER BY schema_name;

SELECT 'Recherche des schémas terminée' as message;