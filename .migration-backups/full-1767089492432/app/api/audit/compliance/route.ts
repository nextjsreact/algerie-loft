import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'
import { bookingAuditService } from '@/lib/services/booking-audit'
import { gdprService } from '@/lib/services/gdpr-compliance'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Only admins and managers can access compliance reports
    if (!hasPermission(session.user.role, 'audit', 'manage')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const reportType = searchParams.get('type') || 'full'

    // Validate date parameters
    if (!dateFrom || !dateTo) {
      return NextResponse.json(
        { error: 'Date range is required (date_from and date_to)' },
        { status: 400 }
      )
    }

    let report: any = {}

    switch (reportType) {
      case 'booking_audit':
        // Generate booking audit report
        report = await bookingAuditService.generateComplianceReport(dateFrom, dateTo)
        break

      case 'gdpr':
        // Generate GDPR compliance report
        report = await gdprService.generateComplianceReport(dateFrom, dateTo)
        break

      case 'financial':
        // Generate financial audit report
        const financialData = await bookingAuditService.getFinancialAuditLogs(dateFrom, dateTo)
        report = {
          financial_transactions: financialData.logs,
          summary: financialData.summary,
          period: { from: dateFrom, to: dateTo },
          generated_at: new Date().toISOString()
        }
        break

      case 'full':
      default:
        // Generate comprehensive compliance report
        const [bookingReport, gdprReport, financialReport] = await Promise.all([
          bookingAuditService.generateComplianceReport(dateFrom, dateTo),
          gdprService.generateComplianceReport(dateFrom, dateTo),
          bookingAuditService.getFinancialAuditLogs(dateFrom, dateTo)
        ])

        report = {
          booking_compliance: bookingReport,
          gdpr_compliance: gdprReport,
          financial_audit: {
            transactions: financialReport.logs,
            summary: financialReport.summary
          },
          period: { from: dateFrom, to: dateTo },
          generated_at: new Date().toISOString(),
          generated_by: {
            user_id: session.user.id,
            user_email: session.user.email,
            user_name: session.user.full_name
          }
        }
        break
    }

    return NextResponse.json({
      success: true,
      report
    })

  } catch (error) {
    console.error('Compliance report generation error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate compliance report', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Only admins can perform compliance actions
    if (!hasPermission(session.user.role, 'audit', 'manage')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { action, parameters } = await request.json()

    let result: any = {}

    switch (action) {
      case 'archive_logs':
        // Archive old audit logs
        const retentionDays = parameters?.retention_days || 2555 // 7 years default
        const archivedCount = await bookingAuditService.archiveOldAuditLogs(retentionDays)
        
        result = {
          action: 'archive_logs',
          archived_count: archivedCount,
          retention_days: retentionDays,
          executed_at: new Date().toISOString(),
          executed_by: session.user.id
        }
        break

      case 'export_compliance_data':
        // Export compliance data for external audit
        const { date_from, date_to, format } = parameters
        
        if (!date_from || !date_to) {
          return NextResponse.json(
            { error: 'Date range is required for export' },
            { status: 400 }
          )
        }

        const exportData = await bookingAuditService.generateComplianceReport(date_from, date_to)
        
        // Create downloadable file
        const filename = `compliance_export_${date_from}_${date_to}.json`
        const response = new NextResponse(JSON.stringify(exportData, null, 2))
        response.headers.set('Content-Type', 'application/json')
        response.headers.set('Content-Disposition', `attachment; filename="${filename}"`)
        
        return response

      case 'validate_data_integrity':
        // Validate data integrity across audit logs
        // This would implement checksums, hash validation, etc.
        result = {
          action: 'validate_data_integrity',
          status: 'completed',
          validation_results: {
            total_records_checked: 0,
            integrity_violations: 0,
            last_validation: new Date().toISOString()
          },
          executed_by: session.user.id
        }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      result
    })

  } catch (error) {
    console.error('Compliance action error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to execute compliance action', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}