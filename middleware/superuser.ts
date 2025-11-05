import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { 
  SuperuserMiddlewareConfig, 
  SuperuserPermission, 
  SuperuserProfile,
  SuperuserSession 
} from '@/types/superuser';
import type { UserRole } from '@/lib/types';

const SUPERUSER_CONFIG: SuperuserMiddlewareConfig = {
  superuserRoutes: [
    '/admin/superuser',
    '/admin/superuser/dashboard',
    '/admin/superuser/users',
    '/admin/superuser/backup',
    '/admin/superuser/audit',
    '/admin/superuser/system',
    '/admin/superuser/maintenance',
    '/admin/superuser/security'
  ],
  permissionRequirements: {
    '/admin/superuser/dashboard': [],
    '/admin/superuser/users': ['USER_MANAGEMENT'],
    '/admin/superuser/backup': ['BACKUP_MANAGEMENT'],
    '/admin/superuser/audit': ['AUDIT_ACCESS'],
    '/admin/superuser/system': ['SYSTEM_CONFIG'],
    '/admin/superuser/maintenance': ['MAINTENANCE_TOOLS'],
    '/admin/superuser/security': ['SECURITY_MONITORING']
  },
  sessionTimeoutMinutes: 30,
  requireMFAForCriticalActions: true,
  allowedIpRanges: [] // Empty means all IPs allowed
};

