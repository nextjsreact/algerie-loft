import { NextRequest, NextResponse } from 'next/server'
import { AuditArchivingService } from '@/lib/services/audit-archiving-service'
import { logger } from '@/lib/logger'

/**
 * GET /api/audit/archive/policies
 * Get all retention policies
 */
export async function GET(request: NextRequest) {
  try {
    logger.info('API: Getting retention policies');

    const policies = await AuditArchivingService.getRetentionPolicies();

    return NextResponse.json({
      success: true,
      data: policies,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('API: Failed to get retention policies', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get retention policies',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * PUT /api/audit/archive/policies
 * Update or create a retention policy
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { tableName, retentionDays, archiveAfterDays, enabled = true } = body;

    if (!tableName || !retentionDays || !archiveAfterDays) {
      return NextResponse.json({
        success: false,
        error: 'tableName, retentionDays, and archiveAfterDays are required',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    if (archiveAfterDays >= retentionDays) {
      return NextResponse.json({
        success: false,
        error: 'archiveAfterDays must be less than retentionDays',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    logger.info('API: Updating retention policy', { 
      tableName, 
      retentionDays, 
      archiveAfterDays, 
      enabled 
    });

    const success = await AuditArchivingService.updateRetentionPolicy(
      tableName,
      retentionDays,
      archiveAfterDays,
      enabled
    );

    return NextResponse.json({
      success: true,
      data: { updated: success },
      message: `Retention policy for ${tableName} updated successfully`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('API: Failed to update retention policy', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update retention policy',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}