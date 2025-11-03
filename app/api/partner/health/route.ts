/**
 * Partner System Health Check API
 * Provides health status for partner dashboard system components
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

interface HealthCheck {
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  response_time_ms: number;
  details?: string;
  last_check: string;
}

interface PartnerSystemHealth {
  overall_status: 'healthy' | 'warning' | 'critical';
  checks: HealthCheck[];
  timestamp: string;
  version: string;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const checks: HealthCheck[] = [];
  
  try {
    // Database connectivity check
    const dbCheck = await checkDatabaseHealth();
    checks.push(dbCheck);

    // Partner registration API check
    const registrationCheck = await checkPartnerRegistrationAPI();
    checks.push(registrationCheck);

    // Partner authentication check
    const authCheck = await checkPartnerAuthentication();
    checks.push(authCheck);

    // Partner dashboard API check
    const dashboardCheck = await checkPartnerDashboardAPI();
    checks.push(dashboardCheck);

    // Admin management API check
    const adminCheck = await checkAdminManagementAPI();
    checks.push(adminCheck);

    // Integration points check
    const integrationCheck = await checkIntegrationPoints();
    checks.push(integrationCheck);

    // RLS policies check
    const rlsCheck = await checkRLSPolicies();
    checks.push(rlsCheck);

    // Data consistency check
    const dataCheck = await checkDataConsistency();
    checks.push(dataCheck);

    // Determine overall status
    const criticalChecks = checks.filter(check => check.status === 'critical');
    const warningChecks = checks.filter(check => check.status === 'warning');
    
    let overallStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (criticalChecks.length > 0) {
      overallStatus = 'critical';
    } else if (warningChecks.length > 0) {
      overallStatus = 'warning';
    }

    const healthResponse: PartnerSystemHealth = {
      overall_status: overallStatus,
      checks,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };

    const statusCode = overallStatus === 'critical' ? 503 : 200;

    return NextResponse.json(healthResponse, { status: statusCode });

  } catch (error) {
    console.error('Partner system health check error:', error);
    
    const errorResponse: PartnerSystemHealth = {
      overall_status: 'critical',
      checks: [{
        name: 'health_check_system',
        status: 'critical',
        response_time_ms: Date.now() - startTime,
        details: `Health check system failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        last_check: new Date().toISOString()
      }],
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };

    return NextResponse.json(errorResponse, { status: 503 });
  }
}

async function checkDatabaseHealth(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    const supabase = await createClient(true);
    
    // Test basic database connectivity
    const { data, error } = await supabase
      .from('partners')
      .select('id')
      .limit(1);

    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        name: 'database_connectivity',
        status: 'critical',
        response_time_ms: responseTime,
        details: `Database error: ${error.message}`,
        last_check: new Date().toISOString()
      };
    }

    // Check response time
    const status = responseTime > 1000 ? 'warning' : 'healthy';
    const details = responseTime > 1000 ? 'Slow database response' : 'Database responding normally';

    return {
      name: 'database_connectivity',
      status,
      response_time_ms: responseTime,
      details,
      last_check: new Date().toISOString()
    };

  } catch (error) {
    return {
      name: 'database_connectivity',
      status: 'critical',
      response_time_ms: Date.now() - startTime,
      details: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      last_check: new Date().toISOString()
    };
  }
}

async function checkPartnerRegistrationAPI(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    const supabase = await createClient(true);
    
    // Check if partners table is accessible
    const { error } = await supabase
      .from('partners')
      .select('id, verification_status')
      .limit(1);

    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        name: 'partner_registration_api',
        status: 'critical',
        response_time_ms: responseTime,
        details: `Registration API error: ${error.message}`,
        last_check: new Date().toISOString()
      };
    }

    return {
      name: 'partner_registration_api',
      status: 'healthy',
      response_time_ms: responseTime,
      details: 'Registration API accessible',
      last_check: new Date().toISOString()
    };

  } catch (error) {
    return {
      name: 'partner_registration_api',
      status: 'critical',
      response_time_ms: Date.now() - startTime,
      details: `Registration API check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      last_check: new Date().toISOString()
    };
  }
}

async function checkPartnerAuthentication(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    const supabase = await createClient(true);
    
    // Check if we can access user profiles
    const { error } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('role', 'partner')
      .limit(1);

    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        name: 'partner_authentication',
        status: 'critical',
        response_time_ms: responseTime,
        details: `Authentication check error: ${error.message}`,
        last_check: new Date().toISOString()
      };
    }

    return {
      name: 'partner_authentication',
      status: 'healthy',
      response_time_ms: responseTime,
      details: 'Partner authentication system operational',
      last_check: new Date().toISOString()
    };

  } catch (error) {
    return {
      name: 'partner_authentication',
      status: 'critical',
      response_time_ms: Date.now() - startTime,
      details: `Authentication check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      last_check: new Date().toISOString()
    };
  }
}

async function checkPartnerDashboardAPI(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    const supabase = await createClient(true);
    
    // Check if we can access partner properties
    const { error } = await supabase
      .from('lofts')
      .select('id, partner_id')
      .not('partner_id', 'is', null)
      .limit(1);

    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        name: 'partner_dashboard_api',
        status: 'critical',
        response_time_ms: responseTime,
        details: `Dashboard API error: ${error.message}`,
        last_check: new Date().toISOString()
      };
    }

    return {
      name: 'partner_dashboard_api',
      status: 'healthy',
      response_time_ms: responseTime,
      details: 'Dashboard API operational',
      last_check: new Date().toISOString()
    };

  } catch (error) {
    return {
      name: 'partner_dashboard_api',
      status: 'critical',
      response_time_ms: Date.now() - startTime,
      details: `Dashboard API check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      last_check: new Date().toISOString()
    };
  }
}

async function checkAdminManagementAPI(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    const supabase = await createClient(true);
    
    // Check if we can access validation requests
    const { error } = await supabase
      .from('partner_validation_requests')
      .select('id, status')
      .limit(1);

    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        name: 'admin_management_api',
        status: 'critical',
        response_time_ms: responseTime,
        details: `Admin API error: ${error.message}`,
        last_check: new Date().toISOString()
      };
    }

    return {
      name: 'admin_management_api',
      status: 'healthy',
      response_time_ms: responseTime,
      details: 'Admin management API operational',
      last_check: new Date().toISOString()
    };

  } catch (error) {
    return {
      name: 'admin_management_api',
      status: 'critical',
      response_time_ms: Date.now() - startTime,
      details: `Admin API check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      last_check: new Date().toISOString()
    };
  }
}

async function checkIntegrationPoints(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    const supabase = await createClient(true);
    
    // Check integration between partners and lofts
    const { data: partnersWithLofts, error } = await supabase
      .from('partners')
      .select(`
        id,
        lofts!inner(id)
      `)
      .limit(1);

    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        name: 'integration_points',
        status: 'warning',
        response_time_ms: responseTime,
        details: `Integration check warning: ${error.message}`,
        last_check: new Date().toISOString()
      };
    }

    return {
      name: 'integration_points',
      status: 'healthy',
      response_time_ms: responseTime,
      details: 'Integration points operational',
      last_check: new Date().toISOString()
    };

  } catch (error) {
    return {
      name: 'integration_points',
      status: 'warning',
      response_time_ms: Date.now() - startTime,
      details: `Integration check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      last_check: new Date().toISOString()
    };
  }
}

async function checkRLSPolicies(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    const supabase = await createClient(true);
    
    // Check if RLS policies exist for partner tables
    const { data: policies, error } = await supabase
      .rpc('check_rls_policies', {
        table_names: ['partners', 'lofts', 'reservations']
      })
      .single();

    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        name: 'rls_policies',
        status: 'warning',
        response_time_ms: responseTime,
        details: `RLS policy check warning: ${error.message}`,
        last_check: new Date().toISOString()
      };
    }

    return {
      name: 'rls_policies',
      status: 'healthy',
      response_time_ms: responseTime,
      details: 'RLS policies active',
      last_check: new Date().toISOString()
    };

  } catch (error) {
    return {
      name: 'rls_policies',
      status: 'warning',
      response_time_ms: Date.now() - startTime,
      details: 'RLS policy check not available (function may not exist)',
      last_check: new Date().toISOString()
    };
  }
}

async function checkDataConsistency(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    const supabase = await createClient(true);
    
    // Check for orphaned records
    const { data: orphanedLofts, error: loftError } = await supabase
      .from('lofts')
      .select('id')
      .not('partner_id', 'is', null)
      .not('partner_id', 'in', 
        supabase.from('partners').select('id')
      )
      .limit(1);

    const responseTime = Date.now() - startTime;

    if (loftError) {
      return {
        name: 'data_consistency',
        status: 'warning',
        response_time_ms: responseTime,
        details: `Data consistency check warning: ${loftError.message}`,
        last_check: new Date().toISOString()
      };
    }

    const hasOrphanedData = orphanedLofts && orphanedLofts.length > 0;
    
    return {
      name: 'data_consistency',
      status: hasOrphanedData ? 'warning' : 'healthy',
      response_time_ms: responseTime,
      details: hasOrphanedData ? 'Some orphaned records detected' : 'Data consistency good',
      last_check: new Date().toISOString()
    };

  } catch (error) {
    return {
      name: 'data_consistency',
      status: 'warning',
      response_time_ms: Date.now() - startTime,
      details: `Data consistency check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      last_check: new Date().toISOString()
    };
  }
}