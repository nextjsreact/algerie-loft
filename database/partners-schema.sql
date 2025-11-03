-- =====================================================
-- PARTNER DASHBOARD SYSTEM - DATABASE SCHEMA
-- =====================================================

-- Create partners table
CREATE TABLE IF NOT EXISTS partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Business Information
    business_name TEXT,
    business_type TEXT NOT NULL CHECK (business_type IN ('individual', 'company')),
    tax_id TEXT,
    
    -- Contact Information
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    
    -- Verification Information
    verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected', 'suspended')),
    verification_documents TEXT[] DEFAULT '{}',
    portfolio_description TEXT,
    
    -- Admin Management Fields
    admin_notes TEXT,
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES auth.users(id),
    rejected_at TIMESTAMPTZ,
    rejected_by UUID REFERENCES auth.users(id),
    rejection_reason TEXT,
    
    -- Banking Information
    bank_details JSONB,
    
    -- Activity Tracking
    last_login_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id),
    CONSTRAINT valid_approval_data CHECK (
        (verification_status = 'approved' AND approved_at IS NOT NULL AND approved_by IS NOT NULL) OR
        (verification_status != 'approved')
    ),
    CONSTRAINT valid_rejection_data CHECK (
        (verification_status = 'rejected' AND rejected_at IS NOT NULL AND rejected_by IS NOT NULL AND rejection_reason IS NOT NULL) OR
        (verification_status != 'rejected')
    )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_partners_user_id ON partners(user_id);
CREATE INDEX IF NOT EXISTS idx_partners_verification_status ON partners(verification_status);
CREATE INDEX IF NOT EXISTS idx_partners_created_at ON partners(created_at);
CREATE INDEX IF NOT EXISTS idx_partners_approved_by ON partners(approved_by);
CREATE INDEX IF NOT EXISTS idx_partners_rejected_by ON partners(rejected_by);

-- Add partner_id column to lofts table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lofts' AND column_name = 'partner_id') THEN
        ALTER TABLE lofts ADD COLUMN partner_id UUID REFERENCES partners(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_lofts_partner_id ON lofts(partner_id);
    END IF;
END $$;

-- Update trigger for partners table
CREATE OR REPLACE FUNCTION update_partners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_partners_updated_at ON partners;
CREATE TRIGGER trigger_update_partners_updated_at
    BEFORE UPDATE ON partners
    FOR EACH ROW
    EXECUTE FUNCTION update_partners_updated_at();

-- Comments for documentation
COMMENT ON TABLE partners IS 'Partner profiles for the partner dashboard system';
COMMENT ON COLUMN partners.verification_status IS 'Partner verification status: pending, approved, rejected, suspended';
COMMENT ON COLUMN partners.business_type IS 'Type of business: individual or company';
COMMENT ON COLUMN partners.verification_documents IS 'Array of document URLs for verification';
COMMENT ON COLUMN partners.bank_details IS 'JSON object containing banking information';
COMMENT ON COLUMN partners.last_login_at IS 'Timestamp of last partner login for activity tracking';