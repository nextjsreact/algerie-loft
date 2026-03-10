-- Script pour vérifier les noms de tables dans votre base de données
-- Exécutez ce script dans Supabase SQL Editor

-- 1. Lister toutes les tables dans le schéma public
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Chercher les tables qui contiennent "loft" dans leur nom
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name LIKE '%loft%'
ORDER BY table_name;

-- 3. Chercher les tables qui contiennent "owner" dans leur nom
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name LIKE '%owner%'
ORDER BY table_name;

-- 4. Chercher les tables qui contiennent "propert" dans leur nom
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name LIKE '%propert%'
ORDER BY table_name;
