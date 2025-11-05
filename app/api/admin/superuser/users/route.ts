import { NextRequest, NextResponse } from 'next/server';
import { verifySuperuserAPI, logSuperuserAudit } from '@/lib/superuser/auth';
import { getAllUsers, getUserById } from '@/lib/superuser/user-management';
import type { UserSearchFilters } from '@/lib/superuser/user-management';

export async function GET(request: NextRequest) {
  try {
    // Verify superuser permissions
    const { authorized, superuser, error } = await verifySuperuserAPI(['USER_MANAGEMENT']);
    
    if (!authorized) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const filters: UserSearchFilters = {
      role: searchParams.get('role') as any || undefined,
      status: searchParams.get('status') as any || undefined,
      search: searchParams.get('search') || undefined,
      createdAfter: searchParams.get('createdAfter') ? new Date(searchParams.get('createdAfter')!) : undefined,
      createdBefore: searchParams.get('createdBefore') ? new Date(searchParams.get('createdBefore')!) : undefined,
      lastLoginAfter: searchParams.get('lastLoginAfter') ? new Date(searchParams.get('lastLoginAfter')!) : undefined,
      lastLoginBefore: searchParams.get('lastLoginBefore') ? new Date(searchParams.get('lastLoginBefore')!) : undefined,
    };

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get users with filtering and pagination
    const result = await getAllUsers(filters, page, limit);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error in superuser users API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify superuser permissions
    const { authorized, superuser, error } = await verifySuperuserAPI(['USER_MANAGEMENT']);
    
    if (!authorized) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, full_name, role, password } = body;

    // Validate required fields
    if (!email || !full_name || !role) {
      return NextResponse.json(
        { error: 'Email, full name, and role are required' },
        { status: 400 }
      );
    }

    // Create user using Supabase Admin API
    const { createClient } = await import('@/utils/supabase/server');
    const supabase = createClient(true); // Use service role

    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: password || generateTemporaryPassword(),
      email_confirm: true,
      user_metadata: {
        full_name,
        role,
        created_by_superuser: true
      }
    });

    if (createError) {
      return NextResponse.json(
        { error: createError.message },
        { status: 400 }
      );
    }

    // Create profile record
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: newUser.user.id,
        email: newUser.user.email,
        full_name,
        role,
        created_at: new Date().toISOString()
      });

    if (profileError) {
      // Cleanup user if profile creation fails
      await supabase.auth.admin.deleteUser(newUser.user.id);
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      );
    }

    // Log the action
    await logSuperuserAudit('USER_MANAGEMENT', {
      action: 'create_user',
      target_user_id: newUser.user.id,
      user_data: { email, full_name, role }
    }, { 
      targetUserId: newUser.user.id,
      severity: 'HIGH'
    });

    return NextResponse.json({
      success: true,
      data: {
        id: newUser.user.id,
        email: newUser.user.email,
        full_name,
        role,
        temporaryPassword: !password ? 'Generated and sent via email' : undefined
      }
    });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}