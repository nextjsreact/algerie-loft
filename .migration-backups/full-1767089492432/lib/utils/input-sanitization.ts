/**
 * Input Sanitization Utilities
 * Provides comprehensive input sanitization and validation for partner system
 */

import DOMPurify from 'isomorphic-dompurify';
import { z } from 'zod';

// =====================================================
// SANITIZATION FUNCTIONS
// =====================================================

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHtml(input: string, options?: {
  allowedTags?: string[];
  allowedAttributes?: string[];
  stripTags?: boolean;
}): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  const config = {
    ALLOWED_TAGS: options?.allowedTags || [],
    ALLOWED_ATTR: options?.allowedAttributes || [],
    KEEP_CONTENT: !options?.stripTags
  };
  
  return DOMPurify.sanitize(input, config);
}

/**
 * Sanitize text input by removing potentially dangerous characters
 */
export function sanitizeText(input: string, options?: {
  maxLength?: number;
  allowSpecialChars?: boolean;
  allowNumbers?: boolean;
  allowSpaces?: boolean;
}): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  let sanitized = input.trim();
  
  // Remove null bytes and control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Remove potentially dangerous characters if not allowed
  if (!options?.allowSpecialChars) {
    sanitized = sanitized.replace(/[<>'"&]/g, '');
  }
  
  // Keep only alphanumeric characters if specified
  if (!options?.allowNumbers && !options?.allowSpaces && !options?.allowSpecialChars) {
    sanitized = sanitized.replace(/[^a-zA-ZÀ-ÿ]/g, '');
  } else if (!options?.allowNumbers) {
    sanitized = sanitized.replace(/[0-9]/g, '');
  }
  
  // Remove extra spaces if spaces are allowed
  if (options?.allowSpaces) {
    sanitized = sanitized.replace(/\s+/g, ' ');
  } else if (!options?.allowSpaces) {
    sanitized = sanitized.replace(/\s/g, '');
  }
  
  // Truncate if max length specified
  if (options?.maxLength && sanitized.length > options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength);
  }
  
  return sanitized;
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Remove whitespace and convert to lowercase
  let sanitized = input.trim().toLowerCase();
  
  // Remove potentially dangerous characters
  sanitized = sanitized.replace(/[<>'"&]/g, '');
  
  // Basic email format validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(sanitized)) {
    return '';
  }
  
  return sanitized;
}

/**
 * Sanitize phone number
 */
export function sanitizePhoneNumber(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Keep only numbers, spaces, hyphens, parentheses, and plus sign
  let sanitized = input.replace(/[^0-9\s\-\(\)\+]/g, '');
  
  // Remove extra spaces
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  return sanitized;
}

/**
 * Sanitize URL
 */
export function sanitizeUrl(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  let sanitized = input.trim();
  
  // Only allow http and https protocols
  if (!sanitized.match(/^https?:\/\//)) {
    return '';
  }
  
  try {
    const url = new URL(sanitized);
    return url.toString();
  } catch {
    return '';
  }
}

/**
 * Sanitize file name
 */
export function sanitizeFileName(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Remove path traversal attempts
  let sanitized = input.replace(/\.\./g, '');
  
  // Remove potentially dangerous characters
  sanitized = sanitized.replace(/[<>:"/\\|?*\x00-\x1F]/g, '');
  
  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.split('.').pop();
    const name = sanitized.substring(0, 255 - (ext ? ext.length + 1 : 0));
    sanitized = ext ? `${name}.${ext}` : name;
  }
  
  return sanitized.trim();
}

/**
 * Sanitize JSON input
 */
export function sanitizeJson(input: any): any {
  if (input === null || input === undefined) {
    return null;
  }
  
  if (typeof input === 'string') {
    return sanitizeText(input, { allowSpecialChars: false, maxLength: 1000 });
  }
  
  if (typeof input === 'number') {
    return isFinite(input) ? input : 0;
  }
  
  if (typeof input === 'boolean') {
    return input;
  }
  
  if (Array.isArray(input)) {
    return input.map(item => sanitizeJson(item)).slice(0, 100); // Limit array size
  }
  
  if (typeof input === 'object') {
    const sanitized: any = {};
    let keyCount = 0;
    
    for (const [key, value] of Object.entries(input)) {
      if (keyCount >= 50) break; // Limit object size
      
      const sanitizedKey = sanitizeText(key, { maxLength: 100 });
      if (sanitizedKey) {
        sanitized[sanitizedKey] = sanitizeJson(value);
        keyCount++;
      }
    }
    
    return sanitized;
  }
  
  return null;
}

// =====================================================
// VALIDATION FUNCTIONS
// =====================================================

/**
 * Validate UUID format
 */
export function isValidUuid(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(input.trim());
}

/**
 * Validate date format
 */
export function isValidDate(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }
  
  const date = new Date(input);
  return !isNaN(date.getTime());
}

/**
 * Validate numeric input
 */
export function isValidNumber(input: any, options?: {
  min?: number;
  max?: number;
  integer?: boolean;
}): boolean {
  const num = Number(input);
  
  if (isNaN(num) || !isFinite(num)) {
    return false;
  }
  
  if (options?.integer && !Number.isInteger(num)) {
    return false;
  }
  
  if (options?.min !== undefined && num < options.min) {
    return false;
  }
  
  if (options?.max !== undefined && num > options.max) {
    return false;
  }
  
  return true;
}

/**
 * Check for SQL injection patterns
 */
export function containsSqlInjection(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }
  
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
    /(;|\-\-|\/\*|\*\/)/gi,
    /(\b(SCRIPT|JAVASCRIPT|VBSCRIPT)\b)/gi,
    /(\bEXEC\s*\()/gi,
    /(\bSP_\w+)/gi
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * Check for XSS patterns
 */
export function containsXss(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }
  
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /vbscript:/gi,
    /data:text\/html/gi,
    /<svg\b[^>]*>/gi,
    /<math\b[^>]*>/gi
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
}

/**
 * Check for path traversal attempts
 */
export function containsPathTraversal(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }
  
  const pathTraversalPatterns = [
    /\.\./g,
    /\.\\/g,
    /\.\/\./g,
    /%2e%2e/gi,
    /%2f/gi,
    /%5c/gi,
    /\0/g
  ];
  
  return pathTraversalPatterns.some(pattern => pattern.test(input));
}

// =====================================================
// COMPREHENSIVE SANITIZATION FUNCTION
// =====================================================

/**
 * Comprehensive input sanitization based on data type
 */
export function sanitizeInput(input: any, type: 'text' | 'email' | 'phone' | 'url' | 'filename' | 'html' | 'json' | 'uuid', options?: any): any {
  switch (type) {
    case 'text':
      return sanitizeText(input, options);
    case 'email':
      return sanitizeEmail(input);
    case 'phone':
      return sanitizePhoneNumber(input);
    case 'url':
      return sanitizeUrl(input);
    case 'filename':
      return sanitizeFileName(input);
    case 'html':
      return sanitizeHtml(input, options);
    case 'json':
      return sanitizeJson(input);
    case 'uuid':
      return isValidUuid(input) ? input.trim() : '';
    default:
      return sanitizeText(input);
  }
}

// =====================================================
// PARTNER-SPECIFIC SANITIZATION
// =====================================================

/**
 * Sanitize partner registration data
 */
export function sanitizePartnerRegistrationData(data: any): any {
  if (!data || typeof data !== 'object') {
    return {};
  }
  
  return {
    personal_info: {
      full_name: sanitizeText(data.personal_info?.full_name, {
        allowSpaces: true,
        allowSpecialChars: false,
        maxLength: 100
      }),
      email: sanitizeEmail(data.personal_info?.email),
      phone: sanitizePhoneNumber(data.personal_info?.phone),
      address: sanitizeText(data.personal_info?.address, {
        allowSpaces: true,
        allowNumbers: true,
        allowSpecialChars: true,
        maxLength: 500
      })
    },
    business_info: {
      business_name: data.business_info?.business_name ? 
        sanitizeText(data.business_info.business_name, {
          allowSpaces: true,
          allowNumbers: true,
          allowSpecialChars: false,
          maxLength: 255
        }) : undefined,
      business_type: ['individual', 'company'].includes(data.business_info?.business_type) ? 
        data.business_info.business_type : 'individual',
      tax_id: data.business_info?.tax_id ? 
        sanitizeText(data.business_info.tax_id, {
          allowNumbers: true,
          allowSpecialChars: false,
          maxLength: 50
        }) : undefined
    },
    portfolio_description: sanitizeText(data.portfolio_description, {
      allowSpaces: true,
      allowNumbers: true,
      allowSpecialChars: true,
      maxLength: 2000
    }),
    terms_accepted: Boolean(data.terms_accepted)
  };
}

/**
 * Sanitize partner profile update data
 */
export function sanitizePartnerProfileData(data: any): any {
  if (!data || typeof data !== 'object') {
    return {};
  }
  
  const sanitized: any = {};
  
  if (data.personal_info) {
    sanitized.personal_info = {};
    
    if (data.personal_info.full_name) {
      sanitized.personal_info.full_name = sanitizeText(data.personal_info.full_name, {
        allowSpaces: true,
        allowSpecialChars: false,
        maxLength: 100
      });
    }
    
    if (data.personal_info.phone) {
      sanitized.personal_info.phone = sanitizePhoneNumber(data.personal_info.phone);
    }
    
    if (data.personal_info.address) {
      sanitized.personal_info.address = sanitizeText(data.personal_info.address, {
        allowSpaces: true,
        allowNumbers: true,
        allowSpecialChars: true,
        maxLength: 500
      });
    }
  }
  
  if (data.business_info) {
    sanitized.business_info = {};
    
    if (data.business_info.business_name) {
      sanitized.business_info.business_name = sanitizeText(data.business_info.business_name, {
        allowSpaces: true,
        allowNumbers: true,
        allowSpecialChars: false,
        maxLength: 255
      });
    }
    
    if (data.business_info.tax_id) {
      sanitized.business_info.tax_id = sanitizeText(data.business_info.tax_id, {
        allowNumbers: true,
        allowSpecialChars: false,
        maxLength: 50
      });
    }
  }
  
  if (data.portfolio_description) {
    sanitized.portfolio_description = sanitizeText(data.portfolio_description, {
      allowSpaces: true,
      allowNumbers: true,
      allowSpecialChars: true,
      maxLength: 2000
    });
  }
  
  return sanitized;
}

/**
 * Sanitize admin validation data
 */
export function sanitizeAdminValidationData(data: any): any {
  if (!data || typeof data !== 'object') {
    return {};
  }
  
  return {
    action: ['approve', 'reject'].includes(data.action) ? data.action : 'reject',
    partner_id: isValidUuid(data.partner_id) ? data.partner_id : '',
    reason: data.reason ? sanitizeText(data.reason, {
      allowSpaces: true,
      allowNumbers: true,
      allowSpecialChars: true,
      maxLength: 1000
    }) : undefined,
    admin_notes: data.admin_notes ? sanitizeText(data.admin_notes, {
      allowSpaces: true,
      allowNumbers: true,
      allowSpecialChars: true,
      maxLength: 2000
    }) : undefined
  };
}

// Export all sanitization functions
export default {
  sanitizeHtml,
  sanitizeText,
  sanitizeEmail,
  sanitizePhoneNumber,
  sanitizeUrl,
  sanitizeFileName,
  sanitizeJson,
  sanitizeInput,
  sanitizePartnerRegistrationData,
  sanitizePartnerProfileData,
  sanitizeAdminValidationData,
  isValidUuid,
  isValidDate,
  isValidNumber,
  containsSqlInjection,
  containsXss,
  containsPathTraversal
};