-- QUICK FIX: Add avatar_url column to profiles table
-- This is the fastest way to fix the "column does not exist" error

-- Add the missing avatar_url column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Verify the column was added
SELECT 'avatar_url column added successfully!' as status;

-- Show current table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;