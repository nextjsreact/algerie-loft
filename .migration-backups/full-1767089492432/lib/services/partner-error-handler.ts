/**
 * Partner-Specific Error Handler
 * 
 * Provides comprehensive error handling for partner dashboard system
 * with user-friendly messages and proper error classification.
 */

import { NextResponse } from 'next/server';
import { PartnerErrorCodes, PartnerError } from '@/types/partner';

export interface PartnerAPIError {
  error: string;
  code: PartnerErrorCodes;
  details?: string;
  field?: string;
  suggestions?: string[];
  timestamp: string;
  request_id?: string;
  redirect_url?: string;
}

export interface PartnerErrorContext {
  operation: string;
  partner_id?: string;
  user_id?: string;
  request_id?: string;
  user_agent?: string;
  ip_address?: string;
  loft_id?: string;
}

export enum PartnerErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export class PartnerErrorHandler {
  
  /**
   * Handle partner not found errors
   */
  static handlePartnerNotFound(context?: PartnerErrorContext): PartnerAPIError {
    const message = 'Partner account not found. Please register as a partner first.';
    const suggestions = [
      'Register for a new partner account',
      'Check if you are logged in with the correct email',
      'Contact support if you believe this is an error'
    ];

    this.logError(
      new Error('Partner not found'),
      PartnerErrorCodes.PARTNER_NOT_FOUND,
      context,
      PartnerErrorSeverity.MEDIUM
    );

    return {
      error: message,
      code: PartnerErrorCodes.PARTNER_NOT_FOUND,
      suggestions,
      timestamp: new Date().toISOString(),
      request_id: context?.request_id,
      redirect_url: '/partner/register'
    };
  }

  /**
   * Handle partner not approved errors
   */
  static handlePartnerNotApproved(context?: PartnerErrorContext): PartnerAPIError {
    const message = 'Your partner account is pending administrative approval.';
    const suggestions = [
      'Wait for admin approval (usually within 24-48 hours)',
      'Check your email for approval notifications',
      'Contact support if your application has been pending for more than 48 hours'
    ];

    this.logError(
      new Error('Partner not approved'),
      PartnerErrorCodes.PARTNER_NOT_APPROVED,
      context,
      PartnerErrorSeverity.LOW
    );

    return {
      error: message,
      code: PartnerErrorCodes.PARTNER_NOT_APPROVED,
      suggestions,
      timestamp: new Date().toISOString(),
      request_id: context?.request_id,
      redirect_url: '/partner/pending'
    };
  }

  /**
   * Handle partner rejected errors
   */
  static handlePartnerRejected(rejectionReason?: string, context?: PartnerErrorContext): PartnerAPIError {
    const message = 'Your partner account application has been rejected.';
    const suggestions = [
      'Review the rejection reason provided',
      'Submit a new application with corrected information',
      'Contact support for clarification on the rejection'
    ];

    if (rejectionReason) {
      suggestions.unshift(`Rejection reason: ${rejectionReason}`);
    }

    this.logError(
      new Error(`Partner rejected: ${rejectionReason || 'No reason provided'}`),
      PartnerErrorCodes.PARTNER_REJECTED,
      context,
      PartnerErrorSeverity.MEDIUM
    );

    return {
      error: message,
      code: PartnerErrorCodes.PARTNER_REJECTED,
      details: rejectionReason,
      suggestions,
      timestamp: new Date().toISOString(),
      request_id: context?.request_id,
      redirect_url: '/partner/rejected'
    };
  }

  /**
   * Handle partner suspended errors
   */
  static handlePartnerSuspended(context?: PartnerErrorContext): PartnerAPIError {
    const message = 'Your partner account has been suspended.';
    const suggestions = [
      'Contact support to understand the reason for suspension',
      'Review our partner terms and conditions',
      'Submit an appeal if you believe this is an error'
    ];

    this.logError(
      new Error('Partner suspended'),
      PartnerErrorCodes.PARTNER_SUSPENDED,
      context,
      PartnerErrorSeverity.HIGH
    );

    return {
      error: message,
      code: PartnerErrorCodes.PARTNER_SUSPENDED,
      suggestions,
      timestamp: new Date().toISOString(),
      request_id: context?.request_id,
      redirect_url: '/partner/suspended'
    };
  }

