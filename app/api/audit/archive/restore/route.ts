import { NextRequest, NextResponse } from 'next/server'
import { AuditArchivingService } from '@/lib/services/audit-archiving-service'
import { logger } from '@/lib/logger'

/**
 * POST /api/audit/archive/restore
 * Restore archived logs back to active audit table
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tableName, recordId, dateFrom, dateTo } = body;

    if (!tableName) {
      return NextResponse.json({
        success: false,
        error: 'tableName is required',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    logger.info('API: Restoring archived logs', { tableName, recordId, dateFrom, dateTo });

    const result = await AuditArchivingService.restoreArchivedLogs(
      tableName,
      recordId,
      dateFrom,
      dateTo
    );

    return NextResponse.json({
      success: true,
      data: result,
      message: `Successfully restored ${result.restoredCount} logs`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('API: Failed to restore archived logs', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to restore archived logs',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}