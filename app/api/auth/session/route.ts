import { NextRequest, NextResponse } from 'next/server';
import { getEnhancedSession } from '@/lib/auth/enhanced-auth';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Use our enhanced authentication system
    const session = await getEnhancedSession();

    if (!session) {
      return NextResponse.json(
        { isAuthenticated: false, user: null },
        { status: 200 }
      );
    }

    console.log('📡 Session API: Returning user with role:', session.user.role);

    return NextResponse.json({
      isAuthenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        full_name: session.user.full_name,
        role: session.user.role, // This will now be 'superuser' if detected correctly
        avatar_url: session.user.avatar_url,
        created_at: session.user.created_at,
        updated_at: session.user.updated_at
      },
      isSuperuser: session.isSuperuser,
      permissions: session.permissions,
      token: session.token
    });
  } catch (error) {
    console.error('Session API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to sign out', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}