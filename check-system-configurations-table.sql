-- Check System Configurations Table
-- This script verifies the table structure and current data

-- 1. Check if table exists
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_name = 'system_configurations';

-- 2. Check table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'system_configurations'
ORDER BY ordinal_position;

-- 3. Count total configurations
SELECT 
  COUNT(*) as total_configurations,
  COUNT(DISTINCT category) as total_categories
FROM system_configurations;

-- 4. View all configurations grouped by category
SELECT 
  category,
  config_key,
  data_type,
  config_value,
  description,
  is_sensitive,
  requires_restart,
  modified_at
FROM system_configurations
ORDER BY category, config_key;

-- 5. Check for configurations with English descriptions (to identify what needs translation)
SELECT 
  category,
  config_key,
  description,
  CASE 
    WHEN description ~ '[a-zA-Z]' THEN '❌ English'
    ELSE '✅ Arabic'
  END as language_status
FROM system_configurations
ORDER BY category, config_key;
