/**
 * API Security Helpers
 * Provides easy-to-use security middleware functions for API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';
import {
  partnerSecurityMiddleware,
  validatePartnerOwnership,
  extractSecurityContext,
  logSecurityEvent,
  partnerRegistrationSchema,
  partnerProfileUpdateSchema,
  adminValidationSchema,
  propertyAccessSchema
} from './partner-security';

// =====================================================
// API ROUTE SECURITY DECORATORS
// =====================================================

/**
 * Secure API route wrapper with partner authentication and validation
 */
export function withPartnerSecurity(
  handler: (request: NextRequest, context: any) => Promise<NextResponse>,
  options: {
    endpoint: string;
    validationSchema?: z.ZodSchema;
    securityLevel?: 'low' | 'medium' | 'high' | 'critical';
    requireApprovedPartner?: boolean;
    requireOwnership?: {
      resourceType: 'loft' | 'reservation' | 'transaction';
      resourceIdParam: string;
    };
  }
) {
  return async (request: NextRequest, context: any): Promise<NextResponse> => {
    try {
      // Apply security middleware
      const securityResponse = await partnerSecurityMiddleware(
        request,
        options.endpoint,
        options.validationSchema,
        options.securityLevel
      );
      
      if (securityResponse) {
        return securityResponse;
      }
      
      // Create Supabase client
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get: (name: string) => request.cookies.get(name)?.value,
            set: () => {},
            remove: () => {}
          }
        }
      );
      
      // Extract security context
      const securityContext = extractSecurityContext(request);
      
      // Verify partner authentication
      if (!securityContext.partnerId || !securityContext.userId) {
        await logSecurityEvent(supabase, securityContext, {
          type: 'access_denied',
          description: 'Missing partner authentication',
          severity: 'medium',
          metadata: { endpoint: options.endpoint }
        });
        
        return NextResponse.json(
          { error: 'Partner authentication required' },
          { status: 401 }
        );
      }
      
      // Check if approved partner is required
      if (options.requireApprovedPartner && securityContext.partnerStatus !== 'approved') {
        await logSecurityEvent(supabase, securityContext, {
          type: 'access_denied',
          description: 'Partner not approved',
          severity: 'medium',
          metadata: { 
            endpoint: options.endpoint,
            partnerStatus: securityContext.partnerStatus
          }
        });
        
        return NextResponse.json(
          { error: 'Partner approval required' },
          { status: 403 }
        );
      }
      
      // Check resource ownership if required
      if (options.requireOwnership) {
        const resourceId = context.params?.[options.requireOwnership.resourceIdParam];
        if (!resourceId) {
          return NextResponse.json(
            { error: 'Resource ID required' },
            { status: 400 }
          );
        }
        
        const ownershipResult = await validatePartnerOwnership(
          supabase,
          securityContext.partnerId,
          options.requireOwnership.resourceType,
          resourceId
        );
        
        if (!ownershipResult.isValid) {
          await logSecurityEvent(supabase, securityContext, {
            type: 'access_denied',
            description: ownershipResult.error || 'Resource ownership validation failed',
            severity: 'high',
            metadata: { 
              endpoint: options.endpoint,
              resourceType: options.requireOwnership.resourceType,
              resourceId
            }
          });
          
          return NextResponse.json(
            { error: ownershipResult.error || 'Access denied' },
            { status: 403 }
          );
        }
      }
      
      // Add security context to the handler context
      const enhancedContext = {
        ...context,
        security: securityContext,
        supabase
      };
      
      // Call the original handler
      return await handler(request, enhancedContext);
      
    } catch (error) {
      console.error('Security middleware error:', error);
      
      // Log security error
      try {
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              get: (name: string) => request.cookies.get(name)?.value,
              set: () => {},
              remove: () => {}
            }
          }
        );
        
        await logSecurityEvent(supabase, extractSecurityContext(request), {
          type: 'suspicious_activity',
          description: 'Security middleware error',
          severity: 'critical',
          metadata: { 
            endpoint: options.endpoint,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        });
      } catch (logError) {
        console.error('Failed to log security error:', logError);
      }
      
      return NextResponse.json(
        { error: 'Internal security error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Admin-only API route wrapper
 */
export function withAdminSecurity(
  handler: (request: NextRequest, context: any) => Promise<NextResponse>,
  options: {
    endpoint: string;
    validationSchema?: z.ZodSchema;
    securityLevel?: 'low' | 'medium' | 'high' | 'critical';
  }
) {
  return async (request: NextRequest, context: any): Promise<NextResponse> => {
    try {
      // Apply security middleware
      const securityResponse = await partnerSecurityMiddleware(
        request,
        options.endpoint,
        options.validationSchema,
        options.securityLevel
      );
      
      if (securityResponse) {
        return securityResponse;
      }
      
      // Create Supabase client
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get: (name: string) => request.cookies.get(name)?.value,
            set: () => {},
            remove: () => {}
          }
        }
      );
      
      // Extract security context
      const securityContext = extractSecurityContext(request);
      
      // Verify admin authentication
      if (!securityContext.userId) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      
      // Check admin role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', securityContext.userId)
        .single();
      
      if (profileError || !profile || !['admin', 'manager'].includes(profile.role)) {
        await logSecurityEvent(supabase, securityContext, {
          type: 'access_denied',
          description: 'Admin access required',
          severity: 'high',
          metadata: { 
            endpoint: options.endpoint,
            userRole: profile?.role || 'unknown'
          }
        });
        
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
      
      // Add security context to the handler context
      const enhancedContext = {
        ...context,
        security: { ...securityContext, isAdmin: true },
        supabase
      };
      
      // Call the original handler
      return await handler(request, enhancedContext);
      
    } catch (error) {
      console.error('Admin security middleware error:', error);
      return NextResponse.json(
        { error: 'Internal security error' },
        { status: 500 }
      );
    }
  };
}

