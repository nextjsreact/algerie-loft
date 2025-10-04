-- Script de déploiement simple du système d'audit
-- Exécutez ce script dans Supabase Dashboard > SQL Editor

-- =====================================================
-- 1. CRÉER LE SCHÉMA AUDIT
-- =====================================================

CREATE SCHEMA IF NOT EXISTS audit;
GRANT USAGE ON SCHEMA audit TO authenticated;

-- =====================================================
-- 2. CRÉER LA TABLE AUDIT_LOGS
-- =====================================================

DROP TABLE IF EXISTS audit.audit_logs CASCADE;

CREATE TABLE audit.audit_logs (
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

CREATE INDEX idx_audit_logs_table_record ON audit.audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_user_id ON audit.audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit.audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_action ON audit.audit_logs(action);
CREATE INDEX idx_audit_logs_table_name ON audit.audit_logs(table_name);

-- =====================================================
-- 4. CRÉER DES DONNÉES DE TEST
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
    NOW() - INTERVAL '2 hours',
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
    NOW() - INTERVAL '1 hour',
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
    NOW() - INTERVAL '30 minutes',
    NULL,
    '{"title": "Test Task", "status": "pending", "description": "Task de test"}',
    '{}'
),
(
    'reservations',
    gen_random_uuid(),
    'INSERT',
    NULL,
    'user@example.com',
    NOW() - INTERVAL '15 minutes',
    NULL,
    '{"customer_name": "Client Test", "status": "confirmed"}',
    '{}'
),
(
    'lofts',
    gen_random_uuid(),
    'UPDATE',
    NULL,
    'manager@example.com',
    NOW() - INTERVAL '5 minutes',
    '{"name": "Loft A", "status": "available"}',
    '{"name": "Loft A", "status": "occupied"}',
    '{"status"}'
);

-- =====================================================
-- 5. VÉRIFICATION
-- =====================================================

-- Vérifier que la table existe et contient des données
SELECT 
    'audit.audit_logs table' as component,
    CASE 
        WHEN COUNT(*) > 0 THEN 'OK - ' || COUNT(*) || ' records'
        ELSE 'EMPTY'
    END as status
FROM audit.audit_logs;

-- Afficher un échantillon des données
SELECT 
    table_name,
    action,
    user_email,
    timestamp,
    CASE 
        WHEN action = 'INSERT' THEN 'Created: ' || COALESCE(new_values->>'description', new_values->>'title', new_values->>'customer_name', new_values->>'name', 'record')
        WHEN action = 'UPDATE' THEN 'Updated: ' || array_to_string(changed_fields, ', ')
        WHEN action = 'DELETE' THEN 'Deleted: ' || COALESCE(old_values->>'description', old_values->>'title', old_values->>'customer_name', old_values->>'name', 'record')
        ELSE 'Unknown action'
    END as details
FROM audit.audit_logs 
ORDER BY timestamp DESC
LIMIT 10;

-- Message de succès
SELECT 'Audit system setup completed successfully! You can now test the API.' as message;