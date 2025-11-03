-- =====================================================
-- PARTNER DASHBOARD SYSTEM - AUDIT LOGGING SYSTEM (FIXED)
-- =====================================================
-- This script creates a comprehensive audit logging system for the Partner Dashboard
-- tracking all partner data changes, property access, and admin actions

-- =====================================================
-- 0. CLEANUP EXISTING TRIGGERS AND FUNCTIONS
-- =====================================================

-- Drop existing triggers
DROP TRIGGER IF EXISTS partners_audit_trigger ON partners;
DROP TRIGGER IF EXISTS partner_validation_requests_audit_trigger ON partner_validation_requests;
DROP TRIGGER IF EXISTS lofts_partner_audit_trigger ON lofts;

-- Drop existing functions
DROP FUNCTION IF EXISTS audit_trigger_function() CASCADE;
DROP FUNCTION IF EXISTS lofts_partner_audit_trigger() CASCADE;
DROP FUNCTION IF EXISTS log_partner_audit(UUID, UUID, UUID, TEXT, TEXT, UUID, JSONB, JSONB, TEXT, TEXT, INET, TEXT, TEXT, BOOLEAN, TEXT) CASCADE;
DROP FUNCTION IF EXISTS log_property_access(UUID, UUID, UUID, TEXT, BOOLEAN, TEXT, INET, TEXT, TEXT, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS log_admin_action(UUID, UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID[], INET, TEXT) CASCADE;
DROP FUNCTION IF EXISTS approve_partner_with_audit(UUID, UUID, TEXT, INET, TEXT) CASCADE;
DROP FUNCTION IF EXISTS reject_partner_with_audit(UUID, UUID, TEXT, TEXT, INET, TEXT) CASCADE;
DROP FUNCTION IF EXISTS cleanup_partner_audit_logs(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS is_admin(UUID) CASCADE;
DROP FUNCTION IF EXISTS is_approved_partner(UUID) CASCADE;

-- Drop existing audit table policies
DO $$
BEGIN
    -- Drop partner_audit_log policies
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partner_audit_log') THEN
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

-- =====================================================
-- 1. AUDIT LOG TABLES
-- =====================================================

-- Main audit log table (enhanced version of the one in RLS policies)
DROP TABLE IF EXISTS partner_audit_log CASCADE;
CREATE TABLE partner_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User and Partner Information
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    partner_id UUID REFERENCES partners(id) ON DELETE SET NULL,
    admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Action Details
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'SELECT', 'LOGIN', 'LOGOUT', 'APPROVE', 'REJECT', 'ACCESS_DENIED')),
    table_name TEXT NOT NULL,
    record_id UUID,
    
    -- Data Changes
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    
    -- Request Context
    ip_address INET,
    user_agent TEXT,
    request_path TEXT,
    request_method TEXT,
    session_id TEXT,
    
    -- Security Context
    auth_role TEXT,
    permission_level TEXT,
    access_granted BOOLEAN DEFAULT TRUE,
    failure_reason TEXT,
    
    -- Metadata
    description TEXT,
    severity TEXT DEFAULT 'INFO' CHECK (severity IN ('INFO', 'WARNING', 'ERROR', 'CRITICAL')),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Property access log table for detailed property access tracking
CREATE TABLE IF NOT EXISTS partner_property_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User and Property Information
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    partner_id UUID REFERENCES partners(id) ON DELETE SET NULL,
    loft_id UUID REFERENCES lofts(id) ON DELETE SET NULL,
    
    -- Access Details
    access_type TEXT NOT NULL CHECK (access_type IN ('VIEW', 'DASHBOARD', 'DETAILS', 'RESERVATIONS', 'REVENUE', 'EXPORT')),
    access_granted BOOLEAN NOT NULL DEFAULT TRUE,
    denial_reason TEXT,
    
    -- Request Context
    ip_address INET,
    user_agent TEXT,
    request_path TEXT,
    session_id TEXT,
    
    -- Performance Metrics
    response_time_ms INTEGER,
    data_size_bytes INTEGER,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin action log table for tracking administrative actions on partners
