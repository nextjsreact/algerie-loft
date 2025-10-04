/**
 * UUID validation utilities for transaction routing
 * Provides validation functions to ensure proper UUID format validation
 * before database queries and routing operations.
 */

import { logger } from '@/lib/logger';
import { trackValidationError, errorAggregator } from '@/lib/utils/error-tracking';

/**
 * Regular expression pattern for UUID v4 validation
 * Matches the standard UUID format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 * where x is any hexadecimal digit and y is one of 8, 9, A, or B
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates if a string is a valid UUID format
 * 
 * @param id - The string to validate as UUID
 * @returns boolean - true if valid UUID format, false otherwise
 * 
 * @example
 * ```typescript
 * isValidUUID('550e8400-e29b-41d4-a716-446655440000') // true
 * isValidUUID('reference-amounts') // false
 * isValidUUID('invalid-uuid') // false
 * ```
 */
export function isValidUUID(id: string): boolean {
  if (!id || typeof id !== 'string') {
    trackValidationError('UUID validation failed: invalid input type', {
      validationFunction: 'isValidUUID',
      inputValue: id,
      inputType: typeof id,
      errorCode: 'INVALID_INPUT_TYPE',
      expectedFormat: 'string'
    });
    errorAggregator.incrementError('invalid_input_type', 'uuid_validation');
    return false;
  }
  
  const trimmedId = id.trim();
  const isValid = UUID_REGEX.test(trimmedId);
  
  if (!isValid) {
    trackValidationError('UUID validation failed: invalid format', {
      validationFunction: 'isValidUUID',
      inputValue: trimmedId,
      inputType: typeof trimmedId,
      errorCode: 'INVALID_UUID_FORMAT',
      expectedFormat: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
    });
    errorAggregator.incrementError('invalid_uuid_format', 'uuid_validation');
  }
  
  return isValid;
}

/**
 * Validation result interface for transaction ID validation
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  errorCode?: 'INVALID_FORMAT' | 'EMPTY_ID' | 'INVALID_TYPE';
}

/**
 * Validates a transaction ID with detailed error responses
 * Provides comprehensive validation with specific error messages
 * for different validation failure scenarios.
 * 
 * @param id - The transaction ID to validate
 * @returns ValidationResult - Object containing validation status and error details
 * 
 * @example
 * ```typescript
 * validateTransactionId('550e8400-e29b-41d4-a716-446655440000')
 * // { isValid: true }
 * 
 * validateTransactionId('reference-amounts')
 * // { isValid: false, error: 'Invalid UUID format', errorCode: 'INVALID_FORMAT' }
 * 
 * validateTransactionId('')
 * // { isValid: false, error: 'Transaction ID cannot be empty', errorCode: 'EMPTY_ID' }
 * ```
 */
export function validateTransactionId(id: string): ValidationResult {
  const validationContext = {
    category: 'validation',
    validationFunction: 'validateTransactionId',
    inputValue: id,
    inputType: typeof id,
    timestamp: new Date().toISOString()
  };

  // Check for null, undefined, or non-string values
  if (id === null || id === undefined || typeof id !== 'string') {
    trackValidationError('Transaction ID validation failed: invalid type', {
      validationFunction: 'validateTransactionId',
      inputValue: id,
      inputType: typeof id,
      errorCode: 'INVALID_TYPE',
      expectedFormat: 'string'
    });
    errorAggregator.incrementError('invalid_type', 'transaction_id_validation');
    
    return {
      isValid: false,
      error: 'Transaction ID must be a valid string',
      errorCode: 'INVALID_TYPE'
    };
  }
  
  // Check for empty or whitespace-only strings
  const trimmedId = id.trim();
  if (!trimmedId) {
    trackValidationError('Transaction ID validation failed: empty ID', {
      validationFunction: 'validateTransactionId',
      inputValue: id,
      inputType: typeof id,
      errorCode: 'EMPTY_ID',
      expectedFormat: 'non-empty string'
    });
    errorAggregator.incrementError('empty_id', 'transaction_id_validation');
    
    return {
      isValid: false,
      error: 'Transaction ID cannot be empty',
      errorCode: 'EMPTY_ID'
    };
  }
  
  // Validate UUID format
  if (!isValidUUID(trimmedId)) {
    trackValidationError('Transaction ID validation failed: invalid UUID format', {
      validationFunction: 'validateTransactionId',
      inputValue: trimmedId,
      inputType: typeof trimmedId,
      errorCode: 'INVALID_FORMAT',
      expectedFormat: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
    });
    errorAggregator.incrementError('invalid_format', 'transaction_id_validation');
    
    return {
      isValid: false,
      error: 'Invalid UUID format. Expected format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx',
      errorCode: 'INVALID_FORMAT'
    };
  }
  
  logger.debug('Transaction ID validation successful', {
    ...validationContext,
    validatedId: trimmedId
  });
  
  return {
    isValid: true
  };
}

/**
 * Type guard function to check if a string is a valid UUID
 * Useful for TypeScript type narrowing
 * 
 * @param id - The string to check
 * @returns boolean - true if id is a valid UUID string
 */
export function isUUID(id: string): id is string {
  return isValidUUID(id);
}

/**
 * Utility function to sanitize and validate UUID input
 * Trims whitespace and validates UUID format
 * 
 * @param id - The UUID string to sanitize and validate
 * @returns string | null - Returns sanitized UUID if valid, null if invalid
 */
export function sanitizeUUID(id: string): string | null {
  const sanitizationContext = {
    category: 'validation',
    validationFunction: 'sanitizeUUID',
    inputValue: id,
    inputType: typeof id
  };

  if (!id || typeof id !== 'string') {
    logger.debug('UUID sanitization failed: invalid input', {
      ...sanitizationContext,
      reason: 'invalid_input_type'
    });
    return null;
  }
  
  const trimmedId = id.trim();
  const isValid = isValidUUID(trimmedId);
  
  if (!isValid) {
    logger.debug('UUID sanitization failed: invalid format after trimming', {
      ...sanitizationContext,
      trimmedValue: trimmedId,
      originalLength: id.length,
      trimmedLength: trimmedId.length,
      reason: 'invalid_uuid_format'
    });
    return null;
  }
  
  logger.debug('UUID sanitization successful', {
    ...sanitizationContext,
    sanitizedValue: trimmedId,
    wasModified: id !== trimmedId
  });
  
  return trimmedId;
}