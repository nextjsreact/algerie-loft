-- Fonctions RPC simples pour accéder aux logs d'audit
-- Exécutez ce script dans Supabase Dashboard > SQL Editor

-- Fonction simple pour récupérer les logs d'audit pour une entité spécifique
CREATE OR REPLACE FUNCTION get_audit_logs_for_entity(
    p_table_name TEXT,
    p_record_id UUID,
    p_limit INTEGER DEFAULT 50
)
RETURNS JSON AS $$
DECLARE
    result JSON;
    logs_data JSON;
BEGIN
    -- Récupérer les logs et les convertir en JSON
    SELECT json_agg(
        json_build_object(
            'id', al.id,
            'table_name', al.table_name,
            'record_id', al.record_id,
            'action', al.action,
            'user_id', al.user_id,
            'user_email', al.user_email,
            'timestamp', al."timestamp",
            'old_values', al.old_values,
            'new_values', al.new_values,
            'changed_fields', al.changed_fields,
            'ip_address', al.ip_address,
            'user_agent', al.user_agent,
            'session_id', al.session_id,
            'created_at', al.created_at
        ) ORDER BY al."timestamp" DESC
    ) INTO logs_data
    FROM audit.audit_logs al
    WHERE al.table_name = p_table_name
      AND al.record_id = p_record_id
    LIMIT p_limit;

    -- Construire le résultat final
    result := json_build_object(
        'success', true,
        'data', COALESCE(logs_data, '[]'::json),
        'count', (
            SELECT COUNT(*)
            FROM audit.audit_logs al
            WHERE al.table_name = p_table_name
              AND al.record_id = p_record_id
        )
    );

    RETURN result;

EXCEPTION WHEN OTHERS THEN
    result := json_build_object(
        'success', false,
        'error', SQLERRM,
        'data', '[]'::json,
        'count', 0
    );
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour compter les logs d'audit
CREATE OR REPLACE FUNCTION count_audit_logs_simple(
    p_table_name TEXT DEFAULT NULL,
    p_record_id UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    log_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO log_count
    FROM audit.audit_logs al
    WHERE (p_table_name IS NULL OR al.table_name = p_table_name)
      AND (p_record_id IS NULL OR al.record_id = p_record_id);
    
    RETURN log_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour récupérer tous les logs avec pagination
CREATE OR REPLACE FUNCTION get_all_audit_logs(
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
    result JSON;
    logs_data JSON;
    total_count INTEGER;
BEGIN
    -- Compter le total
    SELECT COUNT(*) INTO total_count FROM audit.audit_logs;

    -- Récupérer les logs
    SELECT json_agg(
        json_build_object(
            'id', al.id,
            'table_name', al.table_name,
            'record_id', al.record_id,
            'action', al.action,
            'user_id', al.user_id,
            'user_email', al.user_email,
            'timestamp', al."timestamp",
            'old_values', al.old_values,
            'new_values', al.new_values,
            'changed_fields', al.changed_fields,
            'ip_address', al.ip_address,
            'user_agent', al.user_agent
        ) ORDER BY al."timestamp" DESC
    ) INTO logs_data
    FROM audit.audit_logs al
    ORDER BY al."timestamp" DESC
    LIMIT p_limit
    OFFSET p_offset;

    result := json_build_object(
        'success', true,
        'data', COALESCE(logs_data, '[]'::json),
        'total', total_count,
        'limit', p_limit,
        'offset', p_offset
    );

    RETURN result;

EXCEPTION WHEN OTHERS THEN
    result := json_build_object(
        'success', false,
        'error', SQLERRM,
        'data', '[]'::json,
        'total', 0
    );
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test des fonctions
SELECT 'Testing simple RPC functions...' as message;

-- Test 1: Compter tous les logs
SELECT 'Total audit logs: ' || count_audit_logs_simple() as test1;

-- Test 2: Récupérer quelques logs
SELECT 'All logs test: ' || (get_all_audit_logs(3, 0)->>'total') || ' total logs' as test2;

-- Test 3: Test avec un UUID fictif
SELECT 'Entity test result: ' || (get_audit_logs_for_entity('transactions', '123e4567-e89b-12d3-a456-426614174000', 5)->>'success') as test3;