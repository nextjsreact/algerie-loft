-- Fonctions d'aide pour le système d'audit
-- Exécutez ce script dans Supabase Dashboard > SQL Editor

-- Fonction pour vérifier si un schéma existe
CREATE OR REPLACE FUNCTION check_schema_exists(schema_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM information_schema.schemata 
        WHERE schema_name = $1
    );
END;
$$ LANGUAGE plpgsql;

-- Fonction pour vérifier si une table existe
CREATE OR REPLACE FUNCTION check_table_exists(schema_name TEXT, table_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = $1 AND table_name = $2
    );
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir le nombre de logs d'audit
CREATE OR REPLACE FUNCTION get_audit_logs_count()
RETURNS INTEGER AS $$
DECLARE
    log_count INTEGER := 0;
BEGIN
    -- Vérifier si la table existe d'abord
    IF check_table_exists('audit', 'audit_logs') THEN
        SELECT COUNT(*) INTO log_count FROM audit.audit_logs;
    END IF;
    
    RETURN log_count;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour tester la connexion à la table audit_logs
CREATE OR REPLACE FUNCTION test_audit_logs_access()
RETURNS JSON AS $$
DECLARE
    result JSON;
    log_count INTEGER := 0;
    sample_log JSON;
BEGIN
    -- Vérifier si la table existe
    IF NOT check_table_exists('audit', 'audit_logs') THEN
        result := json_build_object(
            'exists', false,
            'count', 0,
            'error', 'Table audit.audit_logs does not exist'
        );
        RETURN result;
    END IF;
    
    -- Compter les logs
    SELECT COUNT(*) INTO log_count FROM audit.audit_logs;
    
    -- Obtenir un échantillon si des logs existent
    IF log_count > 0 THEN
        SELECT json_build_object(
            'id', id,
            'table_name', table_name,
            'action', action,
            'timestamp', timestamp
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