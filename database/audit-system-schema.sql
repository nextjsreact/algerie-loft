-- Audit System Database Schema
-- This file contains the complete audit system infrastructure including:
-- 1. audit_logs table with proper indexes
-- 2. Generic audit trigger function
-- 3. User context setting mechanism
-- 4. Helper functions for audit management

-- =====================================================
-- 0. CREATE AUDIT SCHEMA
-- =====================================================

-- Create dedicated schema for audit system
CREATE SCHEMA IF NOT EXISTS audit;

-- Set search path to include audit schema
SET search_path TO audit, public;

-- Grant usage on audit schema to authenticated users
GRANT USAGE ON SCHEMA audit TO authenticated;

-- =====================================================
-- 1. CREATE AUDIT_LOGS TABLE
-- =====================================================

-- Drop existing table if it exists (for development/testing)
DROP TABLE IF EXISTS audit.audit_logs CASCADE;

-- Create the main audit logs table in audit schema
CREATE TABLE audit.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(10) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    user_id UUID REFERENCES profiles(id),
    user_email VARCHAR(255),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. CREATE PERFORMANCE INDEXES
-- =====================================================

-- Primary indexes for common query patterns
CREATE INDEX idx_audit_logs_table_record ON audit.audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_user_id ON audit.audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit.audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_action ON audit.audit_logs(action);
CREATE INDEX idx_audit_logs_table_name ON audit.audit_logs(table_name);

-- Composite indexes for complex queries
CREATE INDEX idx_audit_logs_user_timestamp ON audit.audit_logs(user_id, timestamp DESC);
CREATE INDEX idx_audit_logs_table_action ON audit.audit_logs(table_name, action);
CREATE INDEX idx_audit_logs_record_timestamp ON audit.audit_logs(table_name, record_id, timestamp DESC);

-- GIN index for JSONB fields to support efficient searches in old_values and new_values
CREATE INDEX idx_audit_logs_old_values_gin ON audit.audit_logs USING GIN (old_values);
CREATE INDEX idx_audit_logs_new_values_gin ON audit.audit_logs USING GIN (new_values);

-- =====================================================
-- 3. USER CONTEXT SETTING MECHANISM
-- =====================================================

