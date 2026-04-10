import { NextRequest, NextResponse } from 'next/server';
import { verifySuperuserAPI, logSuperuserAudit } from '@/lib/superuser/auth';
import { createClient } from '@/utils/supabase/server';
import type { UserRole } from '@/lib/types';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    // Verify superuser access with user management permissions
    const { authorized, error } = await verifySuperuserAPI(['USER_MANAGEMENT']);
    if (!authorized) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, email, role, is_active, email_verified, password, is_staff, team } = body;

    const supabase = await createClient(true); // Use service role

    // Get current user data for audit
    const { data: currentUser, error: currentUserError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (currentUserError || !currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user profile
    const { data: updatedUser, error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: name,
        email,
        role,
        is_staff: is_staff ?? false,
        team: team ?? null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Profile update error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Update auth user metadata only if email or password changed
    if (email !== currentUser.email || (password && password.trim())) {
      const authUpdateData: any = { user_metadata: { full_name: name, role } }
      if (email !== currentUser.email) authUpdateData.email = email
      if (password && password.trim()) authUpdateData.password = password
      const { error: authErr } = await supabase.auth.admin.updateUserById(userId, authUpdateData)
      if (authErr) console.error('Auth update error (non-blocking):', authErr)
    }

    // Log audit entry (non-blocking)
    const changes: Record<string, any> = {};
    if (name !== currentUser.full_name) changes.name = { from: currentUser.full_name, to: name };
    if (email !== currentUser.email) changes.email = { from: currentUser.email, to: email };
    if (role !== currentUser.role) changes.role = { from: currentUser.role, to: role };
    if (is_staff !== currentUser.is_staff) changes.is_staff = { from: currentUser.is_staff, to: is_staff };
    if (team !== currentUser.team) changes.team = { from: currentUser.team, to: team };
    if (password && password.trim()) changes.password = { changed: true };

    logSuperuserAudit(
      'USER_MANAGEMENT',
      { action: 'user_update', targetUserId: userId, changes },
      { targetUserId: userId, severity: 'MEDIUM', metadata: { actionType: 'user_update', fieldsChanged: Object.keys(changes) } }
    ).catch(err => console.error('Audit log failed (non-blocking):', err))

    return NextResponse.json({ 
      user: updatedUser,
      message: 'User updated successfully'
    });

  } catch (error) {
    console.error('Error updating user:', JSON.stringify(error))
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    // Verify superuser access with user management permissions
    const { authorized, error } = await verifySuperuserAPI(['USER_MANAGEMENT']);
    if (!authorized) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient(true); // Use service role

    // Get user details for audit
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete from profiles table
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (deleteError) {
      throw deleteError;
    }

    // Delete from auth.users
    await supabase.auth.admin.deleteUser(userId);

    // Log audit entry
    await logSuperuserAudit(
      'USER_MANAGEMENT',
      {
        action: 'user_delete',
        targetUserId: userId,
        deletedUser: {
          email: user.email,
          full_name: user.full_name,
          role: user.role
        }
      },
      {
        targetUserId: userId,
        severity: 'HIGH',
        metadata: {
          actionType: 'user_delete'
        }
      }
    );

    return NextResponse.json({ 
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}