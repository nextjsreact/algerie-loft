import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { AuditService } from '@/lib/services/audit-service'
import { AuditPermissionManager } from '@/lib/permissions/audit-permissions'
import { logger } from '@/lib/logger'

/**
 * GET /api/audit/security
 * Retrieve audit security information including integrity checks, access logs, and retention status
 * Query parameters:
 * - action: 'integrity' | 'access-logs' | 'retention' | 'suspicious-access'
 * - table_name: optional table name for integrity checks
 * - date_from: optional start date for integrity checks
 * - date_to: optional end date for integrity checks
 * - page: page number for access logs (default: 1)
 * - limit: records per page for access logs (default: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      logger.warn('Unauthorized audit security access attempt')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile to check permissions
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      logger.error('Failed to get user profile for audit security', profileError)
      return NextResponse.json(
        { error: 'Failed to get user profile' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const tableName = searchParams.get('table_name')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    switch (action) {
      case 'integrity':
        // Check if user can view integrity reports
        if (!AuditPermissionManager.getAuditPermissions(profile.role).canViewIntegrityReports) {
          return NextResponse.json(
            { error: 'Insufficient permissions to view integrity reports' },
            { status: 403 }
          )
        }

        const integrityResult = await AuditService.verifyAuditIntegrity(
          tableName || undefined,
          dateFrom || undefined,
          dateTo || undefined
        )

        return NextResponse.json({
          success: true,
          data: integrityResult
        })

      case 'access-logs':
        // Check if user can view audit access logs
        if (!AuditPermissionManager.canViewAuditAccessLogs(profile.role)) {
          return NextResponse.json(
            { error: 'Insufficient permissions to view audit access logs' },
            { status: 403 }
          )
        }

        const accessLogsResult = await AuditService.getAuditAccessLogs(page, limit)

        return NextResponse.json({
          success: true,
          data: accessLogsResult
        })

      case 'retention':
        // Check if user can view retention status
        if (!AuditPermissionManager.getAuditPermissions(profile.role).canViewIntegrityReports) {
          return NextResponse.json(
            { error: 'Insufficient permissions to view retention status' },
            { status: 403 }
          )
        }

        const retentionStatus = await AuditService.getRetentionStatus()

        return NextResponse.json({
          success: true,
          data: retentionStatus
        })

      case 'suspicious-access':
        // Check if user can view suspicious access patterns (admin only)
        if (!AuditPermissionManager.hasAdminAuditAccess(profile.role)) {
          return NextResponse.json(
            { error: 'Insufficient permissions to view suspicious access patterns' },
            { status: 403 }
          )
        }

        const suspiciousAccess = await AuditService.detectSuspiciousAccess()

        return NextResponse.json({
          success: true,
          data: suspiciousAccess
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter. Must be one of: integrity, access-logs, retention, suspicious-access' },
          { status: 400 }
        )
    }

  } catch (error) {
    logger.error('Error in audit security API', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/audit/security
 * Perform audit security operations like archiving or cleanup
 * Body parameters:
 * - action: 'archive' | 'cleanup'
 * - table_name: optional table name to target
 * - batch_size: optional batch size for operations (default: 1000)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      logger.warn('Unauthorized audit security operation attempt')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile to check permissions
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      logger.error('Failed to get user profile for audit security operation', profileError)
      return NextResponse.json(
        { error: 'Failed to get user profile' },
        { status: 500 }
      )
    }

    // Check if user can manage retention (admin only)
    if (!AuditPermissionManager.canManageRetention(profile.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to manage audit retention' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action, table_name, batch_size = 1000 } = body

    switch (action) {
      case 'archive':
        const archiveResults = await AuditService.archiveOldAuditLogs(
          table_name || undefined,
          batch_size
        )

        logger.info('Audit logs archived', {
          userId: user.id,
          tableName: table_name,
          batchSize: batch_size,
          results: archiveResults
        })

        return NextResponse.json({
          success: true,
          data: archiveResults,
          message: 'Audit logs archived successfully'
        })

      case 'cleanup':
        const cleanupResults = await AuditService.cleanupOldAuditLogs(
          table_name || undefined,
          batch_size
        )

        logger.info('Audit logs cleaned up', {
          userId: user.id,
          tableName: table_name,
          batchSize: batch_size,
          results: cleanupResults
        })

        return NextResponse.json({
          success: true,
          data: cleanupResults,
          message: 'Audit logs cleaned up successfully'
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter. Must be one of: archive, cleanup' },
          { status: 400 }
        )
    }

  } catch (error) {
    logger.error('Error in audit security operation', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}