  /**
   * Handle property not owned errors
   */
  static handlePropertyNotOwned(loftId: string, context?: PartnerErrorContext): PartnerAPIError {
    const message = 'You do not have access to this property.';
    const suggestions = [
      'Check if you are viewing the correct property',
      'Ensure you are logged in with the correct partner account',
      'Contact support if you believe you should have access to this property'
    ];

    this.logError(
      new Error(`Property not owned: ${loftId}`),
      PartnerErrorCodes.PROPERTY_NOT_OWNED,
      { ...context, loft_id: loftId },
      PartnerErrorSeverity.MEDIUM
    );

    return {
      error: message,
      code: PartnerErrorCodes.PROPERTY_NOT_OWNED,
      field: 'loft_id',
      suggestions,
      timestamp: new Date().toISOString(),
      request_id: context?.request_id
    };
  }

  /**
   * Handle insufficient permissions errors
   */
  static handleInsufficientPermissions(operation: string, context?: PartnerErrorContext): PartnerAPIError {
    const message = `You do not have permission to perform this operation: ${operation}`;
    const suggestions = [
      'Check if you are logged in with the correct account',
      'Ensure your partner account has the necessary permissions',
      'Contact support if you believe you should have access'
    ];

    this.logError(
      new Error(`Insufficient permissions for: ${operation}`),
      PartnerErrorCodes.INSUFFICIENT_PERMISSIONS,
      context,
      PartnerErrorSeverity.MEDIUM
    );

    return {
      error: message,
      code: PartnerErrorCodes.INSUFFICIENT_PERMISSIONS,
      suggestions,
      timestamp: new Date().toISOString(),
      request_id: context?.request_id
    };
  }

  /**
   * Handle validation pending errors
   */
  static handleValidationPending(context?: PartnerErrorContext): PartnerAPIError {
    const message = 'Your partner registration is being processed.';
    const suggestions = [
      'Your application is under review',
      'You will receive an email notification once approved',
      'Contact support if you have questions about the process'
    ];

    this.logError(
      new Error('Validation pending'),
      PartnerErrorCodes.VALIDATION_PENDING,
      context,
      PartnerErrorSeverity.LOW
    );

    return {
      error: message,
      code: PartnerErrorCodes.VALIDATION_PENDING,
      suggestions,
      timestamp: new Date().toISOString(),
      request_id: context?.request_id,
      redirect_url: '/partner/pending'
    };
  }

  /**
   * Handle invalid registration data errors
   */
  static handleInvalidRegistrationData(validationErrors: string[], context?: PartnerErrorContext): PartnerAPIError {
    const message = validationErrors.length === 1 
      ? validationErrors[0] 
      : `${validationErrors.length} validation errors occurred`;

    const suggestions = [
      'Please check all required fields',
      'Ensure all information is accurate and complete',
      'Upload valid verification documents',
      'Contact support if you need assistance'
    ];

    this.logError(
      new Error(`Invalid registration data: ${validationErrors.join(', ')}`),
      PartnerErrorCodes.INVALID_REGISTRATION_DATA,
      context,
      PartnerErrorSeverity.LOW
    );

    return {
      error: message,
      code: PartnerErrorCodes.INVALID_REGISTRATION_DATA,
      details: validationErrors.join('; '),
      suggestions,
      timestamp: new Date().toISOString(),
      request_id: context?.request_id
    };
  }

  /**
   * Handle email already exists errors
   */
  static handleEmailAlreadyExists(email: string, context?: PartnerErrorContext): PartnerAPIError {
    const message = 'An account with this email address already exists.';
    const suggestions = [
      'Try logging in instead of registering',
      'Use a different email address',
      'Reset your password if you forgot it',
      'Contact support if you believe this is an error'
    ];

    this.logError(
      new Error(`Email already exists: ${email}`),
      PartnerErrorCodes.EMAIL_ALREADY_EXISTS,
      context,
      PartnerErrorSeverity.LOW
    );

    return {
      error: message,
      code: PartnerErrorCodes.EMAIL_ALREADY_EXISTS,
      field: 'email',
      suggestions,
      timestamp: new Date().toISOString(),
      request_id: context?.request_id,
      redirect_url: '/partner/login'
    };
  }

