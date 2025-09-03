-- Add missing column to bills table
ALTER TABLE bills ADD COLUMN prochaine_echeance_energie TIMESTAMP;
