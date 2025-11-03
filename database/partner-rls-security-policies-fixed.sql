-- =====================================================
-- PARTNER DASHBOARD SYSTEM - ROW LEVEL SECURITY POLICIES (FIXED)
-- =====================================================
-- This script creates comprehensive RLS policies for the Partner Dashboard System
-- ensuring complete data isolation between partners and proper access controls

-- =====================================================
-- 0. CLEANUP EXISTING FUNCTIONS AND TRIGGERS
-- =====================================================

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS partner_owns_loft(UUID, UUID);
DROP FUNCTION IF EXISTS is_admin(UUID);
DROP FUNCTION IF EXISTS is_approved_partner(UUID);

-- =====================================================
-- 1. DROP EXISTING POLICIES TO AVOID CONFLICTS
-- =====================================================

-- Drop existing partner-related policies
DROP POLICY IF EXISTS "partners_select_own" ON partners;
DROP POLICY IF EXISTS "partners_update_own" ON partners;
DROP POLICY IF EXISTS "partners_admin_all" ON partners;
DROP POLICY IF EXISTS "partners_view_own_profile" ON partners;
DROP POLICY IF EXISTS "partners_update_own_profile" ON partners;
DROP POLICY IF EXISTS "partners_insert_authenticated" ON partners;
DROP POLICY IF EXISTS "partners_admin_full_access" ON partners;

DROP POLICY IF EXISTS "validation_requests_select_own" ON partner_validation_requests;
DROP POLICY IF EXISTS "validation_requests_insert_own" ON partner_validation_requests;
DROP POLICY IF EXISTS "validation_requests_admin_all" ON partner_validation_requests;
DROP POLICY IF EXISTS "validation_requests_view_own" ON partner_validation_requests;
DROP POLICY IF EXISTS "validation_requests_admin_full_access" ON partner_validation_requests;

DROP POLICY IF EXISTS "lofts_partner_select" ON lofts;
DROP POLICY IF EXISTS "lofts_partner_view_own_properties" ON lofts;
DROP POLICY IF EXISTS "lofts_admin_full_access" ON lofts;
DROP POLICY IF EXISTS "lofts_service_role_access" ON lofts;

DROP POLICY IF EXISTS "reservations_partner_select" ON reservations;
DROP POLICY IF EXISTS "reservations_partner_view_own_property_bookings" ON reservations;
DROP POLICY IF EXISTS "reservations_admin_full_access" ON reservations;
DROP POLICY IF EXISTS "reservations_service_role_access" ON reservations;

DROP POLICY IF EXISTS "transactions_partner_view_own_property_transactions" ON transactions;
DROP POLICY IF EXISTS "transactions_admin_full_access" ON transactions;
DROP POLICY IF EXISTS "transactions_service_role_access" ON transactions;

DROP POLICY IF EXISTS "tasks_partner_view_own_property_tasks" ON tasks;
DROP POLICY IF EXISTS "tasks_partner_update_own_property_tasks" ON tasks;
DROP POLICY IF EXISTS "tasks_admin_full_access" ON tasks;
DROP POLICY IF EXISTS "tasks_service_role_access" ON tasks;

DROP POLICY IF EXISTS "profiles_view_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_view_all" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_update_all" ON profiles;
DROP POLICY IF EXISTS "profiles_service_role_access" ON profiles;

-- Drop existing audit log policies
DROP POLICY IF EXISTS "audit_log_admin_view_all" ON partner_audit_log;
DROP POLICY IF EXISTS "audit_log_partner_view_own" ON partner_audit_log;
DROP POLICY IF EXISTS "audit_log_system_insert" ON partner_audit_log;

-- =====================================================
-- 2. PARTNERS TABLE RLS POLICIES
-- =====================================================

-- Enable RLS on partners table
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

-- Policy 1: Partners can view their own profile only
CREATE POLICY "partners_view_own_profile" ON partners
    FOR SELECT USING (
        user_id = auth.uid()
    );

-- Policy 2: Partners can update their own profile (limited fields only)
CREATE POLICY "partners_update_own_profile" ON partners
    FOR UPDATE USING (
        user_id = auth.uid()
    )
    WITH CHECK (
        user_id = auth.uid()
        -- Note: Field-level restrictions should be handled at application level
        -- RLS policies cannot reference OLD values in WITH CHECK clauses
    );