  /**
   * Handle document upload failed errors
   */
  static handleDocumentUploadFailed(reason?: string, context?: PartnerErrorContext): PartnerAPIError {
    const message = 'Failed to upload verification documents.';
    const suggestions = [
      'Check that your files are in supported formats (PDF, JPG, PNG)',
      'Ensure files are under the maximum size limit',
      'Try uploading files one at a time',
      'Contact support if the problem persists'
    ];

    if (reason) {
      suggestions.unshift(`Upload failed: ${reason}`);
    }

    this.logError(
      new Error(`Document upload failed: ${reason || 'Unknown reason'}`),
      PartnerErrorCodes.DOCUMENT_UPLOAD_FAILED,
      context,
      PartnerErrorSeverity.MEDIUM
    );

    return {
      error: message,
      code: PartnerErrorCodes.DOCUMENT_UPLOAD_FAILED,
      details: reason,
      field: 'verification_documents',
      suggestions,
      timestamp: new Date().toISOString(),
      request_id: context?.request_id
    };
  }

  /**
   * Handle database errors specific to partner operations
   */
  static handlePartnerDatabaseError(error: any, context?: PartnerErrorContext): PartnerAPIError {
    let code = PartnerErrorCodes.PARTNER_NOT_FOUND;
    let message = 'A database error occurred. Please try again.';
    let suggestions: string[] = [];

    // Handle specific PostgreSQL error codes
    if (error.code) {
      switch (error.code) {
        case '23503': // Foreign key violation
          if (error.constraint?.includes('partner')) {
            code = PartnerErrorCodes.PARTNER_NOT_FOUND;
            message = 'Partner account not found or has been removed.';
            suggestions = [
              'Register for a new partner account',
              'Contact support if you believe this is an error'
            ];
          }
          break;

        case '23505': // Unique constraint violation
          if (error.constraint?.includes('email')) {
            return this.handleEmailAlreadyExists(
              error.detail?.match(/\(([^)]+)\)/)?.[1] || 'unknown',
              context
            );
          }
          break;

        default:
          message = 'A database error occurred while processing your partner request.';
          suggestions = [
            'Try again in a moment',
            'Contact support if the problem persists'
          ];
      }
    }

    this.logError(error, code, context, PartnerErrorSeverity.HIGH);

