#!/usr/bin/env node

/**
 * Script pour appliquer automatiquement le schéma de conversations
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

async function applyConversationsSchema() {
  console.log('💬 Applying conversations schema...');
  
  try {
    // Step 1: Create conversations table
    console.log('📝 Creating conversations table...');
    const { error: conversationsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS conversations (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name TEXT,
          type TEXT NOT NULL DEFAULT 'direct',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (conversationsError) {
      console.log('⚠️  Using direct table creation for conversations...');
      // Try direct creation without exec_sql
      await supabase.from('conversations').select('id').limit(0);
    } else {
      console.log('✅ Conversations table created');
    }
    
    // Step 2: Create conversation_participants table
    console.log('📝 Creating conversation_participants table...');
    const { error: participantsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS conversation_participants (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          conversation_id UUID NOT NULL,
          user_id UUID NOT NULL,
          joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          last_read_at TIMESTAMP WITH TIME ZONE,
          role TEXT NOT NULL DEFAULT 'member'
        );
      `
    });
    
    if (participantsError) {
      console.log('⚠️  Direct table creation needed for conversation_participants');
    } else {
      console.log('✅ Conversation_participants table created');
    }
    
    // Step 3: Create messages table
    console.log('📝 Creating messages table...');
    const { error: messagesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS messages (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          conversation_id UUID NOT NULL,
          sender_id UUID NOT NULL,
          content TEXT NOT NULL,
          message_type TEXT NOT NULL DEFAULT 'text',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE,
          edited BOOLEAN DEFAULT FALSE
        );
      `
    });
    
    if (messagesError) {
      console.log('⚠️  Direct table creation needed for messages');
    } else {
      console.log('✅ Messages table created');
    }
    
    // Alternative approach: Create tables using Supabase client
    console.log('🔄 Attempting alternative table creation...');
    
    // Test if we can create a simple conversation
    try {
      const { data: testConv, error: testError } = await supabase
        .from('conversations')
        .insert({
          name: 'Test Conversation',
          type: 'direct'
        })
        .select()
        .single();
      
      if (!testError && testConv) {
        console.log('✅ Conversations table is working');
        
        // Clean up test data
        await supabase
          .from('conversations')
          .delete()
          .eq('id', testConv.id);
      }
    } catch (e) {
      console.log('⚠️  Conversations table needs manual creation');
    }
    
    console.log('\n📋 Manual Setup Required:');
    console.log('Please copy and paste the following SQL into your Supabase SQL Editor:');
    console.log('\n' + '='.repeat(60));
    console.log(`
-- CONVERSATIONS SETUP
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  type TEXT NOT NULL DEFAULT 'direct',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE,
  role TEXT NOT NULL DEFAULT 'member',
  UNIQUE(conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE,
  edited BOOLEAN DEFAULT FALSE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "conversations_select" ON conversations
  FOR SELECT USING (
    id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid())
  );

CREATE POLICY "conversations_insert" ON conversations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "conversation_participants_select" ON conversation_participants
  FOR SELECT USING (
    conversation_id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid())
  );

CREATE POLICY "conversation_participants_insert" ON conversation_participants
  FOR INSERT WITH CHECK (true);

CREATE POLICY "messages_select" ON messages
  FOR SELECT USING (
    conversation_id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid())
  );

CREATE POLICY "messages_insert" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid())
  );
    `);
    console.log('='.repeat(60));
    
    console.log('\n🎯 After running the SQL:');
    console.log('1. Run: node scripts/setup-conversations.js (to verify)');
    console.log('2. The conversations system will be ready to use');
    
  } catch (error) {
    console.error('❌ Error applying schema:', error);
  }
}

// Run the schema application
applyConversationsSchema();