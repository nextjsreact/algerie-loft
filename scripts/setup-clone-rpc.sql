-- =====================================================
-- FONCTION RPC POUR LISTER LES TABLES
-- =====================================================

-- Fonction pour lister toutes les tables publiques
CREATE OR REPLACE FUNCTION get_tables_list()
RETURNS TABLE(table_name text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT t.table_name::text
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
  ORDER BY t.table_name;
END;
$$;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION get_tables_list() TO service_role;
GRANT EXECUTE ON FUNCTION get_tables_list() TO anon;