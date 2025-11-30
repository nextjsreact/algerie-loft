-- Check if archive_policies table exists and has correct structure

-- 1. Check if table exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'archive_policies'
    ) 
    THEN '✅ Table archive_policies exists'
    ELSE '❌ Table archive_policies does NOT exist'
  END as table_status;

-- 2. List all columns
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'archive_policies'
ORDER BY ordinal_position;

-- 3. Check for required columns
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'archive_policies' AND column_name = 'archived_count'
    ) 
    THEN '✅ archived_count exists'
    ELSE '❌ archived_count MISSING'
  END as archived_count_status,
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'archive_policies' AND column_name = 'archived_size_mb'
    ) 
    THEN '✅ archived_size_mb exists'
    ELSE '❌ archived_size_mb MISSING'
  END as archived_size_mb_status,
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'archive_policies' AND column_name = 'last_run'
    ) 
    THEN '✅ last_run exists'
    ELSE '❌ last_run MISSING'
  END as last_run_status,
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'archive_policies' AND column_name = 'next_run'
    ) 
    THEN '✅ next_run exists'
    ELSE '❌ next_run MISSING'
  END as next_run_status;

-- 4. Check indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'archive_policies';

-- 5. Count existing policies
SELECT 
  COUNT(*) as total_policies,
  COUNT(*) FILTER (WHERE enabled = true) as enabled_policies,
  COUNT(*) FILTER (WHERE enabled = false) as disabled_policies
FROM archive_policies;
