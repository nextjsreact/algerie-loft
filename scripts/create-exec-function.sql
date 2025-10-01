-- Fonction pour exécuter du SQL directement
CREATE OR REPLACE FUNCTION exec(sql text)
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

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION exec(text) TO service_role;