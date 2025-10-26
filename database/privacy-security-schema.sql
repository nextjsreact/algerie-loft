-- Privacy and Security Compliance Schema
-- This schema implements GDPR-compliant data handling, cookie consent, and secure payment processing

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Cookie Consent Table
CREATE TABLE IF NOT EXISTS cookie_consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT, -- For anonymous users
    consent_data JSONB NOT NULL,
    ip_address INET,
    user_agent TEXT,
    version TEXT DEFAULT '1.0',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for cookie consents
CREATE INDEX IF NOT EXISTS idx_cookie_consents_user_id ON cookie_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_cookie_consents_session_id ON cookie_consents(session_id);
CREATE INDEX IF NOT EXISTS idx_cookie_consents_created_at ON cookie_consents(created_at);

-- GDPR Data Requests Table
CREATE TABLE IF NOT EXISTS gdpr_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_type TEXT NOT NULL CHECK (request_type IN ('export', 'deletion', 'rectification', 'portability')),
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    reason TEXT NOT NULL,
    data_categories TEXT[] DEFAULT '{}',
    verification_method TEXT NOT NULL CHECK (verification_method IN ('email', 'phone', 'document')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
    ip_address INET,
    verification_token TEXT,
    verified_at TIMESTAMPTZ,
    processed_at TIMESTAMPTZ,
    processor_id UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for GDPR requests
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_email ON gdpr_requests(email);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_status ON gdpr_requests(status);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_created_at ON gdpr_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_request_type ON gdpr_requests(request_type);

-- Privacy Settings Table
CREATE TABLE IF NOT EXISTS privacy_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    settings JSONB NOT NULL DEFAULT '{
        "dataProcessing": {
            "essential": true,
            "analytics": false,
            "marketing": false,
            "profiling": false
        },
        "communications": {
            "email": true,
            "sms": false,
            "push": false,
            "phone": false
        },
        "dataRetention": {
            "bookingHistory": "3years",
            "communicationLogs": "1year",
            "analyticsData": "6months"
        },
        "dataSharing": {
            "partners": false,
            "analytics": false,
            "marketing": false
        }
    }',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for privacy settings
CREATE INDEX IF NOT EXISTS idx_privacy_settings_user_id ON privacy_settings(user_id);

-- Secure Payments Table (PCI DSS Compliant)
CREATE TABLE IF NOT EXISTS secure_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    booking_id UUID, -- Reference to booking/reservation
    payment_token TEXT UNIQUE NOT NULL, -- Secure token for payment
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL CHECK (currency IN ('DZD', 'EUR', 'USD')),
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    transaction_id TEXT, -- External payment processor transaction ID
    encrypted_data JSONB, -- Encrypted sensitive payment data
    client_ip INET,
    user_agent TEXT,
    session_id TEXT,
    gateway_response JSONB, -- Response from payment gateway
    processed_at TIMESTAMPTZ,
    archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for secure payments
CREATE INDEX IF NOT EXISTS idx_secure_payments_user_id ON secure_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_secure_payments_booking_id ON secure_payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_secure_payments_status ON secure_payments(status);
CREATE INDEX IF NOT EXISTS idx_secure_payments_created_at ON secure_payments(created_at);
CREATE INDEX IF NOT EXISTS idx_secure_payments_payment_token ON secure_payments(payment_token);

-- Payment Tokens Table (for tokenization)
CREATE TABLE IF NOT EXISTS payment_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token TEXT UNIQUE NOT NULL,
    value_hash TEXT NOT NULL, -- SHA-256 hash of original value
    token_type TEXT DEFAULT 'payment' CHECK (token_type IN ('payment', 'card', 'account')),
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for payment tokens
CREATE INDEX IF NOT EXISTS idx_payment_tokens_token ON payment_tokens(token);
CREATE INDEX IF NOT EXISTS idx_payment_tokens_expires_at ON payment_tokens(expires_at);

-- Data Breaches Table (for incident tracking)
CREATE TABLE IF NOT EXISTS data_breaches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id TEXT UNIQUE NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    affected_data_types TEXT[] NOT NULL,
    affected_users INTEGER DEFAULT 0,
    discovered_at TIMESTAMPTZ NOT NULL,
    contained_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    description TEXT NOT NULL,
    mitigation_steps TEXT[] DEFAULT '{}',
    notification_required BOOLEAN DEFAULT FALSE,
    regulatory_reported BOOLEAN DEFAULT FALSE,
    reported_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for data breaches
CREATE INDEX IF NOT EXISTS idx_data_breaches_incident_id ON data_breaches(incident_id);
CREATE INDEX IF NOT EXISTS idx_data_breaches_severity ON data_breaches(severity);
CREATE INDEX IF NOT EXISTS idx_data_breaches_discovered_at ON data_breaches(discovered_at);

-- Audit Log for Privacy Actions
CREATE TABLE IF NOT EXISTS privacy_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL CHECK (action_type IN (
        'consent_given', 'consent_withdrawn', 'data_exported', 'data_deleted', 
        'settings_updated', 'gdpr_request', 'payment_processed'
    )),
    entity_type TEXT NOT NULL,
    entity_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for privacy audit log
CREATE INDEX IF NOT EXISTS idx_privacy_audit_log_user_id ON privacy_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_privacy_audit_log_action_type ON privacy_audit_log(action_type);
CREATE INDEX IF NOT EXISTS idx_privacy_audit_log_created_at ON privacy_audit_log(created_at);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE cookie_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE gdpr_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE secure_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_breaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_audit_log ENABLE ROW LEVEL SECURITY;

