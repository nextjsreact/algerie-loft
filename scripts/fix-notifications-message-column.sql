-- Fix notifications table - ensure message column exists
-- This script checks and adds the message column if it's missing

DO $$ 
BEGIN
  -- Check if message column exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'notifications' 
    AND column_name = 'message'
    AND table_schema = 'public'
  ) THEN
    -- Add message column
    ALTER TABLE notifications ADD COLUMN message TEXT NOT NULL DEFAULT '';
    RAISE NOTICE 'Added message column to notifications table';
  ELSE
    RAISE NOTICE 'Message column already exists in notifications table';
  END IF;
END $$;

-- Verify the column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'notifications'
AND table_schema = 'public'
ORDER BY ordinal_position;
