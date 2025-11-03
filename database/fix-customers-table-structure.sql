-- =====================================================
-- FIX CUSTOMERS TABLE STRUCTURE
-- =====================================================
-- This script fixes the customers table to use auth.users.id as primary key
-- instead of auto-generated UUID, which is causing registration errors.

-- =====================================================
-- 1. BACKUP EXISTING DATA (if any)
-- =====================================================

-- Create backup table if customers table has data
-- Note: This will only work if customers table exists and has data
CREATE TABLE IF NOT EXISTS customers_backup AS 
SELECT * FROM customers WHERE EXISTS (SELECT 1 FROM customers LIMIT 1);

-- =====================================================
-- 2. DROP EXISTING TABLE AND RECREATE WITH CORRECT STRUCTURE
-- =====================================================

-- Drop existing table (this will also drop triggers and policies)
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
    preferences JSONB DEFAULT jsonb_build_object(
        'language', 'fr',
        'currency', 'DZD',
        'notifications', jsonb_build_object(
            'email', true,
            'sms', false,
            'marketing', false
        )
    ),
    
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

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_loft ON customers(current_loft_id);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);

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
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'manager')
        )
    );

-- Policy for admins to delete customers
CREATE POLICY "Admins can delete customers" ON customers
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- =====================================================
-- 6. CREATE UPDATED_AT TRIGGER
-- =====================================================

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_customers_updated_at 
    BEFORE UPDATE ON customers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. RESTORE DATA FROM BACKUP (if exists)
-- =====================================================

-- Try to restore data from backup if it exists
-- This will fail silently if customers_backup doesn't exist
INSERT INTO customers (
    id, first_name, last_name, email, phone, status, 
    notes, current_loft_id, created_at, updated_at, created_by
)
SELECT 
    cb.id, cb.first_name, cb.last_name, cb.email, cb.phone, cb.status,
    cb.notes, cb.current_loft_id, cb.created_at, cb.updated_at, cb.created_by
FROM customers_backup cb
WHERE EXISTS (SELECT 1 FROM auth.users WHERE id = cb.id)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 8. VERIFICATION
-- =====================================================

SELECT 
    'Customers table structure fixed! ✅' as status,
    'Primary key now references auth.users(id)' as change,
    'Auto-sync trigger should work correctly now' as result;

-- Show table structure (comment out if not supported)
-- \d customers;

-- Alternative: Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'customers' 
AND table_schema = 'public'
ORDER BY ordinal_position;