-- Add billing frequency and due date columns to lofts table
-- This migration adds the missing columns that are causing the database error

-- Add frequency and next due date columns for each utility type
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS frequence_paiement_eau VARCHAR(20);
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS prochaine_echeance_eau DATE;

-- Add energy billing columns
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS frequence_paiement_energie VARCHAR(20);
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS prochaine_echeance_energie DATE;

-- Add telephone billing columns
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS frequence_paiement_telephone VARCHAR(20);
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS prochaine_echeance_telephone DATE;

-- Add internet billing columns
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS frequence_paiement_internet VARCHAR(20);
ALTER TABLE lofts ADD COLUMN IF NOT EXISTS prochaine_echeance_internet DATE;

-- Create indexes for better performance on due date queries
CREATE INDEX IF NOT EXISTS idx_lofts_eau_due_date ON lofts(prochaine_echeance_eau) WHERE prochaine_echeance_eau IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lofts_energie_due_date ON lofts(prochaine_echeance_energie) WHERE prochaine_echeance_energie IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lofts_telephone_due_date ON lofts(prochaine_echeance_telephone) WHERE prochaine_echeance_telephone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lofts_internet_due_date ON lofts(prochaine_echeance_internet) WHERE prochaine_echeance_internet IS NOT NULL;

-- Add comment to document the purpose of these columns
COMMENT ON COLUMN lofts.frequence_paiement_eau IS 'Frequency of water bill payments (monthly, quarterly, etc.)';
COMMENT ON COLUMN lofts.prochaine_echeance_eau IS 'Next due date for water bill payment';
COMMENT ON COLUMN lofts.frequence_paiement_energie IS 'Frequency of energy bill payments (monthly, quarterly, etc.)';
COMMENT ON COLUMN lofts.prochaine_echeance_energie IS 'Next due date for energy bill payment';
COMMENT ON COLUMN lofts.frequence_paiement_telephone IS 'Frequency of telephone bill payments (monthly, quarterly, etc.)';
COMMENT ON COLUMN lofts.prochaine_echeance_telephone IS 'Next due date for telephone bill payment';
COMMENT ON COLUMN lofts.frequence_paiement_internet IS 'Frequency of internet bill payments (monthly, quarterly, etc.)';
COMMENT ON COLUMN lofts.prochaine_echeance_internet IS 'Next due date for internet bill payment';