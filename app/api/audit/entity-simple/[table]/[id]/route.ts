import { NextRequest, NextResponse } from "next/server";
import { requireAuthAPI } from "@/lib/auth";
import { createClient } from '@/utils/supabase/server';

/**
 * GET /api/audit/entity-simple/[table]/[id]
 * Simple version to test audit entity API
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ table: string; id: string }> }
) {
  let table: string = '';
  let id: string = '';
  
  try {
    console.log('🧪 Simple Audit API called');
    
    // Await params in Next.js 15+
    const resolvedParams = await params;
    console.log('📋 Params received:', resolvedParams);

    // Extract params safely
    table = resolvedParams?.table || '';
    id = resolvedParams?.id || '';

    // Basic validation
    if (!table || !id) {
      console.log('❌ Missing params');
      return NextResponse.json({
        success: false,
        error: "Missing parameters",
        received: { table, id }
      }, { status: 400 });
    }
    console.log('📊 Processing:', { table, id });

    // Check authentication
    const session = await requireAuthAPI();
    if (!session) {
      console.log('❌ No authentication');
      return NextResponse.json({
        success: false,
        error: "Not authenticated"
      }, { status: 401 });
    }

    console.log('✅ User authenticated:', session.user.email);

    // Check permissions
    if (!['admin', 'manager'].includes(session.user.role)) {
      console.log('❌ Insufficient permissions');
      return NextResponse.json({
        success: false,
        error: "Insufficient permissions",
        userRole: session.user.role
      }, { status: 403 });
    }

    // Validate table
    const validTables = ['transactions', 'tasks', 'reservations', 'lofts'];
    if (!validTables.includes(table)) {
      console.log('❌ Invalid table');
      return NextResponse.json({
        success: false,
        error: "Invalid table name",
        table,
        validTables
      }, { status: 400 });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      console.log('❌ Invalid UUID format');
      return NextResponse.json({
        success: false,
        error: "Invalid UUID format",
        id
      }, { status: 400 });
    }

    // Try to query audit logs
    console.log('🔍 Querying audit logs...');
    const supabase = await createClient();
    
    // Use the working RPC function to access audit logs
    console.log('🔍 Using get_audit_logs_for_entity RPC function...');
    
    const { data: rpcResult, error } = await supabase.rpc('get_audit_logs_for_entity', {
      p_table_name: table,
      p_record_id: id,
      p_limit: 10
    });
    
    console.log('📊 RPC Result:', { rpcResult, error });
    
    let data = [];
    let count = 0;
    
    if (rpcResult && rpcResult.success) {
      data = rpcResult.data || [];
      count = rpcResult.count || 0;
    } else if (rpcResult && !rpcResult.success) {
      console.log('❌ RPC function returned error:', rpcResult.error);
      return NextResponse.json({
        success: false,
        error: "RPC function error",
        details: rpcResult.error,
        query: { table_name: table, record_id: id }
      }, { status: 500 });
    }

    if (error) {
      console.log('❌ Database error:', error);
      return NextResponse.json({
        success: false,
        error: "Database query failed",
        details: error.message,
        query: { table_name: table, record_id: id }
      }, { status: 500 });
    }

    console.log('✅ Query successful:', { count, recordsFound: data?.length || 0 });

    return NextResponse.json({
      success: true,
      message: "Audit history retrieved successfully",
      data: {
        tableName: table,
        recordId: id,
        auditHistory: data,
        total: count
      },
      meta: {
        user: session.user.email,
        userRole: session.user.role,
        timestamp: new Date().toISOString()
      },
      debug: {
        rpcResult: rpcResult,
        error: error
      }
    });

  } catch (error) {
    console.error('💥 API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    }, { status: 500 });
  }
}