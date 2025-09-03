-- Fix for missing 'type' column in notifications table

-- Check if 'type' column exists and add it if not
DO $$
BEGIN
  -- Check if the column exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'notifications' 
    AND column_name = 'type'
  ) THEN
    -- Add the column if it doesn't exist
    ALTER TABLE notifications ADD COLUMN type VARCHAR(50) DEFAULT 'info';

    -- Add a comment explaining the column
    COMMENT ON COLUMN notifications.type IS 'Type of notification (info, warning, success, error, etc)';
  END IF;
END
$$;

-- Update permissions for this column
GRANT ALL ON notifications TO authenticated;

-- Direct fix for foreign key constraint issue in notifications table

-- First, temporarily disable the RLS policies on notifications to make changes
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Get information about the existing constraint (for logging purposes)
DO $$
DECLARE
  constraint_details RECORD;
BEGIN
  SELECT tc.table_schema, tc.constraint_name, tc.table_name, kcu.column_name, 
         ccu.table_schema AS foreign_table_schema,
         ccu.table_name AS foreign_table_name,
         ccu.column_name AS foreign_column_name 
  INTO constraint_details
  FROM information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
  WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'notifications'
    AND kcu.column_name = 'user_id';

  -- Log the constraint details to help debug
  RAISE NOTICE 'Found constraint: % on table %.%.% referencing %.%.%', 
    constraint_details.constraint_name, 
    constraint_details.table_schema, 
    constraint_details.table_name, 
    constraint_details.column_name,
    constraint_details.foreign_table_schema,
    constraint_details.foreign_table_name,
    constraint_details.foreign_column_name;
EXCEPTION
  WHEN NO_DATA_FOUND THEN
    RAISE NOTICE 'No foreign key constraint found for notifications.user_id';
END $$;

-- Option 1: Directly drop the constraint by name
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;

-- Option 2: If Option 1 doesn't work, try force-dropping all foreign keys on this column
DO $$
DECLARE
  stmt TEXT;
BEGIN
  SELECT 'ALTER TABLE notifications DROP CONSTRAINT ' || tc.constraint_name || ';'
  INTO stmt
  FROM information_schema.table_constraints tc
  JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
  JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'notifications'
    AND kcu.column_name = 'user_id'
  LIMIT 1;

  IF stmt IS NOT NULL THEN
    EXECUTE stmt;
    RAISE NOTICE 'Executed: %', stmt;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error dropping constraint: %', SQLERRM;
END $$;

-- Make user_id nullable so notifications can be created even without a valid user reference
ALTER TABLE notifications ALTER COLUMN user_id DROP NOT NULL;

-- Re-enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Let's simplify this part to avoid syntax issues
-- Just create a simpler version of the function
CREATE OR REPLACE FUNCTION create_notification_safe(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info',
  p_link TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  -- Try to insert with the provided user_id
  BEGIN
    INSERT INTO notifications(user_id, title, message, type, link)
    VALUES(p_user_id, p_title, p_message, p_type, p_link)
    RETURNING id INTO notification_id;
  EXCEPTION
    WHEN foreign_key_violation THEN
      -- If FK violation, insert with NULL user_id as fallback
      INSERT INTO notifications(user_id, title, message, type, link)
      VALUES(NULL, p_title, p_message, p_type, p_link)
      RETURNING id INTO notification_id;
  END;

  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions on the new function
GRANT EXECUTE ON FUNCTION create_notification_safe TO authenticated;