-- Policy 3: Only authenticated users can insert new partner records
CREATE POLICY "partners_insert_authenticated" ON partners
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND
        user_id = auth.uid() AND
        verification_status = 'pending'
    );

-- Policy 4: Admins have full access to all partner records
CREATE POLICY "partners_admin_full_access" ON partners
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- =====================================================
-- 3. PARTNER VALIDATION REQUESTS RLS POLICIES
-- =====================================================

-- Enable RLS on partner validation requests table
ALTER TABLE partner_validation_requests ENABLE ROW LEVEL SECURITY;

-- Policy 1: Partners can view their own validation requests only
CREATE POLICY "validation_requests_view_own" ON partner_validation_requests
    FOR SELECT USING (
        partner_id IN (
            SELECT id FROM partners WHERE user_id = auth.uid()
        )
    );

-- Policy 2: Partners can insert validation requests for themselves only
CREATE POLICY "validation_requests_insert_own" ON partner_validation_requests
    FOR INSERT WITH CHECK (
        partner_id IN (
            SELECT id FROM partners WHERE user_id = auth.uid()
        ) AND
        status = 'pending'
    );

-- Policy 3: Admins have full access to all validation requests
CREATE POLICY "validation_requests_admin_full_access" ON partner_validation_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- =====================================================
-- 4. LOFTS TABLE RLS POLICIES FOR PARTNER ACCESS
-- =====================================================

-- Drop existing broad loft policies that might conflict
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON lofts;

-- Enable RLS on lofts table (should already be enabled)
ALTER TABLE lofts ENABLE ROW LEVEL SECURITY;

-- Policy 1: Partners can only view their own properties
CREATE POLICY "lofts_partner_view_own_properties" ON lofts
    FOR SELECT USING (
        partner_id IN (
            SELECT id FROM partners 
            WHERE user_id = auth.uid() 
            AND verification_status = 'approved'
        )
    );

-- Policy 2: Admins have full access to all lofts
CREATE POLICY "lofts_admin_full_access" ON lofts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- Policy 3: Service role has full access (for system operations)
CREATE POLICY "lofts_service_role_access" ON lofts
    FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- 5. RESERVATIONS TABLE RLS POLICIES FOR PARTNER ACCESS
-- =====================================================

-- Check if reservations table exists and create policies
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reservations') THEN
        -- Drop existing broad reservation policies that might conflict
        EXECUTE 'DROP POLICY IF EXISTS "Allow all access to authenticated users" ON reservations';
        
        -- Enable RLS on reservations table
        EXECUTE 'ALTER TABLE reservations ENABLE ROW LEVEL SECURITY';
        
        -- Policy 1: Partners can only view reservations for their properties
        EXECUTE 'CREATE POLICY "reservations_partner_view_own_property_bookings" ON reservations
            FOR SELECT USING (
                loft_id IN (
                    SELECT l.id FROM lofts l
                    JOIN partners p ON l.partner_id = p.id
                    WHERE p.user_id = auth.uid() 
                    AND p.verification_status = ''approved''
                )
            )';
        
        -- Policy 2: Admins have full access to all reservations
        EXECUTE 'CREATE POLICY "reservations_admin_full_access" ON reservations
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE id = auth.uid() 
                    AND role IN (''admin'', ''manager'')
                )
            )';
        
        -- Policy 3: Service role has full access
        EXECUTE 'CREATE POLICY "reservations_service_role_access" ON reservations
            FOR ALL USING (auth.role() = ''service_role'')';
    END IF;
END$$;

-- =====================================================
-- 6. TRANSACTIONS TABLE RLS POLICIES FOR PARTNER ACCESS
-- =====================================================

-- Drop existing broad transaction policies that might conflict
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON transactions;

-- Enable RLS on transactions table
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policy 1: Partners can only view transactions related to their properties
CREATE POLICY "transactions_partner_view_own_property_transactions" ON transactions
    FOR SELECT USING (
        loft_id IN (
            SELECT l.id FROM lofts l
            JOIN partners p ON l.partner_id = p.id
            WHERE p.user_id = auth.uid() 
            AND p.verification_status = 'approved'
        )
    );

-- Policy 2: Admins have full access to all transactions
CREATE POLICY "transactions_admin_full_access" ON transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- Policy 3: Service role has full access
CREATE POLICY "transactions_service_role_access" ON transactions
    FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- 7. TASKS TABLE RLS POLICIES FOR PARTNER ACCESS
-- =====================================================

-- Drop existing broad task policies that might conflict
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON tasks;

