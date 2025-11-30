-- Safe fix for archive_policies table - Preserves existing data

-- Step 1: Check if table exists
DO $$ 
BEGIN
  -- If table doesn't exist, create it
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'archive_policies') THEN
    CREATE TABLE archive_policies (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      table_name TEXT NOT NULL UNIQUE,
      enabled BOOLEAN DEFAULT true,
      retention_days INTEGER NOT NULL CHECK (retention_days > 0),
      frequency TEXT NOT NULL CHECK (frequency IN ('DAILY', 'WEEKLY', 'MONTHLY')),
      last_run TIMESTAMPTZ,
      next_run TIMESTAMPTZ,
      archived_count INTEGER DEFAULT 0,
      archived_size_mb NUMERIC(10, 2) DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    RAISE NOTICE 'Table archive_policies created';
  ELSE
    RAISE NOTICE 'Table archive_policies already exists, adding missing columns...';
  END IF;
END $$;

-- Step 2: Add missing columns one by one (safe if table exists)
DO $$ 
BEGIN
  -- Add id column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'archive_policies' AND column_name = 'id') THEN
    ALTER TABLE archive_policies ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();
  END IF;

  -- Add table_name column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'archive_policies' AND column_name = 'table_name') THEN
    ALTER TABLE archive_policies ADD COLUMN table_name TEXT NOT NULL UNIQUE;
  END IF;

  -- Add enabled column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'archive_policies' AND column_name = 'enabled') THEN
    ALTER TABLE archive_policies ADD COLUMN enabled BOOLEAN DEFAULT true;
  END IF;

  -- Add retention_days column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'archive_policies' AND column_name = 'retention_days') THEN
    ALTER TABLE archive_policies ADD COLUMN retention_days INTEGER NOT NULL DEFAULT 90 CHECK (retention_days > 0);
  END IF;

  -- Add frequency column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'archive_policies' AND column_name = 'frequency') THEN
    ALTER TABLE archive_policies ADD COLUMN frequency TEXT NOT NULL DEFAULT 'WEEKLY' CHECK (frequency IN ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'BIANNUAL', 'ANNUAL'));
  END IF;

  -- Add last_run column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'archive_policies' AND column_name = 'last_run') THEN
    ALTER TABLE archive_policies ADD COLUMN last_run TIMESTAMPTZ;
  END IF;

  -- Add next_run column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'archive_policies' AND column_name = 'next_run') THEN
    ALTER TABLE archive_policies ADD COLUMN next_run TIMESTAMPTZ;
  END IF;

  -- Add archived_count column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'archive_policies' AND column_name = 'archived_count') THEN
    ALTER TABLE archive_policies ADD COLUMN archived_count INTEGER DEFAULT 0;
  END IF;

  -- Add archived_size_mb column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'archive_policies' AND column_name = 'archived_size_mb') THEN
    ALTER TABLE archive_policies ADD COLUMN archived_size_mb NUMERIC(10, 2) DEFAULT 0;
  END IF;

  -- Add created_at column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'archive_policies' AND column_name = 'created_at') THEN
    ALTER TABLE archive_policies ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- Add updated_at column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'archive_policies' AND column_name = 'updated_at') THEN
    ALTER TABLE archive_policies ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Step 3: Create indexes
CREATE INDEX IF NOT EXISTS idx_archive_policies_enabled ON archive_policies(enabled);
CREATE INDEX IF NOT EXISTS idx_archive_policies_next_run ON archive_policies(next_run) WHERE enabled = true;

-- Step 4: Enable RLS
ALTER TABLE archive_policies ENABLE ROW LEVEL SECURITY;

-- Step 5: Create policy (drop if exists first)
DROP POLICY IF EXISTS "Superusers can manage archive policies" ON archive_policies;
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

-- Step 6: Grant permissions
GRANT ALL ON archive_policies TO authenticated;

-- Step 7: Verify the table structure
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'archive_policies'
ORDER BY ordinal_position;

-- Success message
SELECT '✅ Table archive_policies fixed successfully!' as status;
