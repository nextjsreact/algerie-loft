-- Function to check if RLS is enabled on a table
-- This should be run in Supabase SQL editor or via migration

CREATE OR REPLACE FUNCTION check_rls_enabled(table_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    rls_enabled boolean;
BEGIN
    SELECT relrowsecurity INTO rls_enabled
    FROM pg_class
    WHERE relname = table_name;
    
    RETURN COALESCE(rls_enabled, false);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_rls_enabled(text) TO authenticated;
GRANT EXECUTE ON FUNCTION check_rls_enabled(text) TO service_role;