// =====================================================
// SPECIFIC ENDPOINT SECURITY HELPERS
// =====================================================

/**
 * Partner registration endpoint security
 */
export const withPartnerRegistrationSecurity = (
  handler: (request: NextRequest, context: any) => Promise<NextResponse>
) => withPartnerSecurity(handler, {
  endpoint: 'partner-register',
  validationSchema: partnerRegistrationSchema,
  securityLevel: 'high',
  requireApprovedPartner: false
});

/**
 * Partner profile update endpoint security
 */
export const withPartnerProfileSecurity = (
  handler: (request: NextRequest, context: any) => Promise<NextResponse>
) => withPartnerSecurity(handler, {
  endpoint: 'partner-dashboard',
  validationSchema: partnerProfileUpdateSchema,
  securityLevel: 'medium',
  requireApprovedPartner: true
});

/**
 * Partner dashboard data endpoint security
 */
export const withPartnerDashboardSecurity = (
  handler: (request: NextRequest, context: any) => Promise<NextResponse>
) => withPartnerSecurity(handler, {
  endpoint: 'partner-dashboard',
  securityLevel: 'medium',
  requireApprovedPartner: true
});

/**
 * Partner properties endpoint security
 */
export const withPartnerPropertiesSecurity = (
  handler: (request: NextRequest, context: any) => Promise<NextResponse>
) => withPartnerSecurity(handler, {
  endpoint: 'partner-properties',
  validationSchema: propertyAccessSchema,
  securityLevel: 'medium',
  requireApprovedPartner: true
});

/**
 * Partner property details endpoint security
 */
export const withPartnerPropertyDetailsSecurity = (
  handler: (request: NextRequest, context: any) => Promise<NextResponse>
) => withPartnerSecurity(handler, {
  endpoint: 'partner-properties',
  securityLevel: 'medium',
  requireApprovedPartner: true,
  requireOwnership: {
    resourceType: 'loft',
    resourceIdParam: 'loftId'
  }
});

/**
 * Partner revenue endpoint security
 */
export const withPartnerRevenueSecurity = (
  handler: (request: NextRequest, context: any) => Promise<NextResponse>
) => withPartnerSecurity(handler, {
  endpoint: 'partner-revenue',
  securityLevel: 'high',
  requireApprovedPartner: true
});

/**
 * Admin partner validation endpoint security
 */
export const withAdminPartnerValidationSecurity = (
  handler: (request: NextRequest, context: any) => Promise<NextResponse>
) => withAdminSecurity(handler, {
  endpoint: 'admin-partner-actions',
  validationSchema: adminValidationSchema,
  securityLevel: 'critical'
});

/**
 * Admin partner management endpoint security
 */
export const withAdminPartnerManagementSecurity = (
  handler: (request: NextRequest, context: any) => Promise<NextResponse>
) => withAdminSecurity(handler, {
  endpoint: 'admin-partner-actions',
  securityLevel: 'high'
});

// =====================================================
// UTILITY FUNCTIONS FOR API ROUTES
// =====================================================

/**
 * Extract partner context from secured request
 */
export function getPartnerContext(context: any) {
  return {
    partnerId: context.security?.partnerId,
    userId: context.security?.userId,
    partnerStatus: context.security?.partnerStatus,
    isAdmin: context.security?.isAdmin || false,
    supabase: context.supabase
  };
}

/**
 * Log partner API access
 */
export async function logPartnerApiAccess(
  supabase: any,
  context: any,
  endpoint: string,
  method: string,
  success: boolean,
  responseTime?: number
) {
  try {
    await supabase.rpc('log_property_access', {
      p_user_id: context.security?.userId,
      p_partner_id: context.security?.partnerId,
      p_loft_id: null,
      p_access_type: 'API',
      p_access_granted: success,
      p_denial_reason: success ? null : 'API access failed',
      p_ip_address: context.security?.ipAddress,
      p_user_agent: context.security?.userAgent,
      p_request_path: endpoint,
      p_response_time_ms: responseTime
    });
  } catch (error) {
    console.error('Failed to log API access:', error);
  }
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  message: string,
  status: number = 400,
  details?: any
): NextResponse {
  return NextResponse.json(
    {
      error: message,
      ...(details && { details }),
      timestamp: new Date().toISOString()
    },
    { status }
  );
}

/**
 * Create standardized success response
 */
export function createSuccessResponse(
  data: any,
  message?: string,
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
      timestamp: new Date().toISOString()
    },
    { status }
  );
}

// Export commonly used schemas
export {
  partnerRegistrationSchema,
  partnerProfileUpdateSchema,
  adminValidationSchema,
  propertyAccessSchema
};