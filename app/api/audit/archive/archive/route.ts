import { NextRequest, NextResponse } from 'next/server'
import { AuditArchivingService } from '@/lib/services/audit-archiving-service'
import { logger } from '@/lib/logger'

/**
 * POST /api/audit/archive/archive
 * Archive old audit logs based on retention policies
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tableName, batchSize = 1000 } = body;

    logger.info('API: Archiving old audit logs', { tableName, batchSize });

    const results = await AuditArchivingService.archiveOldAuditLogs(tableName, batchSize);

    return NextResponse.json({
      success: true,
      data: results,
      message: `Successfully archived logs for ${results.length} table(s)`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('API: Failed to archive audit logs', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to archive audit logs',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}