-- GDPR Compliance Database Schema
-- This file contains tables and functions for GDPR compliance management

-- =====================================================
-- 1. GDPR DELETION REQUESTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS gdpr_deletion_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    requested_by UUID REFERENCES auth.users(id),
    reason TEXT NOT NULL,
    deletion_type TEXT CHECK (deletion_type IN ('soft', 'hard')) DEFAULT 'soft',
    retain_financial_records BOOLEAN DEFAULT true,
    retain_audit_logs BOOLEAN DEFAULT true,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'completed')) DEFAULT 'pending',
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES auth.users(id),
    executed_at TIMESTAMP WITH TIME ZONE,
    executed_by UUID REFERENCES auth.users(id),
    rejection_reason TEXT,
    deletion_summary JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_gdpr_deletion_requests_user_id ON gdpr_deletion_requests(user_id);
CREATE INDEX idx_gdpr_deletion_requests_status ON gdpr_deletion_requests(status);
CREATE INDEX idx_gdpr_deletion_requests_requested_at ON gdpr_deletion_requests(requested_at);

-- =====================================================
-- 2. USER CONSENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS user_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    consent_type TEXT CHECK (consent_type IN ('data_processing', 'marketing', 'analytics', 'cookies')) NOT NULL,
    consent_given BOOLEAN NOT NULL,
    consent_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    consent_version TEXT NOT NULL DEFAULT '1.0',
    ip_address INET,
    user_agent TEXT,
    withdrawn_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, consent_type)
);

-- Create indexes for performance
CREATE INDEX idx_user_consents_user_id ON user_consents(user_id);
CREATE INDEX idx_user_consents_type ON user_consents(consent_type);
CREATE INDEX idx_user_consents_date ON user_consents(consent_date);

-- =====================================================
-- 3. GDPR ACTIVITIES LOG TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS gdpr_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT CHECK (activity_type IN ('data_export', 'deletion_request', 'deletion_executed', 'consent_recorded', 'data_access')) NOT NULL,
    requested_by UUID REFERENCES auth.users(id),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_gdpr_activities_user_id ON gdpr_activities(user_id);
CREATE INDEX idx_gdpr_activities_type ON gdpr_activities(activity_type);
CREATE INDEX idx_gdpr_activities_date ON gdpr_activities(created_at);

-- =====================================================
-- 4. DATA RETENTION POLICIES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS data_retention_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    retention_period_days INTEGER NOT NULL,
    policy_type TEXT CHECK (policy_type IN ('legal_requirement', 'business_need', 'user_consent')) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(table_name)
);

-- Insert default retention policies
INSERT INTO data_retention_policies (table_name, retention_period_days, policy_type, description) VALUES
('audit_logs', 2555, 'legal_requirement', 'Audit logs must be retained for 7 years for compliance'),
('bookings', 2555, 'legal_requirement', 'Booking records must be retained for 7 years for tax purposes'),
('transactions', 2555, 'legal_requirement', 'Financial transactions must be retained for 7 years'),
('user_consents', 2555, 'legal_requirement', 'Consent records must be retained for 7 years'),
('gdpr_activities', 2555, 'legal_requirement', 'GDPR activity logs must be retained for 7 years'),
('notifications', 365, 'business_need', 'Notifications can be deleted after 1 year'),
('booking_messages', 1095, 'business_need', 'Messages can be deleted after 3 years'),
('loft_reviews', 1825, 'business_need', 'Reviews can be deleted after 5 years')
ON CONFLICT (table_name) DO NOTHING;

-- =====================================================
-- 5. GDPR COMPLIANCE FUNCTIONS
-- =====================================================

-- Function to check if user data can be deleted
CREATE OR REPLACE FUNCTION gdpr.can_delete_user_data(
    p_user_id UUID
)
RETURNS TABLE (
    can_delete BOOLEAN,
    blocking_reasons TEXT[],
    retention_requirements JSONB
) AS $
DECLARE
    active_bookings INTEGER;
    pending_transactions INTEGER;
    legal_holds TEXT[] := '{}';
    retention_info JSONB := '{}';
BEGIN
    -- Check for active bookings
    SELECT COUNT(*) INTO active_bookings
    FROM bookings
    WHERE (client_id = p_user_id OR partner_id = p_user_id)
      AND status IN ('confirmed', 'pending')
      AND check_out >= CURRENT_DATE;

    IF active_bookings > 0 THEN
        legal_holds := array_append(legal_holds, format('User has %s active bookings', active_bookings));
    END IF;

    -- Check for pending financial transactions
    SELECT COUNT(*) INTO pending_transactions
    FROM transactions t
    JOIN bookings b ON t.loft_id = b.loft_id
    WHERE (b.client_id = p_user_id OR b.partner_id = p_user_id)
      AND t.status = 'pending';

    IF pending_transactions > 0 THEN
        legal_holds := array_append(legal_holds, format('User has %s pending transactions', pending_transactions));
    END IF;

    -- Check retention requirements
    SELECT jsonb_object_agg(
        table_name,
        jsonb_build_object(
            'retention_days', retention_period_days,
            'policy_type', policy_type,
            'description', description
        )
    ) INTO retention_info
    FROM data_retention_policies
    WHERE is_active = true;

    RETURN QUERY SELECT 
        (array_length(legal_holds, 1) IS NULL) as can_delete,
        legal_holds as blocking_reasons,
        retention_info as retention_requirements;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to anonymize user data (soft deletion)
CREATE OR REPLACE FUNCTION gdpr.anonymize_user_data(
    p_user_id UUID,
    p_executed_by UUID
)
RETURNS JSONB AS $
DECLARE
    anonymized_records JSONB := '{}';
    record_count INTEGER;
