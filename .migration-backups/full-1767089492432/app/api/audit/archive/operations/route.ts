import { NextRequest, NextResponse } from 'next/server'
import { AuditArchivingService } from '@/lib/services/audit-archiving-service'
import { logger } from '@/lib/logger'

/**
 * GET /api/audit/archive/operations
 * Get archive operation status and history
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const operationId = searchParams.get('operationId') || undefined;
    const limit = parseInt(searchParams.get('limit') || '20');

    logger.info('API: Getting archive operations', { operationId, limit });

    const operations = await AuditArchivingService.getArchiveOperations(operationId, limit);

    return NextResponse.json({
      success: true,
      data: operations,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('API: Failed to get archive operations', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get archive operations',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}