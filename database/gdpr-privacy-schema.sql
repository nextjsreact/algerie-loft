-- =====================================================
-- GDPR COMPLIANCE AND DATA PRIVACY SCHEMA
-- =====================================================
-- Implements GDPR compliance, data retention, and privacy rights management
-- Requirements: 10.2, 10.3, 10.5

-- =====================================================
-- 1. GDPR CONSENT MANAGEMENT
-- =====================================================

-- Table to track user consent for different data categories
CREATE TABLE IF NOT EXISTS gdpr_consent_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Consent details
    data_category VARCHAR(50) NOT NULL CHECK (data_category IN (
        'personal_identity', 'contact_information', 'financial_data',
        'behavioral_data', 'technical_data', 'special_category'
    )),
    legal_basis VARCHAR(30) NOT NULL CHECK (legal_basis IN (
        'consent', 'contract', 'legal_obligation', 
        'vital_interests', 'public_task', 'legitimate_interests'
    )),
    purpose TEXT NOT NULL,
    
    -- Consent status
    consent_given BOOLEAN NOT NULL DEFAULT false,
    consent_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    withdrawn_date TIMESTAMP WITH TIME ZONE,
    
    -- Consent metadata
    version VARCHAR(10) NOT NULL DEFAULT '1.0',
    ip_address INET,
    user_agent TEXT,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_active_consent UNIQUE (user_id, data_category, consent_given) 
        DEFERRABLE INITIALLY DEFERRED
);

-- =====================================================
-- 2. DATA PROCESSING REGISTRY
-- =====================================================

-- Table to track all data processing activities
CREATE TABLE IF NOT EXISTS gdpr_processing_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Processing details
    data_category VARCHAR(50) NOT NULL CHECK (data_category IN (
        'personal_identity', 'contact_information', 'financial_data',
        'behavioral_data', 'technical_data', 'special_category'
    )),
    legal_basis VARCHAR(30) NOT NULL CHECK (legal_basis IN (
        'consent', 'contract', 'legal_obligation', 
        'vital_interests', 'public_task', 'legitimate_interests'
    )),
    purpose TEXT NOT NULL,
    data_fields TEXT[] NOT NULL,
    
    -- Processing metadata
    processing_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    retention_until TIMESTAMP WITH TIME ZONE NOT NULL,
    encrypted BOOLEAN NOT NULL DEFAULT false,
    source VARCHAR(100) NOT NULL,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. PRIVACY REQUESTS MANAGEMENT
-- =====================================================

-- Table to track privacy rights requests (access, erasure, portability, etc.)
CREATE TABLE IF NOT EXISTS gdpr_privacy_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Request details
    type VARCHAR(20) NOT NULL CHECK (type IN (
        'access', 'rectification', 'erasure', 'portability', 'restriction', 'objection'
    )),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'processing', 'completed', 'rejected'
    )),
    
    -- Request metadata
    request_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completion_date TIMESTAMP WITH TIME ZONE,
    reason TEXT,
    details JSONB,
    
    -- Processing information
    processed_by UUID REFERENCES auth.users(id),
    processing_notes TEXT,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. DATA ERASURE LOG
-- =====================================================

-- Table to track data erasure activities
CREATE TABLE IF NOT EXISTS gdpr_erasure_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    
    -- Erasure details
    erasure_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    reason TEXT NOT NULL,
    method VARCHAR(20) NOT NULL CHECK (method IN ('hard_delete', 'anonymization', 'archival')),
    
    -- Data affected
    tables_affected TEXT[],
    records_affected INTEGER DEFAULT 0,
    
    -- Metadata
    performed_by UUID REFERENCES auth.users(id),
    verification_hash VARCHAR(255),
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. DATA RETENTION POLICIES
-- =====================================================

-- Table to define data retention policies
CREATE TABLE IF NOT EXISTS data_retention_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Policy details
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    data_category VARCHAR(50) NOT NULL CHECK (data_category IN (
        'personal_identity', 'contact_information', 'financial_data',
        'behavioral_data', 'technical_data', 'special_category'
    )),
    
    -- Retention configuration
    retention_period_days INTEGER NOT NULL CHECK (retention_period_days > 0),
    deletion_method VARCHAR(20) NOT NULL CHECK (deletion_method IN (
        'hard_delete', 'soft_delete', 'anonymize', 'archive'
    )),
    
    -- Policy status
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- =====================================================
-- 6. DATA DELETION JOBS
-- =====================================================

