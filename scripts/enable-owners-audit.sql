-- ============================================================================
-- Script: Activer l'Audit pour la Table Owners
-- Description: Ajoute le trigger d'audit pour enregistrer toutes les 
--              modifications (INSERT, UPDATE, DELETE) sur la table owners
-- Date: 2026-03-10
-- ============================================================================

-- Étape 1: Supprimer le trigger s'il existe déjà (pour éviter les erreurs)
DROP TRIGGER IF EXISTS audit_trigger_owners ON owners;

-- Étape 2: Créer le trigger d'audit
CREATE TRIGGER audit_trigger_owners
    AFTER INSERT OR UPDATE OR DELETE ON owners
    FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function();

-- Étape 3: Vérifier que le trigger a été créé avec succès
SELECT 
    '✅ Trigger créé avec succès!' as status,
    n.nspname as schema_name,
    c.relname as table_name,
    t.tgname as trigger_name,
    CASE 
        WHEN t.tgtype & 2 = 2 THEN 'BEFORE'
        WHEN t.tgtype & 4 = 4 THEN 'AFTER'
        ELSE 'INSTEAD OF'
    END as trigger_timing,
    CASE 
        WHEN t.tgtype & 4 = 4 THEN 'INSERT'
        WHEN t.tgtype & 8 = 8 THEN 'DELETE'
        WHEN t.tgtype & 16 = 16 THEN 'UPDATE'
        ELSE 'MULTIPLE'
    END as trigger_event
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname = 'owners'
AND n.nspname = 'public'
AND t.tgname = 'audit_trigger_owners'
AND NOT t.tgisinternal;

-- Étape 4: Afficher un message de confirmation
SELECT 
    '🎉 Configuration terminée!' as message,
    'La table owners est maintenant auditée' as details,
    'Toutes les modifications seront enregistrées dans /settings/audit' as info;

-- ============================================================================
-- Instructions de Test:
-- ============================================================================
-- 1. Allez sur https://www.loftalgerie.com/owners
-- 2. Modifiez un propriétaire (changez le nom, email, téléphone, etc.)
-- 3. Allez sur https://www.loftalgerie.com/settings/audit
-- 4. Filtrez par table "Propriétaire"
-- 5. Vous devriez voir la modification enregistrée
-- ============================================================================
