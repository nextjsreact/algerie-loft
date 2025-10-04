-- Fonctions simples pour tester le système d'audit
-- Exécutez ce script APRÈS avoir exécuté simple-audit-setup.sql

-- Fonction simple pour vérifier si un schéma existe
CREATE OR REPLACE FUNCTION check_schema_exists(p_schema_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM information_schema.schemata 
        WHERE schema_name = p_schema_name
    );
END;
$$ LANGUAGE plpgsql;

-- Fonction simple pour vérifier si une table existe
CREATE OR REPLACE FUNCTION check_table_exists(p_schema_name TEXT, p_table_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = p_schema_name AND table_name = p_table_name
    );
END;
$$ LANGUAGE plpgsql;

-- Fonction simple pour tester l'accès aux logs d'audit
CREATE OR REPLACE FUNCTION test_audit_logs_access()
RETURNS JSON AS $$
DECLARE
    result JSON;
    log_count INTEGER := 0;
    sample_log JSON;
BEGIN
    -- Compter les logs
    SELECT COUNT(*) INTO log_count FROM audit.audit_logs;
    
    -- Obtenir un échantillon si des logs existent
    IF log_count > 0 THEN
        SELECT json_build_object(
            'id', id,
            'table_name', table_name,
            'action', action,
            'timestamp', timestamp,
            'user_email', user_email
        ) INTO sample_log
        FROM audit.audit_logs 
        ORDER BY timestamp DESC 
        LIMIT 1;
    END IF;
    
    result := json_build_object(
        'exists', true,
        'count', log_count,
        'sample', sample_log,
        'error', null
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    result := json_build_object(
        'exists', false,
        'count', 0,
        'error', SQLERRM
    );
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Test des fonctions
SELECT 'Schema audit exists: ' || check_schema_exists('audit') as test1;
SELECT 'Table audit_logs exists: ' || check_table_exists('audit', 'audit_logs') as test2;
SELECT 'Audit logs access test: ' || test_audit_logs_access() as test3;