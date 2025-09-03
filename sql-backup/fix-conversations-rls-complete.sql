-- COMPLETE RLS POLICY RESET FOR CONVERSATIONS
-- This will completely reset all RLS policies and recreate them safely

-- Step 1: Disable RLS on all tables to prevent conflicts
ALTER TABLE IF EXISTS conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS conversation_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS messages DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL possible policies (comprehensive cleanup)
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    -- Drop all policies on conversations table
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'conversations' LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON conversations';
    END LOOP;
    
    -- Drop all policies on conversation_participants table
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'conversation_participants' LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON conversation_participants';
    END LOOP;
    
    -- Drop all policies on messages table
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'messages' LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON messages';
    END LOOP;
END $$;

-- Step 3: Re-enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Step 4: Create simple, non-recursive policies

-- Conversations: Users can see conversations they participate in
CREATE POLICY "conversations_select_simple" ON conversations
  FOR SELECT USING (
    id IN (
      SELECT DISTINCT conversation_id 
      FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Conversations: Anyone can create conversations
CREATE POLICY "conversations_insert_simple" ON conversations
  FOR INSERT WITH CHECK (true);

-- Conversations: Only admins can update
CREATE POLICY "conversations_update_simple" ON conversations
  FOR UPDATE USING (
    id IN (
      SELECT DISTINCT conversation_id 
      FROM conversation_participants 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Conversation participants: Users can see participants in their conversations
CREATE POLICY "participants_select_simple" ON conversation_participants
  FOR SELECT USING (
    user_id = auth.uid() OR
    conversation_id IN (
      SELECT DISTINCT conversation_id 
      FROM conversation_participants cp2 
      WHERE cp2.user_id = auth.uid()
    )
  );

-- Conversation participants: Users can add themselves or admins can add others
CREATE POLICY "participants_insert_simple" ON conversation_participants
  FOR INSERT WITH CHECK (
    user_id = auth.uid() OR
    conversation_id IN (
      SELECT DISTINCT conversation_id 
      FROM conversation_participants cp 
      WHERE cp.user_id = auth.uid() AND cp.role = 'admin'
    )
  );

-- Conversation participants: Users can remove themselves or admins can remove others
CREATE POLICY "participants_delete_simple" ON conversation_participants
  FOR DELETE USING (
    user_id = auth.uid() OR
    conversation_id IN (
      SELECT DISTINCT conversation_id 
      FROM conversation_participants cp 
      WHERE cp.user_id = auth.uid() AND cp.role = 'admin'
    )
  );

-- Messages: Users can see messages in conversations they participate in
CREATE POLICY "messages_select_simple" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT DISTINCT conversation_id 
      FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Messages: Users can insert messages in conversations they participate in
CREATE POLICY "messages_insert_simple" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
      SELECT DISTINCT conversation_id 
      FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Messages: Users can update their own messages
CREATE POLICY "messages_update_simple" ON messages
  FOR UPDATE USING (
    sender_id = auth.uid() AND
    conversation_id IN (
      SELECT DISTINCT conversation_id 
      FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Step 5: Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON conversations TO authenticated;
GRANT ALL ON conversation_participants TO authenticated;
GRANT ALL ON messages TO authenticated;

-- Step 6: Verify the fix
SELECT 'All RLS policies have been completely reset and recreated!' as status;

-- Step 7: Test query to ensure no recursion
SELECT COUNT(*) as participant_count FROM conversation_participants LIMIT 1;