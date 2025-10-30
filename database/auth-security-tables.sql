-- Additional security tables for authentication and user session management
-- These tables support the enhanced login security features

-- Failed login attempts tracking
CREATE TABLE IF NOT EXISTS failed_login_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    client_ip VARCHAR(45) NOT NULL, -- Supports both IPv4 and IPv6
    user_agent TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for failed login attempts
CREATE INDEX IF NOT EXISTS idx_failed_login_email ON failed_login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_failed_login_ip ON failed_login_attempts(client_ip);
CREATE INDEX IF NOT EXISTS idx_failed_login_created_at ON failed_login_attempts(created_at);
CREATE INDEX IF NOT EXISTS idx_failed_login_email_time ON failed_login_attempts(email, created_at);
CREATE INDEX IF NOT EXISTS idx_failed_login_ip_time ON failed_login_attempts(client_ip, created_at);

-- User sessions tracking
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token VARCHAR(255), -- Supabase session token reference
    client_ip VARCHAR(45),
    user_agent TEXT,
    login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    logout_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    device_fingerprint VARCHAR(255), -- For device tracking
    location_info JSONB, -- Geolocation data if available
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for user sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_login_at ON user_sessions(login_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_ip ON user_sessions(client_ip);

-- Extend profiles table with security-related fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login_ip VARCHAR(45);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS failed_login_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS security_questions JSONB;

-- Password history table (to prevent password reuse)
CREATE TABLE IF NOT EXISTS password_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for password history
CREATE INDEX IF NOT EXISTS idx_password_history_user_id ON password_history(user_id);
CREATE INDEX IF NOT EXISTS idx_password_history_created_at ON password_history(created_at);

-- Two-factor authentication tokens
CREATE TABLE IF NOT EXISTS two_factor_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL, -- SHA-256 hash of the token
    token_type VARCHAR(20) NOT NULL DEFAULT 'totp', -- 'totp', 'sms', 'email'
    secret_key VARCHAR(255), -- For TOTP
    backup_codes JSONB, -- Array of backup codes
    is_verified BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for two-factor tokens
CREATE INDEX IF NOT EXISTS idx_two_factor_user_id ON two_factor_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_two_factor_token_hash ON two_factor_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_two_factor_active ON two_factor_tokens(user_id, is_verified);

-- Device trust table for remembering trusted devices
CREATE TABLE IF NOT EXISTS trusted_devices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_fingerprint VARCHAR(255) NOT NULL,
    device_name VARCHAR(255),
    client_ip VARCHAR(45),
    user_agent TEXT,
    trusted_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for trusted devices
CREATE INDEX IF NOT EXISTS idx_trusted_devices_user_id ON trusted_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_fingerprint ON trusted_devices(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_active ON trusted_devices(user_id, is_active, trusted_until);

-- Function to increment login count
CREATE OR REPLACE FUNCTION increment_login_count(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    new_count INTEGER;
BEGIN
    UPDATE profiles 
    SET login_count = COALESCE(login_count, 0) + 1,
        updated_at = NOW()
    WHERE id = user_id
    RETURNING login_count INTO new_count;
    
    RETURN COALESCE(new_count, 1);
END;
$$ LANGUAGE plpgsql;

-- Function to check if account should be locked
CREATE OR REPLACE FUNCTION should_lock_account(check_email VARCHAR, check_ip VARCHAR)
RETURNS TABLE(
    should_lock BOOLEAN,
    reason VARCHAR,
    retry_after INTEGER
) AS $$
DECLARE
    email_attempts INTEGER;
    ip_attempts INTEGER;
    lockout_window TIMESTAMP WITH TIME ZONE;
BEGIN
    lockout_window := NOW() - INTERVAL '30 minutes';
    
    -- Count failed attempts by email
    SELECT COUNT(*) INTO email_attempts
    FROM failed_login_attempts
    WHERE email = check_email 
    AND created_at >= lockout_window;
    
    -- Count failed attempts by IP
    SELECT COUNT(*) INTO ip_attempts
    FROM failed_login_attempts
    WHERE client_ip = check_ip 
    AND created_at >= lockout_window;
    
    -- Check thresholds
    IF email_attempts >= 5 THEN
        RETURN QUERY SELECT TRUE, 'Too many failed attempts for this email'::VARCHAR, 1800; -- 30 minutes
    ELSIF ip_attempts >= 10 THEN
        RETURN QUERY SELECT TRUE, 'Too many failed attempts from this IP'::VARCHAR, 1800; -- 30 minutes
    ELSE
        RETURN QUERY SELECT FALSE, ''::VARCHAR, 0;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old authentication records
CREATE OR REPLACE FUNCTION cleanup_auth_security_tables()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
    temp_count INTEGER;
BEGIN
    -- Clean up old failed login attempts (older than 7 days)
    DELETE FROM failed_login_attempts 
    WHERE created_at < NOW() - INTERVAL '7 days';
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Clean up inactive user sessions (older than 30 days)
    DELETE FROM user_sessions 
    WHERE (logout_at IS NOT NULL AND logout_at < NOW() - INTERVAL '30 days')
    OR (is_active = FALSE AND updated_at < NOW() - INTERVAL '30 days');
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Clean up old password history (keep only last 12 passwords per user)
    DELETE FROM password_history 
    WHERE id NOT IN (
        SELECT id FROM (
            SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
            FROM password_history
        ) ranked
        WHERE rn <= 12
    );
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Clean up expired two-factor tokens
    DELETE FROM two_factor_tokens 
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Clean up expired trusted devices
    DELETE FROM trusted_devices 
    WHERE trusted_until IS NOT NULL AND trusted_until < NOW();
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get authentication security stats
CREATE OR REPLACE FUNCTION get_auth_security_stats(
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '24 hours',
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE(
    metric VARCHAR,
    count BIGINT,
    details JSONB
) AS $$
BEGIN
    -- Failed login attempts
    RETURN QUERY
    SELECT 
        'failed_login_attempts'::VARCHAR,
        COUNT(*)::BIGINT,
        jsonb_build_object(
            'by_email', jsonb_object_agg(email, cnt),
            'by_ip', jsonb_object_agg(client_ip, ip_cnt)
        )
    FROM (
        SELECT email, COUNT(*) as cnt
        FROM failed_login_attempts 
        WHERE created_at BETWEEN start_date AND end_date
        GROUP BY email
        ORDER BY cnt DESC
        LIMIT 10
    ) email_stats,
    (
        SELECT client_ip, COUNT(*) as ip_cnt
        FROM failed_login_attempts 
        WHERE created_at BETWEEN start_date AND end_date
        GROUP BY client_ip
        ORDER BY ip_cnt DESC
        LIMIT 10
    ) ip_stats;
    
    -- Active sessions
    RETURN QUERY
    SELECT 
        'active_sessions'::VARCHAR,
        COUNT(*)::BIGINT,
        jsonb_build_object(
            'total_active', COUNT(*),
            'unique_users', COUNT(DISTINCT user_id),
            'unique_ips', COUNT(DISTINCT client_ip)
        )
    FROM user_sessions 
    WHERE is_active = TRUE
    AND login_at BETWEEN start_date AND end_date;
    
    -- Two-factor usage
    RETURN QUERY
    SELECT 
        'two_factor_stats'::VARCHAR,
        COUNT(*)::BIGINT,
        jsonb_build_object(
            'enabled_users', COUNT(*),
            'by_type', jsonb_object_agg(token_type, type_cnt)
        )
    FROM (
        SELECT token_type, COUNT(*) as type_cnt
        FROM two_factor_tokens 
        WHERE is_verified = TRUE
        GROUP BY token_type
    ) t;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security policies
ALTER TABLE failed_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE two_factor_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE trusted_devices ENABLE ROW LEVEL SECURITY;

-- Policies for failed_login_attempts (admin access only)
CREATE POLICY "Admins can view failed login attempts" ON failed_login_attempts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Policies for user_sessions (users can view their own, admins can view all)
CREATE POLICY "Users can view their own sessions" ON user_sessions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all sessions" ON user_sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Policies for password_history (users can view their own)
CREATE POLICY "Users can view their own password history" ON password_history
    FOR SELECT USING (user_id = auth.uid());

-- Policies for two_factor_tokens (users can manage their own)
CREATE POLICY "Users can manage their own 2FA tokens" ON two_factor_tokens
    FOR ALL USING (user_id = auth.uid());

-- Policies for trusted_devices (users can manage their own)
CREATE POLICY "Users can manage their own trusted devices" ON trusted_devices
    FOR ALL USING (user_id = auth.uid());

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Comments
COMMENT ON TABLE failed_login_attempts IS 'Tracks failed login attempts for security monitoring and account lockout';
COMMENT ON TABLE user_sessions IS 'Tracks active user sessions with device and location information';
COMMENT ON TABLE password_history IS 'Stores password history to prevent password reuse';
COMMENT ON TABLE two_factor_tokens IS 'Manages two-factor authentication tokens and backup codes';
COMMENT ON TABLE trusted_devices IS 'Tracks trusted devices to reduce 2FA prompts';

COMMENT ON FUNCTION increment_login_count(UUID) IS 'Increments the login count for a user';
COMMENT ON FUNCTION should_lock_account(VARCHAR, VARCHAR) IS 'Checks if an account should be locked based on failed attempts';
COMMENT ON FUNCTION cleanup_auth_security_tables() IS 'Cleans up old authentication security records';
COMMENT ON FUNCTION get_auth_security_stats(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) IS 'Provides authentication security statistics';