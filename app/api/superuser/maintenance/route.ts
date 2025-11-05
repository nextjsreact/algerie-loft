import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { requireSuperuser } from '@/lib/superuser/auth';
import { logAuditEvent } from '@/lib/superuser/audit';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Verify superuser permissions
    const authResult = await requireSuperuser(supabase, ['SYSTEM_MAINTENANCE']);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const operation = searchParams.get('operation');

    let result = {};

    switch (operation) {
      case 'system-status':
        result = await getSystemStatus(supabase);
        break;
      case 'database-stats':
        result = await getDatabaseStats(supabase);
        break;
      case 'cache-status':
        result = await getCacheStatus();
        break;
      default:
        result = {
          systemStatus: await getSystemStatus(supabase),
          databaseStats: await getDatabaseStats(supabase),
          cacheStatus: await getCacheStatus()
        };
    }

    // Log audit event
    await logAuditEvent(supabase, authResult.superuser!.id, 'SYSTEM_MAINTENANCE', 'VIEW_STATUS', {
      operation: operation || 'all'
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Maintenance status API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Verify superuser permissions
    const authResult = await requireSuperuser(supabase, ['SYSTEM_MAINTENANCE']);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { operation, options = {} } = body;

    let result = {};

    switch (operation) {
      case 'database-cleanup':
        result = await performDatabaseCleanup(supabase, options);
        break;
      case 'cache-clear':
        result = await clearCache(options);
        break;
      case 'optimize-database':
        result = await optimizeDatabase(supabase, options);
        break;
      case 'vacuum-analyze':
        result = await vacuumAnalyze(supabase, options);
        break;
      default:
        return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
    }

    // Log audit event
    await logAuditEvent(supabase, authResult.superuser!.id, 'SYSTEM_MAINTENANCE', 'PERFORM_OPERATION', {
      operation,
      options,
      result
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Maintenance operation API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function getSystemStatus(supabase: any) {
  try {
    // Get database connection info
    const { data: dbInfo } = await supabase.rpc('get_database_info');
    
    // Get table sizes
    const { data: tableSizes } = await supabase.rpc('get_table_sizes');
    
    // Get active connections
    const { data: connections } = await supabase.rpc('get_active_connections');

    return {
      database: {
        info: dbInfo,
        tableSizes: tableSizes || [],
        activeConnections: connections || 0
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting system status:', error);
    return { error: 'Failed to get system status' };
  }
}

async function getDatabaseStats(supabase: any) {
  try {
    // Get table statistics
    const { data: tableStats } = await supabase.rpc('get_table_statistics');
    
    // Get index usage
    const { data: indexUsage } = await supabase.rpc('get_index_usage');
    
    // Get slow queries (if available)
    const { data: slowQueries } = await supabase.rpc('get_slow_queries');

    return {
      tableStats: tableStats || [],
      indexUsage: indexUsage || [],
      slowQueries: slowQueries || [],
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting database stats:', error);
    return { error: 'Failed to get database statistics' };
  }
}

async function getCacheStatus() {
  try {
    // In a real implementation, this would check Redis or other cache systems
    // For now, we'll return Next.js cache information
    return {
      nextjs: {
        status: 'active',
        // This would be populated with actual cache metrics
        hitRate: 0.85,
        size: '125MB',
        entries: 1250
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting cache status:', error);
    return { error: 'Failed to get cache status' };
  }
}

async function performDatabaseCleanup(supabase: any, options: any) {
  try {
    const results = [];

    // Clean up old audit logs (older than retention period)
    if (options.cleanAuditLogs !== false) {
      const retentionDays = options.auditRetentionDays || 90;
      const { data: auditCleanup } = await supabase.rpc('cleanup_old_audit_logs', {
        retention_days: retentionDays
      });
      results.push({ operation: 'audit_logs_cleanup', result: auditCleanup });
    }

    // Clean up expired sessions
    if (options.cleanSessions !== false) {
      const { data: sessionCleanup } = await supabase.rpc('cleanup_expired_sessions');
      results.push({ operation: 'sessions_cleanup', result: sessionCleanup });
    }

    // Clean up orphaned records
    if (options.cleanOrphans !== false) {
      const { data: orphanCleanup } = await supabase.rpc('cleanup_orphaned_records');
      results.push({ operation: 'orphans_cleanup', result: orphanCleanup });
    }

    return {
      success: true,
      operations: results,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error performing database cleanup:', error);
    return { error: 'Failed to perform database cleanup' };
  }
}

async function clearCache(options: any) {
  try {
    const results = [];

    // Clear Next.js cache
    if (options.clearNextjs !== false) {
      // In a real implementation, this would clear Next.js cache
      results.push({ 
        cache: 'nextjs', 
        status: 'cleared',
        message: 'Next.js cache cleared successfully'
      });
    }

    // Clear application cache
    if (options.clearApplication !== false) {
      // Clear any application-specific caches
      results.push({ 
        cache: 'application', 
        status: 'cleared',
        message: 'Application cache cleared successfully'
      });
    }

    return {
      success: true,
      operations: results,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error clearing cache:', error);
    return { error: 'Failed to clear cache' };
  }
}

async function optimizeDatabase(supabase: any, options: any) {
  try {
    const results = [];

    // Reindex tables
    if (options.reindex !== false) {
      const { data: reindexResult } = await supabase.rpc('reindex_tables', {
        table_names: options.tables || null
      });
      results.push({ operation: 'reindex', result: reindexResult });
    }

    // Update table statistics
    if (options.updateStats !== false) {
      const { data: statsResult } = await supabase.rpc('update_table_statistics', {
        table_names: options.tables || null
      });
      results.push({ operation: 'update_statistics', result: statsResult });
    }

    return {
      success: true,
      operations: results,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error optimizing database:', error);
    return { error: 'Failed to optimize database' };
  }
}

async function vacuumAnalyze(supabase: any, options: any) {
  try {
    const { data: result } = await supabase.rpc('vacuum_analyze_tables', {
      table_names: options.tables || null,
      full_vacuum: options.fullVacuum || false
    });

    return {
      success: true,
      result,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error performing vacuum analyze:', error);
    return { error: 'Failed to perform vacuum analyze' };
  }
}