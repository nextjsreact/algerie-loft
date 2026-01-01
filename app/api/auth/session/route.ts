import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Cache simple pour les sessions (30 secondes)
const sessionCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_DURATION = 30 * 1000; // 30 secondes

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // SÉCURISÉ : Utiliser getUser() au lieu de getSession()
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { isAuthenticated: false, user: null },
        { 
          status: 200,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }

    const userId = user.id;
    const cacheKey = `session-${userId}`;
    
    // Vérifier le cache
    const cached = sessionCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('📡 Session API: Returning cached user with role:', cached.data.user.role);
      return NextResponse.json(cached.data);
    }

    // Récupérer le profil utilisateur avec timeout
    const profilePromise = supabase
      .from('profiles')
      .select('full_name, role, avatar_url, created_at, updated_at')
      .eq('id', userId)
      .single();

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Profile query timeout')), 3000)
    );

    let profile = null;
    try {
      const { data: profileData } = await Promise.race([profilePromise, timeoutPromise]);
      profile = profileData;
    } catch (error) {
      console.warn('Profile query failed or timed out:', error.message);
      // Continuer avec les données de base de la session
    }

    const userData = {
      id: user.id,
      email: user.email,
      full_name: profile?.full_name || user.user_metadata?.full_name || user.email,
      role: profile?.role || 'client',
      avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url,
      created_at: profile?.created_at || user.created_at,
      updated_at: profile?.updated_at || user.updated_at
    };

    const responseData = {
      isAuthenticated: true,
      user: userData,
      isSuperuser: userData.role === 'admin',
      permissions: getPermissionsForRole(userData.role)
    };

    // Mettre en cache
    sessionCache.set(cacheKey, { data: responseData, timestamp: Date.now() });

    console.log('📡 Session API: Returning user with role:', userData.role);

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'private, max-age=30',
      }
    });
  } catch (error) {
    console.error('Session API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getPermissionsForRole(role: string) {
  const permissions = {
    admin: ['read', 'write', 'delete', 'manage_users', 'view_analytics'],
    manager: ['read', 'write', 'view_analytics'],
    executive: ['read', 'view_analytics'],
    employee: ['read', 'write'],
    client: ['read'],
    member: ['read']
  };
  
  return permissions[role as keyof typeof permissions] || permissions.client;
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

    // Nettoyer le cache
    sessionCache.clear();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}