-- Function to set current user context for audit tracking
CREATE OR REPLACE FUNCTION audit.set_audit_user_context(
    p_user_id UUID,
    p_user_email VARCHAR(255) DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_session_id VARCHAR(255) DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    -- Set user context variables that can be accessed by triggers
    PERFORM set_config('audit.current_user_id', p_user_id::TEXT, true);
    
    IF p_user_email IS NOT NULL THEN
        PERFORM set_config('audit.current_user_email', p_user_email, true);
    END IF;
    
    IF p_ip_address IS NOT NULL THEN
        PERFORM set_config('audit.current_ip_address', p_ip_address::TEXT, true);
    END IF;
    
    IF p_user_agent IS NOT NULL THEN
        PERFORM set_config('audit.current_user_agent', p_user_agent, true);
    END IF;
    
    IF p_session_id IS NOT NULL THEN
        PERFORM set_config('audit.current_session_id', p_session_id, true);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to clear audit user context
CREATE OR REPLACE FUNCTION audit.clear_audit_user_context()
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('audit.current_user_id', '', true);
    PERFORM set_config('audit.current_user_email', '', true);
    PERFORM set_config('audit.current_ip_address', '', true);
    PERFORM set_config('audit.current_user_agent', '', true);
    PERFORM set_config('audit.current_session_id', '', true);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. GENERIC AUDIT TRIGGER FUNCTION
-- =====================================================

-- Main audit trigger function that can be applied to any table
CREATE OR REPLACE FUNCTION audit.audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    user_info RECORD;
    changed_fields TEXT[] := '{}';
    field_name TEXT;
    old_val TEXT;
    new_val TEXT;
    current_user_id UUID;
    current_user_email VARCHAR(255);
    current_ip_address INET;
    current_user_agent TEXT;
    current_session_id VARCHAR(255);
BEGIN
    -- Get user context from session variables
    BEGIN
        current_user_id := NULLIF(current_setting('audit.current_user_id', true), '')::UUID;
        current_user_email := NULLIF(current_setting('audit.current_user_email', true), '');
        current_ip_address := NULLIF(current_setting('audit.current_ip_address', true), '')::INET;
        current_user_agent := NULLIF(current_setting('audit.current_user_agent', true), '');
        current_session_id := NULLIF(current_setting('audit.current_session_id', true), '');
    EXCEPTION WHEN OTHERS THEN
        -- If context variables are not set, try to get user info from auth context
        current_user_id := NULL;
        current_user_email := NULL;
        current_ip_address := NULL;
        current_user_agent := NULL;
        current_session_id := NULL;
    END;
    
    -- If no user context is set, try to get from auth.uid() (Supabase)
    IF current_user_id IS NULL THEN
        BEGIN
            current_user_id := auth.uid();
        EXCEPTION WHEN OTHERS THEN
            current_user_id := NULL;
        END;
    END IF;
    
    -- Get user email from profiles table if not provided in context
    IF current_user_id IS NOT NULL AND current_user_email IS NULL THEN
        BEGIN
            SELECT email INTO current_user_email 
            FROM profiles 
            WHERE id = current_user_id;
        EXCEPTION WHEN OTHERS THEN
            current_user_email := NULL;
        END;
    END IF;
    
    -- For UPDATE operations, determine which fields have changed
    IF TG_OP = 'UPDATE' THEN
        -- Get all column names for the table
        FOR field_name IN 
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = TG_TABLE_SCHEMA 
            AND table_name = TG_TABLE_NAME
            AND column_name NOT IN ('updated_at', 'created_at') -- Exclude timestamp fields
        LOOP
            -- Compare old and new values
            EXECUTE format('SELECT ($1).%I::TEXT, ($2).%I::TEXT', field_name, field_name) 
            INTO old_val, new_val 
            USING OLD, NEW;
            
            -- Add to changed_fields if values are different
            IF old_val IS DISTINCT FROM new_val THEN
                changed_fields := array_append(changed_fields, field_name);
            END IF;
        END LOOP;
    END IF;
    
    -- Insert audit log record
    INSERT INTO audit.audit_logs (
        table_name,
        record_id,
        action,
        user_id,
        user_email,
        old_values,
        new_values,
        changed_fields,
        ip_address,
        user_agent,
        session_id
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        current_user_id,
        current_user_email,
        CASE 
            WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
            WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD)
            ELSE NULL 
        END,
        CASE 
            WHEN TG_OP = 'INSERT' THEN to_jsonb(NEW)
            WHEN TG_OP = 'UPDATE' THEN to_jsonb(NEW)
            ELSE NULL 
        END,
        changed_fields,
        current_ip_address,
        current_user_agent,
        current_session_id
    );
    
    -- Return the appropriate record
    RETURN COALESCE(NEW, OLD);
    
EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the main operation
    RAISE WARNING 'Audit trigger failed for table %: %', TG_TABLE_NAME, SQLERRM;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. HELPER FUNCTIONS FOR AUDIT MANAGEMENT
-- =====================================================

