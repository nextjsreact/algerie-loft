/**
 * Secure password handling utilities - TEMPORARY VERSION
 * Provides basic password validation without bcrypt (bcryptjs not installed)
 */

import { logger } from '@/lib/logger';

// Password security configuration
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

// Password strength requirements
export interface PasswordRequirements {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

// Default password requirements
export const DEFAULT_PASSWORD_REQUIREMENTS: PasswordRequirements = {
  minLength: MIN_PASSWORD_LENGTH,
  maxLength: MAX_PASSWORD_LENGTH,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
};

/**
 * Hash a password - TEMPORARY IMPLEMENTATION
 * @param password - Plain text password
 * @returns Promise<string> - Hashed password (currently returns plain text with warning)
 */
export async function hashPassword(password: string): Promise<string> {
  logger.warn('TEMPORARY: Password hashing disabled - bcryptjs not installed');
  // In production, this should use bcrypt.hash(password, SALT_ROUNDS)
  return `temp_hash_${password}`;
}

/**
 * Verify a password - TEMPORARY IMPLEMENTATION
 * @param password - Plain text password
 * @param hashedPassword - Hashed password
 * @returns Promise<boolean> - Whether password matches
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  logger.warn('TEMPORARY: Password verification simplified - bcryptjs not installed');
  // In production, this should use bcrypt.compare(password, hashedPassword)
  return hashedPassword === `temp_hash_${password}`;
}

/**
 * Validate password strength
 * @param password - Password to validate
 * @param requirements - Password requirements (optional)
 * @returns Object with validation result and errors
 */
export function validatePasswordStrength(
  password: string,
  requirements: PasswordRequirements = DEFAULT_PASSWORD_REQUIREMENTS
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Length validation
  if (password.length < requirements.minLength) {
    errors.push(`Password must be at least ${requirements.minLength} characters long`);
  }
  
  if (password.length > requirements.maxLength) {
    errors.push(`Password must not exceed ${requirements.maxLength} characters`);
  }

  // Character requirements
  if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (requirements.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (requirements.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (requirements.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generate a secure random password
 * @param length - Password length (default: 16)
 * @param requirements - Password requirements
 * @returns Generated password
 */
export function generateSecurePassword(
  length: number = 16,
  requirements: PasswordRequirements = DEFAULT_PASSWORD_REQUIREMENTS
): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const specialChars = '!@#$%^&*(),.?":{}|<>';

  let charset = '';
  let password = '';

  // Build charset based on requirements
  if (requirements.requireUppercase) {
    charset += uppercase;
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
  }

  if (requirements.requireLowercase) {
    charset += lowercase;
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
  }

  if (requirements.requireNumbers) {
    charset += numbers;
    password += numbers[Math.floor(Math.random() * numbers.length)];
  }

  if (requirements.requireSpecialChars) {
    charset += specialChars;
    password += specialChars[Math.floor(Math.random() * specialChars.length)];
  }

  // Fill remaining length
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }

  // Shuffle password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}