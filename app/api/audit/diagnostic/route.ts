import { NextRequest, NextResponse } from "next/server";
import { requireAuthAPI } from "@/lib/auth";
import { createClient } from '@/utils/supabase/server';

/**
 * GET /api/audit/diagnostic
 * Comprehensive diagnostic endpoint for audit system
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Audit diagnostic endpoint called');

    // Test 1: Authentication
    const session = await requireAuthAPI();
    console.log('🔐 Session test:', session ? 'OK' : 'FAILED');

    if (!session) {
      return NextResponse.json({
        success: false,
        error: "Authentication required",
        tests: {
          auth: false
        }
      }, { status: 401 });
    }

    const supabase = await createClient();
    const diagnostics = {
      auth: true,
      database: false,
      auditSchema: false,
      auditTable: false,
      rpcFunctions: false,
      permissions: false,
      sampleData: false
    };

    const details: any = {
      userRole: session.user.role,
      userId: session.user.id,
      timestamp: new Date().toISOString()
    };

    // Test 2: Database connection
    try {
      const { data, error } = await supabase.from('users').select('id').limit(1);
      diagnostics.database = !error;
      if (error) details.databaseError = error.message;
    } catch (error) {
      details.databaseError = error instanceof Error ? error.message : 'Unknown error';
    }

    // Test 3: Audit schema and table access
    try {
      const { data, error } = await supabase
        .from('audit.audit_logs')
        .select('id')
        .limit(1);
      
      diagnostics.auditSchema = true;
      diagnostics.auditTable = !error;
      
      if (error) {
        details.auditTableError = error.message;
      }
    } catch (error) {
      details.auditSchemaError = error instanceof Error ? error.message : 'Unknown error';
    }

    // Test 4: RPC functions
    try {
      const { data: rpcResult, error } = await supabase.rpc('get_audit_logs_for_entity', {
        p_table_name: 'transactions',
        p_record_id: '123e4567-e89b-12d3-a456-426614174000',
        p_limit: 1
      });
      
      diagnostics.rpcFunctions = !error;
      
      if (error) {
        details.rpcError = error.message;
      } else {
        details.rpcResult = rpcResult;
      }
    } catch (error) {
      details.rpcError = error instanceof Error ? error.message : 'Unknown error';
    }

    // Test 5: User permissions
    diagnostics.permissions = ['admin', 'manager'].includes(session.user.role);
    if (!diagnostics.permissions) {
      details.permissionError = `Role '${session.user.role}' does not have audit access`;
    }

    // Test 6: Sample data check
    if (diagnostics.auditTable) {
      try {
        const { data, error, count } = await supabase
          .from('audit.audit_logs')
          .select('id, table_name, action', { count: 'exact' })
          .limit(5);
        
        diagnostics.sampleData = !error;
        details.auditLogsCount = count || 0;
        details.sampleLogs = data || [];
        
        if (error) {
          details.sampleDataError = error.message;
        }
      } catch (error) {
        details.sampleDataError = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    // Overall health check
    const overallHealth = Object.values(diagnostics).every(test => test === true);

    return NextResponse.json({
      success: true,
      message: "Audit system diagnostic completed",
      overallHealth,
      diagnostics,
      details,
      recommendations: generateRecommendations(diagnostics, details)
    });

  } catch (error) {
    console.error('❌ Audit diagnostic error:', error);
    
    return NextResponse.json({
      success: false,
      error: "Diagnostic failed",
      details: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      }
    }, { status: 500 });
  }
}

function generateRecommendations(diagnostics: any, details: any): string[] {
  const recommendations: string[] = [];

  if (!diagnostics.auth) {
    recommendations.push("Ensure user is properly authenticated");
  }

  if (!diagnostics.database) {
    recommendations.push("Check database connection and credentials");
  }

  if (!diagnostics.auditSchema) {
    recommendations.push("Run audit schema creation script: database/audit-system-schema-fixed.sql");
  }

  if (!diagnostics.auditTable) {
    recommendations.push("Create audit_logs table using the schema script");
  }

  if (!diagnostics.rpcFunctions) {
    recommendations.push("Deploy RPC functions using: database/simple-audit-rpc.sql");
  }

  if (!diagnostics.permissions) {
    recommendations.push("User needs 'admin' or 'manager' role for audit access");
  }

  if (!diagnostics.sampleData && details.auditLogsCount === 0) {
    recommendations.push("No audit logs found - triggers may not be active");
    recommendations.push("Deploy audit triggers using: database/create-audit-triggers.sql");
  }

  if (recommendations.length === 0) {
    recommendations.push("All systems operational! ✅");
  }

  return recommendations;
}