export async function superuserMiddleware(request: NextRequest): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;
  const locale = pathname.split('/')[1];
  const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';
  
  console.log(`[SUPERUSER MIDDLEWARE] Processing: ${pathname} (without locale: ${pathWithoutLocale})`);

  // Check if this is a superuser route
  if (!isSuperuserRoute(pathWithoutLocale)) {
    return NextResponse.next();
  }

  // Create Supabase client for middleware
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  try {
    // Get user session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log(`[SUPERUSER MIDDLEWARE] No valid session, redirecting to login`);
      await logSecurityEvent(supabase, 'UNAUTHORIZED_ACCESS', 'No valid session for superuser route', {
        path: pathWithoutLocale,
        ip: getClientIP(request),
        userAgent: request.headers.get('user-agent') || 'unknown'
      });
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }

    // Get user profile to verify admin role first
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const userRole: UserRole = profile?.role || user.user_metadata?.role || 'guest';
    
    if (userRole !== 'admin') {
      console.log(`[SUPERUSER MIDDLEWARE] User is not admin (role: ${userRole}), access denied`);
      await logSecurityEvent(supabase, 'UNAUTHORIZED_ACCESS', 'Non-admin user attempted superuser access', {
        userId: user.id,
        userRole,
        path: pathWithoutLocale,
        ip: getClientIP(request),
        userAgent: request.headers.get('user-agent') || 'unknown'
      });
      return NextResponse.redirect(new URL(`/${locale}/unauthorized`, request.url));
    }

    // Check superuser profile
    const { data: superuserProfile, error: superuserError } = await supabase
      .from('superuser_profiles')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (superuserError || !superuserProfile) {
      console.log(`[SUPERUSER MIDDLEWARE] No active superuser profile found`);
      await logSecurityEvent(supabase, 'UNAUTHORIZED_ACCESS', 'Admin user without superuser profile attempted access', {
        userId: user.id,
        path: pathWithoutLocale,
        ip: getClientIP(request),
        userAgent: request.headers.get('user-agent') || 'unknown'
      });
      return NextResponse.redirect(new URL(`/${locale}/unauthorized`, request.url));
    }

    // Check IP restrictions if configured
    const clientIP = getClientIP(request);
    if (superuserProfile.ip_restrictions && superuserProfile.ip_restrictions.length > 0) {
      const isAllowedIP = superuserProfile.ip_restrictions.some(allowedIP => 
        clientIP === allowedIP || clientIP.startsWith(allowedIP.replace('*', ''))
      );
      
      if (!isAllowedIP) {
        console.log(`[SUPERUSER MIDDLEWARE] IP ${clientIP} not in allowed list`);
        await logSecurityEvent(supabase, 'UNAUTHORIZED_ACCESS', 'Superuser access from unauthorized IP', {
          userId: user.id,
          clientIP,
          allowedIPs: superuserProfile.ip_restrictions,
          path: pathWithoutLocale,
          userAgent: request.headers.get('user-agent') || 'unknown'
        });
        return NextResponse.redirect(new URL(`/${locale}/unauthorized`, request.url));
      }
    }

    // Check or create superuser session
    const sessionToken = request.cookies.get('superuser-session')?.value;
    let superuserSession: SuperuserSession | null = null;

    if (sessionToken) {
      const { data: existingSession } = await supabase
        .from('superuser_sessions')
        .select('*')
        .eq('session_token', sessionToken)
        .eq('superuser_id', superuserProfile.id)
        .eq('is_active', true)
        .gte('expires_at', new Date().toISOString())
        .single();

      if (existingSession) {
        superuserSession = existingSession;
        
        // Update last activity
        await supabase
          .from('superuser_sessions')
          .update({ 
            last_activity: new Date().toISOString(),
            expires_at: new Date(Date.now() + superuserProfile.session_timeout_minutes * 60 * 1000).toISOString()
          })
          .eq('id', existingSession.id);
      }
    }

    // Create new session if none exists or expired
    if (!superuserSession) {
      const newSessionToken = generateSessionToken();
      const expiresAt = new Date(Date.now() + superuserProfile.session_timeout_minutes * 60 * 1000);
      
      const { data: newSession, error: sessionError } = await supabase
        .from('superuser_sessions')
        .insert({
          superuser_id: superuserProfile.id,
          session_token: newSessionToken,
          ip_address: clientIP,
          user_agent: request.headers.get('user-agent') || 'unknown',
          started_at: new Date().toISOString(),
          last_activity: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          is_active: true,
          mfa_verified: !superuserProfile.require_mfa
        })
        .select()
        .single();

      if (sessionError || !newSession) {
        console.error(`[SUPERUSER MIDDLEWARE] Failed to create session:`, sessionError);
        return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
      }

      superuserSession = newSession;
      
      // Set session cookie
      response.cookies.set('superuser-session', newSessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: superuserProfile.session_timeout_minutes * 60
      });
    }

    // Check MFA requirement for critical actions
    const requiredPermissions = getRequiredPermissionsForRoute(pathWithoutLocale);
    const isCriticalAction = requiredPermissions.some(perm => 
      ['USER_MANAGEMENT', 'BACKUP_MANAGEMENT', 'SYSTEM_CONFIG'].includes(perm)
    );

    if (superuserProfile.require_mfa && isCriticalAction && !superuserSession.mfa_verified) {
      console.log(`[SUPERUSER MIDDLEWARE] MFA required for critical action`);
      return NextResponse.redirect(new URL(`/${locale}/admin/superuser/mfa-verify?return=${encodeURIComponent(pathname)}`, request.url));
    }

    // Check permissions for the specific route
    if (requiredPermissions.length > 0) {
      const hasPermission = requiredPermissions.every(perm => 
        superuserProfile.permissions.includes(perm)
      );
      
      if (!hasPermission) {
        console.log(`[SUPERUSER MIDDLEWARE] Insufficient permissions for ${pathWithoutLocale}`);
        await logSecurityEvent(supabase, 'UNAUTHORIZED_ACCESS', 'Insufficient superuser permissions', {
          userId: user.id,
          superuserId: superuserProfile.id,
          requiredPermissions,
          userPermissions: superuserProfile.permissions,
          path: pathWithoutLocale,
          ip: clientIP,
          userAgent: request.headers.get('user-agent') || 'unknown'
        });
        return NextResponse.redirect(new URL(`/${locale}/admin/superuser/insufficient-permissions`, request.url));
      }
    }

    // Log successful access
    await logAuditEntry(supabase, {
      superuser_id: superuserProfile.id,
      action_type: 'SECURITY',
      action_details: {
        action: 'route_access',
        path: pathWithoutLocale,
        permissions_checked: requiredPermissions
      },
      ip_address: clientIP,
      user_agent: request.headers.get('user-agent') || 'unknown',
      timestamp: new Date(),
      severity: 'LOW',
      session_id: superuserSession.id
    });

    // Add superuser information to request headers for downstream use
    response.headers.set('x-superuser-id', superuserProfile.id);
    response.headers.set('x-superuser-session', superuserSession.id);
    response.headers.set('x-superuser-permissions', JSON.stringify(superuserProfile.permissions));
    response.headers.set('x-user-id', user.id);

    console.log(`[SUPERUSER MIDDLEWARE] Access granted for superuser ${superuserProfile.id}`);
    return response;

  } catch (error) {
    console.error('[SUPERUSER MIDDLEWARE] Error:', error);
    await logSecurityEvent(supabase, 'UNAUTHORIZED_ACCESS', 'Middleware error during superuser authentication', {
      error: error instanceof Error ? error.message : 'Unknown error',
      path: pathWithoutLocale,
      ip: getClientIP(request),
      userAgent: request.headers.get('user-agent') || 'unknown'
    });
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }
}

