-- Add missing columns to archive_policies table if they don't exist

-- Add archived_count column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'archive_policies' 
    AND column_name = 'archived_count'
  ) THEN
    ALTER TABLE archive_policies ADD COLUMN archived_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Add archived_size_mb column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'archive_policies' 
    AND column_name = 'archived_size_mb'
  ) THEN
    ALTER TABLE archive_policies ADD COLUMN archived_size_mb NUMERIC(10, 2) DEFAULT 0;
  END IF;
END $$;

-- Add last_run column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'archive_policies' 
    AND column_name = 'last_run'
  ) THEN
    ALTER TABLE archive_policies ADD COLUMN last_run TIMESTAMPTZ;
  END IF;
END $$;

-- Add next_run column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'archive_policies' 
    AND column_name = 'next_run'
  ) THEN
    ALTER TABLE archive_policies ADD COLUMN next_run TIMESTAMPTZ;
  END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'archive_policies' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE archive_policies ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_archive_policies_enabled ON archive_policies(enabled);
CREATE INDEX IF NOT EXISTS idx_archive_policies_next_run ON archive_policies(next_run) WHERE enabled = true;

-- Verify the structure
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'archive_policies'
ORDER BY ordinal_position;
