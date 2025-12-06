-- =====================================================
-- FIX: Fonctions Owner/Partner (Correction Ambiguïté)
-- =====================================================
-- Correction de l'erreur "column reference is ambiguous"
-- =====================================================

-- =====================================================
-- FONCTION: Réactiver un Owner/Partner Rejeté
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
    -- Vérification des permissions admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = reactivate_owner_partner.admin_user_id 
        AND role IN ('admin', 'manager', 'superuser')
    ) THEN
        RAISE EXCEPTION 'Permissions insuffisantes pour réactiver un propriétaire/partenaire';
    END IF;
    
    -- Vérifier que l'owner existe et est rejeté
    SELECT * INTO owner_record
    FROM owners 
    WHERE id = reactivate_owner_partner.owner_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Le propriétaire/partenaire avec l''ID % n''existe pas', reactivate_owner_partner.owner_id;
    END IF;
    
    IF owner_record.verification_status != 'rejected' THEN
        RAISE EXCEPTION 'Le propriétaire/partenaire n''est pas en statut rejeté (statut actuel: %)', owner_record.verification_status;
    END IF;
    
    -- Réactiver l'owner/partner
    UPDATE owners 
    SET 
        verification_status = 'pending',
        rejected_at = NULL,
        rejected_by = NULL,
        rejection_reason = NULL,
        admin_notes = COALESCE(reactivate_owner_partner.admin_notes, 'Réactivé pour réévaluation le ' || NOW()::TEXT),
        updated_at = NOW()
    WHERE id = reactivate_owner_partner.owner_id;
    
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erreur lors de la réactivation: %', SQLERRM;
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
        WHERE id = approve_owner_partner.admin_user_id 
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
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erreur lors de l''approbation: %', SQLERRM;
        RETURN FALSE;
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
        WHERE id = reject_owner_partner.admin_user_id 
        AND role IN ('admin', 'manager', 'superuser')
    ) THEN
        RAISE EXCEPTION 'Permissions insuffisantes';
    END IF;
    
    -- Vérifier que la raison est fournie
    IF reject_owner_partner.rejection_reason IS NULL OR reject_owner_partner.rejection_reason = '' THEN
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
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erreur lors du rejet: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
-- VÉRIFICATION
-- =====================================================

SELECT 
    '✅ Fonctions corrigées avec succès!' as status,
    'Ambiguïté des colonnes résolue' as fix,
    'reactivate_owner_partner, approve_owner_partner, reject_owner_partner' as functions;
