import { NextRequest, NextResponse } from "next/server";
import { requireAuthAPI } from "@/lib/auth";
import { createClient } from '@/utils/supabase/server';

/**
 * GET /api/audit/test
 * Test endpoint to diagnose audit system issues
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Audit test endpoint called');

    // Test 1: Authentication
    const session = await requireAuthAPI();
    console.log('🔐 Session test:', session ? 'OK' : 'FAILED');

    if (!session) {
      return NextResponse.json({
        success: false,
        error: "Authentication failed",
        tests: {
          auth: false
        }
      }, { status: 401 });
    }

    // Test 2: Database connection
    const supabase = await createClient();
    console.log('🗄️ Database connection test...');

    // Test 3: Check if audit schema exists by trying to access audit_logs table
    let schemaExists = false;
    let schemaError = null;
    try {
      const { data: altData, error: altError } = await supabase
        .from('audit_logs')
        .select('id')
        .limit(1);
      schemaExists = !altError;
      schemaError = altError;
    } catch (altErr) {
      schemaExists = false;
      schemaError = altErr;
    }

    console.log('📊 Schema test:', schemaExists ? 'OK' : 'FAILED', schemaError);

    // Test 4: Check if audit_logs table exists (simple query)
    let tableExists = false;
    let tableError = null;
    try {
      const { data: tableData, error: tableErr } = await supabase
        .from('audit_logs')
        .select('id')
        .limit(1);
      tableExists = !tableErr;
      tableError = tableErr;
    } catch (error) {
      tableExists = false;
      tableError = error;
    }

    console.log('📋 Table test:', tableExists ? 'OK' : 'FAILED', tableError);

    // Test 5: Test audit_logs access via RPC
    let auditLogsTest = false;
    let auditLogsError = null;
    let auditLogsCount = 0;

    try {
      const { data: rpcResult, error: auditError } = await supabase.rpc('get_all_audit_logs', {
        p_limit: 1,
        p_offset: 0
      });

      auditLogsTest = !auditError && rpcResult?.success;
      auditLogsError = auditError || rpcResult?.error;
      auditLogsCount = rpcResult?.count || 0;
      
      console.log('📊 Audit logs RPC test:', auditLogsTest ? 'OK' : 'FAILED', auditLogsError);
    } catch (error) {
      auditLogsError = error;
      console.log('📊 Audit logs RPC test: FAILED', error);
    }

    // Test 6: Check user permissions
    const hasPermissions = ['admin', 'manager'].includes(session.user.role);
    console.log('🔑 Permissions test:', hasPermissions ? 'OK' : 'FAILED');

    return NextResponse.json({
      success: true,
      message: "Audit system diagnostic completed",
      tests: {
        auth: true,
        database: true,
        schema: schemaExists || false,
        table: tableExists || false,
        auditLogs: auditLogsTest,
        permissions: hasPermissions
      },
      details: {
        userRole: session.user.role,
        userId: session.user.id,
        auditLogsCount,
        schemaError: schemaError?.message || String(schemaError),
        tableError: tableError?.message || String(tableError),
        auditLogsError: auditLogsError?.message || String(auditLogsError)
      }
    });

  } catch (error) {
    console.error('❌ Audit test endpoint error:', error);
    
    return NextResponse.json({
      success: false,
      error: "Test endpoint failed",
      details: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      }
    }, { status: 500 });
  }
}