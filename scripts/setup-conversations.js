#!/usr/bin/env node

/**
 * Script pour configurer le système de conversations
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupConversations() {
  console.log('💬 Setting up conversations system...');
  
  try {
    // Check if conversations tables exist by trying to query them
    console.log('🔍 Checking existing tables...');
    
    const requiredTables = ['conversations', 'conversation_participants', 'messages'];
    const existingTables = [];
    
    for (const tableName of requiredTables) {
      try {
        const { error } = await supabase
          .from(tableName)
          .select('*')
          .limit(0);
        
        if (!error) {
          existingTables.push(tableName);
        }
      } catch (e) {
        // Table doesn't exist
      }
    }
    
    console.log('📊 Existing tables:', existingTables);
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length > 0) {
      console.log('⚠️  Missing tables:', missingTables);
      console.log('📋 Please run the following SQL script in your Supabase dashboard:');
      console.log('File: database/conversations-fixed.sql');
      return;
    }
    
    console.log('✅ All required tables exist');
    
    // Test basic functionality
    console.log('🧪 Testing conversations functionality...');
    
    // Test if we can query conversations (this will test RLS policies)
    const { data: testConversations, error: testError } = await supabase
      .from('conversations')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.log('⚠️  RLS policies might need adjustment:', testError.message);
    } else {
      console.log('✅ Conversations table accessible');
    }
    
    // Test profiles table
    const { data: testProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .limit(5);
    
    if (profilesError) {
      console.log('⚠️  Profiles table issue:', profilesError.message);
    } else {
      console.log(`✅ Profiles table accessible (${testProfiles?.length || 0} profiles found)`);
    }
    
    console.log('\n🎉 Conversations system setup verification completed!');
    console.log('💡 The conversations system should now be ready to use.');
    
  } catch (error) {
    console.error('❌ Error setting up conversations:', error);
  }
}

// Run the setup
setupConversations();