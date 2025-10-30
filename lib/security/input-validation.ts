/**
 * Comprehensive input validation and sanitization utilities
 * Provides protection against XSS, SQL injection, and other security threats
 */

import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';
import { logger } from '@/lib/logger';

export interface ValidationResult {
  isValid: boolean;
  sanitizedData?: any;
  errors?: string[];
  securityViolations?: string[];
}

export interface ValidationConfig {
  allowHtml?: boolean;
  maxLength?: number;
  allowedTags?: string[];
  stripTags?: boolean;
  preventSqlInjection?: boolean;
  preventXss?: boolean;
  preventPathTraversal?: boolean;
}

// Common validation patterns
export const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\+]?[1-9][\d]{0,15}$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  url: /^https?:\/\/.+/,
  ipAddress: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  creditCard: /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3[0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})$/,
  sqlInjection: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)|('|(\\x27)|(\\x2D\\x2D))/i,
  xssPatterns: /(<script|javascript:|on\w+\s*=|<iframe|<object|<embed|<link|<meta)/i,
  pathTraversal: /(\.\.|\/\.\.|\\\.\.)/,
  commandInjection: /[;&|`$(){}[\]]/
} as const;

// SQL injection detection patterns
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
  /('|(\\x27)|(\\x2D\\x2D))/,
  /(\b(OR|AND)\b.*=.*)/i,
  /(UNION.*SELECT)/i,
  /(DROP.*TABLE)/i,
  /(INSERT.*INTO)/i,
  /(UPDATE.*SET)/i,
  /(DELETE.*FROM)/i
];

// XSS detection patterns
const XSS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe[^>]*>/gi,
  /<object[^>]*>/gi,
  /<embed[^>]*>/gi,
  /<link[^>]*>/gi,
  /<meta[^>]*>/gi,
  /expression\s*\(/gi,
  /vbscript:/gi,
  /data:text\/html/gi
];

/**
 * Sanitize string input to prevent XSS attacks
 */
export function sanitizeString(
  input: string, 
  config: ValidationConfig = {}
): string {
  if (typeof input !== 'string') {
    return String(input);
  }

  let sanitized = input;

  // Prevent XSS
  if (config.preventXss !== false) {
    if (config.allowHtml) {
      // Use DOMPurify for HTML content
      sanitized = DOMPurify.sanitize(sanitized, {
        ALLOWED_TAGS: config.allowedTags || ['p', 'br', 'strong', 'em', 'u'],
        ALLOWED_ATTR: ['href', 'title', 'alt']
      });
    } else {
      // Strip all HTML tags
      sanitized = sanitized.replace(/<[^>]*>/g, '');
    }
  }

  // Prevent SQL injection
  if (config.preventSqlInjection !== false) {
    // Escape single quotes
    sanitized = sanitized.replace(/'/g, "''");
    
    // Remove or escape dangerous SQL keywords
    SQL_INJECTION_PATTERNS.forEach(pattern => {
      if (pattern.test(sanitized)) {
        logger.warn('Potential SQL injection attempt detected', { input: sanitized });
        sanitized = sanitized.replace(pattern, '');
      }
    });
  }

  // Prevent path traversal
  if (config.preventPathTraversal !== false) {
    sanitized = sanitized.replace(/\.\./g, '');
    sanitized = sanitized.replace(/[\/\\]/g, '');
  }

  // Apply length limit
  if (config.maxLength && sanitized.length > config.maxLength) {
    sanitized = sanitized.substring(0, config.maxLength);
  }

  return sanitized.trim();
}

/**
 * Validate and sanitize object data
 */
export function validateAndSanitizeObject(
  data: Record<string, any>,
  schema: z.ZodSchema,
  config: ValidationConfig = {}
): ValidationResult {
  try {
    const securityViolations: string[] = [];
    const sanitizedData: Record<string, any> = {};

    // First, sanitize all string values
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        const originalValue = value;
        sanitizedData[key] = sanitizeString(value, config);
        
        // Check for security violations
        if (detectSecurityViolations(originalValue).length > 0) {
          securityViolations.push(...detectSecurityViolations(originalValue).map(v => `${key}: ${v}`));
        }
      } else if (Array.isArray(value)) {
        sanitizedData[key] = value.map(item => 
          typeof item === 'string' ? sanitizeString(item, config) : item
        );
      } else {
        sanitizedData[key] = value;
      }
    }

    // Then validate with schema
    const result = schema.safeParse(sanitizedData);

    if (!result.success) {
      return {
        isValid: false,
        errors: result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`),
        securityViolations
      };
    }

    return {
      isValid: true,
      sanitizedData: result.data,
      securityViolations: securityViolations.length > 0 ? securityViolations : undefined
    };
  } catch (error) {
    logger.error('Validation error', error);
    return {
      isValid: false,
      errors: ['Validation failed'],
      securityViolations: ['Unknown security violation']
    };
  }
}

