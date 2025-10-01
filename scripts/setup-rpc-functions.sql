-- =====================================================
-- FONCTIONS RPC POUR LE CLONAGE COMPLET
-- =====================================================
-- Ces fonctions permettent d'exécuter du SQL brut depuis le script de clonage

-- Fonction pour exécuter du SQL brut
CREATE OR REPLACE FUNCTION execute_sql(sql text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
  RETURN 'SUCCESS';
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'ERROR: ' || SQLERRM;
END;
$$;

-- Fonction pour obtenir le dump du schéma (optionnelle)
CREATE OR REPLACE FUNCTION get_schema_dump()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  schema_dump text := '';
  table_record record;
  column_record record;
BEGIN
  -- Parcourir toutes les tables publiques
  FOR table_record IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  LOOP
    schema_dump := schema_dump || E'\n-- Table: ' || table_record.table_name || E'\n';
    schema_dump := schema_dump || 'CREATE TABLE "' || table_record.table_name || '" (' || E'\n';
    
    -- Parcourir les colonnes de la table
    FOR column_record IN
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length,
        ordinal_position
      FROM information_schema.columns
      WHERE table_schema = 'public' 
        AND table_name = table_record.table_name
      ORDER BY ordinal_position
    LOOP
      IF column_record.ordinal_position > 1 THEN
        schema_dump := schema_dump || ',' || E'\n';
      END IF;
      
      schema_dump := schema_dump || '  "' || column_record.column_name || '" ' || column_record.data_type;
      
      IF column_record.character_maximum_length IS NOT NULL THEN
        schema_dump := schema_dump || '(' || column_record.character_maximum_length || ')';
      END IF;
      
      IF column_record.is_nullable = 'NO' THEN
        schema_dump := schema_dump || ' NOT NULL';
      END IF;
      
      IF column_record.column_default IS NOT NULL THEN
        schema_dump := schema_dump || ' DEFAULT ' || column_record.column_default;
      END IF;
    END LOOP;
    
    schema_dump := schema_dump || E'\n);' || E'\n';
  END LOOP;
  
  RETURN schema_dump;
END;
$$;

-- Fonction pour lister tous les objets de la base
CREATE OR REPLACE FUNCTION list_database_objects()
RETURNS TABLE(object_name text, object_type text, object_schema text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Tables
  RETURN QUERY
  SELECT 
    table_name::text,
    'table'::text,
    table_schema::text
  FROM information_schema.tables
  WHERE table_schema = 'public';
  
  -- Vues
  RETURN QUERY
  SELECT 
    table_name::text,
    'view'::text,
    table_schema::text
  FROM information_schema.views
  WHERE table_schema = 'public';
  
  -- Fonctions
  RETURN QUERY
  SELECT 
    proname::text,
    'function'::text,
    'public'::text
  FROM pg_proc
  WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND proname NOT LIKE 'pg_%';
END;
$$;

-- Accorder les permissions nécessaires
GRANT EXECUTE ON FUNCTION execute_sql(text) TO service_role;
GRANT EXECUTE ON FUNCTION get_schema_dump() TO service_role;
GRANT EXECUTE ON FUNCTION list_database_objects() TO service_role;