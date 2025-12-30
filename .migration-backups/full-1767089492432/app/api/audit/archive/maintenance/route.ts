import { NextRequest, NextResponse } from 'next/server'
import { AuditArchivingService } from '@/lib/services/audit-archiving-service'
import { logger } from '@/lib/logger'

/**
 * POST /api/audit/archive/maintenance
 * Run daily archive maintenance (archive + cleanup)
 */
export async function POST(request: NextRequest) {
  try {
    logger.info('API: Running daily archive maintenance');

    const result = await AuditArchivingService.runDailyMaintenance();

    return NextResponse.json({
      success: true,
      data: { maintenanceLog: result },
      message: 'Daily maintenance completed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('API: Failed to run daily maintenance', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to run daily maintenance',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * GET /api/audit/archive/maintenance
 * Get archive statistics and maintenance status
 */
export async function GET(request: NextRequest) {
  try {
    logger.info('API: Getting archive statistics');

    const statistics = await AuditArchivingService.getArchiveStatistics();

    return NextResponse.json({
      success: true,
      data: statistics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('API: Failed to get archive statistics', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get archive statistics',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}