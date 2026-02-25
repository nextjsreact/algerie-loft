import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated'
      })
    }

    const results: any = {
      user: {
        id: user.id,
        email: user.email
      },
      checks: {}
    }

    // Check 1: Can we access audit_logs in audit schema?
    try {
      const { data, error } = await supabase
        .schema('audit')
        .from('audit_logs')
        .select('count')
        .limit(1)
      
      results.checks.auditSchemaAccess = {
        success: !error,
        error: error?.message,
        hasData: !!data
      }
    } catch (e) {
      results.checks.auditSchemaAccess = {
        success: false,
        error: 'Cannot use schema() method'
      }
    }

    // Check 2: Check if audit_logs exists in public schema
    const { data: publicAuditLogs, error: publicError } = await supabase
      .from('audit_logs')
      .select('*')
      .limit(5)
      .order('created_at', { ascending: false })

    results.checks.publicAuditLogs = {
      success: !publicError,
      error: publicError?.message,
      count: publicAuditLogs?.length || 0,
      latestLogs: publicAuditLogs || []
    }

    // Check 3: Get all audit logs from last 7 days using raw query
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: recentLogs, error: recentError } = await supabase
      .from('audit_logs')
      .select('*')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })

    results.checks.recentAuditLogs = {
      success: !recentError,
      error: recentError?.message,
      count: recentLogs?.length || 0,
      last7Days: recentLogs?.slice(0, 10) || []
    }

    // Check 4: Check lofts table for recent updates
    const { data: recentLofts, error: loftsError } = await supabase
      .from('lofts')
      .select('id, name, updated_at')
      .order('updated_at', { ascending: false })
      .limit(5)

    results.checks.recentLoftUpdates = {
      success: !loftsError,
      error: loftsError?.message,
      lofts: recentLofts || []
    }

    // Check 5: Try to get table info
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_schema, table_name')
      .or('table_name.eq.audit_logs,table_name.eq.lofts')

    results.checks.tableInfo = {
      success: !tablesError,
      error: tablesError?.message,
      tables: tables || 'Cannot access information_schema'
    }

    return NextResponse.json({
      success: true,
      ...results
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
  }
}
