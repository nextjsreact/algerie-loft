/**
 * Unit tests for UUID validation utilities
 * Tests the validation functions used for transaction routing
 */

import {
  isValidUUID,
  validateTransactionId,
  isUUID,
  sanitizeUUID,
  ValidationResult
} from '@/lib/utils/validation';

// Mock the logger and error tracking modules
jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  }
}));

jest.mock('@/lib/utils/error-tracking', () => ({
  trackValidationError: jest.fn(),
  errorAggregator: {
    incrementError: jest.fn(),
  }
}));

describe('UUID Validation Utilities', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('isValidUUID', () => {
    describe('Valid UUID formats', () => {
      test('should return true for valid UUID v4 format', () => {
        const validUUIDs = [
          '550e8400-e29b-41d4-a716-446655440000',
          'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          '6ba7b810-9dad-41d1-80b4-00c04fd430c8',
          '6ba7b811-9dad-41d1-90b4-00c04fd430c8',
          'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        ];

        validUUIDs.forEach(uuid => {
          expect(isValidUUID(uuid)).toBe(true);
        });
      });

      test('should return true for valid UUID with different cases', () => {
        const mixedCaseUUIDs = [
          '550E8400-E29B-41D4-A716-446655440000',
          'F47AC10B-58CC-4372-A567-0E02B2C3D479',
          '6Ba7B810-9DaD-41D1-80B4-00C04FD430C8',
        ];

        mixedCaseUUIDs.forEach(uuid => {
          expect(isValidUUID(uuid)).toBe(true);
        });
      });

      test('should return true for UUID with whitespace that gets trimmed', () => {
        const uuidWithWhitespace = [
          ' 550e8400-e29b-41d4-a716-446655440000 ',
          '\t550e8400-e29b-41d4-a716-446655440000\t',
          '\n550e8400-e29b-41d4-a716-446655440000\n',
        ];

        uuidWithWhitespace.forEach(uuid => {
          expect(isValidUUID(uuid)).toBe(true);
        });
      });
    });

    describe('Invalid UUID formats', () => {
      test('should return false for non-UUID strings', () => {
        const invalidUUIDs = [
          'reference-amounts',
          'invalid-uuid',
          'not-a-uuid-at-all',
          'abc123',
          '12345',
          'hello-world',
        ];

        invalidUUIDs.forEach(uuid => {
          expect(isValidUUID(uuid)).toBe(false);
        });
      });

      test('should return false for UUID with wrong format', () => {
        const wrongFormatUUIDs = [
          '550e8400-e29b-41d4-a716-44665544000', // Missing one character
          '550e8400-e29b-41d4-a716-4466554400000', // Extra character
          '550e8400e29b41d4a716446655440000', // Missing hyphens
          '550e8400-e29b-41d4-a716_446655440000', // Wrong separator
          '550e8400-e29b-31d4-a716-446655440000', // Wrong version (3 instead of 4)
          '550e8400-e29b-41d4-c716-446655440000', // Wrong variant (c instead of 8,9,a,b)
        ];

        wrongFormatUUIDs.forEach(uuid => {
          expect(isValidUUID(uuid)).toBe(false);
        });
      });

      test('should return false for empty or null values', () => {
        const emptyValues = [
          '',
          '   ',
          '\t',
          '\n',
        ];

        emptyValues.forEach(value => {
          expect(isValidUUID(value)).toBe(false);
        });
      });

      test('should return false for non-string types', () => {
        const nonStringValues = [
          null as any,
          undefined as any,
          123 as any,
          {} as any,
          [] as any,
          true as any,
        ];

        nonStringValues.forEach(value => {
          expect(isValidUUID(value)).toBe(false);
        });
      });
    });

    describe('Error tracking', () => {
      test('should track validation errors for invalid input types', () => {
        const { trackValidationError, errorAggregator } = require('@/lib/utils/error-tracking');
        
        isValidUUID(null as any);
        
        expect(trackValidationError).toHaveBeenCalledWith(
          'UUID validation failed: invalid input type',
          expect.objectContaining({
            validationFunction: 'isValidUUID',
            inputValue: null,
            inputType: 'object',
            errorCode: 'INVALID_INPUT_TYPE',
            expectedFormat: 'string'
          })
        );
        
        expect(errorAggregator.incrementError).toHaveBeenCalledWith(
          'invalid_input_type',
          'uuid_validation'
        );
      });

      test('should track validation errors for invalid UUID format', () => {
        const { trackValidationError, errorAggregator } = require('@/lib/utils/error-tracking');
        
        isValidUUID('reference-amounts');
        
        expect(trackValidationError).toHaveBeenCalledWith(
          'UUID validation failed: invalid format',
          expect.objectContaining({
            validationFunction: 'isValidUUID',
            inputValue: 'reference-amounts',
            inputType: 'string',
            errorCode: 'INVALID_UUID_FORMAT',
            expectedFormat: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
          })
        );
        
        expect(errorAggregator.incrementError).toHaveBeenCalledWith(
          'invalid_uuid_format',
          'uuid_validation'
        );
      });
    });
  });

  describe('validateTransactionId', () => {
    describe('Valid transaction IDs', () => {
      test('should return valid result for correct UUID', () => {
        const validUUID = '550e8400-e29b-41d4-a716-446655440000';
        const result = validateTransactionId(validUUID);
        
        expect(result).toEqual({
          isValid: true
        });
      });

      test('should return valid result for UUID with whitespace', () => {
        const uuidWithWhitespace = ' 550e8400-e29b-41d4-a716-446655440000 ';
        const result = validateTransactionId(uuidWithWhitespace);
        
        expect(result).toEqual({
          isValid: true
        });
      });
    });

    describe('Invalid transaction IDs - Type errors', () => {
      test('should return INVALID_TYPE error for null', () => {
        const result = validateTransactionId(null as any);
        
        expect(result).toEqual({
          isValid: false,
          error: 'Transaction ID must be a valid string',
          errorCode: 'INVALID_TYPE'
        });
      });

      test('should return INVALID_TYPE error for undefined', () => {
        const result = validateTransactionId(undefined as any);
        
        expect(result).toEqual({
          isValid: false,
          error: 'Transaction ID must be a valid string',
          errorCode: 'INVALID_TYPE'
        });
      });

      test('should return INVALID_TYPE error for non-string types', () => {
        const nonStringValues = [
          123,
          {},
          [],
          true,
          false,
        ];

        nonStringValues.forEach(value => {
          const result = validateTransactionId(value as any);
          
          expect(result).toEqual({
            isValid: false,
            error: 'Transaction ID must be a valid string',
            errorCode: 'INVALID_TYPE'
          });
        });
      });
    });

    describe('Invalid transaction IDs - Empty values', () => {
      test('should return EMPTY_ID error for empty string', () => {
        const result = validateTransactionId('');
        
        expect(result).toEqual({
          isValid: false,
          error: 'Transaction ID cannot be empty',
          errorCode: 'EMPTY_ID'
        });
      });

      test('should return EMPTY_ID error for whitespace-only strings', () => {
        const whitespaceValues = [
          '   ',
          '\t',
          '\n',
          '\r',
          ' \t\n ',
        ];

        whitespaceValues.forEach(value => {
          const result = validateTransactionId(value);
          
          expect(result).toEqual({
            isValid: false,
            error: 'Transaction ID cannot be empty',
            errorCode: 'EMPTY_ID'
          });
        });
      });
    });

    describe('Invalid transaction IDs - Format errors', () => {
      test('should return INVALID_FORMAT error for non-UUID strings', () => {
        const invalidFormats = [
          'reference-amounts',
          'invalid-uuid',
          'not-a-uuid-at-all',
          'abc123',
          '12345',
        ];

        invalidFormats.forEach(value => {
          const result = validateTransactionId(value);
          
          expect(result).toEqual({
            isValid: false,
            error: 'Invalid UUID format. Expected format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx',
            errorCode: 'INVALID_FORMAT'
          });
        });
      });

      test('should return INVALID_FORMAT error for malformed UUIDs', () => {
        const malformedUUIDs = [
          '550e8400-e29b-41d4-a716-44665544000', // Missing character
          '550e8400-e29b-41d4-a716-4466554400000', // Extra character
          '550e8400e29b41d4a716446655440000', // Missing hyphens
          '550e8400-e29b-41d4-a716_446655440000', // Wrong separator
        ];

        malformedUUIDs.forEach(value => {
          const result = validateTransactionId(value);
          
          expect(result).toEqual({
            isValid: false,
            error: 'Invalid UUID format. Expected format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx',
            errorCode: 'INVALID_FORMAT'
          });
        });
      });
    });

    describe('Error tracking and logging', () => {
      test('should track errors for invalid types', () => {
        const { trackValidationError, errorAggregator } = require('@/lib/utils/error-tracking');
        
        validateTransactionId(null as any);
        
        expect(trackValidationError).toHaveBeenCalledWith(
          'Transaction ID validation failed: invalid type',
          expect.objectContaining({
            validationFunction: 'validateTransactionId',
            inputValue: null,
            inputType: 'object',
            errorCode: 'INVALID_TYPE',
            expectedFormat: 'string'
          })
        );
        
        expect(errorAggregator.incrementError).toHaveBeenCalledWith(
          'invalid_type',
          'transaction_id_validation'
        );
      });

      test('should track errors for empty IDs', () => {
        const { trackValidationError, errorAggregator } = require('@/lib/utils/error-tracking');
        
        validateTransactionId('');
        
        expect(trackValidationError).toHaveBeenCalledWith(
          'Transaction ID validation failed: empty ID',
          expect.objectContaining({
            validationFunction: 'validateTransactionId',
            inputValue: '',
            inputType: 'string',
            errorCode: 'EMPTY_ID',
            expectedFormat: 'non-empty string'
          })
        );
        
        expect(errorAggregator.incrementError).toHaveBeenCalledWith(
          'empty_id',
          'transaction_id_validation'
        );
      });

      test('should track errors for invalid formats', () => {
        const { trackValidationError, errorAggregator } = require('@/lib/utils/error-tracking');
        
        validateTransactionId('reference-amounts');
        
        expect(trackValidationError).toHaveBeenCalledWith(
          'Transaction ID validation failed: invalid UUID format',
          expect.objectContaining({
            validationFunction: 'validateTransactionId',
            inputValue: 'reference-amounts',
            inputType: 'string',
            errorCode: 'INVALID_FORMAT',
            expectedFormat: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
          })
        );
        
        expect(errorAggregator.incrementError).toHaveBeenCalledWith(
          'invalid_format',
          'transaction_id_validation'
        );
      });

      test('should log successful validation', () => {
        const { logger } = require('@/lib/logger');
        
        validateTransactionId('550e8400-e29b-41d4-a716-446655440000');
        
        expect(logger.debug).toHaveBeenCalledWith(
          'Transaction ID validation successful',
          expect.objectContaining({
            category: 'validation',
            validationFunction: 'validateTransactionId',
            validatedId: '550e8400-e29b-41d4-a716-446655440000'
          })
        );
      });
    });
  });

  describe('isUUID (Type Guard)', () => {
    test('should return true for valid UUIDs', () => {
      const validUUID = '550e8400-e29b-41d4-a716-446655440000';
      expect(isUUID(validUUID)).toBe(true);
    });

    test('should return false for invalid UUIDs', () => {
      const invalidUUID = 'reference-amounts';
      expect(isUUID(invalidUUID)).toBe(false);
    });

    test('should work as type guard in TypeScript', () => {
      const testValue: string = '550e8400-e29b-41d4-a716-446655440000';
      
      if (isUUID(testValue)) {
        // TypeScript should recognize testValue as string (UUID)
        expect(typeof testValue).toBe('string');
        expect(testValue.length).toBe(36);
      }
    });
  });

  describe('sanitizeUUID', () => {
    describe('Valid UUID sanitization', () => {
      test('should return sanitized UUID for valid input', () => {
        const validUUID = '550e8400-e29b-41d4-a716-446655440000';
        const result = sanitizeUUID(validUUID);
        
        expect(result).toBe(validUUID);
      });

      test('should trim whitespace and return valid UUID', () => {
        const uuidWithWhitespace = ' 550e8400-e29b-41d4-a716-446655440000 ';
        const expectedUUID = '550e8400-e29b-41d4-a716-446655440000';
        const result = sanitizeUUID(uuidWithWhitespace);
        
        expect(result).toBe(expectedUUID);
      });

      test('should handle various whitespace characters', () => {
        const whitespaceVariations = [
          '\t550e8400-e29b-41d4-a716-446655440000\t',
          '\n550e8400-e29b-41d4-a716-446655440000\n',
          ' \t550e8400-e29b-41d4-a716-446655440000\n ',
        ];

        whitespaceVariations.forEach(uuid => {
          const result = sanitizeUUID(uuid);
          expect(result).toBe('550e8400-e29b-41d4-a716-446655440000');
        });
      });
    });

    describe('Invalid UUID sanitization', () => {
      test('should return null for invalid UUID formats', () => {
        const invalidUUIDs = [
          'reference-amounts',
          'invalid-uuid',
          'not-a-uuid-at-all',
          '550e8400-e29b-41d4-a716-44665544000', // Missing character
        ];

        invalidUUIDs.forEach(uuid => {
          const result = sanitizeUUID(uuid);
          expect(result).toBeNull();
        });
      });

      test('should return null for non-string types', () => {
        const nonStringValues = [
          null,
          undefined,
          123,
          {},
          [],
          true,
        ];

        nonStringValues.forEach(value => {
          const result = sanitizeUUID(value as any);
          expect(result).toBeNull();
        });
      });

      test('should return null for empty strings', () => {
        const emptyValues = [
          '',
          '   ',
          '\t',
          '\n',
        ];

        emptyValues.forEach(value => {
          const result = sanitizeUUID(value);
          expect(result).toBeNull();
        });
      });
    });

    describe('Logging behavior', () => {
      test('should log successful sanitization', () => {
        const { logger } = require('@/lib/logger');
        
        sanitizeUUID('550e8400-e29b-41d4-a716-446655440000');
        
        expect(logger.debug).toHaveBeenCalledWith(
          'UUID sanitization successful',
          expect.objectContaining({
            category: 'validation',
            validationFunction: 'sanitizeUUID',
            sanitizedValue: '550e8400-e29b-41d4-a716-446655440000',
            wasModified: false
          })
        );
      });

      test('should log when UUID was modified during sanitization', () => {
        const { logger } = require('@/lib/logger');
        
        sanitizeUUID(' 550e8400-e29b-41d4-a716-446655440000 ');
        
        expect(logger.debug).toHaveBeenCalledWith(
          'UUID sanitization successful',
          expect.objectContaining({
            category: 'validation',
            validationFunction: 'sanitizeUUID',
            sanitizedValue: '550e8400-e29b-41d4-a716-446655440000',
            wasModified: true
          })
        );
      });

      test('should log failure for invalid input type', () => {
        const { logger } = require('@/lib/logger');
        
        sanitizeUUID(null as any);
        
        expect(logger.debug).toHaveBeenCalledWith(
          'UUID sanitization failed: invalid input',
          expect.objectContaining({
            category: 'validation',
            validationFunction: 'sanitizeUUID',
            inputValue: null,
            inputType: 'object',
            reason: 'invalid_input_type'
          })
        );
      });

      test('should log failure for invalid UUID format', () => {
        const { logger } = require('@/lib/logger');
        
        sanitizeUUID('reference-amounts');
        
        expect(logger.debug).toHaveBeenCalledWith(
          'UUID sanitization failed: invalid format after trimming',
          expect.objectContaining({
            category: 'validation',
            validationFunction: 'sanitizeUUID',
            inputValue: 'reference-amounts',
            trimmedValue: 'reference-amounts',
            reason: 'invalid_uuid_format'
          })
        );
      });
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    test('should handle extremely long strings', () => {
      const longString = 'a'.repeat(1000);
      
      expect(isValidUUID(longString)).toBe(false);
      expect(validateTransactionId(longString)).toEqual({
        isValid: false,
        error: 'Invalid UUID format. Expected format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx',
        errorCode: 'INVALID_FORMAT'
      });
      expect(sanitizeUUID(longString)).toBeNull();
    });

    test('should handle special characters', () => {
      const specialChars = [
        '550e8400-e29b-41d4-a716-446655440000!',
        '@550e8400-e29b-41d4-a716-446655440000',
        '550e8400-e29b-41d4-a716-446655440000#',
        '550e8400$e29b$41d4$a716$446655440000',
      ];

      specialChars.forEach(uuid => {
        expect(isValidUUID(uuid)).toBe(false);
        expect(validateTransactionId(uuid).isValid).toBe(false);
        expect(sanitizeUUID(uuid)).toBeNull();
      });
    });

    test('should handle Unicode characters', () => {
      const unicodeStrings = [
        '550e8400-e29b-41d4-a716-44665544000ñ',
        'ñ50e8400-e29b-41d4-a716-446655440000',
        '550e8400-e29b-41d4-a716-446655440000€',
      ];

      unicodeStrings.forEach(uuid => {
        expect(isValidUUID(uuid)).toBe(false);
        expect(validateTransactionId(uuid).isValid).toBe(false);
        expect(sanitizeUUID(uuid)).toBeNull();
      });
    });

    test('should handle mixed case consistently', () => {
      const mixedCaseUUID = '550E8400-E29B-41D4-A716-446655440000';
      
      expect(isValidUUID(mixedCaseUUID)).toBe(true);
      expect(validateTransactionId(mixedCaseUUID).isValid).toBe(true);
      expect(sanitizeUUID(mixedCaseUUID)).toBe(mixedCaseUUID);
    });
  });

  describe('Performance and Memory', () => {
    test('should handle multiple rapid validations', () => {
      const validUUID = '550e8400-e29b-41d4-a716-446655440000';
      const invalidUUID = 'reference-amounts';
      
      // Test rapid successive calls
      for (let i = 0; i < 100; i++) {
        expect(isValidUUID(validUUID)).toBe(true);
        expect(isValidUUID(invalidUUID)).toBe(false);
      }
    });

    test('should not leak memory with large inputs', () => {
      const largeInput = 'x'.repeat(10000);
      
      // Multiple calls with large input should not cause issues
      for (let i = 0; i < 10; i++) {
        expect(isValidUUID(largeInput)).toBe(false);
        expect(validateTransactionId(largeInput).isValid).toBe(false);
        expect(sanitizeUUID(largeInput)).toBeNull();
      }
    });
  });
});