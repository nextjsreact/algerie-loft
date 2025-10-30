/**
 * Enhanced Error Handler for Reservation System
 * 
 * Provides comprehensive error classification, user-friendly error messages,
 * and standardized error response formatting for the reservation API.
 */

import { NextResponse } from 'next/server';

export interface APIError {
  error: string;
  code: string;
  details?: string;
  field?: string;
  suggestions?: string[];
  timestamp: string;
  request_id?: string;
}

export interface ErrorContext {
  operation: string;
  loft_id?: string;
  user_id?: string;
  request_id?: string;
  user_agent?: string;
  ip_address?: string;
}

/**
 * Error codes for reservation operations
 */
export enum ErrorCodes {
  // Validation Errors
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  MISSING_REQUIRED_FIELDS = 'MISSING_REQUIRED_FIELDS',
  INVALID_DATE_FORMAT = 'INVALID_DATE_FORMAT',
  INVALID_DATE_RANGE = 'INVALID_DATE_RANGE',
  INVALID_GUEST_COUNT = 'INVALID_GUEST_COUNT',
  INVALID_GUEST_INFO = 'INVALID_GUEST_INFO',
  INVALID_LOFT_ID = 'INVALID_LOFT_ID',
  
  // Loft-related Errors
  LOFT_NOT_FOUND = 'LOFT_NOT_FOUND',
  LOFT_UNAVAILABLE = 'LOFT_UNAVAILABLE',
  LOFT_NOT_PUBLISHED = 'LOFT_NOT_PUBLISHED',
  GUEST_COUNT_EXCEEDED = 'GUEST_COUNT_EXCEEDED',
  MINIMUM_STAY_NOT_MET = 'MINIMUM_STAY_NOT_MET',
  MAXIMUM_STAY_EXCEEDED = 'MAXIMUM_STAY_EXCEEDED',
  
  // Availability Errors
  DATES_NOT_AVAILABLE = 'DATES_NOT_AVAILABLE',
  AVAILABILITY_CONFLICT = 'AVAILABILITY_CONFLICT',
  BOOKING_TOO_FAR_ADVANCE = 'BOOKING_TOO_FAR_ADVANCE',
  PAST_DATE_BOOKING = 'PAST_DATE_BOOKING',
  
  // Business Logic Errors
  TERMS_NOT_ACCEPTED = 'TERMS_NOT_ACCEPTED',
  PRICING_ERROR = 'PRICING_ERROR',
  PAYMENT_REQUIRED = 'PAYMENT_REQUIRED',
  
  // Database Errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  FOREIGN_KEY_VIOLATION = 'FOREIGN_KEY_VIOLATION',
  UNIQUE_CONSTRAINT_VIOLATION = 'UNIQUE_CONSTRAINT_VIOLATION',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  
  // System Errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}

/**
 * Error severity levels for logging and monitoring
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Enhanced Error Handler Class
 * 
 * Provides comprehensive error handling with user-friendly messages,
 * detailed logging, and standardized API responses.
 */
export class ErrorHandler {
  
