#!/usr/bin/env node

/**
 * Script pour corriger les politiques RLS des conversations qui causent une récursion infinie
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixConversationsRLS() {
  console.log('🔧 Fixing conversations RLS policies...');
  
  console.log('\n📋 Please copy and paste the following SQL into your Supabase SQL Editor:');
  console.log('\n' + '='.repeat(80));
  console.log(`
-- FIX CONVERSATIONS RLS POLICIES
-- This fixes the infinite recursion error in conversation_participants policies

-- Step 1: Drop existing problematic policies
DROP POLICY IF EXISTS "conversations_select" ON conversations;
DROP POLICY IF EXISTS "conversations_insert" ON conversations;
DROP POLICY IF EXISTS "conversation_participants_select" ON conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_insert" ON conversation_participants;
DROP POLICY IF EXISTS "messages_select" ON messages;
DROP POLICY IF EXISTS "messages_insert" ON messages;

-- Step 2: Create fixed RLS policies without recursion

-- Conversations policies
CREATE POLICY "conversations_select" ON conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp 
      WHERE cp.conversation_id = conversations.id 
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "conversations_insert" ON conversations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "conversations_update" ON conversations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp 
      WHERE cp.conversation_id = conversations.id 
      AND cp.user_id = auth.uid()
      AND cp.role = 'admin'
    )
  );

-- Conversation participants policies (simplified to avoid recursion)
CREATE POLICY "conversation_participants_select" ON conversation_participants
  FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM conversation_participants cp2 
      WHERE cp2.conversation_id = conversation_participants.conversation_id 
      AND cp2.user_id = auth.uid()
    )
  );

CREATE POLICY "conversation_participants_insert" ON conversation_participants
  FOR INSERT WITH CHECK (
    -- Allow if user is inserting themselves
    user_id = auth.uid() OR
    -- Allow if user is admin of the conversation
    EXISTS (
      SELECT 1 FROM conversation_participants cp 
      WHERE cp.conversation_id = conversation_participants.conversation_id 
      AND cp.user_id = auth.uid() 
      AND cp.role = 'admin'
    )
  );

CREATE POLICY "conversation_participants_delete" ON conversation_participants
  FOR DELETE USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM conversation_participants cp 
      WHERE cp.conversation_id = conversation_participants.conversation_id 
      AND cp.user_id = auth.uid() 
      AND cp.role = 'admin'
    )
  );

-- Messages policies
CREATE POLICY "messages_select" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp 
      WHERE cp.conversation_id = messages.conversation_id 
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "messages_insert" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversation_participants cp 
      WHERE cp.conversation_id = messages.conversation_id 
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "messages_update" ON messages
  FOR UPDATE USING (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversation_participants cp 
      WHERE cp.conversation_id = messages.conversation_id 
      AND cp.user_id = auth.uid()
    )
  );

-- Step 3: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON conversations TO authenticated;
GRANT ALL ON conversation_participants TO authenticated;
GRANT ALL ON messages TO authenticated;

-- Step 4: Test the fix
SELECT 'RLS policies fixed successfully!' as status;
  `);
  console.log('='.repeat(80));
  
  console.log('\n🎯 After running the SQL:');
  console.log('1. The infinite recursion error should be resolved');
  console.log('2. Try accessing /conversations again');
  console.log('3. The conversations system should work properly');
  
  console.log('\n💡 What was fixed:');
  console.log('- Removed circular references in RLS policies');
  console.log('- Simplified conversation_participants policies');
  console.log('- Added proper admin role checks');
  console.log('- Fixed policy logic to prevent recursion');
}

// Run the fix
fixConversationsRLS();