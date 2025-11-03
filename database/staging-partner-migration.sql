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

-- ========================================

-- =====================================================
-- PARTNER VALIDATION REQUESTS - DATABASE SCHEMA
-- =====================================================

-- Create partner_validation_requests table
CREATE TABLE IF NOT EXISTS partner_validation_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    
    -- Request Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    
    -- Submitted Data (JSON snapshot of registration data)
    submitted_data JSONB NOT NULL,
    
    -- Admin Processing
    admin_notes TEXT,
    processed_by UUID REFERENCES auth.users(id),
    processed_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_processing_data CHECK (
        (status IN ('approved', 'rejected') AND processed_by IS NOT NULL AND processed_at IS NOT NULL) OR
        (status = 'pending')
    )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_partner_validation_requests_partner_id ON partner_validation_requests(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_validation_requests_status ON partner_validation_requests(status);
CREATE INDEX IF NOT EXISTS idx_partner_validation_requests_created_at ON partner_validation_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_partner_validation_requests_processed_by ON partner_validation_requests(processed_by);

-- Update trigger for partner_validation_requests table
CREATE OR REPLACE FUNCTION update_partner_validation_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_partner_validation_requests_updated_at ON partner_validation_requests;
CREATE TRIGGER trigger_update_partner_validation_requests_updated_at
    BEFORE UPDATE ON partner_validation_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_partner_validation_requests_updated_at();

-- Function to automatically update partner status when validation request is processed
CREATE OR REPLACE FUNCTION sync_partner_status_from_validation()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process when status changes to approved or rejected
    IF NEW.status != OLD.status AND NEW.status IN ('approved', 'rejected') THEN
        UPDATE partners 
        SET 
            verification_status = NEW.status,
            approved_at = CASE WHEN NEW.status = 'approved' THEN NEW.processed_at ELSE NULL END,
            approved_by = CASE WHEN NEW.status = 'approved' THEN NEW.processed_by ELSE NULL END,
            rejected_at = CASE WHEN NEW.status = 'rejected' THEN NEW.processed_at ELSE NULL END,
            rejected_by = CASE WHEN NEW.status = 'rejected' THEN NEW.processed_by ELSE NULL END,
            rejection_reason = CASE WHEN NEW.status = 'rejected' THEN NEW.admin_notes ELSE NULL END,
            updated_at = NOW()
        WHERE id = NEW.partner_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_partner_status_from_validation ON partner_validation_requests;
CREATE TRIGGER trigger_sync_partner_status_from_validation
    AFTER UPDATE ON partner_validation_requests
    FOR EACH ROW
    EXECUTE FUNCTION sync_partner_status_from_validation();

-- Comments for documentation
COMMENT ON TABLE partner_validation_requests IS 'Validation requests for partner registration approval workflow';
COMMENT ON COLUMN partner_validation_requests.status IS 'Request status: pending, approved, rejected';
COMMENT ON COLUMN partner_validation_requests.submitted_data IS 'JSON snapshot of the original registration data';
COMMENT ON COLUMN partner_validation_requests.admin_notes IS 'Admin notes for approval/rejection decision';
COMMENT ON COLUMN partner_validation_requests.processed_by IS 'Admin user who processed the request';
COMMENT ON COLUMN partner_validation_requests.processed_at IS 'Timestamp when the request was processed';