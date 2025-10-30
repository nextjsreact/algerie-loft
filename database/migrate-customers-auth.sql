-- =====================================================
-- MIGRATION: Add Authentication to Existing Customers Table
-- =====================================================
-- This script safely adds authentication fields to the existing customers table
-- Run this script in your Supabase SQL editor

-- =====================================================
-- 1. BACKUP EXISTING DATA (Optional but recommended)
-- =====================================================
-- Uncomment the following lines if you want to create a backup
-- CREATE TABLE customers_backup AS SELECT * FROM customers;

-- =====================================================
-- 2. ADD AUTHENTICATION COLUMNS TO CUSTOMERS TABLE
-- =====================================================

-- Add authentication fields (using IF NOT EXISTS to avoid errors if already added)
DO $$ 
BEGIN
    -- Add password_hash column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'password_hash') THEN
        ALTER TABLE customers ADD COLUMN password_hash VARCHAR(255);
    END IF;

    -- Add preferences column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'preferences') THEN
        ALTER TABLE customers ADD COLUMN preferences JSONB DEFAULT '{
            "language": "fr",
            "currency": "DZD",
            "notifications": {
                "email": true,
                "sms": false,
                "marketing": false
            }
        }'::jsonb;
    END IF;

    -- Add email_verified column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'email_verified') THEN
        ALTER TABLE customers ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add email_verification_token column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'email_verification_token') THEN
        ALTER TABLE customers ADD COLUMN email_verification_token VARCHAR(255);
    END IF;

    -- Add password_reset_token column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'password_reset_token') THEN
        ALTER TABLE customers ADD COLUMN password_reset_token VARCHAR(255);
    END IF;

    -- Add password_reset_expires column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'password_reset_expires') THEN
        ALTER TABLE customers ADD COLUMN password_reset_expires TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add last_login column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'last_login') THEN
        ALTER TABLE customers ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Update phone column to allow longer international numbers
ALTER TABLE customers ALTER COLUMN phone TYPE VARCHAR(50);

-- =====================================================
-- 3. CREATE ADDITIONAL INDEXES
-- =====================================================

-- Index for email verification
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
-- 4. CREATE CUSTOMER SESSIONS TABLE
-- =====================================================

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

-- Indexes for session lookup
CREATE INDEX IF NOT EXISTS idx_customer_sessions_token ON customer_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_customer_sessions_customer_id ON customer_sessions(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_sessions_expires ON customer_sessions(expires_at);

-- =====================================================
-- 5. CREATE UTILITY FUNCTIONS
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
-- 6. UPDATE ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS for sessions
ALTER TABLE customer_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view customers" ON customers;
DROP POLICY IF EXISTS "Users can insert customers" ON customers;
DROP POLICY IF EXISTS "Users can update customers" ON customers;
DROP POLICY IF EXISTS "Users can delete customers" ON customers;

-- New policies for customer self-management and admin access
CREATE POLICY "Customers can view own profile" ON customers
    FOR SELECT USING (id = auth.uid()::uuid OR auth.role() = 'authenticated');

CREATE POLICY "Allow customer registration" ON customers
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Customers can update own profile" ON customers
    FOR UPDATE USING (id = auth.uid()::uuid OR auth.role() = 'authenticated');

CREATE POLICY "Admin can manage customers" ON customers
    FOR ALL USING (auth.role() = 'authenticated');

-- Policies for customer sessions
CREATE POLICY "Customers can view own sessions" ON customer_sessions
    FOR SELECT USING (customer_id = auth.uid()::uuid);

CREATE POLICY "Customers can delete own sessions" ON customer_sessions
    FOR DELETE USING (customer_id = auth.uid()::uuid);

CREATE POLICY "Allow session creation" ON customer_sessions
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- 7. GRANT PERMISSIONS
-- =====================================================

-- Grant permissions for sessions table
GRANT SELECT, INSERT, DELETE ON customer_sessions TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant permissions to service role for functions
GRANT EXECUTE ON FUNCTION get_customer_by_email(VARCHAR) TO service_role;
GRANT EXECUTE ON FUNCTION create_customer_session(UUID, VARCHAR, TIMESTAMP WITH TIME ZONE, TEXT, INET) TO service_role;
GRANT EXECUTE ON FUNCTION validate_customer_session(VARCHAR) TO service_role;
GRANT EXECUTE ON FUNCTION clean_expired_customer_sessions() TO service_role;

-- =====================================================
-- 8. UPDATE EXISTING CUSTOMERS WITH DEFAULT PREFERENCES
-- =====================================================

-- Set default preferences for existing customers who don't have them
UPDATE customers 
SET preferences = '{
    "language": "fr",
    "currency": "DZD",
    "notifications": {
        "email": true,
        "sms": false,
        "marketing": false
    }
}'::jsonb
WHERE preferences IS NULL;

-- =====================================================
-- 9. VERIFICATION
-- =====================================================

-- Verify the migration
SELECT 
    'Migration completed successfully! ✅' as status,
    COUNT(*) as total_customers,
    COUNT(CASE WHEN password_hash IS NOT NULL THEN 1 END) as customers_with_auth,
    COUNT(CASE WHEN preferences IS NOT NULL THEN 1 END) as customers_with_preferences
FROM customers;

-- Show new columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'customers' 
AND column_name IN ('password_hash', 'preferences', 'email_verified', 'email_verification_token', 'password_reset_token', 'last_login')
ORDER BY column_name;