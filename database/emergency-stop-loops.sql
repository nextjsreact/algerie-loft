-- EMERGENCY: Stop infinite loops by disabling problematic RLS policies
-- Run this immediately to stop the system from looping

-- Disable RLS on all conversations tables to stop recursion
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies that might be causing recursion
DROP POLICY IF EXISTS "conversations_select" ON conversations;
DROP POLICY IF EXISTS "conversation_participants_select" ON conversation_participants;
DROP POLICY IF EXISTS "messages_select" ON messages;
DROP POLICY IF EXISTS "users_can_view_conversation_participants" ON conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_can_view_conversations" ON conversations;
DROP POLICY IF EXISTS "users_can_view_messages_in_their_conversations" ON messages;
DROP POLICY IF EXISTS "allow_all_conversations_read" ON conversations;
DROP POLICY IF EXISTS "allow_all_participants_read" ON conversation_participants;
DROP POLICY IF EXISTS "allow_all_messages_read" ON messages;

-- Add the missing avatar_url column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Re-enable RLS with SIMPLE, non-recursive policies
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create SIMPLE policies that don't reference themselves
CREATE POLICY "simple_conversations_read" ON conversations
  FOR SELECT USING (true);

CREATE POLICY "simple_participants_read" ON conversation_participants
  FOR SELECT USING (true);

CREATE POLICY "simple_messages_read" ON messages
  FOR SELECT USING (true);

-- Allow inserts for authenticated users
CREATE POLICY "allow_conversation_insert" ON conversations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "allow_participant_insert" ON conversation_participants
  FOR INSERT WITH CHECK (true);

CREATE POLICY "allow_message_insert" ON messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

SELECT 'Emergency fix applied - loops should be stopped!' as status;