  /**
   * Handle database-related errors
   * @param error Database error object
   * @param context Error context information
   * @returns APIError object with user-friendly message
   */
  static handleDatabaseError(error: any, context?: ErrorContext): APIError {
    let code = ErrorCodes.DATABASE_ERROR;
    let message = 'A database error occurred. Please try again.';
    let suggestions: string[] = [];

    // Handle specific PostgreSQL error codes
    if (error.code) {
      switch (error.code) {
        case '23503': // Foreign key violation
          code = ErrorCodes.FOREIGN_KEY_VIOLATION;
          message = 'The selected loft is no longer available. Please refresh and try again.';
          suggestions = [
            'Refresh the page and select a different loft',
            'Check if the loft is still available',
            'Contact support if the problem persists'
          ];
          break;

        case '23505': // Unique constraint violation
          code = ErrorCodes.UNIQUE_CONSTRAINT_VIOLATION;
          message = 'A reservation with these details already exists.';
          suggestions = [
            'Check your booking history',
            'Use different dates or guest information',
            'Contact support if you believe this is an error'
          ];
          break;

        case '08000': // Connection exception
        case '08003': // Connection does not exist
        case '08006': // Connection failure
          code = ErrorCodes.CONNECTION_ERROR;
          message = 'Unable to connect to the database. Please try again in a moment.';
          suggestions = [
            'Wait a moment and try again',
            'Check your internet connection',
            'Contact support if the problem persists'
          ];
          break;

        default:
          // Log unknown database error codes for investigation
          console.error('Unknown database error code:', error.code, error.message);
      }
    }

    // Log the error with context
    this.logError(error, code, context, ErrorSeverity.HIGH);

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
   * Handle validation errors
   * @param errors Array of validation error messages
   * @param context Error context information
   * @returns APIError object with validation details
   */
  static handleValidationError(errors: string[], context?: ErrorContext): APIError {
    const message = errors.length === 1 
      ? errors[0] 
      : `${errors.length} validation errors occurred`;

    const suggestions = [
      'Please check all required fields',
      'Ensure dates are in the correct format (YYYY-MM-DD)',
      'Verify guest information is complete and accurate'
    ];

    // Log validation errors
    this.logError(
      new Error(`Validation failed: ${errors.join(', ')}`),
      ErrorCodes.VALIDATION_FAILED,
      context,
      ErrorSeverity.LOW
    );

    return {
      error: message,
      code: ErrorCodes.VALIDATION_FAILED,
      details: errors.join('; '),
      suggestions,
      timestamp: new Date().toISOString(),
      request_id: context?.request_id
    };
  }

  /**
   * Handle loft not found errors
   * @param loftId The loft ID that was not found
   * @param context Error context information
   * @returns APIError object with loft-specific message
   */
  static handleLoftNotFound(loftId: string, context?: ErrorContext): APIError {
    const message = 'The selected loft is not available or does not exist.';
    const suggestions = [
      'Try searching for other available lofts',
      'Check if the loft ID is correct',
      'Contact support if you believe this loft should be available'
    ];

    // Log loft not found error
    this.logError(
      new Error(`Loft not found: ${loftId}`),
      ErrorCodes.LOFT_NOT_FOUND,
      { ...context, loft_id: loftId },
      ErrorSeverity.MEDIUM
    );

    return {
      error: message,
      code: ErrorCodes.LOFT_NOT_FOUND,
      field: 'loft_id',
      suggestions,
      timestamp: new Date().toISOString(),
      request_id: context?.request_id
    };
  }

  /**
   * Handle loft unavailable errors
   * @param loftId The loft ID that is unavailable
   * @param reason Reason for unavailability
   * @param context Error context information
   * @returns APIError object with availability message
   */
  static handleLoftUnavailable(loftId: string, reason: string, context?: ErrorContext): APIError {
    let message = 'This loft is currently not available for booking.';
    let suggestions = ['Try searching for other available lofts'];

    switch (reason) {
      case 'maintenance':
        message = 'This loft is temporarily unavailable due to maintenance.';
        suggestions = [
          'Try searching for other available lofts',
          'Check back later as maintenance may be completed soon'
        ];
        break;
      case 'unavailable':
        message = 'This loft is currently marked as unavailable.';
        break;
      case 'not_published':
        message = 'This loft is not currently available for public booking.';
        break;
    }

    // Log loft unavailable error
    this.logError(
      new Error(`Loft unavailable: ${loftId} - ${reason}`),
      ErrorCodes.LOFT_UNAVAILABLE,
      { ...context, loft_id: loftId },
      ErrorSeverity.MEDIUM
    );

    return {
      error: message,
      code: ErrorCodes.LOFT_UNAVAILABLE,
      field: 'loft_id',
      suggestions,
      timestamp: new Date().toISOString(),
      request_id: context?.request_id
    };
  }

  /**
   * Handle date-related errors
   * @param dateError Specific date validation error
   * @param context Error context information
   * @returns APIError object with date-specific message
   */
  static handleDateError(dateError: string, context?: ErrorContext): APIError {
    let code = ErrorCodes.INVALID_DATE_RANGE;
    let suggestions = [
      'Ensure check-in date is before check-out date',
      'Use dates in the future (not in the past)',
      'Check the date format (YYYY-MM-DD)'
    ];

    if (dateError.includes('format')) {
      code = ErrorCodes.INVALID_DATE_FORMAT;
      suggestions = [
        'Use the date format YYYY-MM-DD (e.g., 2024-12-25)',
        'Ensure both check-in and check-out dates are provided'
      ];
    } else if (dateError.includes('past')) {
      code = ErrorCodes.PAST_DATE_BOOKING;
      suggestions = [
        'Select dates in the future',
        'Check-in date must be today or later'
      ];
    } else if (dateError.includes('advance')) {
      code = ErrorCodes.BOOKING_TOO_FAR_ADVANCE;
      suggestions = [
        'Bookings can only be made up to 1 year in advance',
        'Select dates within the next 12 months'
      ];
    }

    // Log date error
    this.logError(
      new Error(`Date validation error: ${dateError}`),
      code,
      context,
      ErrorSeverity.LOW
    );

    return {
      error: dateError,
      code,
      field: 'dates',
      suggestions,
      timestamp: new Date().toISOString(),
      request_id: context?.request_id
    };
  }

  /**
   * Handle guest count errors
   * @param guestCount Requested guest count
   * @param maxGuests Maximum allowed guests
   * @param context Error context information
   * @returns APIError object with guest count message
   */
  static handleGuestCountError(guestCount: number, maxGuests: number, context?: ErrorContext): APIError {
    const message = `This loft accommodates a maximum of ${maxGuests} guests. You selected ${guestCount} guests.`;
    const suggestions = [
      `Reduce the number of guests to ${maxGuests} or fewer`,
      'Search for lofts that accommodate more guests',
      'Consider booking multiple lofts for larger groups'
    ];

    // Log guest count error
    this.logError(
      new Error(`Guest count exceeded: ${guestCount} > ${maxGuests}`),
      ErrorCodes.GUEST_COUNT_EXCEEDED,
      context,
      ErrorSeverity.LOW
    );

    return {
      error: message,
      code: ErrorCodes.GUEST_COUNT_EXCEEDED,
      field: 'guests',
      suggestions,
      timestamp: new Date().toISOString(),
      request_id: context?.request_id
    };
  }

  /**
   * Handle availability conflict errors
   * @param checkIn Check-in date
   * @param checkOut Check-out date
   * @param context Error context information
   * @returns APIError object with availability message
   */
  static handleAvailabilityConflict(checkIn: string, checkOut: string, context?: ErrorContext): APIError {
    const message = `The selected dates (${checkIn} to ${checkOut}) are not available for this loft.`;
    const suggestions = [
      'Try different dates for the same loft',
      'Search for other available lofts for these dates',
      'Consider adjusting your travel dates by a few days'
    ];

    // Log availability conflict
    this.logError(
      new Error(`Availability conflict: ${checkIn} to ${checkOut}`),
      ErrorCodes.DATES_NOT_AVAILABLE,
      context,
      ErrorSeverity.MEDIUM
    );

    return {
      error: message,
      code: ErrorCodes.DATES_NOT_AVAILABLE,
      field: 'dates',
      suggestions,
      timestamp: new Date().toISOString(),
      request_id: context?.request_id
    };
  }

  /**
   * Handle foreign key violation errors
   * @param constraint The constraint that was violated
   * @param context Error context information
   * @returns APIError object with constraint-specific message
   */
  static handleForeignKeyViolation(constraint: string, context?: ErrorContext): APIError {
    let message = 'The selected loft is no longer available. Please refresh and try again.';
    let suggestions = [
      'Refresh the page and try again',
      'Select a different loft',
      'Contact support if the problem persists'
    ];

    if (constraint.includes('loft')) {
      message = 'The selected loft is no longer available in our system.';
      suggestions = [
        'The loft may have been removed or is temporarily unavailable',
        'Try searching for other available lofts',
        'Contact support for assistance'
      ];
    } else if (constraint.includes('customer')) {
      message = 'There was an issue with your customer information.';
      suggestions = [
        'Please try creating the reservation again',
        'Ensure all guest information is correct',
        'Contact support if the problem persists'
      ];
    }

    // Log foreign key violation
    this.logError(
      new Error(`Foreign key violation: ${constraint}`),
      ErrorCodes.FOREIGN_KEY_VIOLATION,
      context,
      ErrorSeverity.HIGH
    );

    return {
      error: message,
      code: ErrorCodes.FOREIGN_KEY_VIOLATION,
      suggestions,
      timestamp: new Date().toISOString(),
      request_id: context?.request_id
    };
  }

  /**
   * Translate technical errors to user-friendly messages
   * @param error Original error object
   * @param context Error context information
   * @returns APIError object with user-friendly message
   */
  static translateTechnicalError(error: any, context?: ErrorContext): APIError {
    // Handle different types of errors
    if (error.code) {
      // Database errors
      if (error.code.startsWith('23')) {
        return this.handleDatabaseError(error, context);
      }
      
      // Connection errors
      if (error.code.startsWith('08')) {
        return this.handleDatabaseError(error, context);
      }
    }

    // Handle timeout errors
    if (error.message?.includes('timeout') || error.code === 'ETIMEDOUT') {
      return {
        error: 'The request timed out. Please try again.',
        code: ErrorCodes.TIMEOUT_ERROR,
        suggestions: [
          'Check your internet connection',
          'Try again in a moment',
          'Contact support if the problem persists'
        ],
        timestamp: new Date().toISOString(),
        request_id: context?.request_id
      };
    }

    // Handle network errors
    if (error.message?.includes('network') || error.code === 'ENOTFOUND') {
      return {
        error: 'Network error occurred. Please check your connection and try again.',
        code: ErrorCodes.CONNECTION_ERROR,
        suggestions: [
          'Check your internet connection',
          'Try again in a moment',
          'Contact support if the problem persists'
        ],
        timestamp: new Date().toISOString(),
        request_id: context?.request_id
      };
    }

    // Generic error handling
    const message = 'An unexpected error occurred. Please try again.';
    
    // Log unknown error for investigation
    this.logError(error, ErrorCodes.INTERNAL_SERVER_ERROR, context, ErrorSeverity.CRITICAL);

    return {
      error: message,
      code: ErrorCodes.INTERNAL_SERVER_ERROR,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      suggestions: [
        'Try again in a moment',
        'Contact support if the problem persists'
      ],
      timestamp: new Date().toISOString(),
      request_id: context?.request_id
    };
  }

  /**
   * Add user-friendly suggestions to error responses
   * @param error APIError object to enhance
   * @returns Enhanced APIError with additional suggestions
   */
  static addUserFriendlySuggestions(error: APIError): APIError {
    const baseSuggestions = error.suggestions || [];
    
    // Add general suggestions based on error code
    const additionalSuggestions: string[] = [];

    switch (error.code) {
      case ErrorCodes.LOFT_NOT_FOUND:
      case ErrorCodes.LOFT_UNAVAILABLE:
        additionalSuggestions.push('Browse our available lofts to find alternatives');
        break;
      
      case ErrorCodes.DATES_NOT_AVAILABLE:
        additionalSuggestions.push('Use our availability calendar to find open dates');
        break;
      
      case ErrorCodes.VALIDATION_FAILED:
        additionalSuggestions.push('Double-check all form fields for accuracy');
        break;
      
      case ErrorCodes.DATABASE_ERROR:
      case ErrorCodes.INTERNAL_SERVER_ERROR:
        additionalSuggestions.push('Our team has been notified and is working on a fix');
        break;
    }

    return {
      ...error,
      suggestions: [...baseSuggestions, ...additionalSuggestions]
    };
  }

  /**
   * Create a standardized error response
   * @param error APIError object
   * @param statusCode HTTP status code
   * @returns NextResponse with standardized error format
   */
  static createErrorResponse(error: APIError, statusCode: number = 400): NextResponse {
    // Enhance error with additional suggestions
    const enhancedError = this.addUserFriendlySuggestions(error);

    // Create response body
    const responseBody = {
      success: false,
      ...enhancedError,
      status_code: statusCode
    };

    return NextResponse.json(responseBody, { status: statusCode });
  }

  /**
   * Log errors with context and severity
   * @param error Error object or message
   * @param code Error code
   * @param context Error context information
   * @param severity Error severity level
   */
  private static logError(
    error: Error | string,
    code: string,
    context?: ErrorContext,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM
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
        loft_id: context?.loft_id,
        user_id: context?.user_id,
        request_id: context?.request_id,
        user_agent: context?.user_agent,
        ip_address: context?.ip_address
      }
    };