function isSuperuserRoute(pathname: string): boolean {
  return SUPERUSER_CONFIG.superuserRoutes.some(route => {
    if (route.endsWith('*')) {
      return pathname.startsWith(route.slice(0, -1));
    }
    return pathname === route || pathname.startsWith(route + '/');
  });
}

function getRequiredPermissionsForRoute(pathname: string): SuperuserPermission[] {
  // Find the most specific route match
  const matchingRoutes = Object.keys(SUPERUSER_CONFIG.permissionRequirements)
    .filter(route => pathname.startsWith(route))
    .sort((a, b) => b.length - a.length);

  if (matchingRoutes.length === 0) {
    return [];
  }

  const mostSpecificRoute = matchingRoutes[0];
  return SUPERUSER_CONFIG.permissionRequirements[mostSpecificRoute];
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return request.ip || 'unknown';
}

function generateSessionToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function logSecurityEvent(
  supabase: any,
  alertType: string,
  description: string,
  metadata: Record<string, any>
): Promise<void> {
  try {
    await supabase
      .from('security_alerts')
      .insert({
        alert_type: alertType,
        severity: 'HIGH',
        description,
        source_ip: metadata.ip || 'unknown',
        user_id: metadata.userId,
        metadata,
        resolved: false,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

async function logAuditEntry(
  supabase: any,
  entry: Omit<AuditLogEntry, 'id'>
): Promise<void> {
  try {
    await supabase
      .from('audit_logs')
      .insert({
        ...entry,
        timestamp: entry.timestamp.toISOString()
      });
  } catch (error) {
    console.error('Failed to log audit entry:', error);
  }
}

// Utility functions for superuser authentication
export function getSuperuserRedirectUrl(locale: string = 'fr'): string {
  return `/${locale}/admin/superuser/dashboard`;
}

export function canSuperuserAccessRoute(pathname: string, permissions: SuperuserPermission[]): boolean {
  if (!isSuperuserRoute(pathname)) {
    return false;
  }
  
  const requiredPermissions = getRequiredPermissionsForRoute(pathname);
  return requiredPermissions.every(perm => permissions.includes(perm));
}

// Middleware helper to extract superuser info from request headers
export function getSuperuserInfoFromHeaders(request: NextRequest) {
  const permissionsHeader = request.headers.get('x-superuser-permissions');
  return {
    superuserId: request.headers.get('x-superuser-id'),
    sessionId: request.headers.get('x-superuser-session'),
    permissions: permissionsHeader ? JSON.parse(permissionsHeader) as SuperuserPermission[] : [],
    userId: request.headers.get('x-user-id')
  };
}

export { SUPERUSER_CONFIG };