    return {
      error: message,
      code,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      suggestions,
      timestamp: new Date().toISOString(),
      request_id: context?.request_id
    };
  }

  /**
   * Translate PartnerError to PartnerAPIError
   */
  static translatePartnerError(error: PartnerError, context?: PartnerErrorContext): PartnerAPIError {
    switch (error.code) {
      case PartnerErrorCodes.PARTNER_NOT_FOUND:
        return this.handlePartnerNotFound(context);
      
      case PartnerErrorCodes.PARTNER_NOT_APPROVED:
        return this.handlePartnerNotApproved(context);
      
      case PartnerErrorCodes.PARTNER_REJECTED:
        return this.handlePartnerRejected(error.details?.rejection_reason, context);
      
      case PartnerErrorCodes.PARTNER_SUSPENDED:
        return this.handlePartnerSuspended(context);
      
      case PartnerErrorCodes.PROPERTY_NOT_OWNED:
        return this.handlePropertyNotOwned(error.details?.loft_id || 'unknown', context);
      
      case PartnerErrorCodes.INSUFFICIENT_PERMISSIONS:
        return this.handleInsufficientPermissions(error.details?.operation || 'unknown', context);
      
      case PartnerErrorCodes.VALIDATION_PENDING:
        return this.handleValidationPending(context);
      
      case PartnerErrorCodes.INVALID_REGISTRATION_DATA:
        return this.handleInvalidRegistrationData(error.details?.errors || [error.message], context);
      
      case PartnerErrorCodes.EMAIL_ALREADY_EXISTS:
        return this.handleEmailAlreadyExists(error.details?.email || 'unknown', context);
      
      case PartnerErrorCodes.DOCUMENT_UPLOAD_FAILED:
        return this.handleDocumentUploadFailed(error.details?.reason, context);
      
      default:
        return {
          error: error.message || 'An unexpected partner error occurred',
          code: error.code,
          details: error.details ? JSON.stringify(error.details) : undefined,
          suggestions: [
            'Try again in a moment',
            'Contact support if the problem persists'
          ],
          timestamp: new Date().toISOString(),
          request_id: context?.request_id,
          redirect_url: error.redirect_url
        };
    }
  }

  /**
   * Create a standardized partner error response
   */
  static createPartnerErrorResponse(error: PartnerAPIError, statusCode: number = 400): NextResponse {
    const responseBody = {
      success: false,
      ...error,
      status_code: statusCode
    };

    return NextResponse.json(responseBody, { status: statusCode });
  }

  /**
   * Create a partner error response from PartnerError
   */
  static createPartnerErrorResponseFromError(
    error: PartnerError, 
    context?: PartnerErrorContext,
    statusCode: number = 400
  ): NextResponse {
    const apiError = this.translatePartnerError(error, context);
    return this.createPartnerErrorResponse(apiError, statusCode);
  }

  /**
   * Log partner-specific errors
   */
  private static logError(
    error: Error | string,
    code: PartnerErrorCodes,
    context?: PartnerErrorContext,
    severity: PartnerErrorSeverity = PartnerErrorSeverity.MEDIUM
  ): void {
    const errorMessage = error instanceof Error ? error.message : error;
    const stack = error instanceof Error ? error.stack : undefined;

    const logEntry = {
      timestamp: new Date().toISOString(),
      severity,
      code,
      message: errorMessage,
      stack: process.env.NODE_ENV === 'development' ? stack : undefined,
      context: {
        operation: context?.operation || 'unknown',
        partner_id: context?.partner_id,
        user_id: context?.user_id,
        loft_id: context?.loft_id,
        request_id: context?.request_id,
        user_agent: context?.user_agent,
        ip_address: context?.ip_address
      }
    };

    // Log based on severity
    switch (severity) {
      case PartnerErrorSeverity.CRITICAL:
        console.error('[PARTNER CRITICAL ERROR]', logEntry);
        break;
      case PartnerErrorSeverity.HIGH:
        console.error('[PARTNER HIGH ERROR]', logEntry);
        break;
      case PartnerErrorSeverity.MEDIUM:
        console.warn('[PARTNER MEDIUM ERROR]', logEntry);
        break;
      case PartnerErrorSeverity.LOW:
        console.info('[PARTNER LOW ERROR]', logEntry);
        break;
    }

    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to partner-specific error tracking
      // Example: Sentry.captureException(error, { tags: { component: 'partner' }, extra: logEntry });
    }
  }

  /**
   * Generate unique request ID for partner error tracking
   */
  static generateRequestId(): string {
    return `partner_req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Extract partner error context from request
   */
  static extractPartnerErrorContext(request: any, operation: string, partnerId?: string): PartnerErrorContext {
    return {
      operation,
      partner_id: partnerId,
      request_id: this.generateRequestId(),
      user_agent: request.headers?.get('user-agent') || undefined,
      ip_address: request.ip || request.headers?.get('x-forwarded-for') || undefined
    };
  }
}

/**
 * Utility function to create partner success responses
 */
export function createPartnerSuccessResponse(data: any, statusCode: number = 200): NextResponse {
  const responseBody = {
    success: true,
    timestamp: new Date().toISOString(),
    ...data
  };

  return NextResponse.json(responseBody, { status: statusCode });
}

/**
 * Utility function to validate partner registration fields
 */
export function validatePartnerRegistrationFields(data: any): string[] {
  const errors: string[] = [];
  
  // Personal info validation
  if (!data.personal_info?.full_name?.trim()) {
    errors.push('Full name is required');
  }
  
  if (!data.personal_info?.email?.trim()) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.personal_info.email)) {
    errors.push('Valid email address is required');
  }
  
  if (!data.personal_info?.phone?.trim()) {
    errors.push('Phone number is required');
  }
  
  if (!data.personal_info?.address?.trim()) {
    errors.push('Address is required');
  }
  
  // Business info validation
  if (!data.business_info?.business_type) {
    errors.push('Business type is required');
  } else if (!['individual', 'company'].includes(data.business_info.business_type)) {
    errors.push('Business type must be either "individual" or "company"');
  }
  
  if (data.business_info?.business_type === 'company' && !data.business_info?.business_name?.trim()) {
    errors.push('Business name is required for company type');
  }
  
  // Portfolio description validation
  if (!data.portfolio_description?.trim()) {
    errors.push('Portfolio description is required');
  } else if (data.portfolio_description.trim().length < 50) {
    errors.push('Portfolio description must be at least 50 characters');
  }
  
  // Verification documents validation
  if (!data.verification_documents || data.verification_documents.length === 0) {
    errors.push('At least one verification document is required');
  }
  
  return errors;
}