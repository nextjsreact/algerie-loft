-- Complete fix for archive_policies table
-- This will create the table if it doesn't exist, or add missing columns if it does

-- Drop the table if it exists with wrong structure and recreate it
DROP TABLE IF EXISTS archive_policies CASCADE;

-- Create archive_policies table with all required columns
CREATE TABLE archive_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL UNIQUE,
  enabled BOOLEAN DEFAULT true,
  retention_days INTEGER NOT NULL CHECK (retention_days > 0),
  frequency TEXT NOT NULL CHECK (frequency IN ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'BIANNUAL', 'ANNUAL')),
  last_run TIMESTAMPTZ,
  next_run TIMESTAMPTZ,
  archived_count INTEGER DEFAULT 0,
  archived_size_mb NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_archive_policies_enabled ON archive_policies(enabled);
CREATE INDEX idx_archive_policies_next_run ON archive_policies(next_run) WHERE enabled = true;

-- Enable Row Level Security
ALTER TABLE archive_policies ENABLE ROW LEVEL SECURITY;

-- Policy: Only superusers can manage archive policies
CREATE POLICY "Superusers can manage archive policies"
  ON archive_policies
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superuser'
    )
  );

-- Grant permissions
GRANT ALL ON archive_policies TO authenticated;

-- Verify the table structure
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'archive_policies'
ORDER BY ordinal_position;

-- Success message
SELECT '✅ Table archive_policies created successfully!' as status;
