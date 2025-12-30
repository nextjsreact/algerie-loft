import { NextRequest, NextResponse } from 'next/server'
import { AuditArchivingService } from '@/lib/services/audit-archiving-service'
import { logger } from '@/lib/logger'

/**
 * GET /api/audit/archive/status
 * Get retention status for all audited tables
 */
export async function GET(request: NextRequest) {
  try {
    logger.info('API: Getting audit retention status');

    const retentionStatus = await AuditArchivingService.getRetentionStatus();

    return NextResponse.json({
      success: true,
      data: retentionStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('API: Failed to get retention status', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get retention status',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}