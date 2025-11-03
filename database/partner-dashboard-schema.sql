-- =====================================================
-- PARTNER DASHBOARD SYSTEM - DATABASE SCHEMA
-- =====================================================
-- This script creates the database schema for the Partner Dashboard System
-- Run this script in your Supabase SQL editor to set up the partner system

-- =====================================================
-- 1. CUSTOM TYPES FOR PARTNER SYSTEM
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
-- 2. PARTNERS TABLE
-- =====================================================

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
    verification_documents TEXT[], -- Array of document URLs/paths
    portfolio_description TEXT,
    
    -- Admin Management Fields
    admin_notes TEXT,
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES auth.users(id),
    rejected_at TIMESTAMPTZ,
    rejected_by UUID REFERENCES auth.users(id),
    rejection_reason TEXT,
    
    -- Banking Information (for future use)
    bank_details JSONB,
    
    -- Activity Tracking
    last_login_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT partners_user_id_unique UNIQUE (user_id),
    CONSTRAINT partners_business_type_check CHECK (business_type IN ('individual', 'company')),
    CONSTRAINT partners_verification_status_check CHECK (verification_status IN ('pending', 'approved', 'rejected', 'suspended'))
);

-- =====================================================
-- 3. PARTNER VALIDATION REQUESTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS partner_validation_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
    
    -- Request Status
    status validation_request_status NOT NULL DEFAULT 'pending',
    
    -- Submitted Data (JSON snapshot of registration data)
    submitted_data JSONB NOT NULL,
    
    -- Admin Processing
    admin_notes TEXT,
    processed_by UUID REFERENCES auth.users(id),
    processed_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT validation_requests_status_check CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- =====================================================
-- 4. EXTEND LOFTS TABLE FOR PARTNER OWNERSHIP
-- =====================================================

-- Add partner_id column to lofts table if it doesn't exist
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES partners(id) ON DELETE SET NULL;

-- Add index for partner_id
CREATE INDEX IF NOT EXISTS idx_lofts_partner_id ON lofts(partner_id);

-- =====================================================
-- 5. PERFORMANCE INDEXES
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

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_partners_status_created ON partners(verification_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_validation_requests_status_created ON partner_validation_requests(status, created_at DESC);

-- Reservations table index for partner property queries (if reservations table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reservations') THEN
        CREATE INDEX IF NOT EXISTS idx_reservations_loft_partner ON reservations(loft_id) 
        WHERE loft_id IN (SELECT id FROM lofts WHERE partner_id IS NOT NULL);
    END IF;
END$$;

-- =====================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on partner tables
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_validation_requests ENABLE ROW LEVEL SECURITY;

-- Partners table policies
-- Partners can view their own profile
CREATE POLICY "partners_select_own" ON partners
    FOR SELECT USING (user_id = auth.uid());

-- Partners can update their own profile (limited fields)
CREATE POLICY "partners_update_own" ON partners
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Admins have full access to partners
CREATE POLICY "partners_admin_all" ON partners
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- Partner validation requests policies
-- Partners can view their own validation requests
CREATE POLICY "validation_requests_select_own" ON partner_validation_requests
    FOR SELECT USING (
        partner_id IN (
            SELECT id FROM partners WHERE user_id = auth.uid()
        )
    );

-- Partners can insert their own validation requests
CREATE POLICY "validation_requests_insert_own" ON partner_validation_requests
    FOR INSERT WITH CHECK (
        partner_id IN (
            SELECT id FROM partners WHERE user_id = auth.uid()
        )
    );

-- Admins have full access to validation requests
CREATE POLICY "validation_requests_admin_all" ON partner_validation_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- Lofts table policies for partner access
-- Partners can only see their own properties
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
        -- Partners can only see reservations for their properties
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
-- 7. HELPER FUNCTIONS FOR PARTNER SYSTEM
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
    current_month_revenue NUMERIC;
    previous_month_revenue NUMERIC;
    year_to_date_revenue NUMERIC;
    active_reservations INTEGER;
    upcoming_reservations INTEGER;
    completed_this_month INTEGER;
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
    
    -- Initialize revenue variables (will be calculated when transactions are linked to partners)
    current_month_revenue := 0;
    previous_month_revenue := 0;
    year_to_date_revenue := 0;
    
    -- Initialize reservation variables (will be calculated when reservations are linked)
    active_reservations := 0;
    upcoming_reservations := 0;
    completed_this_month := 0;
    
    -- Build statistics JSON
    stats := jsonb_build_object(
        'properties', jsonb_build_object(
            'total', properties_count,
            'available', available_count,
            'occupied', occupied_count,
            'maintenance', maintenance_count
        ),
        'revenue', jsonb_build_object(
            'current_month', current_month_revenue,
            'previous_month', previous_month_revenue,
            'year_to_date', year_to_date_revenue,
            'currency', 'DZD'
        ),
        'reservations', jsonb_build_object(
            'active', active_reservations,
            'upcoming', upcoming_reservations,
            'completed_this_month', completed_this_month
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
DECLARE
    partner_record partners%ROWTYPE;
BEGIN
    -- Check if admin has permission
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = admin_user_id 
        AND role IN ('admin', 'manager')
    ) THEN
        RAISE EXCEPTION 'Insufficient permissions to approve partner';
    END IF;
    
    -- Get partner record
    SELECT * INTO partner_record FROM partners WHERE id = partner_id;
    
    IF partner_record.id IS NULL THEN
        RAISE EXCEPTION 'Partner not found';
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
DECLARE
    partner_record partners%ROWTYPE;
BEGIN
    -- Check if admin has permission
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = admin_user_id 
        AND role IN ('admin', 'manager')
    ) THEN
        RAISE EXCEPTION 'Insufficient permissions to reject partner';
    END IF;
    
    -- Get partner record
    SELECT * INTO partner_record FROM partners WHERE id = partner_id;
    
    IF partner_record.id IS NULL THEN
        RAISE EXCEPTION 'Partner not found';
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
-- 8. TRIGGERS FOR AUTOMATIC UPDATES
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
-- 9. PERMISSIONS
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
-- 10. COMPLETION MESSAGE
-- =====================================================

SELECT 
    'Partner Dashboard System database schema created successfully! 🎉' as status,
    'Tables: partners, partner_validation_requests' as tables_created,
    'Features: Partner registration, Admin validation, RLS policies, Dashboard statistics' as features,
    'Next steps: Create partner registration API and dashboard components' as next_steps;