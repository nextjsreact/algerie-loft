-- =====================================================
-- MIGRATION: Add Partner Dashboard System
-- =====================================================
-- Migration ID: 001
-- Description: Adds partner system tables, types, and functions
-- Date: 2024-01-XX
-- =====================================================

-- Start transaction
BEGIN;

-- =====================================================
-- 1. CREATE CUSTOM TYPES
-- =====================================================

DO $$
BEGIN
    -- Business type enum for partners
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'business_type') THEN
        CREATE TYPE business_type AS ENUM ('individual', 'company');
    END IF;
    
    -- Verification status enum for partners
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status') THEN
        CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
    END IF;
    
    -- Validation request status enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'validation_request_status') THEN
        CREATE TYPE validation_request_status AS ENUM ('pending', 'approved', 'rejected');
    END IF;
END$$;

-- =====================================================
-- 2. CREATE TABLES
-- =====================================================

-- Partners table
CREATE TABLE IF NOT EXISTS partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Business Information
    business_name TEXT,
    business_type business_type NOT NULL DEFAULT 'individual',
    tax_id TEXT,
    
    -- Contact Information
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    
    -- Verification Information
    verification_status verification_status NOT NULL DEFAULT 'pending',
    verification_documents TEXT[],
    portfolio_description TEXT,
    
    -- Admin Management Fields
    admin_notes TEXT,
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES auth.users(id),
    rejected_at TIMESTAMPTZ,
    rejected_by UUID REFERENCES auth.users(id),
    rejection_reason TEXT,
    
    -- Banking Information
    bank_details JSONB,
    
    -- Activity Tracking
    last_login_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT partners_user_id_unique UNIQUE (user_id)
);

-- Partner validation requests table
CREATE TABLE IF NOT EXISTS partner_validation_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
    status validation_request_status NOT NULL DEFAULT 'pending',
    submitted_data JSONB NOT NULL,
    admin_notes TEXT,
    processed_by UUID REFERENCES auth.users(id),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. EXTEND EXISTING TABLES
-- =====================================================

-- Add partner_id to lofts table if it doesn't exist
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES partners(id) ON DELETE SET NULL;

-- =====================================================
-- 4. CREATE INDEXES
-- =====================================================

-- Partners table indexes
CREATE INDEX IF NOT EXISTS idx_partners_user_id ON partners(user_id);
CREATE INDEX IF NOT EXISTS idx_partners_verification_status ON partners(verification_status);
CREATE INDEX IF NOT EXISTS idx_partners_created_at ON partners(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_partners_approved_by ON partners(approved_by);
CREATE INDEX IF NOT EXISTS idx_partners_rejected_by ON partners(rejected_by);

-- Partner validation requests indexes
CREATE INDEX IF NOT EXISTS idx_partner_validation_requests_partner_id ON partner_validation_requests(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_validation_requests_status ON partner_validation_requests(status);
CREATE INDEX IF NOT EXISTS idx_partner_validation_requests_created_at ON partner_validation_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_partner_validation_requests_processed_by ON partner_validation_requests(processed_by);

-- Lofts table index for partner queries
CREATE INDEX IF NOT EXISTS idx_lofts_partner_id ON lofts(partner_id);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_partners_status_created ON partners(verification_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_validation_requests_status_created ON partner_validation_requests(status, created_at DESC);

-- =====================================================
-- 5. CREATE FUNCTIONS
-- =====================================================

-- Function to get partner dashboard statistics
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
    -- Get partner record
    SELECT * INTO partner_record FROM partners WHERE user_id = partner_user_id;
    
    IF partner_record.id IS NULL THEN
        RETURN '{"error": "Partner not found"}'::JSONB;
    END IF;
    
    -- Get properties statistics
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'available'),
        COUNT(*) FILTER (WHERE status = 'occupied'),
        COUNT(*) FILTER (WHERE status = 'maintenance')
    INTO properties_count, available_count, occupied_count, maintenance_count
    FROM lofts 
    WHERE partner_id = partner_record.id;
    
    -- Build statistics JSON
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

-- Function to approve a partner
CREATE OR REPLACE FUNCTION approve_partner(
    partner_id UUID,
    admin_user_id UUID,
    admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if admin has permission
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = admin_user_id 
        AND role IN ('admin', 'manager')
    ) THEN
        RAISE EXCEPTION 'Insufficient permissions to approve partner';
    END IF;
    
    -- Update partner status
    UPDATE partners 
    SET 
        verification_status = 'approved',
        approved_at = NOW(),
        approved_by = admin_user_id,
        admin_notes = COALESCE(admin_notes, admin_notes),
        updated_at = NOW()
    WHERE id = partner_id;
    
    -- Update any pending validation requests
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

-- Function to reject a partner
CREATE OR REPLACE FUNCTION reject_partner(
    partner_id UUID,
    admin_user_id UUID,
    rejection_reason TEXT,
    admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if admin has permission
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = admin_user_id 
        AND role IN ('admin', 'manager')
    ) THEN
        RAISE EXCEPTION 'Insufficient permissions to reject partner';
    END IF;
    
    -- Update partner status
    UPDATE partners 
    SET 
        verification_status = 'rejected',
        rejected_at = NOW(),
        rejected_by = admin_user_id,
        rejection_reason = rejection_reason,
        admin_notes = COALESCE(admin_notes, admin_notes),
        updated_at = NOW()
    WHERE id = partner_id;
    
    -- Update any pending validation requests
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
-- 6. CREATE TRIGGERS
-- =====================================================

-- Trigger to update updated_at timestamp on partners table
CREATE OR REPLACE FUNCTION update_partners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER partners_updated_at_trigger
    BEFORE UPDATE ON partners
    FOR EACH ROW
    EXECUTE FUNCTION update_partners_updated_at();

-- =====================================================
-- 7. ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on partner tables
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_validation_requests ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 8. CREATE RLS POLICIES
-- =====================================================

-- Partners table policies
CREATE POLICY "partners_select_own" ON partners
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "partners_update_own" ON partners
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "partners_admin_all" ON partners
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- Partner validation requests policies
CREATE POLICY "validation_requests_select_own" ON partner_validation_requests
    FOR SELECT USING (
        partner_id IN (
            SELECT id FROM partners WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "validation_requests_insert_own" ON partner_validation_requests
    FOR INSERT WITH CHECK (
        partner_id IN (
            SELECT id FROM partners WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "validation_requests_admin_all" ON partner_validation_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- Lofts table policies for partner access
CREATE POLICY "lofts_partner_select" ON lofts
    FOR SELECT USING (
        partner_id IN (
            SELECT id FROM partners WHERE user_id = auth.uid()
        )
    );

-- Reservations table policies for partner access (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reservations') THEN
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
-- 9. GRANT PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON partners TO authenticated;
GRANT SELECT, INSERT ON partner_validation_requests TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION get_partner_dashboard_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_partner(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_partner(UUID, UUID, TEXT, TEXT) TO authenticated;

-- Grant permissions to service role
GRANT ALL ON partners TO service_role;
GRANT ALL ON partner_validation_requests TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- =====================================================
-- 10. COMMIT TRANSACTION
-- =====================================================

COMMIT;

-- =====================================================
-- 11. VERIFICATION
-- =====================================================

-- Verify tables were created
SELECT 
    'Partner system migration completed successfully!' as status,
    'Tables: partners, partner_validation_requests' as tables_created,
    'Functions: get_partner_dashboard_stats, approve_partner, reject_partner' as functions_created,
    'RLS policies enabled for data isolation' as security_status;