CREATE TABLE IF NOT EXISTS partner_admin_action_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Admin and Target Information
    admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    target_partner_id UUID REFERENCES partners(id) ON DELETE SET NULL,
    target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Action Details
    action_type TEXT NOT NULL CHECK (action_type IN ('APPROVE', 'REJECT', 'SUSPEND', 'REACTIVATE', 'UPDATE_PROFILE', 'ASSIGN_PROPERTY', 'REMOVE_PROPERTY', 'VIEW_DETAILS')),
    action_result TEXT NOT NULL CHECK (action_result IN ('SUCCESS', 'FAILED', 'PARTIAL')),
    
    -- Action Context
    reason TEXT,
    admin_notes TEXT,
    previous_status TEXT,
    new_status TEXT,
    
    -- Affected Resources
    affected_properties UUID[],
    affected_reservations UUID[],
    
    -- Request Context
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. HELPER FUNCTIONS
-- =====================================================

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
-- 3. AUDIT LOGGING FUNCTIONS
-- =====================================================

-- Generic audit logging function
CREATE OR REPLACE FUNCTION log_partner_audit(
    p_user_id UUID,
    p_partner_id UUID,
    p_admin_user_id UUID,
    p_action TEXT,
    p_table_name TEXT,
    p_record_id UUID,
    p_old_values JSONB,
    p_new_values JSONB,
    p_description TEXT DEFAULT NULL,
    p_severity TEXT DEFAULT 'INFO',
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_request_path TEXT DEFAULT NULL,
    p_access_granted BOOLEAN DEFAULT TRUE,
    p_failure_reason TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    audit_id UUID;
    changed_fields TEXT[];
BEGIN
    -- Calculate changed fields if both old and new values exist
    IF p_old_values IS NOT NULL AND p_new_values IS NOT NULL THEN
        SELECT array_agg(key) INTO changed_fields
        FROM (
            SELECT key FROM jsonb_each(p_old_values)
            EXCEPT
            SELECT key FROM jsonb_each(p_new_values)
            UNION
            SELECT key FROM jsonb_each(p_new_values)
            EXCEPT
            SELECT key FROM jsonb_each(p_old_values)
        ) AS changed;
    END IF;
    
    -- Insert audit record
    INSERT INTO partner_audit_log (
        user_id, partner_id, admin_user_id, action, table_name, record_id,
        old_values, new_values, changed_fields, description, severity,
        ip_address, user_agent, request_path, auth_role, access_granted, failure_reason
    ) VALUES (
        p_user_id, p_partner_id, p_admin_user_id, p_action, p_table_name, p_record_id,
        p_old_values, p_new_values, changed_fields, p_description, p_severity,
        p_ip_address, p_user_agent, p_request_path, current_setting('role', true), p_access_granted, p_failure_reason
    ) RETURNING id INTO audit_id;
    
    RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Property access logging function
CREATE OR REPLACE FUNCTION log_property_access(
    p_user_id UUID,
    p_partner_id UUID,
    p_loft_id UUID,
    p_access_type TEXT,
    p_access_granted BOOLEAN DEFAULT TRUE,
    p_denial_reason TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_request_path TEXT DEFAULT NULL,
    p_response_time_ms INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    access_log_id UUID;
BEGIN
    INSERT INTO partner_property_access_log (
        user_id, partner_id, loft_id, access_type, access_granted, denial_reason,
        ip_address, user_agent, request_path, response_time_ms
    ) VALUES (
        p_user_id, p_partner_id, p_loft_id, p_access_type, p_access_granted, p_denial_reason,
        p_ip_address, p_user_agent, p_request_path, p_response_time_ms
    ) RETURNING id INTO access_log_id;
    
    RETURN access_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin action logging function
CREATE OR REPLACE FUNCTION log_admin_action(
    p_admin_user_id UUID,
    p_target_partner_id UUID,
    p_target_user_id UUID,
    p_action_type TEXT,
    p_action_result TEXT,
    p_reason TEXT DEFAULT NULL,
    p_admin_notes TEXT DEFAULT NULL,
    p_previous_status TEXT DEFAULT NULL,
    p_new_status TEXT DEFAULT NULL,
    p_affected_properties UUID[] DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    action_log_id UUID;
BEGIN
    INSERT INTO partner_admin_action_log (
        admin_user_id, target_partner_id, target_user_id, action_type, action_result,
        reason, admin_notes, previous_status, new_status, affected_properties,
        ip_address, user_agent
    ) VALUES (
        p_admin_user_id, p_target_partner_id, p_target_user_id, p_action_type, p_action_result,
        p_reason, p_admin_notes, p_previous_status, p_new_status, p_affected_properties,
        p_ip_address, p_user_agent
    ) RETURNING id INTO action_log_id;
    
    RETURN action_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. AUDIT TRIGGERS FOR PARTNER DATA CHANGES
-- =====================================================

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    old_data JSONB;
    new_data JSONB;
    partner_id UUID;
    user_id UUID;
    current_user_id UUID;
BEGIN
    -- Get current user ID safely
    current_user_id := auth.uid();
    
    -- Convert OLD and NEW to JSONB
    IF TG_OP = 'DELETE' THEN
        old_data := to_jsonb(OLD);
        new_data := NULL;
    ELSIF TG_OP = 'INSERT' THEN
        old_data := NULL;
        new_data := to_jsonb(NEW);
    ELSE -- UPDATE
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);
    END IF;
    
    -- Extract partner_id and user_id based on table
    IF TG_TABLE_NAME = 'partners' THEN
        partner_id := COALESCE(NEW.id, OLD.id);
        user_id := COALESCE(NEW.user_id, OLD.user_id);
    ELSIF TG_TABLE_NAME = 'lofts' THEN
        partner_id := COALESCE(NEW.partner_id, OLD.partner_id);
        user_id := current_user_id;
    ELSE
        partner_id := NULL;
        user_id := current_user_id;
    END IF;
    
    -- Log the audit record (with inline admin check)
    PERFORM log_partner_audit(
        user_id,
        partner_id,
        CASE WHEN EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = current_user_id 
            AND role IN ('admin', 'manager')
        ) THEN current_user_id ELSE NULL END,
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        old_data,
        new_data,
        'Automatic audit log for ' || TG_OP || ' on ' || TG_TABLE_NAME,
        'INFO'
    );
    
    -- Return appropriate record
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers for partner-related tables
CREATE TRIGGER partners_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON partners
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER partner_validation_requests_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON partner_validation_requests
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Create audit trigger for lofts when partner_id changes
CREATE OR REPLACE FUNCTION lofts_partner_audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Get current user ID safely
    current_user_id := auth.uid();
    
    -- Only log when partner_id changes or when it's a partner-related operation
    IF TG_OP = 'INSERT' AND NEW.partner_id IS NOT NULL THEN
        PERFORM log_partner_audit(
            current_user_id,
            NEW.partner_id,
            CASE WHEN EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = current_user_id 
                AND role IN ('admin', 'manager')
            ) THEN current_user_id ELSE NULL END,
            'INSERT',
            'lofts',
            NEW.id,
            NULL,
            to_jsonb(NEW),
            'Property assigned to partner',
            'INFO'
        );
    ELSIF TG_OP = 'UPDATE' AND (OLD.partner_id IS DISTINCT FROM NEW.partner_id) THEN
        PERFORM log_partner_audit(
            current_user_id,
            COALESCE(NEW.partner_id, OLD.partner_id),
            CASE WHEN EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = current_user_id 
                AND role IN ('admin', 'manager')
            ) THEN current_user_id ELSE NULL END,
            'UPDATE',
            'lofts',
            NEW.id,
            jsonb_build_object('partner_id', OLD.partner_id),
            jsonb_build_object('partner_id', NEW.partner_id),
            'Property partner assignment changed',
            'INFO'
        );
    ELSIF TG_OP = 'DELETE' AND OLD.partner_id IS NOT NULL THEN
        PERFORM log_partner_audit(
            current_user_id,
            OLD.partner_id,
            CASE WHEN EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = current_user_id 
                AND role IN ('admin', 'manager')
            ) THEN current_user_id ELSE NULL END,
            'DELETE',
            'lofts',
            OLD.id,
            to_jsonb(OLD),
            NULL,
            'Property removed from partner',
            'WARNING'
        );
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER lofts_partner_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON lofts
    FOR EACH ROW EXECUTE FUNCTION lofts_partner_audit_trigger();

