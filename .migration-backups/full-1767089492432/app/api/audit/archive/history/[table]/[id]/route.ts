import { NextRequest, NextResponse } from 'next/server'
import { AuditArchivingService } from '@/lib/services/audit-archiving-service'
import { logger } from '@/lib/logger'

/**
 * GET /api/audit/archive/history/[table]/[id]
 * Get complete audit history for an entity (active + archived)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { table: string; id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    logger.info('API: Getting complete audit history', { 
      table: params.table, 
      id: params.id, 
      limit, 
      offset 
    });

    const logs = await AuditArchivingService.getCompleteAuditHistory(
      params.table,
      params.id,
      limit,
      offset
    );

    return NextResponse.json({
      success: true,
      data: {
        logs,
        tableName: params.table,
        recordId: params.id,
        totalLogs: logs.length,
        archivedLogs: logs.filter(log => log.isArchived).length,
        activeLogs: logs.filter(log => !log.isArchived).length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('API: Failed to get complete audit history', error, { 
      table: params.table, 
      id: params.id 
    });
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get complete audit history',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}