-- Cookie Consents Policies
CREATE POLICY "Users can view their own cookie consents" ON cookie_consents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cookie consents" ON cookie_consents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all cookie consents" ON cookie_consents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'manager')
        )
    );

-- Privacy Settings Policies
CREATE POLICY "Users can view their own privacy settings" ON privacy_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own privacy settings" ON privacy_settings
    FOR ALL USING (auth.uid() = user_id);

-- Secure Payments Policies
CREATE POLICY "Users can view their own payments" ON secure_payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments" ON secure_payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all payments" ON secure_payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'manager')
        )
    );

-- GDPR Requests Policies (Admin only for viewing)
CREATE POLICY "Admins can view all GDPR requests" ON gdpr_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Admins can update GDPR requests" ON gdpr_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'manager')
        )
    );

-- Data Breaches Policies (Admin only)
CREATE POLICY "Admins can manage data breaches" ON data_breaches
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Privacy Audit Log Policies
CREATE POLICY "Users can view their own privacy audit log" ON privacy_audit_log
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all privacy audit logs" ON privacy_audit_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'manager')
        )
    );

-- Functions for Privacy Compliance

-- Function to automatically delete expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM payment_tokens 
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to anonymize user data
CREATE OR REPLACE FUNCTION anonymize_user_data(target_user_id UUID)
RETURNS void AS $$
BEGIN
    -- Update profile with anonymized data
    UPDATE profiles 
    SET 
        email = 'anonymized_' || extract(epoch from now()) || '@example.com',
        name = 'Anonymized User',
        phone = NULL,
        updated_at = NOW()
    WHERE id = target_user_id;
    
    -- Log the anonymization
    INSERT INTO privacy_audit_log (
        user_id, action_type, entity_type, entity_id, details
    ) VALUES (
        target_user_id, 'data_deleted', 'profile', target_user_id,
        '{"action": "anonymization", "reason": "data_retention_policy"}'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log privacy actions
CREATE OR REPLACE FUNCTION log_privacy_action(
    p_user_id UUID,
    p_action_type TEXT,
    p_entity_type TEXT,
    p_entity_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO privacy_audit_log (
        user_id, action_type, entity_type, entity_id, details, ip_address, user_agent
    ) VALUES (
        p_user_id, p_action_type, p_entity_type, p_entity_id, p_details, p_ip_address, p_user_agent
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for automatic audit logging

-- Trigger for cookie consent changes
CREATE OR REPLACE FUNCTION trigger_cookie_consent_audit()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM log_privacy_action(
        NEW.user_id,
        'consent_given',
        'cookie_consent',
        NEW.id,
        jsonb_build_object('consent_data', NEW.consent_data),
        NEW.ip_address::INET,
        NEW.user_agent
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cookie_consent_audit_trigger
    AFTER INSERT ON cookie_consents
    FOR EACH ROW EXECUTE FUNCTION trigger_cookie_consent_audit();

-- Trigger for privacy settings changes
CREATE OR REPLACE FUNCTION trigger_privacy_settings_audit()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM log_privacy_action(
        NEW.user_id,
        'settings_updated',
        'privacy_settings',
        NEW.id,
        jsonb_build_object('settings', NEW.settings)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER privacy_settings_audit_trigger
    AFTER INSERT OR UPDATE ON privacy_settings
    FOR EACH ROW EXECUTE FUNCTION trigger_privacy_settings_audit();

-- Trigger for payment processing
CREATE OR REPLACE FUNCTION trigger_payment_audit()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM log_privacy_action(
        NEW.user_id,
        'payment_processed',
        'secure_payment',
        NEW.id,
        jsonb_build_object(
            'amount', NEW.amount,
            'currency', NEW.currency,
            'status', NEW.status
        ),
        NEW.client_ip::INET,
        NEW.user_agent
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_audit_trigger
    AFTER INSERT OR UPDATE ON secure_payments
    FOR EACH ROW EXECUTE FUNCTION trigger_payment_audit();

-- Scheduled job to cleanup expired data (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-expired-tokens', '0 2 * * *', 'SELECT cleanup_expired_tokens();');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Comments for documentation
COMMENT ON TABLE cookie_consents IS 'Stores user cookie consent preferences for GDPR compliance';
COMMENT ON TABLE gdpr_requests IS 'Tracks GDPR data subject requests (export, deletion, etc.)';
COMMENT ON TABLE privacy_settings IS 'User privacy preferences and data processing settings';
COMMENT ON TABLE secure_payments IS 'PCI DSS compliant payment processing records';
COMMENT ON TABLE payment_tokens IS 'Tokenized payment data for security';
COMMENT ON TABLE data_breaches IS 'Data breach incident tracking for regulatory compliance';
COMMENT ON TABLE privacy_audit_log IS 'Audit trail for all privacy-related actions';

COMMENT ON FUNCTION cleanup_expired_tokens() IS 'Removes expired payment tokens for security';
COMMENT ON FUNCTION anonymize_user_data(UUID) IS 'Anonymizes user data for GDPR compliance';
COMMENT ON FUNCTION log_privacy_action(UUID, TEXT, TEXT, UUID, JSONB, INET, TEXT) IS 'Logs privacy actions for audit trail';