-- =====================================================
-- 5. ENHANCED PARTNER MANAGEMENT FUNCTIONS WITH AUDIT LOGGING
-- =====================================================

-- Enhanced approve partner function with audit logging
CREATE OR REPLACE FUNCTION approve_partner_with_audit(
    partner_id UUID,
    admin_user_id UUID,
    admin_notes TEXT DEFAULT NULL,
    ip_address INET DEFAULT NULL,
    user_agent TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    partner_record partners%ROWTYPE;
    old_status TEXT;
    audit_id UUID;
    action_log_id UUID;
    admin_check BOOLEAN;
BEGIN
    -- Check if admin has permission (inline check to avoid function dependency)
    SELECT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = admin_user_id 
        AND role IN ('admin', 'manager')
    ) INTO admin_check;
    
    IF NOT admin_check THEN
        -- Log failed attempt
        PERFORM log_partner_audit(
            admin_user_id, partner_id, admin_user_id, 'APPROVE', 'partners', partner_id,
            NULL, NULL, 'Failed partner approval - insufficient permissions', 'ERROR',
            ip_address, user_agent, NULL, FALSE, 'Insufficient permissions'
        );
        RAISE EXCEPTION 'Insufficient permissions to approve partner';
    END IF;
    
    -- Get partner record
    SELECT * INTO partner_record FROM partners WHERE id = partner_id;
    
    IF partner_record.id IS NULL THEN
        -- Log failed attempt
        PERFORM log_partner_audit(
            admin_user_id, partner_id, admin_user_id, 'APPROVE', 'partners', partner_id,
            NULL, NULL, 'Failed partner approval - partner not found', 'ERROR',
            ip_address, user_agent, NULL, FALSE, 'Partner not found'
        );
        RAISE EXCEPTION 'Partner not found';
    END IF;
    
    old_status := partner_record.verification_status::TEXT;
    
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
    
    -- Log successful approval
    SELECT log_partner_audit(
        partner_record.user_id, partner_id, admin_user_id, 'APPROVE', 'partners', partner_id,
        jsonb_build_object('verification_status', old_status),
        jsonb_build_object('verification_status', 'approved'),
        'Partner approved by admin', 'INFO', ip_address, user_agent
    ) INTO audit_id;
    
    -- Log admin action
    SELECT log_admin_action(
        admin_user_id, partner_id, partner_record.user_id, 'APPROVE', 'SUCCESS',
        admin_notes, admin_notes, old_status, 'approved', NULL, ip_address, user_agent
    ) INTO action_log_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced reject partner function with audit logging
