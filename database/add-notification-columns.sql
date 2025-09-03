-- Simple Database Update - Add Missing Columns to Notifications Table
-- Run this in your Supabase SQL Editor to add the missing columns

-- Add the 'type' column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' 
    AND column_name = 'type' 
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE notifications ADD COLUMN type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success'));
    RAISE NOTICE 'Added type column to notifications table';
  ELSE
    RAISE NOTICE 'Type column already exists in notifications table';
  END IF;
END $$;

-- Add the 'sender_id' column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' 
    AND column_name = 'sender_id' 
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE notifications ADD COLUMN sender_id UUID REFERENCES auth.users(id);
    RAISE NOTICE 'Added sender_id column to notifications table';
  ELSE
    RAISE NOTICE 'Sender_id column already exists in notifications table';
  END IF;
END $$;

-- Add the 'read_at' column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' 
    AND column_name = 'read_at' 
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE notifications ADD COLUMN read_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Added read_at column to notifications table';
  ELSE
    RAISE NOTICE 'Read_at column already exists in notifications table';
  END IF;
END $$;

-- Ensure link column is TEXT (fix the UUID issue)
DO $$ 
BEGIN
  -- Check current data type of link column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' 
    AND column_name = 'link' 
    AND data_type != 'text'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE notifications ALTER COLUMN link TYPE TEXT;
    RAISE NOTICE 'Changed link column to TEXT type';
  ELSE
    RAISE NOTICE 'Link column is already TEXT type or does not exist';
  END IF;
END $$;

-- Enable realtime for notifications table (if not already enabled)
DO $$
BEGIN
  -- Add table to realtime publication
  ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  RAISE NOTICE 'Added notifications table to realtime publication';
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Notifications table already in realtime publication';
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not add to realtime publication: %', SQLERRM;
END $$;

-- Create a simple index for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at ON notifications(user_id, created_at DESC);

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND table_schema = 'public'
ORDER BY ordinal_position;