-- Table to track automated data deletion jobs
CREATE TABLE IF NOT EXISTS data_deletion_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID NOT NULL REFERENCES data_retention_policies(id) ON DELETE CASCADE,
    
    -- Job details
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'running', 'completed', 'failed'
    )),
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Job results
    records_processed INTEGER DEFAULT 0,
    records_deleted INTEGER DEFAULT 0,
    errors TEXT[],
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. DATA LIFECYCLE EVENTS
-- =====================================================

-- Table to track data lifecycle events
CREATE TABLE IF NOT EXISTS data_lifecycle_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Event details
    data_type VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN (
        'created', 'updated', 'accessed', 'deleted', 'anonymized', 'archived'
    )),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    retention_until TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Event metadata
    metadata JSONB,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 8. PASSWORD SECURITY TABLES
-- =====================================================

-- Table to track password history for reuse prevention
CREATE TABLE IF NOT EXISTS password_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Index for efficient lookups
    CONSTRAINT unique_user_password UNIQUE (user_id, password_hash)
);

-- Table to track account lockouts
CREATE TABLE IF NOT EXISTS account_lockouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier VARCHAR(255) NOT NULL UNIQUE, -- email or user ID
    failed_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    last_attempt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 9. INDEXES FOR PERFORMANCE
-- =====================================================