BEGIN
    -- Anonymize profile
    UPDATE profiles
    SET 
        full_name = 'Anonymized User',
        email = 'anonymized_' || p_user_id || '@deleted.local',
        avatar_url = NULL,
        phone = NULL,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    GET DIAGNOSTICS record_count = ROW_COUNT;
    anonymized_records := jsonb_set(anonymized_records, '{profiles}', to_jsonb(record_count));

    -- Anonymize partner profile if exists
    UPDATE partner_profiles
    SET 
        business_name = 'Anonymized Business',
        tax_id = NULL,
        address = 'Anonymized Address',
        phone = 'Anonymized Phone',
        bank_details = '{}',
        verification_documents = '{}',
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    GET DIAGNOSTICS record_count = ROW_COUNT;
    anonymized_records := jsonb_set(anonymized_records, '{partner_profiles}', to_jsonb(record_count));

    -- Anonymize booking messages
    UPDATE booking_messages
    SET 
        message = 'Message deleted for privacy',
        attachment_url = NULL,
        updated_at = NOW()
    WHERE sender_id = p_user_id;
    
    GET DIAGNOSTICS record_count = ROW_COUNT;
    anonymized_records := jsonb_set(anonymized_records, '{booking_messages}', to_jsonb(record_count));

    -- Anonymize reviews
    UPDATE loft_reviews
    SET 
        review_text = 'Review deleted for privacy',
        updated_at = NOW()
    WHERE client_id = p_user_id;
    
    GET DIAGNOSTICS record_count = ROW_COUNT;
    anonymized_records := jsonb_set(anonymized_records, '{loft_reviews}', to_jsonb(record_count));

    -- Log the anonymization
    INSERT INTO gdpr_activities (user_id, activity_type, requested_by, details)
    VALUES (p_user_id, 'deletion_executed', p_executed_by, anonymized_records);

    RETURN anonymized_records;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get GDPR compliance status for a user
CREATE OR REPLACE FUNCTION gdpr.get_user_compliance_status(
    p_user_id UUID
)
RETURNS TABLE (
    user_id UUID,
    has_active_consents BOOLEAN,
    last_consent_date TIMESTAMP WITH TIME ZONE,
    pending_deletion_requests INTEGER,
    data_export_requests INTEGER,
    can_be_deleted BOOLEAN,
    retention_requirements JSONB
) AS $
DECLARE
    consent_count INTEGER;
    last_consent TIMESTAMP WITH TIME ZONE;
    pending_deletions INTEGER;
    export_count INTEGER;
    deletion_check RECORD;
BEGIN
    -- Check consents
    SELECT COUNT(*), MAX(consent_date)
    INTO consent_count, last_consent
    FROM user_consents
    WHERE user_id = p_user_id AND consent_given = true;

    -- Check pending deletion requests
    SELECT COUNT(*) INTO pending_deletions
    FROM gdpr_deletion_requests
    WHERE user_id = p_user_id AND status = 'pending';

    -- Check data export requests
    SELECT COUNT(*) INTO export_count
    FROM gdpr_activities
    WHERE user_id = p_user_id AND activity_type = 'data_export';

    -- Check if user can be deleted
    SELECT * INTO deletion_check
    FROM gdpr.can_delete_user_data(p_user_id);

    RETURN QUERY SELECT
        p_user_id,
        (consent_count > 0) as has_active_consents,
        last_consent,
        pending_deletions,
        export_count,
        deletion_check.can_delete,
        deletion_check.retention_requirements;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on GDPR tables
ALTER TABLE gdpr_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE gdpr_activities ENABLE ROW LEVEL SECURITY;

-- Policies for gdpr_deletion_requests
CREATE POLICY "Users can view their own deletion requests" ON gdpr_deletion_requests
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own deletion requests" ON gdpr_deletion_requests
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all deletion requests" ON gdpr_deletion_requests
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- Policies for user_consents
CREATE POLICY "Users can manage their own consents" ON user_consents
    FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all consents" ON user_consents
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- Policies for gdpr_activities
CREATE POLICY "Users can view their own GDPR activities" ON gdpr_activities
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert GDPR activities" ON gdpr_activities
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admins can view all GDPR activities" ON gdpr_activities
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- =====================================================
-- 7. GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION gdpr.can_delete_user_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION gdpr.get_user_compliance_status(UUID) TO authenticated;

-- Grant execute permissions for admin functions
GRANT EXECUTE ON FUNCTION gdpr.anonymize_user_data(UUID, UUID) TO authenticated;

-- =====================================================
-- 8. COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON TABLE gdpr_deletion_requests IS 'Stores user data deletion requests for GDPR compliance';
COMMENT ON TABLE user_consents IS 'Stores user consent records for various data processing activities';
COMMENT ON TABLE gdpr_activities IS 'Logs all GDPR-related activities for audit purposes';
COMMENT ON TABLE data_retention_policies IS 'Defines data retention policies for different types of data';

COMMENT ON FUNCTION gdpr.can_delete_user_data(UUID) IS 'Checks if user data can be safely deleted considering legal requirements';
COMMENT ON FUNCTION gdpr.anonymize_user_data(UUID, UUID) IS 'Anonymizes user data for soft deletion (GDPR compliance)';
COMMENT ON FUNCTION gdpr.get_user_compliance_status(UUID) IS 'Returns comprehensive GDPR compliance status for a user';

-- Log successful schema creation
DO $$
BEGIN
    RAISE NOTICE 'GDPR compliance schema created successfully';
    RAISE NOTICE 'Tables created: gdpr_deletion_requests, user_consents, gdpr_activities, data_retention_policies';
    RAISE NOTICE 'Functions created: can_delete_user_data, anonymize_user_data, get_user_compliance_status';
    RAISE NOTICE 'RLS policies applied to all GDPR tables';
END $$;