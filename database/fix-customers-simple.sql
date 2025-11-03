-- =====================================================
-- SIMPLE FIX FOR CUSTOMERS TABLE - SUPABASE COMPATIBLE
-- =====================================================
-- This is a simplified version that works reliably in Supabase SQL Editor

-- =====================================================
-- 1. BACKUP EXISTING DATA (manual step if needed)
-- =====================================================
-- If you have existing customer data, run this first:
-- CREATE TABLE customers_backup AS SELECT * FROM customers;

-- =====================================================
-- 2. DROP AND RECREATE CUSTOMERS TABLE
-- =====================================================

-- Drop existing table
DROP TABLE IF EXISTS customers CASCADE;

-- Create customers table with correct structure
CREATE TABLE customers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Personal information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    
    -- Status and verification
    status VARCHAR(20) DEFAULT 'prospect' CHECK (status IN ('prospect', 'active', 'former')),
    email_verified BOOLEAN DEFAULT false,
    
    -- Client preferences (JSON)
    preferences JSONB DEFAULT '{"language": "fr", "currency": "DZD", "notifications": {"email": true, "sms": false, "marketing": false}}',
    
    -- Notes and relationships
    notes TEXT,
    current_loft_id UUID REFERENCES lofts(id),
    
    -- Login tracking
    last_login TIMESTAMP WITH TIME ZONE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- =====================================================
-- 3. CREATE INDEXES
-- =====================================================

CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_loft ON customers(current_loft_id);
CREATE INDEX idx_customers_name ON customers(first_name, last_name);
CREATE INDEX idx_customers_created_at ON customers(created_at);

-- =====================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. CREATE RLS POLICIES
-- =====================================================

-- Policy for authenticated users to view customers
CREATE POLICY "Authenticated users can view customers" ON customers
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for authenticated users to insert customers
CREATE POLICY "Authenticated users can insert customers" ON customers
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy for users to update their own customer record
CREATE POLICY "Users can update own customer record" ON customers
    FOR UPDATE USING (
        auth.uid() = id OR 
        auth.role() = 'service_role'
    );

-- Policy for service role to delete customers
CREATE POLICY "Service role can delete customers" ON customers
    FOR DELETE USING (auth.role() = 'service_role');

-- =====================================================
-- 6. CREATE UPDATED_AT TRIGGER
-- =====================================================

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_customers_updated_at 
    BEFORE UPDATE ON customers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. VERIFICATION
-- =====================================================

SELECT 'Customers table recreated successfully! ✅' as status;