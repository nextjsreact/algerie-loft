-- =====================================================
-- CLEANUP SCRIPT FOR PARTNER DASHBOARD POLICIES
-- =====================================================
-- Run this script first to clean up any existing policies before applying new ones

-- Drop all existing partner-related policies
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

-- Handle reservations table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reservations') THEN
        EXECUTE 'DROP POLICY IF EXISTS "reservations_partner_select" ON reservations';
        EXECUTE 'DROP POLICY IF EXISTS "reservations_partner_view_own_property_bookings" ON reservations';
        EXECUTE 'DROP POLICY IF EXISTS "reservations_admin_full_access" ON reservations';
        EXECUTE 'DROP POLICY IF EXISTS "reservations_service_role_access" ON reservations';
    END IF;
END$$;

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

-- Drop existing audit log policies if tables exist
DO $$
BEGIN
    -- Drop partner_audit_log policies
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partner_audit_log') THEN
        EXECUTE 'DROP POLICY IF EXISTS "audit_log_admin_view_all" ON partner_audit_log';
        EXECUTE 'DROP POLICY IF EXISTS "audit_log_admin_full_access" ON partner_audit_log';
        EXECUTE 'DROP POLICY IF EXISTS "audit_log_partner_view_own" ON partner_audit_log';
        EXECUTE 'DROP POLICY IF EXISTS "audit_log_system_insert" ON partner_audit_log';
    END IF;
    
    -- Drop partner_property_access_log policies
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partner_property_access_log') THEN
        EXECUTE 'DROP POLICY IF EXISTS "property_access_log_admin_full_access" ON partner_property_access_log';
        EXECUTE 'DROP POLICY IF EXISTS "property_access_log_partner_view_own" ON partner_property_access_log';
        EXECUTE 'DROP POLICY IF EXISTS "property_access_log_system_insert" ON partner_property_access_log';
    END IF;
    
    -- Drop partner_admin_action_log policies
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partner_admin_action_log') THEN
        EXECUTE 'DROP POLICY IF EXISTS "admin_action_log_admin_full_access" ON partner_admin_action_log';
        EXECUTE 'DROP POLICY IF EXISTS "admin_action_log_system_insert" ON partner_admin_action_log';
    END IF;
END$$;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS partner_owns_loft(UUID, UUID);
DROP FUNCTION IF EXISTS is_admin(UUID);
DROP FUNCTION IF EXISTS is_approved_partner(UUID);

-- Drop existing triggers
DROP TRIGGER IF EXISTS partners_audit_trigger ON partners;
DROP TRIGGER IF EXISTS partner_validation_requests_audit_trigger ON partner_validation_requests;
DROP TRIGGER IF EXISTS lofts_partner_audit_trigger ON lofts;

-- Drop existing audit functions
DROP FUNCTION IF EXISTS audit_trigger_function() CASCADE;
DROP FUNCTION IF EXISTS lofts_partner_audit_trigger() CASCADE;
DROP FUNCTION IF EXISTS log_partner_audit(UUID, UUID, UUID, TEXT, TEXT, UUID, JSONB, JSONB, TEXT, TEXT, INET, TEXT, TEXT, BOOLEAN, TEXT) CASCADE;
DROP FUNCTION IF EXISTS log_property_access(UUID, UUID, UUID, TEXT, BOOLEAN, TEXT, INET, TEXT, TEXT, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS log_admin_action(UUID, UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID[], INET, TEXT) CASCADE;
DROP FUNCTION IF EXISTS approve_partner_with_audit(UUID, UUID, TEXT, INET, TEXT) CASCADE;
DROP FUNCTION IF EXISTS reject_partner_with_audit(UUID, UUID, TEXT, TEXT, INET, TEXT) CASCADE;
DROP FUNCTION IF EXISTS cleanup_partner_audit_logs(INTEGER) CASCADE;

-- Drop broad policies that might conflict
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON partners;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON lofts;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON transactions;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON tasks;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON profiles;

-- Handle reservations broad policy
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reservations') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Allow all access to authenticated users" ON reservations';
    END IF;
END$$;

SELECT 'Partner dashboard policies cleanup completed successfully! ✅' as status;