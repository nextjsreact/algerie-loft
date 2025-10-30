/**
 * Data Retention Cleanup Cron Job
 * Automated cleanup of expired data according to retention policies
 */

import { NextRequest, NextResponse } from 'next/server';
import { RetentionScheduler } from '@/lib/security/data-retention';
import { DataRetentionManager } from '@/lib/security/gdpr-compliance';
import { logger } from '@/lib/logger';

/**
 * Daily data retention cleanup
 * This endpoint should be called by a cron service (e.g., Vercel Cron, GitHub Actions)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron authorization (optional - add your cron secret)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    logger.info('Starting daily data retention cleanup');

    // Run daily cleanup
    const cleanupResult = await RetentionScheduler.runDailyCleanup();

    // Clean up expired GDPR data
    const gdprCleanup = await DataRetentionManager.cleanupExpiredData();

    // Generate retention report
    const retentionReport = await RetentionScheduler.generateRetentionReport();

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      cleanup: {
        jobsScheduled: cleanupResult.jobsScheduled,
        jobsExecuted: cleanupResult.jobsExecuted,
        recordsDeleted: cleanupResult.recordsDeleted,
        errors: cleanupResult.errors
      },
      gdprCleanup: {
        deletedRecords: gdprCleanup.deletedRecords,
        categories: gdprCleanup.categories
      },
      report: retentionReport
    };

    logger.info('Daily data retention cleanup completed', result);

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Data retention cleanup failed', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Data retention cleanup failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * Get retention status and reports
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('report');

    switch (reportType) {
      case 'status':
        const report = await RetentionScheduler.generateRetentionReport();
        return NextResponse.json(report);

      case 'compliance':
        const { GDPRValidator } = await import('@/lib/security/gdpr-compliance');
        const complianceReport = await GDPRValidator.generateComplianceReport();
        return NextResponse.json(complianceReport);

      default:
        return NextResponse.json({
          message: 'Data retention cron job endpoint',
          availableReports: ['status', 'compliance'],
          usage: {
            'POST /api/cron/data-retention': 'Run daily cleanup (requires cron secret)',
            'GET /api/cron/data-retention?report=status': 'Get retention status',
            'GET /api/cron/data-retention?report=compliance': 'Get GDPR compliance report'
          }
        });
    }
  } catch (error) {
    logger.error('Failed to generate retention report', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}