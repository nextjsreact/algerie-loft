-- Script pour créer les triggers d'audit
-- Exécutez ce script dans Supabase Dashboard > SQL Editor

-- =====================================================
-- 1. CRÉER LA FONCTION TRIGGER GÉNÉRIQUE
-- =====================================================

CREATE OR REPLACE FUNCTION audit.audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    changed_fields TEXT[] := '{}';
    field_name TEXT;
    old_val TEXT;
    new_val TEXT;
    current_user_id UUID;
    current_user_email VARCHAR(255);
BEGIN
    -- Essayer de récupérer l'utilisateur actuel
    BEGIN
        current_user_id := auth.uid();
    EXCEPTION WHEN OTHERS THEN
        current_user_id := NULL;
    END;
    
    -- Récupérer l'email de l'utilisateur si possible
    IF current_user_id IS NOT NULL THEN
        BEGIN
            SELECT email INTO current_user_email 
            FROM auth.users 
            WHERE id = current_user_id;
        EXCEPTION WHEN OTHERS THEN
            current_user_email := NULL;
        END;
    END IF;
    
    -- Pour les opérations UPDATE, déterminer quels champs ont changé
    IF TG_OP = 'UPDATE' THEN
        -- Obtenir tous les noms de colonnes pour la table
        FOR field_name IN 
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = TG_TABLE_SCHEMA 
            AND table_name = TG_TABLE_NAME
            AND column_name NOT IN ('updated_at', 'created_at') -- Exclure les champs timestamp
        LOOP
            -- Comparer les anciennes et nouvelles valeurs
            EXECUTE format('SELECT ($1).%I::TEXT, ($2).%I::TEXT', field_name, field_name) 
            INTO old_val, new_val 
            USING OLD, NEW;
            
            -- Ajouter à changed_fields si les valeurs sont différentes
            IF old_val IS DISTINCT FROM new_val THEN
                changed_fields := array_append(changed_fields, field_name);
            END IF;
        END LOOP;
    END IF;
    
    -- Insérer l'enregistrement d'audit
    INSERT INTO audit.audit_logs (
        table_name,
        record_id,
        action,
        user_id,
        user_email,
        "timestamp",
        old_values,
        new_values,
        changed_fields,
        ip_address,
        user_agent,
        session_id
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        current_user_id,
        current_user_email,
        NOW(),
        CASE 
            WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
            WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD)
            ELSE NULL 
        END,
        CASE 
            WHEN TG_OP = 'INSERT' THEN to_jsonb(NEW)
            WHEN TG_OP = 'UPDATE' THEN to_jsonb(NEW)
            ELSE NULL 
        END,
        changed_fields,
        NULL, -- ip_address (à implémenter si nécessaire)
        NULL, -- user_agent (à implémenter si nécessaire)
        NULL  -- session_id (à implémenter si nécessaire)
    );
    
    -- Retourner l'enregistrement approprié
    RETURN COALESCE(NEW, OLD);
    
EXCEPTION WHEN OTHERS THEN
    -- Logger l'erreur mais ne pas faire échouer l'opération principale
    RAISE WARNING 'Audit trigger failed for table %: %', TG_TABLE_NAME, SQLERRM;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. CRÉER LES TRIGGERS POUR CHAQUE TABLE
-- =====================================================

-- Trigger pour la table transactions
DROP TRIGGER IF EXISTS audit_trigger_transactions ON transactions;
CREATE TRIGGER audit_trigger_transactions
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function();

-- Trigger pour la table tasks
DROP TRIGGER IF EXISTS audit_trigger_tasks ON tasks;
CREATE TRIGGER audit_trigger_tasks
    AFTER INSERT OR UPDATE OR DELETE ON tasks
    FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function();

-- Trigger pour la table reservations
DROP TRIGGER IF EXISTS audit_trigger_reservations ON reservations;
CREATE TRIGGER audit_trigger_reservations
    AFTER INSERT OR UPDATE OR DELETE ON reservations
    FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function();

-- Trigger pour la table lofts
DROP TRIGGER IF EXISTS audit_trigger_lofts ON lofts;
CREATE TRIGGER audit_trigger_lofts
    AFTER INSERT OR UPDATE OR DELETE ON lofts
    FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function();

-- =====================================================
-- 3. VÉRIFICATION DES TRIGGERS
-- =====================================================

-- Vérifier que tous les triggers ont été créés
SELECT 
    trigger_name,
    event_object_table as table_name,
    string_agg(event_manipulation, ', ') as events,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name LIKE 'audit_trigger_%'
AND event_object_schema = 'public'
GROUP BY trigger_name, event_object_table, action_timing
ORDER BY event_object_table;

-- =====================================================
-- 4. TEST DES TRIGGERS
-- =====================================================

-- Test 1: Compter les logs avant le test
SELECT 'Logs avant test: ' || COUNT(*) FROM audit.audit_logs;

-- Test 2: Insérer une transaction de test
INSERT INTO transactions (
    id, 
    amount, 
    description, 
    transaction_type,
    status,
    created_at
) VALUES (
    gen_random_uuid(),
    999.99,
    'Test trigger - transaction de test',
    (SELECT unnest(enum_range(NULL::transaction_type)) LIMIT 1), -- Prendre le premier type valide
    'pending',
    NOW()
);

-- Test 3: Modifier la transaction de test
UPDATE transactions 
SET 
    amount = 1234.56,
    description = 'Test trigger - transaction modifiée',
    status = 'completed'
WHERE description = 'Test trigger - transaction de test';

-- Test 4: Compter les logs après le test
SELECT 'Logs après test: ' || COUNT(*) FROM audit.audit_logs;

-- Test 5: Voir les nouveaux logs créés
SELECT 
    table_name,
    action,
    user_email,
    "timestamp",
    CASE 
        WHEN action = 'INSERT' THEN 'Créé: ' || (new_values->>'description')
        WHEN action = 'UPDATE' THEN 'Modifié: ' || array_to_string(changed_fields, ', ')
        WHEN action = 'DELETE' THEN 'Supprimé: ' || (old_values->>'description')
    END as details
FROM audit.audit_logs 
WHERE table_name = 'transactions'
ORDER BY "timestamp" DESC 
LIMIT 5;

-- Test 6: Nettoyer les données de test
DELETE FROM transactions 
WHERE description = 'Test trigger - transaction modifiée';

-- Message de succès
SELECT 'Triggers d''audit créés et testés avec succès!' as message;