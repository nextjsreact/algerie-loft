-- Migration: Fix Zone Area Cascade Delete
-- Date: 2026-05-14
-- Description: Change ON DELETE CASCADE to ON DELETE SET NULL for zone_area_id
--              to prevent lofts from being deleted when a zone area is deleted

-- Drop the existing constraint
ALTER TABLE lofts
DROP CONSTRAINT IF EXISTS fk_zone_area;

ALTER TABLE lofts
DROP CONSTRAINT IF EXISTS lofts_zone_area_id_fkey;

-- Add the corrected constraint with ON DELETE SET NULL
ALTER TABLE lofts
ADD CONSTRAINT lofts_zone_area_id_fkey
FOREIGN KEY (zone_area_id) 
REFERENCES zone_areas(id) 
ON DELETE SET NULL;

-- Verify the constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'lofts_zone_area_id_fkey'
    AND table_name = 'lofts'
  ) THEN
    RAISE NOTICE 'SUCCESS: Constraint lofts_zone_area_id_fkey created with ON DELETE SET NULL';
  ELSE
    RAISE EXCEPTION 'FAILED: Constraint lofts_zone_area_id_fkey was not created';
  END IF;
END $$;
