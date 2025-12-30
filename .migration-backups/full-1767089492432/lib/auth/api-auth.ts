import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { UserRole } from '@/lib/types';
import { validateApiAccess } from './role-utils';

export interface ApiAuthResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    role: UserRole;
    full_name?: string;
  };
  error?: string;
}

/**
 * Authenticate API requests and validate role-based access
 */
export async function authenticateApiRequest(
  request: NextRequest,
  requiredRoles?: UserRole[]
): Promise<ApiAuthResult> {
  try {
    const supabase = await createClient();
    
    // Get user from session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return {
        success: false,
        error: 'Authentication required'
      };
    }

    // Get user profile to determine role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return {
        success: false,
        error: 'Failed to fetch user profile'
      };
    }

    const userRole: UserRole = profile?.role || user.user_metadata?.role || 'guest';
    const fullName = profile?.full_name || user.user_metadata?.full_name;

    // Check role-based access if required roles are specified
    if (requiredRoles && !requiredRoles.includes(userRole)) {
      return {
        success: false,
        error: 'Insufficient permissions'
      };
    }

    // Validate API endpoint access
    const pathname = new URL(request.url).pathname;
    const method = request.method;
    
    if (!validateApiAccess(userRole, pathname, method)) {
      return {
        success: false,
        error: 'Access denied for this endpoint'
      };
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email!,
        role: userRole,
        full_name: fullName
      }
    };

  } catch (error) {
    console.error('API authentication error:', error);
    return {
      success: false,
      error: 'Authentication failed'
    };
  }
}

/**
 * Create authenticated API response with proper error handling
 */
export async function createAuthenticatedApiHandler(
  handler: (request: NextRequest, user: NonNullable<ApiAuthResult['user']>) => Promise<NextResponse>,
  requiredRoles?: UserRole[]
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = await authenticateApiRequest(request, requiredRoles);
    
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || 'Authentication failed' },
        { status: authResult.error === 'Insufficient permissions' ? 403 : 401 }
      );
    }

    try {
      return await handler(request, authResult.user);
    } catch (error) {
      console.error('API handler error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Middleware for protecting API routes
 */
export function withAuth(requiredRoles?: UserRole[]) {
  return function (
    handler: (request: NextRequest, user: NonNullable<ApiAuthResult['user']>) => Promise<NextResponse>
  ) {
    return createAuthenticatedApiHandler(handler, requiredRoles);
  };
}

/**
 * Check if user owns a resource (for scope-based access control)
 */
export async function checkResourceOwnership(
  userId: string,
  resourceType: string,
  resourceId: string
): Promise<boolean> {
  const supabase = await createClient();
  
  try {
    switch (resourceType) {
      case 'loft':
        // For partners, check if they own the loft
        const { data: loft } = await supabase
          .from('lofts')
          .select('owner_id')
          .eq('id', resourceId)
          .single();
        return loft?.owner_id === userId;

      case 'booking':
        // Check if user is either the client or partner for this booking
        const { data: booking } = await supabase
          .from('bookings')
          .select('client_id, partner_id')
          .eq('id', resourceId)
          .single();
        return booking?.client_id === userId || booking?.partner_id === userId;

      case 'partner_profile':
        // Check if user owns the partner profile
        const { data: profile } = await supabase
          .from('partner_profiles')
          .select('user_id')
          .eq('id', resourceId)
          .single();
        return profile?.user_id === userId;

      case 'task':
        // Check if user is assigned to the task
        const { data: task } = await supabase
          .from('tasks')
          .select('user_id, assigned_to')
          .eq('id', resourceId)
          .single();
        return task?.user_id === userId || task?.assigned_to === userId;

      default:
        return false;
    }
  } catch (error) {
    console.error('Resource ownership check error:', error);
    return false;
  }
}

/**
 * Enhanced authentication with resource ownership validation
 */
export async function authenticateWithResourceAccess(
  request: NextRequest,
  resourceType: string,
  resourceId: string,
  requiredRoles?: UserRole[]
): Promise<ApiAuthResult> {
  const authResult = await authenticateApiRequest(request, requiredRoles);
  
  if (!authResult.success || !authResult.user) {
    return authResult;
  }

  // For admin and manager roles, skip ownership check
  if (['admin', 'manager'].includes(authResult.user.role)) {
    return authResult;
  }

  // Check resource ownership for other roles
  const hasAccess = await checkResourceOwnership(
    authResult.user.id,
    resourceType,
    resourceId
  );

  if (!hasAccess) {
    return {
      success: false,
      error: 'Access denied: insufficient permissions for this resource'
    };
  }

  return authResult;
}

/**
 * Create API handler with resource-based access control
 */
export function withResourceAuth(
  resourceType: string,
  getResourceId: (request: NextRequest) => string,
  requiredRoles?: UserRole[]
) {
  return function (
    handler: (request: NextRequest, user: NonNullable<ApiAuthResult['user']>) => Promise<NextResponse>
  ) {
    return async (request: NextRequest): Promise<NextResponse> => {
      const resourceId = getResourceId(request);
      const authResult = await authenticateWithResourceAccess(
        request,
        resourceType,
        resourceId,
        requiredRoles
      );
      
      if (!authResult.success || !authResult.user) {
        return NextResponse.json(
          { error: authResult.error || 'Authentication failed' },
          { status: authResult.error?.includes('insufficient permissions') ? 403 : 401 }
        );
      }

      try {
        return await handler(request, authResult.user);
      } catch (error) {
        console.error('API handler error:', error);
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        );
      }
    };
  };
}