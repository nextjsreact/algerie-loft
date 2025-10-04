-- Script de déploiement rapide du système d'audit
-- Exécutez ce script complet dans Supabase Dashboard > SQL Editor

-- =====================================================
-- 1. CRÉER LE SCHÉMA AUDIT
-- =====================================================

CREATE SCHEMA IF NOT EXISTS audit;
GRANT USAGE ON SCHEMA audit TO authenticated;

-- =====================================================
-- 2. CRÉER LA TABLE AUDIT_LOGS
-- =====================================================

CREATE TABLE IF NOT EXISTS audit.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(10) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    user_id UUID,
    user_email VARCHAR(255),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. CRÉER LES INDEX
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit.audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit.audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit.audit_logs(table_name);

-- =====================================================
-- 4. CRÉER LES FONCTIONS D'AIDE
-- =====================================================

-- Fonction pour vérifier si un schéma existe
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

-- Fonction pour vérifier si une table existe
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

-- Fonction pour tester l'accès aux logs d'audit
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

-- =====================================================
-- 5. CRÉER DES DONNÉES DE TEST
-- =====================================================

-- Insérer quelques logs de test
INSERT INTO audit.audit_logs (
    table_name,
    record_id,
    action,
    user_id,
    user_email,
    timestamp,
    old_values,
    new_values,
    changed_fields
) VALUES 
(
    'transactions',
    gen_random_uuid(),
    'INSERT',
    NULL,
    'test@example.com',
    NOW(),
    NULL,
    '{"amount": 100.50, "description": "Test transaction", "status": "pending"}',
    '{}'
),
(
    'transactions',
    gen_random_uuid(),
    'UPDATE',
    NULL,
    'test@example.com',
    NOW(),
    '{"amount": 100.50, "status": "pending"}',
    '{"amount": 150.75, "status": "completed"}',
    '{"amount", "status"}'
),
(
    'tasks',
    gen_random_uuid(),
    'INSERT',
    NULL,
    'admin@example.com',
    NOW(),
    NULL,
    '{"title": "Test Task", "status": "pending", "description": "Task de test"}',
    '{}'
);

-- =====================================================
-- 6. VÉRIFICATION FINALE
-- =====================================================

-- Vérifier que tout fonctionne
SELECT 
    'Schema exists' as test,
    check_schema_exists('audit') as result
UNION ALL
SELECT 
    'Table exists' as test,
    check_table_exists('audit', 'audit_logs') as result
UNION ALL
SELECT 
    'Data count' as test,
    (SELECT COUNT(*) FROM audit.audit_logs) > 0 as result;

-- Afficher un échantillon des données
SELECT 
    table_name,
    action,
    user_email,
    timestamp,
    CASE 
        WHEN action = 'INSERT' THEN new_values->>'description'
        WHEN action = 'UPDATE' THEN 'Changed: ' || array_to_string(changed_fields, ', ')
        ELSE 'N/A'
    END as details
FROM audit.audit_logs 
ORDER BY timestamp DESC
LIMIT 5;

-- Message de succès
SELECT 'Audit system setup completed successfully!' as message;