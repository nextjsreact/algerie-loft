-- =====================================================
-- FONCTION: Réactiver un Partner Rejeté
-- =====================================================
-- Description: Permet à un admin de réactiver un partner
--              qui a été rejeté, pour une nouvelle évaluation
-- Auteur: System
-- Date: 2025-12-06
-- =====================================================

CREATE OR REPLACE FUNCTION reactivate_partner(
    partner_id UUID,
    admin_user_id UUID,
    admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    partner_record RECORD;
BEGIN
    -- =====================================================
    -- 1. VÉRIFICATION DES PERMISSIONS ADMIN
    -- =====================================================
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = admin_user_id 
        AND role IN ('admin', 'manager', 'superuser')
    ) THEN
        RAISE EXCEPTION 'Permissions insuffisantes pour réactiver un partenaire. Rôle requis: admin, manager ou superuser';
    END IF;
    
    -- =====================================================
    -- 2. VÉRIFIER QUE LE PARTNER EXISTE ET EST REJETÉ
    -- =====================================================
    SELECT * INTO partner_record
    FROM partners 
    WHERE id = partner_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Le partenaire avec l''ID % n''existe pas', partner_id;
    END IF;
    
    IF partner_record.verification_status != 'rejected' THEN
        RAISE EXCEPTION 'Le partenaire n''est pas en statut rejeté (statut actuel: %)', partner_record.verification_status;
    END IF;
    
    -- =====================================================
    -- 3. RÉACTIVER LE PARTNER
    -- =====================================================
    UPDATE partners 
    SET 
        -- Changer le statut à pending pour réévaluation
        verification_status = 'pending',
        
        -- Effacer les informations de rejet
        rejected_at = NULL,
        rejected_by = NULL,
        rejection_reason = NULL,
        
        -- Ajouter une note admin
        admin_notes = COALESCE(admin_notes, 'Réactivé pour réévaluation le ' || NOW()::TEXT),
        
        -- Mettre à jour le timestamp
        updated_at = NOW()
    WHERE id = partner_id;
    
    -- =====================================================
    -- 4. CRÉER UNE NOUVELLE DEMANDE DE VALIDATION
    -- =====================================================
    INSERT INTO partner_validation_requests (
        partner_id,
        status,
        admin_notes,
        created_at,
        updated_at
    ) VALUES (
        partner_id,
        'pending',
        COALESCE(
            admin_notes, 
            'Demande réactivée après rejet. Nouvelle évaluation requise.'
        ),
        NOW(),
        NOW()
    );
    
    -- =====================================================
    -- 5. LOG DE L'ACTION (optionnel - si table audit existe)
    -- =====================================================
    -- Vous pouvez ajouter un log dans une table d'audit si elle existe
    -- INSERT INTO admin_actions_log (...)
    
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        -- En cas d'erreur, rollback automatique et message d'erreur
        RAISE EXCEPTION 'Erreur lors de la réactivation du partenaire: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTAIRES ET DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION reactivate_partner(UUID, UUID, TEXT) IS 
'Réactive un partner qui a été rejeté, en le remettant en statut pending pour une nouvelle évaluation.
Paramètres:
  - partner_id: UUID du partner à réactiver
  - admin_user_id: UUID de l''admin qui effectue l''action
  - admin_notes: Notes optionnelles expliquant la raison de la réactivation
Retourne: TRUE si succès, FALSE ou EXCEPTION si échec';

-- =====================================================
-- PERMISSIONS
-- =====================================================

-- Donner les permissions d'exécution aux rôles authentifiés
GRANT EXECUTE ON FUNCTION reactivate_partner(UUID, UUID, TEXT) TO authenticated;

-- Donner les permissions au service role (pour les appels serveur)
GRANT EXECUTE ON FUNCTION reactivate_partner(UUID, UUID, TEXT) TO service_role;

-- =====================================================
-- TESTS
-- =====================================================

-- Test 1: Vérifier qu'un admin peut réactiver un partner rejeté
-- SELECT reactivate_partner(
--     'uuid-du-partner-rejeté',
--     'uuid-de-l-admin',
--     'Documents mis à jour, nouvelle évaluation demandée'
-- );

-- Test 2: Vérifier qu'un non-admin ne peut pas réactiver
-- SELECT reactivate_partner(
--     'uuid-du-partner-rejeté',
--     'uuid-d-un-user-normal',
--     'Test'
-- );
-- Devrait échouer avec: "Permissions insuffisantes"

-- Test 3: Vérifier qu'on ne peut pas réactiver un partner déjà approuvé
-- SELECT reactivate_partner(
--     'uuid-du-partner-approuvé',
--     'uuid-de-l-admin',
--     'Test'
-- );
-- Devrait échouer avec: "Le partenaire n'est pas en statut rejeté"

-- =====================================================
-- AFFICHER UN MESSAGE DE SUCCÈS
-- =====================================================

SELECT 
    '✅ Fonction reactivate_partner créée avec succès!' as status,
    'Permet de réactiver un partner rejeté' as description,
    'Paramètres: partner_id, admin_user_id, admin_notes' as parameters,
    'Retourne: BOOLEAN (TRUE si succès)' as return_type;
