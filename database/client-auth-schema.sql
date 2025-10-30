-- =====================================================
-- CLIENT RESERVATION FLOW - AUTHENTICATION SCHEMA
-- =====================================================
-- This script extends the existing customers table with authentication fields
-- for the client reservation flow

-- =====================================================
-- 1. EXTEND EXISTING CUSTOMERS TABLE
-- =====================================================

-- Add authentication fields to existing customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{
    "language": "fr",
    "currency": "DZD",
    "notifications": {
        "email": true,
        "sms": false,
        "marketing": false
    }
}'::jsonb;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP WITH TIME ZONE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- Update phone column to allow longer international numbers
ALTER TABLE customers ALTER COLUMN phone TYPE VARCHAR(50);

-- =====================================================
-- 2. ADDITIONAL INDEXES FOR AUTHENTICATION
-- =====================================================

-- Index for email verification (email index already exists)
CREATE INDEX IF NOT EXISTS idx_customers_email_verification ON customers(email_verification_token) 
WHERE email_verification_token IS NOT NULL;

-- Index for password reset
CREATE INDEX IF NOT EXISTS idx_customers_password_reset ON customers(password_reset_token) 
WHERE password_reset_token IS NOT NULL;

-- Index for login performance
CREATE INDEX IF NOT EXISTS idx_customers_email_verified ON customers(email, email_verified);

-- Index for authentication lookups
CREATE INDEX IF NOT EXISTS idx_customers_password_hash ON customers(password_hash) 
WHERE password_hash IS NOT NULL;

-- =====================================================
-- 3. CUSTOMER SESSIONS TABLE
-- =====================================================

-- JWT sessions tracking for customer authentication
CREATE TABLE IF NOT EXISTS customer_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_agent TEXT,
    ip_address INET
);

-- Index for session lookup
CREATE INDEX IF NOT EXISTS idx_customer_sessions_token ON customer_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_customer_sessions_customer_id ON customer_sessions(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_sessions_expires ON customer_sessions(expires_at);

-- =====================================================
-- 4. TRIGGER FUNCTIONS
-- =====================================================

-- Function to clean expired customer sessions
CREATE OR REPLACE FUNCTION clean_expired_customer_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM customer_sessions 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. ROW LEVEL SECURITY FOR SESSIONS
-- =====================================================

-- Enable RLS for sessions (customers table RLS already enabled)
ALTER TABLE customer_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for customer sessions
CREATE POLICY "Customers can view own sessions" ON customer_sessions
    FOR SELECT USING (customer_id = auth.uid()::uuid);

CREATE POLICY "Customers can delete own sessions" ON customer_sessions
    FOR DELETE USING (customer_id = auth.uid()::uuid);

-- Allow session creation for everyone (needed for login)
CREATE POLICY "Allow session creation" ON customer_sessions
    FOR INSERT WITH CHECK (true);

-- Update existing customers policies to allow self-registration and profile updates
DROP POLICY IF EXISTS "Users can view customers" ON customers;
DROP POLICY IF EXISTS "Users can insert customers" ON customers;
DROP POLICY IF EXISTS "Users can update customers" ON customers;
DROP POLICY IF EXISTS "Users can delete customers" ON customers;

-- New policies for customer self-management
CREATE POLICY "Customers can view own profile" ON customers
    FOR SELECT USING (id = auth.uid()::uuid OR auth.role() = 'authenticated');

CREATE POLICY "Allow customer registration" ON customers
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Customers can update own profile" ON customers
    FOR UPDATE USING (id = auth.uid()::uuid OR auth.role() = 'authenticated');

CREATE POLICY "Admin can manage customers" ON customers
    FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- 6. UTILITY FUNCTIONS
-- =====================================================

-- Function to get customer by email
CREATE OR REPLACE FUNCTION get_customer_by_email(customer_email VARCHAR)
RETURNS customers AS $$
DECLARE
    customer_record customers;
BEGIN
    SELECT * INTO customer_record 
    FROM customers 
    WHERE email = customer_email;
    
    RETURN customer_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create customer session
CREATE OR REPLACE FUNCTION create_customer_session(
    p_customer_id UUID,
    p_token_hash VARCHAR,
    p_expires_at TIMESTAMP WITH TIME ZONE,
    p_user_agent TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    session_id UUID;
BEGIN
    INSERT INTO customer_sessions (
        customer_id, 
        token_hash, 
        expires_at, 
        user_agent, 
        ip_address
    )
    VALUES (
        p_customer_id, 
        p_token_hash, 
        p_expires_at, 
        p_user_agent, 
        p_ip_address
    )
    RETURNING id INTO session_id;
    
    RETURN session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate customer session
CREATE OR REPLACE FUNCTION validate_customer_session(p_token_hash VARCHAR)
RETURNS TABLE(
    customer_id UUID,
    session_id UUID,
    is_valid BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.customer_id,
        s.id as session_id,
        (s.expires_at > NOW()) as is_valid
    FROM customer_sessions s
    WHERE s.token_hash = p_token_hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated users (customers table permissions already exist)
GRANT SELECT, INSERT, DELETE ON customer_sessions TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant permissions to service role for functions
GRANT EXECUTE ON FUNCTION get_customer_by_email(VARCHAR) TO service_role;
GRANT EXECUTE ON FUNCTION create_customer_session(UUID, VARCHAR, TIMESTAMP WITH TIME ZONE, TEXT, INET) TO service_role;
GRANT EXECUTE ON FUNCTION validate_customer_session(VARCHAR) TO service_role;
GRANT EXECUTE ON FUNCTION clean_expired_customer_sessions() TO service_role;

-- =====================================================
-- 8. COMPLETION MESSAGE
-- =====================================================

SELECT 'Customer authentication schema updated successfully! 🎉' as status,
       'Extended: customers table, Created: customer_sessions table' as tables_modified,
       'Features: JWT sessions, email verification, password reset, RLS policies' as features;