-- Function to create audit trigger for a specific table
CREATE OR REPLACE FUNCTION audit.create_audit_trigger(table_name TEXT)
RETURNS VOID AS $$
BEGIN
    EXECUTE format('
        CREATE TRIGGER audit_trigger_%s
        AFTER INSERT OR UPDATE OR DELETE ON %s
        FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function();
    ', table_name, table_name);
    
    RAISE NOTICE 'Audit trigger created for table: %', table_name;
END;
$$ LANGUAGE plpgsql;

-- Function to drop audit trigger for a specific table
CREATE OR REPLACE FUNCTION audit.drop_audit_trigger(table_name TEXT)
RETURNS VOID AS $$
BEGIN
    EXECUTE format('DROP TRIGGER IF EXISTS audit_trigger_%s ON %s;', table_name, table_name);
    RAISE NOTICE 'Audit trigger dropped for table: %', table_name;
END;
$$ LANGUAGE plpgsql;

-- Function to get audit statistics
CREATE OR REPLACE FUNCTION audit.get_audit_statistics()
RETURNS TABLE (
    table_name VARCHAR(50),
    total_logs BIGINT,
    insert_count BIGINT,
    update_count BIGINT,
    delete_count BIGINT,
    latest_activity TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.table_name,
        COUNT(*) as total_logs,
        COUNT(*) FILTER (WHERE al.action = 'INSERT') as insert_count,
        COUNT(*) FILTER (WHERE al.action = 'UPDATE') as update_count,
        COUNT(*) FILTER (WHERE al.action = 'DELETE') as delete_count,
        MAX(al.timestamp) as latest_activity
    FROM audit.audit_logs al
    GROUP BY al.table_name
    ORDER BY total_logs DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on audit_logs table
ALTER TABLE audit.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read their own audit logs
CREATE POLICY "Users can view their own audit logs" ON audit.audit_logs
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Allow admins and managers to view all audit logs
CREATE POLICY "Admins and managers can view all audit logs" ON audit.audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- Policy: Only system can insert audit logs (no direct user inserts)
CREATE POLICY "System only can insert audit logs" ON audit.audit_logs
    FOR INSERT
    WITH CHECK (false); -- This prevents direct inserts, only triggers can insert

-- Policy: Prevent updates and deletes (audit logs are immutable)
CREATE POLICY "Audit logs are immutable" ON audit.audit_logs
    FOR UPDATE
    USING (false);

CREATE POLICY "Audit logs cannot be deleted" ON audit.audit_logs
    FOR DELETE
    USING (false);

-- =====================================================
-- 7. COMMENTS AND DOCUMENTATION
-- =====================================================

-- Add comments to document the schema
COMMENT ON TABLE audit.audit_logs IS 'Stores audit trail for all CRUD operations on audited tables';
COMMENT ON COLUMN audit.audit_logs.table_name IS 'Name of the table that was modified';
COMMENT ON COLUMN audit.audit_logs.record_id IS 'ID of the record that was modified';
COMMENT ON COLUMN audit.audit_logs.action IS 'Type of operation: INSERT, UPDATE, or DELETE';
COMMENT ON COLUMN audit.audit_logs.user_id IS 'ID of the user who performed the action';
COMMENT ON COLUMN audit.audit_logs.user_email IS 'Email of the user who performed the action';
COMMENT ON COLUMN audit.audit_logs.old_values IS 'JSON representation of the record before the change';
COMMENT ON COLUMN audit.audit_logs.new_values IS 'JSON representation of the record after the change';
COMMENT ON COLUMN audit.audit_logs.changed_fields IS 'Array of field names that were modified (UPDATE only)';
COMMENT ON COLUMN audit.audit_logs.ip_address IS 'IP address of the user who performed the action';
COMMENT ON COLUMN audit.audit_logs.user_agent IS 'User agent string of the client';
COMMENT ON COLUMN audit.audit_logs.session_id IS 'Session identifier for tracking user sessions';

COMMENT ON FUNCTION audit.audit_trigger_function() IS 'Generic trigger function that logs all CRUD operations';
COMMENT ON FUNCTION audit.set_audit_user_context(UUID, VARCHAR, INET, TEXT, VARCHAR) IS 'Sets user context for audit tracking';
COMMENT ON FUNCTION audit.clear_audit_user_context() IS 'Clears user context variables';
COMMENT ON FUNCTION audit.create_audit_trigger(TEXT) IS 'Creates audit trigger for specified table';
COMMENT ON FUNCTION audit.drop_audit_trigger(TEXT) IS 'Drops audit trigger for specified table';
COMMENT ON FUNCTION audit.get_audit_statistics() IS 'Returns audit statistics by table';

-- =====================================================
-- 8. INITIAL SETUP COMPLETE
-- =====================================================

-- Log successful schema creation
DO $$$
BEGIN
    RAISE NOTICE 'Audit system schema created successfully';
    RAISE NOTICE 'Tables created: audit_logs';
    RAISE NOTICE 'Functions created: audit_trigger_function, set_audit_user_context, clear_audit_user_context, create_audit_trigger, drop_audit_trigger, get_audit_statistics';
    RAISE NOTICE 'Indexes created: 8 performance indexes';
    RAISE NOTICE 'RLS policies created: 5 security policies';
    RAISE NOTICE 'Ready to create audit triggers on target tables';
END $$;