CREATE OR REPLACE FUNCTION reject_partner_with_audit(
    partner_id UUID,
    admin_user_id UUID,
    rejection_reason TEXT,
    admin_notes TEXT DEFAULT NULL,
    ip_address INET DEFAULT NULL,
    user_agent TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    partner_record partners%ROWTYPE;
    old_status TEXT;
    audit_id UUID;
    action_log_id UUID;
    admin_check BOOLEAN;
BEGIN
    -- Check if admin has permission (inline check to avoid function dependency)
    SELECT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = admin_user_id 
        AND role IN ('admin', 'manager')
    ) INTO admin_check;
    
    IF NOT admin_check THEN
        -- Log failed attempt
        PERFORM log_partner_audit(
            admin_user_id, partner_id, admin_user_id, 'REJECT', 'partners', partner_id,
            NULL, NULL, 'Failed partner rejection - insufficient permissions', 'ERROR',
            ip_address, user_agent, NULL, FALSE, 'Insufficient permissions'
        );
        RAISE EXCEPTION 'Insufficient permissions to reject partner';
    END IF;
    
    -- Get partner record
    SELECT * INTO partner_record FROM partners WHERE id = partner_id;
    
    IF partner_record.id IS NULL THEN
        -- Log failed attempt
        PERFORM log_partner_audit(
            admin_user_id, partner_id, admin_user_id, 'REJECT', 'partners', partner_id,
            NULL, NULL, 'Failed partner rejection - partner not found', 'ERROR',
            ip_address, user_agent, NULL, FALSE, 'Partner not found'
        );
        RAISE EXCEPTION 'Partner not found';
    END IF;
    
    old_status := partner_record.verification_status::TEXT;
    
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
    
    -- Log successful rejection
    SELECT log_partner_audit(
        partner_record.user_id, partner_id, admin_user_id, 'REJECT', 'partners', partner_id,
        jsonb_build_object('verification_status', old_status),
        jsonb_build_object('verification_status', 'rejected', 'rejection_reason', rejection_reason),
        'Partner rejected by admin', 'WARNING', ip_address, user_agent
    ) INTO audit_id;
    
    -- Log admin action
    SELECT log_admin_action(
        admin_user_id, partner_id, partner_record.user_id, 'REJECT', 'SUCCESS',
        rejection_reason, admin_notes, old_status, 'rejected', NULL, ip_address, user_agent
    ) INTO action_log_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. AUDIT LOG INDEXES FOR PERFORMANCE
-- =====================================================

