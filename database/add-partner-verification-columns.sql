-- Add missing columns to partner_profiles table for verification workflow

ALTER TABLE partner_profiles 
ADD COLUMN IF NOT EXISTS verification_notes TEXT,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id);

-- Add index for verified_by column
CREATE INDEX IF NOT EXISTS idx_partner_profiles_verified_by ON partner_profiles(verified_by);

-- Add comments for the new columns
COMMENT ON COLUMN partner_profiles.verification_notes IS 'Admin notes during verification process';
COMMENT ON COLUMN partner_profiles.verified_at IS 'Timestamp when partner was verified or rejected';
COMMENT ON COLUMN partner_profiles.verified_by IS 'ID of admin/manager who performed verification';