/**
 * Detect security violations in input
 */
export function detectSecurityViolations(input: string): string[] {
  const violations: string[] = [];

  // Check for SQL injection
  SQL_INJECTION_PATTERNS.forEach(pattern => {
    if (pattern.test(input)) {
      violations.push('Potential SQL injection detected');
    }
  });

  // Check for XSS
  XSS_PATTERNS.forEach(pattern => {
    if (pattern.test(input)) {
      violations.push('Potential XSS attack detected');
    }
  });

  // Check for path traversal
  if (VALIDATION_PATTERNS.pathTraversal.test(input)) {
    violations.push('Path traversal attempt detected');
  }

  // Check for command injection
  if (VALIDATION_PATTERNS.commandInjection.test(input)) {
    violations.push('Command injection attempt detected');
  }

  return violations;
}

/**
 * Validate file upload
 */
export function validateFileUpload(
  file: File,
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/gif'],
  maxSize: number = 5 * 1024 * 1024 // 5MB
): ValidationResult {
  const violations: string[] = [];

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    violations.push(`File type ${file.type} not allowed`);
  }

  // Check file size
  if (file.size > maxSize) {
    violations.push(`File size ${file.size} exceeds maximum ${maxSize}`);
  }

  // Check filename for security issues
  const filenameViolations = detectSecurityViolations(file.name);
  violations.push(...filenameViolations);

  return {
    isValid: violations.length === 0,
    securityViolations: violations.length > 0 ? violations : undefined
  };
}

/**
 * Validate API request headers
 */
export function validateRequestHeaders(headers: Headers): ValidationResult {
  const violations: string[] = [];
  const requiredHeaders = ['content-type', 'user-agent'];
  const suspiciousHeaders = ['x-forwarded-for', 'x-real-ip'];

  // Check for required headers
  for (const header of requiredHeaders) {
    if (!headers.get(header)) {
      violations.push(`Missing required header: ${header}`);
    }
  }

  // Check for suspicious patterns in headers
  for (const [name, value] of headers.entries()) {
    if (value && detectSecurityViolations(value).length > 0) {
      violations.push(`Suspicious content in header ${name}`);
    }
  }

  // Check for header injection
  for (const [name, value] of headers.entries()) {
    if (value && (value.includes('\n') || value.includes('\r'))) {
      violations.push(`Header injection attempt in ${name}`);
    }
  }

  return {
    isValid: violations.length === 0,
    securityViolations: violations.length > 0 ? violations : undefined
  };
}

/**
 * Create validation middleware for API routes
 */
export function createValidationMiddleware(
  schema: z.ZodSchema,
  config: ValidationConfig = {}
) {
  return async (request: Request): Promise<ValidationResult> => {
    try {
      // Validate headers
      const headerValidation = validateRequestHeaders(request.headers);
      if (!headerValidation.isValid) {
        return headerValidation;
      }

      // Get request body
      const contentType = request.headers.get('content-type') || '';
      let data: any;

      if (contentType.includes('application/json')) {
        data = await request.json();
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const formData = await request.formData();
        data = Object.fromEntries(formData.entries());
      } else if (contentType.includes('multipart/form-data')) {
        const formData = await request.formData();
        data = {};
        for (const [key, value] of formData.entries()) {
          if (value instanceof File) {
            const fileValidation = validateFileUpload(value);
            if (!fileValidation.isValid) {
              return fileValidation;
            }
            data[key] = value;
          } else {
            data[key] = value;
          }
        }
      } else {
        return {
          isValid: false,
          errors: ['Unsupported content type']
        };
      }

      // Validate and sanitize data
      return validateAndSanitizeObject(data, schema, config);
    } catch (error) {
      logger.error('Validation middleware error', error);
      return {
        isValid: false,
        errors: ['Invalid request format']
      };
    }
  };
}

/**
 * Escape SQL identifiers (table names, column names)
 */
export function escapeSqlIdentifier(identifier: string): string {
  // Remove any non-alphanumeric characters except underscores
  return identifier.replace(/[^a-zA-Z0-9_]/g, '');
}

/**
 * Escape SQL string values
 */
export function escapeSqlString(value: string): string {
  return value.replace(/'/g, "''");
}

/**
 * Validate and sanitize SQL query parameters
 */
export function sanitizeSqlParams(params: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      sanitized[key] = escapeSqlString(value);
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      sanitized[key] = value;
    } else if (value === null || value === undefined) {
      sanitized[key] = null;
    } else {
      // For complex types, convert to string and sanitize
      sanitized[key] = escapeSqlString(String(value));
    }
  }

  return sanitized;
}