-- =====================================================
-- MIGRATION: Recréer les Tables du Système de Partenaires
-- =====================================================
-- Migration ID: 003
-- Description: Supprime et recrée les tables partners avec la structure correcte
-- Date: 2024-01-XX
-- ATTENTION: Cette migration supprime toutes les données existantes de la table partners
-- =====================================================

-- Start transaction
BEGIN;

-- =====================================================
-- 1. SUPPRIMER LES TABLES ET POLITIQUES EXISTANTES
-- =====================================================

-- Supprimer les politiques RLS existantes pour partners
DROP POLICY IF EXISTS "partners_select_own" ON partners;
DROP POLICY IF EXISTS "partners_update_own" ON partners;
DROP POLICY IF EXISTS "partners_admin_all" ON partners;
DROP POLICY IF EXISTS "lofts_partner_select" ON lofts;
DROP POLICY IF EXISTS "reservations_partner_select" ON reservations;

-- Supprimer les triggers existants
DROP TRIGGER IF EXISTS partners_updated_at_trigger ON partners;

-- Supprimer les fonctions liées aux partenaires
DROP FUNCTION IF EXISTS update_partners_updated_at();
DROP FUNCTION IF EXISTS get_partner_dashboard_stats(UUID);
DROP FUNCTION IF EXISTS approve_partner(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS reject_partner(UUID, UUID, TEXT, TEXT);

-- Supprimer la colonne partner_id de lofts si elle existe
ALTER TABLE lofts DROP COLUMN IF EXISTS partner_id;

-- Supprimer les tables dans l'ordre des dépendances
DROP TABLE IF EXISTS partner_validation_requests;
DROP TABLE IF EXISTS partners CASCADE;

-- =====================================================
-- 2. CRÉER LES TYPES PERSONNALISÉS
-- =====================================================

-- Supprimer les types existants s'ils existent
DROP TYPE IF EXISTS business_type CASCADE;
DROP TYPE IF EXISTS verification_status CASCADE;
DROP TYPE IF EXISTS validation_request_status CASCADE;

-- Créer les nouveaux types
CREATE TYPE business_type AS ENUM ('individual', 'company');
CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
CREATE TYPE validation_request_status AS ENUM ('pending', 'approved', 'rejected');

-- =====================================================
-- 3. CRÉER LA TABLE PARTNERS
-- =====================================================

CREATE TABLE partners (
    -- Identifiants
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Informations commerciales
    business_name TEXT,
    business_type business_type NOT NULL DEFAULT 'individual',
    tax_id TEXT,
    
    -- Informations de contact
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    
    -- Informations de vérification
    verification_status verification_status NOT NULL DEFAULT 'pending',
    verification_documents TEXT[] DEFAULT '{}',
    portfolio_description TEXT,
    
    -- Champs de gestion admin
    admin_notes TEXT,
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES auth.users(id),
    rejected_at TIMESTAMPTZ,
    rejected_by UUID REFERENCES auth.users(id),
    rejection_reason TEXT,
    
    -- Informations bancaires (pour usage futur)
    bank_details JSONB,
    
    -- Suivi d'activité
    last_login_at TIMESTAMPTZ,
    
    -- Horodatage
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT partners_user_id_unique UNIQUE (user_id),
    CONSTRAINT partners_business_type_check CHECK (business_type IN ('individual', 'company')),
    CONSTRAINT partners_verification_status_check CHECK (verification_status IN ('pending', 'approved', 'rejected', 'suspended')),
    CONSTRAINT partners_address_not_empty CHECK (length(trim(address)) > 0),
    CONSTRAINT partners_phone_not_empty CHECK (length(trim(phone)) > 0)
);

-- =====================================================
-- 4. CRÉER LA TABLE PARTNER_VALIDATION_REQUESTS
-- =====================================================

CREATE TABLE partner_validation_requests (
    -- Identifiants
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
    
    -- Statut de la demande
    status validation_request_status NOT NULL DEFAULT 'pending',
    
    -- Données soumises (instantané des données d'inscription)
    submitted_data JSONB NOT NULL,
    
    -- Traitement par l'admin
    admin_notes TEXT,
    processed_by UUID REFERENCES auth.users(id),
    processed_at TIMESTAMPTZ,
    
    -- Horodatage
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT validation_requests_status_check CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- =====================================================
-- 5. ÉTENDRE LA TABLE LOFTS
-- =====================================================

-- Ajouter la colonne partner_id à la table lofts
ALTER TABLE lofts ADD COLUMN partner_id UUID REFERENCES partners(id) ON DELETE SET NULL;

-- =====================================================
-- 6. CRÉER LES INDEX POUR LES PERFORMANCES
-- =====================================================

-- Index pour la table partners
CREATE INDEX idx_partners_user_id ON partners(user_id);
CREATE INDEX idx_partners_verification_status ON partners(verification_status);
CREATE INDEX idx_partners_created_at ON partners(created_at DESC);
CREATE INDEX idx_partners_approved_by ON partners(approved_by);
CREATE INDEX idx_partners_rejected_by ON partners(rejected_by);
CREATE INDEX idx_partners_business_type ON partners(business_type);
CREATE INDEX idx_partners_status_created ON partners(verification_status, created_at DESC);

-- Index pour la table partner_validation_requests
CREATE INDEX idx_partner_validation_requests_partner_id ON partner_validation_requests(partner_id);
CREATE INDEX idx_partner_validation_requests_status ON partner_validation_requests(status);
CREATE INDEX idx_partner_validation_requests_created_at ON partner_validation_requests(created_at DESC);
CREATE INDEX idx_partner_validation_requests_processed_by ON partner_validation_requests(processed_by);
CREATE INDEX idx_validation_requests_status_created ON partner_validation_requests(status, created_at DESC);

-- Index pour la table lofts (colonne partner_id)
CREATE INDEX idx_lofts_partner_id ON lofts(partner_id);

-- =====================================================
-- 7. CRÉER LES FONCTIONS
-- =====================================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_partners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les statistiques du tableau de bord partenaire
CREATE OR REPLACE FUNCTION get_partner_dashboard_stats(partner_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    partner_record partners%ROWTYPE;
    stats JSONB;
    properties_count INTEGER;
    available_count INTEGER;
    occupied_count INTEGER;
    maintenance_count INTEGER;
BEGIN
    -- Obtenir l'enregistrement du partenaire
    SELECT * INTO partner_record FROM partners WHERE user_id = partner_user_id;
    
    IF partner_record.id IS NULL THEN
        RETURN '{"error": "Partner not found"}'::JSONB;
    END IF;
    
    -- Obtenir les statistiques des propriétés
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'available'),
        COUNT(*) FILTER (WHERE status = 'occupied'),
        COUNT(*) FILTER (WHERE status = 'maintenance')
    INTO properties_count, available_count, occupied_count, maintenance_count
    FROM lofts 
    WHERE partner_id = partner_record.id;
    
    -- Construire le JSON des statistiques
    stats := jsonb_build_object(
        'properties', jsonb_build_object(
            'total', properties_count,
            'available', available_count,
            'occupied', occupied_count,
            'maintenance', maintenance_count
        ),
        'revenue', jsonb_build_object(
            'current_month', 0,
            'previous_month', 0,
            'year_to_date', 0,
            'currency', 'DZD'
        ),
        'reservations', jsonb_build_object(
            'active', 0,
            'upcoming', 0,
            'completed_this_month', 0
        ),
        'occupancy_rate', jsonb_build_object(
            'current_month', CASE WHEN properties_count > 0 THEN (occupied_count::NUMERIC / properties_count::NUMERIC) * 100 ELSE 0 END,
            'previous_month', 0
        )
    );
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour approuver un partenaire
CREATE OR REPLACE FUNCTION approve_partner(
    partner_id UUID,
    admin_user_id UUID,
    admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Vérifier si l'admin a les permissions
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = admin_user_id 
        AND role IN ('admin', 'manager')
    ) THEN
        RAISE EXCEPTION 'Permissions insuffisantes pour approuver le partenaire';
    END IF;
    
    -- Mettre à jour le statut du partenaire
    UPDATE partners 
    SET 
        verification_status = 'approved',
        approved_at = NOW(),
        approved_by = admin_user_id,
        admin_notes = COALESCE(admin_notes, admin_notes),
        updated_at = NOW()
    WHERE id = partner_id;
    
    -- Mettre à jour les demandes de validation en attente
    UPDATE partner_validation_requests
    SET 
        status = 'approved',
        processed_by = admin_user_id,
        processed_at = NOW(),
        admin_notes = COALESCE(admin_notes, admin_notes)
    WHERE partner_id = partner_id AND status = 'pending';
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour rejeter un partenaire
CREATE OR REPLACE FUNCTION reject_partner(
    partner_id UUID,
    admin_user_id UUID,
    rejection_reason TEXT,
    admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Vérifier si l'admin a les permissions
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = admin_user_id 
        AND role IN ('admin', 'manager')
    ) THEN
        RAISE EXCEPTION 'Permissions insuffisantes pour rejeter le partenaire';
    END IF;
    
    -- Mettre à jour le statut du partenaire
    UPDATE partners 
    SET 
        verification_status = 'rejected',
        rejected_at = NOW(),
        rejected_by = admin_user_id,
        rejection_reason = rejection_reason,
        admin_notes = COALESCE(admin_notes, admin_notes),
        updated_at = NOW()
    WHERE id = partner_id;
    
    -- Mettre à jour les demandes de validation en attente
    UPDATE partner_validation_requests
    SET 
        status = 'rejected',
        processed_by = admin_user_id,
        processed_at = NOW(),
        admin_notes = COALESCE(admin_notes, admin_notes)
    WHERE partner_id = partner_id AND status = 'pending';
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. CRÉER LES TRIGGERS
-- =====================================================

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER partners_updated_at_trigger
    BEFORE UPDATE ON partners
    FOR EACH ROW
    EXECUTE FUNCTION update_partners_updated_at();

-- =====================================================
-- 9. ACTIVER LA SÉCURITÉ AU NIVEAU DES LIGNES (RLS)
-- =====================================================

-- Activer RLS sur les tables partenaires
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_validation_requests ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 10. CRÉER LES POLITIQUES RLS
-- =====================================================

-- Politiques pour la table partners
-- Les partenaires peuvent voir leur propre profil
CREATE POLICY "partners_select_own" ON partners
    FOR SELECT USING (user_id = auth.uid());

-- Les partenaires peuvent mettre à jour leur propre profil (champs limités)
CREATE POLICY "partners_update_own" ON partners
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Les partenaires peuvent insérer leur propre profil
CREATE POLICY "partners_insert_own" ON partners
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Les admins ont accès complet aux partenaires
CREATE POLICY "partners_admin_all" ON partners
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- Politiques pour les demandes de validation des partenaires
-- Les partenaires peuvent voir leurs propres demandes de validation
CREATE POLICY "validation_requests_select_own" ON partner_validation_requests
    FOR SELECT USING (
        partner_id IN (
            SELECT id FROM partners WHERE user_id = auth.uid()
        )
    );

-- Les partenaires peuvent insérer leurs propres demandes de validation
CREATE POLICY "validation_requests_insert_own" ON partner_validation_requests
    FOR INSERT WITH CHECK (
        partner_id IN (
            SELECT id FROM partners WHERE user_id = auth.uid()
        )
    );

-- Les admins ont accès complet aux demandes de validation
CREATE POLICY "validation_requests_admin_all" ON partner_validation_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- Politiques pour la table lofts (accès partenaire)
-- Les partenaires ne peuvent voir que leurs propres propriétés
CREATE POLICY "lofts_partner_select" ON lofts
    FOR SELECT USING (
        partner_id IN (
            SELECT id FROM partners WHERE user_id = auth.uid()
        )
    );

-- Politiques pour la table reservations (si elle existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reservations') THEN
        -- Les partenaires ne peuvent voir que les réservations de leurs propriétés
        EXECUTE 'CREATE POLICY "reservations_partner_select" ON reservations
            FOR SELECT USING (
                loft_id IN (
                    SELECT l.id FROM lofts l
                    JOIN partners p ON l.partner_id = p.id
                    WHERE p.user_id = auth.uid()
                )
            )';
    END IF;
END$$;

-- =====================================================
-- 11. ACCORDER LES PERMISSIONS
-- =====================================================

-- Accorder les permissions aux utilisateurs authentifiés
GRANT SELECT, INSERT, UPDATE ON partners TO authenticated;
GRANT SELECT, INSERT ON partner_validation_requests TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION get_partner_dashboard_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_partner(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_partner(UUID, UUID, TEXT, TEXT) TO authenticated;

-- Accorder les permissions au rôle de service
GRANT ALL ON partners TO service_role;
GRANT ALL ON partner_validation_requests TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- =====================================================
-- 12. AJOUTER DES COMMENTAIRES
-- =====================================================

-- Commentaires sur les tables
COMMENT ON TABLE partners IS 'Table principale pour stocker les informations des partenaires du système';
COMMENT ON TABLE partner_validation_requests IS 'Table pour gérer les demandes de validation des partenaires par les admins';

-- Commentaires sur les colonnes importantes
COMMENT ON COLUMN partners.verification_status IS 'Statut de vérification: pending, approved, rejected, suspended';
COMMENT ON COLUMN partners.business_type IS 'Type d''entreprise: individual ou company';
COMMENT ON COLUMN partners.verification_documents IS 'Tableau des URLs/chemins des documents de vérification';
COMMENT ON COLUMN partners.bank_details IS 'Détails bancaires stockés en JSON pour usage futur';
COMMENT ON COLUMN partner_validation_requests.submitted_data IS 'Instantané JSON des données soumises lors de l''inscription';

-- =====================================================
-- 13. VALIDER LA TRANSACTION
-- =====================================================

COMMIT;

-- =====================================================
-- 14. MESSAGE DE CONFIRMATION
-- =====================================================

SELECT 
    'Tables du système de partenaires recréées avec succès! 🎉' as status,
    'Tables: partners, partner_validation_requests' as tables_created,
    'Extension: lofts.partner_id' as lofts_extended,
    'Fonctions: get_partner_dashboard_stats, approve_partner, reject_partner' as functions_created,
    'Politiques RLS activées pour l''isolation des données' as security_status,
    'ATTENTION: Toutes les données précédentes de la table partners ont été supprimées' as warning;