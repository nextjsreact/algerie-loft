#!/usr/bin/env node

/**
 * Script pour temporairement désactiver RLS sur les tables de conversations
 * À utiliser seulement pour tester le système avant de corriger les politiques
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

async function tempDisableRLS() {
  console.log('⚠️  Temporarily disabling RLS for conversations (TESTING ONLY)...');
  
  console.log('\n📋 Please copy and paste the following SQL into your Supabase SQL Editor:');
  console.log('\n' + '='.repeat(60));
  console.log(`
-- TEMPORARY FIX: Disable RLS for conversations testing
-- ⚠️  WARNING: This removes security! Only for testing!

-- Disable RLS temporarily
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "conversations_select" ON conversations;
DROP POLICY IF EXISTS "conversations_insert" ON conversations;
DROP POLICY IF EXISTS "conversations_update" ON conversations;
DROP POLICY IF EXISTS "conversation_participants_select" ON conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_insert" ON conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_delete" ON conversation_participants;
DROP POLICY IF EXISTS "messages_select" ON messages;
DROP POLICY IF EXISTS "messages_insert" ON messages;
DROP POLICY IF EXISTS "messages_update" ON messages;

-- Grant permissions
GRANT ALL ON conversations TO authenticated;
GRANT ALL ON conversation_participants TO authenticated;
GRANT ALL ON messages TO authenticated;

SELECT 'RLS temporarily disabled for testing' as status;
  `);
  console.log('='.repeat(60));
  
  console.log('\n⚠️  IMPORTANT SECURITY WARNING:');
  console.log('- This removes all security from conversations');
  console.log('- Use ONLY for testing the system');
  console.log('- Re-enable RLS with proper policies ASAP');
  console.log('- Run the fix-conversations-rls.js script for proper security');
  
  console.log('\n🎯 After testing:');
  console.log('1. Run: node scripts/fix-conversations-rls.js');
  console.log('2. Apply the proper RLS policies');
  console.log('3. Re-enable security');
}

// Run the temporary fix
tempDisableRLS();