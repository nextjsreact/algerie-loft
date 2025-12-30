import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { gdprService } from '@/lib/services/gdpr-compliance'
import { hasPermission } from '@/lib/permissions'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { user_id, reason, deletion_type, retain_financial_records, retain_audit_logs } = await request.json()
    
    // Users can request deletion of their own data, admins can request for any user
    if (user_id !== session.user.id && !hasPermission(session.user.role, 'gdpr', 'manage')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Validate required fields
    if (!reason) {
      return NextResponse.json(
        { error: 'Deletion reason is required' },
        { status: 400 }
      )
    }

    // Create deletion request
    const result = await gdprService.requestDataDeletion({
      user_id,
      requested_by: session.user.id,
      reason,
      deletion_type: deletion_type || 'soft',
      retain_financial_records: retain_financial_records !== false,
      retain_audit_logs: retain_audit_logs !== false,
      requested_at: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      deletion_id: result.deletion_id,
      message: 'Deletion request submitted successfully'
    })

  } catch (error) {
    console.error('GDPR deletion request error:', error)
    return NextResponse.json(
      { error: 'Deletion request failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const status = searchParams.get('status')
    
    // Build query
    let query = gdprService.supabase
      .from('gdpr_deletion_requests')
      .select('*')
      .order('requested_at', { ascending: false })

    // Apply filters based on permissions
    if (hasPermission(session.user.role, 'gdpr', 'manage')) {
      // Admins can see all requests
      if (userId) {
        query = query.eq('user_id', userId)
      }
    } else {
      // Users can only see their own requests
      query = query.eq('user_id', session.user.id)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query.limit(50)

    if (error) {
      throw new Error(`Failed to fetch deletion requests: ${error.message}`)
    }

    return NextResponse.json({
      success: true,
      requests: data || []
    })

  } catch (error) {
    console.error('GDPR deletion requests fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch deletion requests', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Only admins can approve/reject deletion requests
    if (!hasPermission(session.user.role, 'gdpr', 'manage')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { deletion_id, action, rejection_reason } = await request.json()
    
    if (!deletion_id || !action) {
      return NextResponse.json(
        { error: 'Deletion ID and action are required' },
        { status: 400 }
      )
    }

    if (!['approve', 'reject', 'execute'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be approve, reject, or execute' },
        { status: 400 }
      )
    }

    if (action === 'reject' && !rejection_reason) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      )
    }

    let result
    
    if (action === 'execute') {
      // Execute the deletion
      result = await gdprService.executeDataDeletion(deletion_id, session.user.id)
    } else {
      // Update request status
      const { error } = await gdprService.supabase
        .from('gdpr_deletion_requests')
        .update({
          status: action === 'approve' ? 'approved' : 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: session.user.id,
          rejection_reason: action === 'reject' ? rejection_reason : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', deletion_id)

      if (error) {
        throw new Error(`Failed to update deletion request: ${error.message}`)
      }

      result = { success: true, action }
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('GDPR deletion request update error:', error)
    return NextResponse.json(
      { error: 'Failed to update deletion request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}