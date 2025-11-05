import { NextRequest, NextResponse } from 'next/server';
import { verifySuperuserAPI, logSuperuserAudit } from '@/lib/superuser/auth';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Verify superuser access with audit access permissions
    const { authorized, error } = await verifySuperuserAPI(['AUDIT_ACCESS']);
    if (!authorized) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const actionType = searchParams.get('actionType');
    const severity = searchParams.get('severity');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const targetUserId = searchParams.get('targetUserId');

    const supabase = await createClient(true); // Use service role

    let query = supabase
      .from('audit_logs')
      .select(`
        *,
        superuser_profiles!inner(
          users!inner(
            full_name
          )
        ),
        target_users:users!audit_logs_target_user_id_fkey(
          full_name
        )
      `)
      .order('timestamp', { ascending: false });

    // Apply same filters as the main query
    if (search) {
      query = query.or(`action_details.cs.${JSON.stringify({ search })},target_resource.ilike.%${search}%`);
    }

    if (actionType && actionType !== 'all') {
      query = query.eq('action_type', actionType);
    }

    if (severity && severity !== 'all') {
      query = query.eq('severity', severity);
    }

    if (dateFrom) {
      query = query.gte('timestamp', dateFrom);
    }

    if (dateTo) {
      query = query.lte('timestamp', dateTo);
    }

    if (targetUserId) {
      query = query.eq('target_user_id', targetUserId);
    }

    // Limit export to prevent memory issues
    query = query.limit(10000);

    const { data: logs, error: fetchError } = await query;

    if (fetchError) {
      throw fetchError;
    }

    // Generate CSV content
    const csvHeaders = [
      'Timestamp',
      'Action Type',
      'Severity',
      'Superuser',
      'Target User',
      'Target Resource',
      'IP Address',
      'User Agent',
      'Action Details',
      'Session ID',
      'Request ID'
    ];

    const csvRows = (logs || []).map((log: any) => [
      new Date(log.timestamp).toISOString(),
      log.action_type,
      log.severity,
      log.superuser_profiles?.users?.full_name || 'Système',
      log.target_users?.full_name || '',
      log.target_resource || '',
      log.ip_address,
      log.user_agent,
      JSON.stringify(log.action_details),
      log.session_id,
      log.request_id || ''
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => 
        row.map(field => 
          typeof field === 'string' && field.includes(',') 
            ? `"${field.replace(/"/g, '""')}"` 
            : field
        ).join(',')
      )
    ].join('\n');

    // Log the export action
    await logSuperuserAudit(
      'AUDIT_ACCESS',
      {
        action: 'export_audit_logs',
        exportedCount: logs?.length || 0,
        filters: {
          search,
          actionType,
          severity,
          dateFrom,
          dateTo,
          targetUserId
        }
      },
      {
        severity: 'MEDIUM',
        metadata: {
          exportType: 'csv',
          recordCount: logs?.length || 0
        }
      }
    );

    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error) {
    console.error('Error exporting audit logs:', error);
    return NextResponse.json(
      { error: 'Export failed' },
      { status: 500 }
    );
  }
}