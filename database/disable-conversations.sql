-- EMERGENCY: Completely disable conversations system
-- This will stop all loops by removing the problematic tables/policies

-- Drop all conversations tables to stop any loops
DROP TABLE IF EXISTS message_attachments CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversation_participants CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;

-- Add avatar_url column to profiles if missing
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

SELECT 'Conversations system completely disabled - loops stopped!' as status;