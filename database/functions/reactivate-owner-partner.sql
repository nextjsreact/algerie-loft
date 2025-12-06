-- =====================================================
-- FONCTION: Réactiver un Owner/Partner Rejeté
-- =====================================================
-- Description: Permet à un admin de réactiver un owner/partner
--              qui a été rejeté, pour une nouvelle évaluation
-- Table: owners (unifiée)
-- Distinction: user_id IS NOT NULL = Partner
-- Date: 6 décembre 2025
-- =====================================================

CREATE OR REPLACE FUNCTION reactivate_owner_partner(
    owner_id UUID,
    admin_user_id UUID,
    admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    owner_record RECORD;
BEGIN
    -- =====================================================
    -- 1. VÉRIFICATION DES PERMISSIONS ADMIN
    -- =====================================================
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = admin_user_id 
        AND role IN ('admin', 'manager', 'superuser')
    ) THEN
        RAISE EXCEPTION 'Permissions insuffisantes pour réactiver un propriétaire/partenaire. Rôle requis: admin, manager ou superuser';
    END IF;
    
    -- =====================================================
    -- 2. VÉRIFIER QUE L'OWNER EXISTE ET EST REJETÉ
    -- =====================================================
    SELECT * INTO owner_record
    FROM owners 
    WHERE id = owner_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Le propriétaire/partenaire avec l''ID % n''existe pas', owner_id;
    END IF;
    
    IF owner_record.verification_status != 'rejected' THEN
        RAISE EXCEPTION 'Le propriétaire/partenaire n''est pas en statut rejeté (statut actuel: %)', owner_record.verification_status;
    END IF;
    
    -- =====================================================
    -- 3. RÉACTIVER L'OWNER/PARTNER
    -- =====================================================
    UPDATE owners 
    SET 
        -- Changer le statut à pending pour réévaluation
        verification_status = 'pending',
        
        -- Effacer les informations de rejet
        rejected_at = NULL,
        rejected_by = NULL,
        rejection_reason = NULL,
        
        -- Ajouter une note admin
        admin_notes = COALESCE(reactivate_owner_partner.admin_notes, 'Réactivé pour réévaluation le ' || NOW()::TEXT),
        
        -- Mettre à jour le timestamp
        updated_at = NOW()
    WHERE id = reactivate_owner_partner.owner_id;
    
    -- =====================================================
    -- 4. LOG DE L'ACTION (optionnel)
    -- =====================================================
    -- Si vous avez une table d'audit, ajoutez un log ici
    
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        -- En cas d'erreur, rollback automatique et message d'erreur
        RAISE EXCEPTION 'Erreur lors de la réactivation du propriétaire/partenaire: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FONCTION: Approuver un Owner/Partner
-- =====================================================

CREATE OR REPLACE FUNCTION approve_owner_partner(
    owner_id UUID,
    admin_user_id UUID,
    admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Vérifier les permissions
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = admin_user_id 
        AND role IN ('admin', 'manager', 'superuser')
    ) THEN
        RAISE EXCEPTION 'Permissions insuffisantes';
    END IF;
    
    -- Approuver
    UPDATE owners 
    SET 
        verification_status = 'verified',
        approved_at = NOW(),
        approved_by = approve_owner_partner.admin_user_id,
        admin_notes = approve_owner_partner.admin_notes,
        updated_at = NOW()
    WHERE id = approve_owner_partner.owner_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FONCTION: Rejeter un Owner/Partner
-- =====================================================

CREATE OR REPLACE FUNCTION reject_owner_partner(
    owner_id UUID,
    admin_user_id UUID,
    rejection_reason TEXT,
    admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Vérifier les permissions
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = admin_user_id 
        AND role IN ('admin', 'manager', 'superuser')
    ) THEN
        RAISE EXCEPTION 'Permissions insuffisantes';
    END IF;
    
    -- Vérifier que la raison est fournie
    IF rejection_reason IS NULL OR rejection_reason = '' THEN
        RAISE EXCEPTION 'La raison du rejet est obligatoire';
    END IF;
    
    -- Rejeter
    UPDATE owners 
    SET 
        verification_status = 'rejected',
        rejected_at = NOW(),
        rejected_by = reject_owner_partner.admin_user_id,
        rejection_reason = reject_owner_partner.rejection_reason,
        admin_notes = reject_owner_partner.admin_notes,
        updated_at = NOW()
    WHERE id = reject_owner_partner.owner_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTAIRES ET DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION reactivate_owner_partner(UUID, UUID, TEXT) IS 
'Réactive un owner/partner qui a été rejeté, en le remettant en statut pending.
Fonctionne avec la table unifiée owners.
Distinction: user_id IS NOT NULL = Partner, user_id IS NULL = Propriétaire interne';

COMMENT ON FUNCTION approve_owner_partner(UUID, UUID, TEXT) IS 
'Approuve un owner/partner en attente. Change le statut à verified.';

COMMENT ON FUNCTION reject_owner_partner(UUID, UUID, TEXT, TEXT) IS 
'Rejette un owner/partner. Raison obligatoire.';

-- =====================================================
-- PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION reactivate_owner_partner(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_owner_partner(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_owner_partner(UUID, UUID, TEXT, TEXT) TO authenticated;

GRANT EXECUTE ON FUNCTION reactivate_owner_partner(UUID, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION approve_owner_partner(UUID, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION reject_owner_partner(UUID, UUID, TEXT, TEXT) TO service_role;

-- =====================================================
-- MESSAGE DE SUCCÈS
-- =====================================================

SELECT 
    '✅ Fonctions pour table owners créées avec succès!' as status,
    'reactivate_owner_partner, approve_owner_partner, reject_owner_partner' as functions,
    'Table: owners (unifiée)' as table_used,
    'Distinction: user_id IS NOT NULL = Partner' as note;