-- GDPR consent records indexes
CREATE INDEX IF NOT EXISTS idx_gdpr_consent_user_id ON gdpr_consent_records(user_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_consent_category ON gdpr_consent_records(data_category);
CREATE INDEX IF NOT EXISTS idx_gdpr_consent_status ON gdpr_consent_records(consent_given);
CREATE INDEX IF NOT EXISTS idx_gdpr_consent_date ON gdpr_consent_records(consent_date);

-- Processing records indexes
CREATE INDEX IF NOT EXISTS idx_gdpr_processing_user_id ON gdpr_processing_records(user_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_processing_category ON gdpr_processing_records(data_category);
CREATE INDEX IF NOT EXISTS idx_gdpr_processing_retention ON gdpr_processing_records(retention_until);
CREATE INDEX IF NOT EXISTS idx_gdpr_processing_date ON gdpr_processing_records(processing_date);

-- Privacy requests indexes
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_user_id ON gdpr_privacy_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_type ON gdpr_privacy_requests(type);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_status ON gdpr_privacy_requests(status);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_date ON gdpr_privacy_requests(request_date);

-- Retention policies indexes
CREATE INDEX IF NOT EXISTS idx_retention_policies_category ON data_retention_policies(data_category);
CREATE INDEX IF NOT EXISTS idx_retention_policies_active ON data_retention_policies(is_active);

-- Deletion jobs indexes
CREATE INDEX IF NOT EXISTS idx_deletion_jobs_policy ON data_deletion_jobs(policy_id);
CREATE INDEX IF NOT EXISTS idx_deletion_jobs_status ON data_deletion_jobs(status);
CREATE INDEX IF NOT EXISTS idx_deletion_jobs_scheduled ON data_deletion_jobs(scheduled_for);

-- Lifecycle events indexes
CREATE INDEX IF NOT EXISTS idx_lifecycle_events_user_id ON data_lifecycle_events(user_id);
CREATE INDEX IF NOT EXISTS idx_lifecycle_events_type ON data_lifecycle_events(data_type);
CREATE INDEX IF NOT EXISTS idx_lifecycle_events_retention ON data_lifecycle_events(retention_until);
CREATE INDEX IF NOT EXISTS idx_lifecycle_events_timestamp ON data_lifecycle_events(timestamp);

-- Password security indexes
CREATE INDEX IF NOT EXISTS idx_password_history_user_id ON password_history(user_id);
CREATE INDEX IF NOT EXISTS idx_password_history_created_at ON password_history(created_at);
CREATE INDEX IF NOT EXISTS idx_account_lockouts_identifier ON account_lockouts(identifier);
CREATE INDEX IF NOT EXISTS idx_account_lockouts_locked_until ON account_lockouts(locked_until);

-- =====================================================
-- 10. FUNCTIONS FOR GDPR COMPLIANCE
-- =====================================================

-- Function to automatically set retention dates
CREATE OR REPLACE FUNCTION set_retention_date()
RETURNS TRIGGER AS $
DECLARE
    retention_days INTEGER;
BEGIN
    -- Get retention period based on data category
    retention_days := CASE NEW.data_category
        WHEN 'personal_identity' THEN 2555  -- 7 years
        WHEN 'contact_information' THEN 1095  -- 3 years
        WHEN 'financial_data' THEN 2555  -- 7 years
        WHEN 'behavioral_data' THEN 365  -- 1 year
        WHEN 'technical_data' THEN 90  -- 3 months
        WHEN 'special_category' THEN 365  -- 1 year
        ELSE 365  -- Default 1 year
    END;
    
    NEW.retention_until := NEW.processing_date + (retention_days || ' days')::INTERVAL;
    
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Trigger to automatically set retention dates
CREATE TRIGGER set_retention_date_trigger
    BEFORE INSERT ON gdpr_processing_records
    FOR EACH ROW
    EXECUTE FUNCTION set_retention_date();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Triggers for updating timestamps
CREATE TRIGGER update_gdpr_consent_updated_at
    BEFORE UPDATE ON gdpr_consent_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_gdpr_requests_updated_at
    BEFORE UPDATE ON gdpr_privacy_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_retention_policies_updated_at
    BEFORE UPDATE ON data_retention_policies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_account_lockouts_updated_at
    BEFORE UPDATE ON account_lockouts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Function to clean up expired data
CREATE OR REPLACE FUNCTION cleanup_expired_gdpr_data()
RETURNS INTEGER AS $
DECLARE
    deleted_count INTEGER := 0;
    temp_count INTEGER;
BEGIN
    -- Clean up expired processing records
    DELETE FROM gdpr_processing_records 
    WHERE retention_until < NOW();
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Clean up expired lifecycle events
    DELETE FROM data_lifecycle_events 
    WHERE retention_until < NOW();
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Clean up old password history (keep only last 5 per user)
    DELETE FROM password_history 
    WHERE id NOT IN (
        SELECT id FROM (
            SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
            FROM password_history
        ) ranked WHERE rn <= 5
    );
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Clean up expired account lockouts
    DELETE FROM account_lockouts 
    WHERE locked_until IS NOT NULL AND locked_until < NOW();
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    RETURN deleted_count;
END;
$ LANGUAGE plpgsql;

-- =====================================================
-- 11. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all GDPR tables
ALTER TABLE gdpr_consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE gdpr_processing_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE gdpr_privacy_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE gdpr_erasure_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_lockouts ENABLE ROW LEVEL SECURITY;

-- Consent records policies
CREATE POLICY "users_can_view_own_consent" ON gdpr_consent_records
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "users_can_manage_own_consent" ON gdpr_consent_records
    FOR ALL USING (user_id = auth.uid());

-- Processing records policies (read-only for users)
CREATE POLICY "users_can_view_own_processing" ON gdpr_processing_records
    FOR SELECT USING (user_id = auth.uid());

-- Privacy requests policies
CREATE POLICY "users_can_manage_own_requests" ON gdpr_privacy_requests
    FOR ALL USING (user_id = auth.uid());

-- Erasure log policies (read-only)
CREATE POLICY "users_can_view_own_erasure" ON gdpr_erasure_log
    FOR SELECT USING (user_id = auth.uid());

-- Password history policies (system only)
CREATE POLICY "system_only_password_history" ON password_history
    FOR ALL USING (false);

-- Account lockouts policies (system only)
CREATE POLICY "system_only_account_lockouts" ON account_lockouts
    FOR ALL USING (false);

-- Admin policies for all tables
CREATE POLICY "admins_full_access_consent" ON gdpr_consent_records
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "admins_full_access_processing" ON gdpr_processing_records
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "admins_full_access_requests" ON gdpr_privacy_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- 12. DEFAULT RETENTION POLICIES
-- =====================================================

-- Insert default retention policies
INSERT INTO data_retention_policies (name, description, data_category, retention_period_days, deletion_method) VALUES
('Personal Identity Data', 'User profile and identity information', 'personal_identity', 2555, 'anonymize'),
('Contact Information', 'Email addresses, phone numbers, addresses', 'contact_information', 1095, 'anonymize'),
('Financial Data', 'Payment information, transaction records', 'financial_data', 2555, 'archive'),
('Behavioral Data', 'User activity logs, audit trails', 'behavioral_data', 365, 'hard_delete'),
('Technical Data', 'IP addresses, session data, device info', 'technical_data', 90, 'hard_delete'),
('Special Category Data', 'Health, biometric, or sensitive personal data', 'special_category', 365, 'hard_delete')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 13. COMPLETION MESSAGE
-- =====================================================

SELECT 'GDPR Compliance and Data Privacy Schema created successfully! 🔒' as status,
       'Features: Consent management, Processing registry, Privacy requests, Data retention, Password security' as features,
       'Compliance: GDPR Article 6 (Legal basis), Article 7 (Consent), Article 17 (Right to erasure), Article 20 (Data portability)' as compliance,
       'Security: RLS policies, Audit trails, Automated cleanup, Retention policies' as security;
</content>
</file>