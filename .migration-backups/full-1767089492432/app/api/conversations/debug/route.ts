import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    const debug: any = {
      userId: session.user.id,
      tables: {},
      foreignKeys: {},
      errors: []
    }

    // Check if conversations table exists
    try {
      const { data: conversationsCheck, error: conversationsError } = await supabase
        .from('conversations')
        .select('count')
        .limit(1)
      
      debug.tables.conversations = {
        exists: !conversationsError,
        error: conversationsError?.message || null
      }
    } catch (error) {
      debug.tables.conversations = {
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    // Check if conversation_participants table exists
    try {
      const { data: participantsCheck, error: participantsError } = await supabase
        .from('conversation_participants')
        .select('count')
        .limit(1)
      
      debug.tables.conversation_participants = {
        exists: !participantsError,
        error: participantsError?.message || null
      }
    } catch (error) {
      debug.tables.conversation_participants = {
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    // Check if messages table exists
    try {
      const { data: messagesCheck, error: messagesError } = await supabase
        .from('messages')
        .select('count')
        .limit(1)
      
      debug.tables.messages = {
        exists: !messagesError,
        error: messagesError?.message || null
      }
    } catch (error) {
      debug.tables.messages = {
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    // Check if profiles table exists
    try {
      const { data: profilesCheck, error: profilesError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
      
      debug.tables.profiles = {
        exists: !profilesError,
        error: profilesError?.message || null
      }
    } catch (error) {
      debug.tables.profiles = {
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    // Try the problematic query that's failing
    try {
      const { data: testQuery, error: testError } = await supabase
        .from('conversation_participants')
        .select(`
          conversation:conversations (
            id,
            name,
            type
          )
        `)
        .limit(1)
      
      debug.foreignKeys.test_relationship = {
        works: !testError,
        error: testError?.message || null,
        data: testQuery
      }
    } catch (error) {
      debug.foreignKeys.test_relationship = {
        works: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    return NextResponse.json(debug)
  } catch (error) {
    console.error('Debug API Error:', error)
    return NextResponse.json(
      { error: 'Failed to run debug check', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    )
  }
}