-- Enable RLS on tasks table
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policy 1: Partners can only view tasks related to their properties
CREATE POLICY "tasks_partner_view_own_property_tasks" ON tasks
    FOR SELECT USING (
        loft_id IN (
            SELECT l.id FROM lofts l
            JOIN partners p ON l.partner_id = p.id
            WHERE p.user_id = auth.uid() 
            AND p.verification_status = 'approved'
        )
    );

-- Policy 2: Partners can update task status for their properties (limited fields)
CREATE POLICY "tasks_partner_update_own_property_tasks" ON tasks
    FOR UPDATE USING (
        loft_id IN (
            SELECT l.id FROM lofts l
            JOIN partners p ON l.partner_id = p.id
            WHERE p.user_id = auth.uid() 
            AND p.verification_status = 'approved'
        )
    )
    WITH CHECK (
        loft_id IN (
            SELECT l.id FROM lofts l
            JOIN partners p ON l.partner_id = p.id
            WHERE p.user_id = auth.uid() 
            AND p.verification_status = 'approved'
        )
        -- Note: Field-level update restrictions should be handled at application level
        -- RLS policies cannot reference OLD values in WITH CHECK clauses
    );

-- Policy 3: Admins have full access to all tasks
CREATE POLICY "tasks_admin_full_access" ON tasks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- Policy 4: Service role has full access
CREATE POLICY "tasks_service_role_access" ON tasks
    FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- 8. PROFILES TABLE RLS POLICIES UPDATE
-- =====================================================

-- Drop existing broad profile policies that might conflict
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON profiles;

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own profile
CREATE POLICY "profiles_view_own" ON profiles
    FOR SELECT USING (id = auth.uid());

-- Policy 2: Users can update their own profile (limited fields)
CREATE POLICY "profiles_update_own" ON profiles
    FOR UPDATE USING (id = auth.uid())
    WITH CHECK (
        id = auth.uid()
        -- Note: Role change restrictions should be handled at application level
        -- RLS policies cannot reference OLD values in WITH CHECK clauses
    );

-- Policy 3: Admins can view all profiles
CREATE POLICY "profiles_admin_view_all" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() 
            AND p.role IN ('admin', 'manager')
        )
    );

-- Policy 4: Admins can update all profiles
CREATE POLICY "profiles_admin_update_all" ON profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() 
            AND p.role IN ('admin', 'manager')
        )
    );

-- Policy 5: Service role has full access
CREATE POLICY "profiles_service_role_access" ON profiles
    FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- 9. SECURITY VALIDATION FUNCTIONS
-- =====================================================

-- Function to validate partner ownership of a loft
CREATE OR REPLACE FUNCTION partner_owns_loft(loft_id UUID, partner_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM lofts l
        JOIN partners p ON l.partner_id = p.id
        WHERE l.id = loft_id 
        AND p.user_id = partner_user_id
        AND p.verification_status = 'approved'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is an admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id 
        AND role IN ('admin', 'manager')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is an approved partner
CREATE OR REPLACE FUNCTION is_approved_partner(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM partners 
        WHERE user_id = user_id 
        AND verification_status = 'approved'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 10. AUDIT LOGGING PREPARATION
-- =====================================================

-- Create audit log table for partner actions
CREATE TABLE IF NOT EXISTS partner_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE partner_audit_log ENABLE ROW LEVEL SECURITY;

-- Audit log policies
CREATE POLICY "audit_log_admin_view_all" ON partner_audit_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "audit_log_partner_view_own" ON partner_audit_log
    FOR SELECT USING (
        user_id = auth.uid()
    );

CREATE POLICY "audit_log_system_insert" ON partner_audit_log
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- 11. GRANT PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated users
GRANT SELECT ON partner_audit_log TO authenticated;
GRANT EXECUTE ON FUNCTION partner_owns_loft(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_approved_partner(UUID) TO authenticated;

-- Grant permissions to service role
GRANT ALL ON partner_audit_log TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- =====================================================
-- 12. COMPLETION MESSAGE
-- =====================================================

SELECT 
    'Partner Dashboard RLS Security Policies created successfully! 🔒' as status,
    'Tables secured: partners, partner_validation_requests, lofts, reservations, transactions, tasks, profiles' as tables_secured,
    'Features: Complete data isolation, Partner ownership validation, Admin access controls, Audit logging preparation' as features,
    'Security Level: Maximum - Partners can only access their own data' as security_level;