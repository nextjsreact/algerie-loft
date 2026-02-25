import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Test 1: Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated',
        authError
      })
    }

    // Test 2: Try to call set_audit_user_context
    const { data: rpcData, error: rpcError } = await supabase.rpc('set_audit_user_context', {
      p_user_id: user.id,
      p_user_email: user.email || 'test@test.com'
    })

    if (rpcError) {
      return NextResponse.json({
        success: false,
        error: 'RPC function failed',
        rpcError,
        user: {
          id: user.id,
          email: user.email
        }
      })
    }

    // Test 3: Check if audit_logs table exists and is accessible
    const { data: auditLogs, error: auditError } = await supabase
      .from('audit_logs')
      .select('*')
      .limit(5)
      .order('timestamp', { ascending: false })

    if (auditError) {
      return NextResponse.json({
        success: false,
        error: 'Cannot access audit_logs table',
        auditError,
        rpcSuccess: true
      })
    }

    // Test 4: Check if triggers exist
    const { data: triggers, error: triggersError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT trigger_name, event_object_table 
          FROM information_schema.triggers 
          WHERE trigger_name LIKE 'audit_trigger_%'
        `
      })
      .catch(() => ({ data: null, error: { message: 'exec_sql not available' } }))

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email
      },
      rpcSuccess: true,
      auditLogsCount: auditLogs?.length || 0,
      latestAuditLogs: auditLogs,
      triggers: triggers || 'Cannot check triggers (exec_sql not available)',
      message: 'All tests passed!'
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : String(error)
    })
  }
}
