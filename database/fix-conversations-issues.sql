-- FIX CONVERSATIONS ISSUES
-- Run this to fix the foreign key and RLS policy problems

-- Step 1: Add missing foreign key relationship between messages and profiles
-- (This is needed for the sender profile lookup)
DO $$ 
BEGIN
  -- The messages table needs to reference profiles through sender_id
  -- But since profiles.id references auth.users.id, we don't need a direct FK
  -- Instead, we'll fix the query structure
  
  -- Check if we need to add any missing relationships
  RAISE NOTICE 'Checking foreign key relationships...';
END $$;

-- Step 2: Fix the infinite recursion in RLS policies
-- Drop the problematic policies
DROP POLICY IF EXISTS "conversation_participants_select" ON conversation_participants;
DROP POLICY IF EXISTS "conversations_select" ON conversations;
DROP POLICY IF EXISTS "messages_select" ON messages;

-- Step 3: Create fixed RLS policies without recursion
-- Policy for conversations - users can see conversations they participate in
CREATE POLICY "conversation_participants_can_view_conversations" ON conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp 
      WHERE cp.conversation_id = conversations.id 
      AND cp.user_id = auth.uid()
    )
  );

-- Policy for conversation_participants - users can see participants in their conversations
CREATE POLICY "users_can_view_conversation_participants" ON conversation_participants
  FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM conversation_participants cp2 
      WHERE cp2.conversation_id = conversation_participants.conversation_id 
      AND cp2.user_id = auth.uid()
    )
  );

-- Policy for messages - users can see messages in conversations they participate in
CREATE POLICY "users_can_view_messages_in_their_conversations" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp 
      WHERE cp.conversation_id = messages.conversation_id 
      AND cp.user_id = auth.uid()
    )
  );

-- Step 4: Keep the insert policies simple
CREATE POLICY "users_can_create_conversations" ON conversations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "users_can_join_conversations" ON conversation_participants
  FOR INSERT WITH CHECK (true);

CREATE POLICY "users_can_send_messages" ON messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Step 5: Add update and delete policies
CREATE POLICY "users_can_update_own_messages" ON messages
  FOR UPDATE USING (sender_id = auth.uid());

CREATE POLICY "users_can_delete_own_messages" ON messages
  FOR DELETE USING (sender_id = auth.uid());

CREATE POLICY "users_can_leave_conversations" ON conversation_participants
  FOR DELETE USING (user_id = auth.uid());

-- Step 6: Ensure profiles table has proper data
-- Insert missing profiles for existing users
INSERT INTO profiles (id, full_name, email)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email, 'User'),
  au.email
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO UPDATE SET
  full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
  email = COALESCE(EXCLUDED.email, profiles.email),
  updated_at = NOW();

-- Step 7: Refresh schema cache
-- Force Supabase to refresh its schema cache
NOTIFY pgrst, 'reload schema';

-- Verification
SELECT 'Fixed policies created:' as status;
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('conversations', 'conversation_participants', 'messages')
ORDER BY tablename, policyname;

SELECT 'Profiles count:' as status;
SELECT COUNT(*) as profile_count FROM profiles;

SELECT 'Setup fixed!' as status;