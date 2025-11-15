-- Add portfolio_description column to partner_profiles table
-- This column stores the partner's description of their business and properties

ALTER TABLE partner_profiles 
ADD COLUMN IF NOT EXISTS portfolio_description TEXT;

-- Add comment for documentation
COMMENT ON COLUMN partner_profiles.portfolio_description IS 'Description of the partner business and property portfolio';
