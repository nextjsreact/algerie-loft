import { NextRequest, NextResponse } from 'next/server';
import { verifySuperuserAPI } from '@/lib/superuser/auth';
import { createClient } from '@/utils/supabase/server';
import type { AuditLogEntry } from '@/types/superuser';

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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

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
      `, { count: 'exact' })
      .order('timestamp', { ascending: false });

    // Apply filters
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

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: logs, error: fetchError, count } = await query;

    if (fetchError) {
      throw fetchError;
    }

    // Transform the data to include user names
    const transformedLogs = (logs || []).map((log: any) => ({
      ...log,
      superuser_name: log.superuser_profiles?.users?.full_name || 'Système',
      target_user_name: log.target_users?.full_name || null,
      timestamp: new Date(log.timestamp)
    }));

    return NextResponse.json({
      logs: transformedLogs,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}