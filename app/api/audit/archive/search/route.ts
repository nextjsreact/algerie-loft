import { NextRequest, NextResponse } from 'next/server'
import { AuditArchivingService } from '@/lib/services/audit-archiving-service'
import { logger } from '@/lib/logger'
import type { AuditFilters } from '@/lib/types'

/**
 * GET /api/audit/archive/search
 * Search archived audit logs with filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters: AuditFilters = {
      tableName: searchParams.get('tableName') || undefined,
      recordId: searchParams.get('recordId') || undefined,
      userId: searchParams.get('userId') || undefined,
      action: searchParams.get('action') as any || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      search: searchParams.get('search') || undefined
    };

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    logger.info('API: Searching archived audit logs', { filters, page, limit });

    const { logs, total } = await AuditArchivingService.searchArchivedLogs(filters, page, limit);

    return NextResponse.json({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('API: Failed to search archived logs', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search archived logs',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}