-- Main audit log indexes
CREATE INDEX IF NOT EXISTS idx_partner_audit_log_user_id ON partner_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_audit_log_partner_id ON partner_audit_log(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_audit_log_admin_user_id ON partner_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_partner_audit_log_action ON partner_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_partner_audit_log_table_name ON partner_audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_partner_audit_log_created_at ON partner_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_partner_audit_log_severity ON partner_audit_log(severity);
CREATE INDEX IF NOT EXISTS idx_partner_audit_log_access_granted ON partner_audit_log(access_granted);

-- Property access log indexes
CREATE INDEX IF NOT EXISTS idx_partner_property_access_log_user_id ON partner_property_access_log(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_property_access_log_partner_id ON partner_property_access_log(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_property_access_log_loft_id ON partner_property_access_log(loft_id);
CREATE INDEX IF NOT EXISTS idx_partner_property_access_log_access_type ON partner_property_access_log(access_type);
CREATE INDEX IF NOT EXISTS idx_partner_property_access_log_created_at ON partner_property_access_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_partner_property_access_log_access_granted ON partner_property_access_log(access_granted);

-- Admin action log indexes
CREATE INDEX IF NOT EXISTS idx_partner_admin_action_log_admin_user_id ON partner_admin_action_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_partner_admin_action_log_target_partner_id ON partner_admin_action_log(target_partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_admin_action_log_action_type ON partner_admin_action_log(action_type);
CREATE INDEX IF NOT EXISTS idx_partner_admin_action_log_created_at ON partner_admin_action_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_partner_admin_action_log_action_result ON partner_admin_action_log(action_result);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_log_partner_action_date ON partner_audit_log(partner_id, action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_table_date ON partner_audit_log(user_id, table_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_property_access_partner_type_date ON partner_property_access_log(partner_id, access_type, created_at DESC);

-- =====================================================
-- 7. ROW LEVEL SECURITY FOR AUDIT TABLES
-- =====================================================

-- Enable RLS on audit tables
ALTER TABLE partner_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_property_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_admin_action_log ENABLE ROW LEVEL SECURITY;

-- Audit log policies
CREATE POLICY "audit_log_admin_full_access" ON partner_audit_log
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "audit_log_partner_view_own" ON partner_audit_log
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "audit_log_system_insert" ON partner_audit_log
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Property access log policies
CREATE POLICY "property_access_log_admin_full_access" ON partner_property_access_log
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "property_access_log_partner_view_own" ON partner_property_access_log
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "property_access_log_system_insert" ON partner_property_access_log
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Admin action log policies
CREATE POLICY "admin_action_log_admin_full_access" ON partner_admin_action_log
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "admin_action_log_system_insert" ON partner_admin_action_log
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- 8. AUDIT LOG CLEANUP AND MAINTENANCE
-- =====================================================

-- Function to clean up old audit logs (retention policy)
CREATE OR REPLACE FUNCTION cleanup_partner_audit_logs(retention_days INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete old audit logs
    DELETE FROM partner_audit_log 
    WHERE created_at < NOW() - INTERVAL '1 day' * retention_days
    AND severity NOT IN ('ERROR', 'CRITICAL');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log the cleanup action
    PERFORM log_partner_audit(
        NULL, NULL, NULL, 'DELETE', 'partner_audit_log', NULL,
        NULL, jsonb_build_object('deleted_count', deleted_count),
        'Automated audit log cleanup', 'INFO'
    );
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. GRANT PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated users
GRANT SELECT ON partner_audit_log TO authenticated;
GRANT SELECT ON partner_property_access_log TO authenticated;
GRANT SELECT ON partner_admin_action_log TO authenticated;

GRANT EXECUTE ON FUNCTION log_partner_audit(UUID, UUID, UUID, TEXT, TEXT, UUID, JSONB, JSONB, TEXT, TEXT, INET, TEXT, TEXT, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_property_access(UUID, UUID, UUID, TEXT, BOOLEAN, TEXT, INET, TEXT, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION log_admin_action(UUID, UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID[], INET, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_partner_with_audit(UUID, UUID, TEXT, INET, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_partner_with_audit(UUID, UUID, TEXT, TEXT, INET, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_partner_audit_logs(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_approved_partner(UUID) TO authenticated;

-- Grant permissions to service role
GRANT ALL ON partner_audit_log TO service_role;
GRANT ALL ON partner_property_access_log TO service_role;
GRANT ALL ON partner_admin_action_log TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- =====================================================
-- 10. COMPLETION MESSAGE
-- =====================================================

SELECT 
    'Partner Dashboard Audit Logging System created successfully! 📊' as status,
    'Tables: partner_audit_log, partner_property_access_log, partner_admin_action_log' as tables_created,
    'Features: Automatic triggers, Property access tracking, Admin action logging, Data change auditing' as features,
    'Security: Complete audit trail for all partner-related activities' as security_features;