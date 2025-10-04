-- Script pour tester les données d'audit
-- Exécutez ce script dans Supabase Dashboard > SQL Editor

-- 1. Vérifier que la table audit_logs existe
SELECT 
    table_name, 
    table_schema 
FROM information_schema.tables 
WHERE table_name = 'audit_logs';

-- 2. Vérifier la structure de la table
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'audit_logs' 
    AND table_schema = 'audit'
ORDER BY ordinal_position;

-- 3. Vérifier s'il y a des données d'audit existantes
SELECT 
    table_name,
    action,
    COUNT(*) as count
FROM audit.audit_logs 
GROUP BY table_name, action
ORDER BY table_name, action;

-- 4. Insérer quelques données de test pour l'audit
-- (Adaptez selon vos tables existantes)

-- Vérifier d'abord quelles tables existent
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('transactions', 'tasks', 'reservations', 'lofts')
ORDER BY table_name;

-- 5. Créer des données de test d'audit manuellement
INSERT INTO audit.audit_logs (
    id,
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
    gen_random_uuid(),
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
    gen_random_uuid(),
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
    gen_random_uuid(),
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

-- 6. Vérifier que les données ont été insérées
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
LIMIT 10;

-- 7. Tester une requête spécifique comme celle utilisée par l'API
SELECT 
    id,
    table_name,
    record_id,
    action,
    user_id,
    user_email,
    timestamp,
    old_values,
    new_values,
    changed_fields,
    ip_address,
    user_agent
FROM audit.audit_logs
WHERE table_name = 'transactions'
ORDER BY timestamp DESC
LIMIT 5;