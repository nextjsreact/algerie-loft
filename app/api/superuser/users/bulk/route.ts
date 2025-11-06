import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireSuperuserPermissions } from '@/lib/superuser/auth';
import { logAuditEntry } from '@/lib/superuser/audit';

interface BulkAction {
  type: 'activate' | 'deactivate' | 'delete' | 'change_role';
  userIds: string[];
  newRole?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Verify superuser permissions
    await requireSuperuserPermissions(['USER_MANAGEMENT']);

    const body: BulkAction = await request.json();
    const { type, userIds, newRole } = body;

    if (!type || !userIds || userIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: type and userIds' },
        { status: 400 }
      );
    }

    const supabase = await createClient(true);

    let result;
    let auditDetails: any = {
      action: `bulk_${type}`,
      user_ids: userIds,
      affected_count: userIds.length
    };

    switch (type) {
      case 'activate':
        const { error: activateError } = await supabase
          .from('profiles')
          .update({ is_active: true })
          .in('id', userIds);

        if (activateError) {
          throw new Error(`Failed to activate users: ${activateError.message}`);
        }

        auditDetails.new_status = 'active';
        break;

      case 'deactivate':
        const { error: deactivateError } = await supabase
          .from('profiles')
          .update({ is_active: false })
          .in('id', userIds);

        if (deactivateError) {
          throw new Error(`Failed to deactivate users: ${deactivateError.message}`);
        }

        auditDetails.new_status = 'inactive';
        break;

      case 'delete':
        // Soft delete - mark as deleted instead of actually deleting
        const { error: deleteError } = await supabase
          .from('profiles')
          .update({ 
            is_active: false,
            deleted_at: new Date().toISOString()
          })
          .in('id', userIds);

        if (deleteError) {
          throw new Error(`Failed to delete users: ${deleteError.message}`);
        }

        auditDetails.action = 'bulk_soft_delete';
        break;

      case 'change_role':
        if (!newRole) {
          return NextResponse.json(
            { error: 'newRole is required for change_role action' },
            { status: 400 }
          );
        }

        const { error: roleError } = await supabase
          .from('profiles')
          .update({ role: newRole })
          .in('id', userIds);

        if (roleError) {
          throw new Error(`Failed to change user roles: ${roleError.message}`);
        }

        auditDetails.new_role = newRole;
        break;

      default:
        return NextResponse.json(
          { error: `Unknown bulk action type: ${type}` },
          { status: 400 }
        );
    }

    // Log the bulk action in audit
    await logAuditEntry({
      superuser_id: 'current-superuser-id', // TODO: Get from session
      action_type: 'USER_MANAGEMENT',
      action_details: auditDetails,
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
      timestamp: new Date(),
      severity: 'MEDIUM'
    });

    return NextResponse.json({
      success: true,
      message: `Bulk ${type} completed successfully`,
      affected_users: userIds.length
    });

  } catch (error) {
    console.error('Bulk action error:', error);
    
    if (error.message?.includes('Insufficient permissions')) {
      return NextResponse.json(
        { error: 'Insufficient permissions for bulk user operations' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Bulk action failed' },
      { status: 500 }
    );
  }
}