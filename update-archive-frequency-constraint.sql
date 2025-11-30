-- Update frequency constraint to include new frequencies

-- Drop the old constraint
ALTER TABLE archive_policies DROP CONSTRAINT IF EXISTS archive_policies_frequency_check;

-- Add new constraint with all frequencies
ALTER TABLE archive_policies ADD CONSTRAINT archive_policies_frequency_check 
  CHECK (frequency IN ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'BIANNUAL', 'ANNUAL'));

-- Verify
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'archive_policies'::regclass
AND conname LIKE '%frequency%';

SELECT '✅ Frequency constraint updated successfully!' as status;
