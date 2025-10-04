-- Fonctions RPC pour accéder aux logs d'audit
-- Exécutez ce script dans Supabase Dashboard > SQL Editor

-- Fonction pour récupérer les logs d'audit pour une entité spécifique
CREATE OR REPLACE FUNCTION get_audit_logs_for_entity(
    p_table_name TEXT,
    p_record_id UUID,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    table_name VARCHAR(50),
    record_id UUID,
    action VARCHAR(10),
    user_id UUID,
    user_email VARCHAR(255),
    "timestamp" TIMESTAMP WITH TIME ZONE,
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.id,
        al.table_name,
        al.record_id,
        al.action,
        al.user_id,
        al.user_email,
        al."timestamp",
        al.old_values,
        al.new_values,
        al.changed_fields,
        al.ip_address,
        al.user_agent,
        al.session_id,
        al.created_at
    FROM audit.audit_logs al
    WHERE al.table_name = p_table_name
      AND al.record_id = p_record_id
    ORDER BY al."timestamp" DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour récupérer tous les logs d'audit avec filtres
CREATE OR REPLACE FUNCTION get_audit_logs_filtered(
    p_table_name TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_action VARCHAR(10) DEFAULT NULL,
    p_date_from TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_date_to TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    table_name VARCHAR(50),
    record_id UUID,
    action VARCHAR(10),
    user_id UUID,
    user_email VARCHAR(255),
    "timestamp" TIMESTAMP WITH TIME ZONE,
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE,
    total_count BIGINT
) AS $$
DECLARE
    total_records BIGINT;
BEGIN
    -- Get total count first
    SELECT COUNT(*) INTO total_records
    FROM audit.audit_logs al
    WHERE (p_table_name IS NULL OR al.table_name = p_table_name)
      AND (p_user_id IS NULL OR al.user_id = p_user_id)
      AND (p_action IS NULL OR al.action = p_action)
      AND (p_date_from IS NULL OR al."timestamp" >= p_date_from)
      AND (p_date_to IS NULL OR al."timestamp" <= p_date_to);

    -- Return paginated results with total count
    RETURN QUERY
    SELECT 
        al.id,
        al.table_name,
        al.record_id,
        al.action,
        al.user_id,
        al.user_email,
        al."timestamp",
        al.old_values,
        al.new_values,
        al.changed_fields,
        al.ip_address,
        al.user_agent,
        al.session_id,
        al.created_at,
        total_records as total_count
    FROM audit.audit_logs al
    WHERE (p_table_name IS NULL OR al.table_name = p_table_name)
      AND (p_user_id IS NULL OR al.user_id = p_user_id)
      AND (p_action IS NULL OR al.action = p_action)
      AND (p_date_from IS NULL OR al."timestamp" >= p_date_from)
      AND (p_date_to IS NULL OR al."timestamp" <= p_date_to)
    ORDER BY al."timestamp" DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour compter les logs d'audit
CREATE OR REPLACE FUNCTION count_audit_logs(
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

-- Test des fonctions
SELECT 'Testing RPC functions...' as message;

-- Test 1: Compter tous les logs
SELECT 'Total audit logs: ' || count_audit_logs() as test1;

-- Test 2: Compter les logs pour transactions
SELECT 'Transaction logs: ' || count_audit_logs('transactions') as test2;

-- Test 3: Récupérer quelques logs
SELECT 'Sample logs retrieved: ' || COUNT(*) 
FROM get_audit_logs_filtered(NULL, NULL, NULL, NULL, NULL, 5, 0) as test3;