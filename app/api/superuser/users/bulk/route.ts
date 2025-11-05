import { NextRequest, NextResponse } from 'next/server';
import { verifySuperuserAPI, logSuperuserAudit } from '@/lib/superuser/auth';
import { createClient } from '@/utils/supabase/server';
import type { UserRole } from '@/lib/types';

interface BulkAction {
  type: 'activate' | 'deactivate' | 'delete' | 'change_role';
  userIds: string[];
  newRole?: UserRole;
}

export async function POST(request: NextRequest) {
  try {
    // Verify superuser access with user management permissions
    const { authorized, error, superuser } = await verifySuperuserAPI(['USER_MANAGEMENT']);
    if (!authorized || !superuser) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });
    }

    const body: BulkAction = await request.json();
    const { type, userIds, newRole } = body;

    if (!type || !userIds || userIds.length === 0) {
      return NextResponse.json(
        { error: 'Action type and user IDs are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient(true); // Use service role

    let result;
    let auditDetails: Record<string, any> = {
      action: type,
      userIds,
      affectedCount: userIds.length
    };

    switch (type) {
      case 'activate':
        result = await supabase
          .from('users')
          .update({ 
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .in('id', userIds);
        break;

      case 'deactivate':
        result = await supabase
          .from('users')
          .update({ 
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .in('id', userIds);
        break;

      case 'change_role':
        if (!newRole) {
          return NextResponse.json(
            { error: 'New role is required for role change action' },
            { status: 400 }
          );
        }
        
        result = await supabase
          .from('users')
          .update({ 
            role: newRole,
            updated_at: new Date().toISOString()
          })
          .in('id', userIds);
        
        auditDetails.newRole = newRole;
        break;

      case 'delete':
        // First, get user details for audit
        const { data: usersToDelete } = await supabase
          .from('users')
          .select('id, email, full_name, role')
          .in('id', userIds);

        // Delete from users table
        result = await supabase
          .from('users')
          .delete()
          .in('id', userIds);

        // Delete from auth.users
        if (result && !result.error) {
          for (const userId of userIds) {
            await supabase.auth.admin.deleteUser(userId);
          }
        }

        auditDetails.deletedUsers = usersToDelete;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action type' },
          { status: 400 }
        );
    }

    if (result?.error) {
      throw result.error;
    }

    // Log audit entry
    await logSuperuserAudit(
      'USER_MANAGEMENT',
      auditDetails,
      {
        severity: type === 'delete' ? 'HIGH' : 'MEDIUM',
        metadata: {
          bulkAction: true,
          actionType: type
        }
      }
    );

    return NextResponse.json({ 
      success: true, 
      message: `Bulk ${type} completed successfully`,
      affectedCount: userIds.length
    });

  } catch (error) {
    console.error('Error performing bulk action:', error);
    return NextResponse.json(
      { error: 'Bulk action failed' },
      { status: 500 }
    );
  }
}