    // Log based on severity
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        console.error('[CRITICAL ERROR]', logEntry);
        break;
      case ErrorSeverity.HIGH:
        console.error('[HIGH ERROR]', logEntry);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn('[MEDIUM ERROR]', logEntry);
        break;
      case ErrorSeverity.LOW:
        console.info('[LOW ERROR]', logEntry);
        break;
    }

    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
      // Example: Sentry.captureException(error, { extra: logEntry });
    }
  }

  /**
   * Generate unique request ID for error tracking
   * @returns Unique request ID string
   */
  static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Extract error context from request
   * @param request NextRequest object
   * @param operation Operation being performed
   * @returns ErrorContext object
   */
  static extractErrorContext(request: any, operation: string): ErrorContext {
    return {
      operation,
      request_id: this.generateRequestId(),
      user_agent: request.headers?.get('user-agent') || undefined,
      ip_address: request.ip || request.headers?.get('x-forwarded-for') || undefined
    };
  }
}

/**
 * Utility function to create success responses
 * @param data Response data
 * @param statusCode HTTP status code
 * @returns NextResponse with success format
 */
export function createSuccessResponse(data: any, statusCode: number = 200): NextResponse {
  const responseBody = {
    success: true,
    timestamp: new Date().toISOString(),
    ...data
  };

  return NextResponse.json(responseBody, { status: statusCode });
}

/**
 * Utility function to validate required fields
 * @param data Object to validate
 * @param requiredFields Array of required field names
 * @returns Array of missing field names
 */
export function validateRequiredFields(data: any, requiredFields: string[]): string[] {
  const missing: string[] = [];
  
  for (const field of requiredFields) {
    if (!data || data[field] === undefined || data[field] === null || data[field] === '') {
      missing.push(field);
    }
  }
  
  return missing;
}