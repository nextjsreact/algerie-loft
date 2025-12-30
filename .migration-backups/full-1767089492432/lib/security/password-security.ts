/**
 * Secure password handling utilities
 * Provides bcrypt-based password hashing, validation, and security measures
 */

import bcrypt from 'bcryptjs';
import { logger } from '@/lib/logger';

// Password security configuration
const SALT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

// Password strength requirements
export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  maxLength: number;
}

export const DEFAULT_PASSWORD_REQUIREMENTS: PasswordRequirements = {
  minLength: MIN_PASSWORD_LENGTH,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  maxLength: MAX_PASSWORD_LENGTH
};

/**
 * Hash password using bcrypt with salt
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    if (!password || typeof password !== 'string') {
      throw new Error('Password must be a non-empty string');
    }

    if (password.length > MAX_PASSWORD_LENGTH) {
      throw new Error(`Password must not exceed ${MAX_PASSWORD_LENGTH} characters`);
    }

    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    logger.info('Password hashed successfully');
    return hashedPassword;
  } catch (error) {
    logger.error('Password hashing failed', error);
    throw new Error('Password hashing failed');
  }
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    if (!password || !hash) {
      return false;
    }

    const isValid = await bcrypt.compare(password, hash);
    
    if (isValid) {
      logger.info('Password verification successful');
    } else {
      logger.warn('Password verification failed');
    }
    
    return isValid;
  } catch (error) {
    logger.error('Password verification error', error);
    return false;
  }
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(
  password: string, 
  requirements: PasswordRequirements = DEFAULT_PASSWORD_REQUIREMENTS
): { isValid: boolean; errors: string[]; score: number } {
  const errors: string[] = [];
  let score = 0;

  if (!password || typeof password !== 'string') {
    return { isValid: false, errors: ['Password is required'], score: 0 };
  }

  // Length validation
  if (password.length < requirements.minLength) {
    errors.push(`Password must be at least ${requirements.minLength} characters long`);
  } else {
    score += 1;
  }

  if (password.length > requirements.maxLength) {
    errors.push(`Password must not exceed ${requirements.maxLength} characters`);
  }

  // Character type requirements
  if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else if (requirements.requireUppercase) {
    score += 1;
  }

  if (requirements.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else if (requirements.requireLowercase) {
    score += 1;
  }

  if (requirements.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  } else if (requirements.requireNumbers) {
    score += 1;
  }

  if (requirements.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  } else if (requirements.requireSpecialChars) {
    score += 1;
  }

  // Additional strength checks
  if (password.length >= 12) score += 1;
  if (/[A-Z].*[A-Z]/.test(password)) score += 1; // Multiple uppercase
  if (/\d.*\d/.test(password)) score += 1; // Multiple numbers
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?].*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1; // Multiple special chars

  // Check for common weak patterns
  const weakPatterns = [
    /123456/,
    /password/i,
    /qwerty/i,
    /abc123/i,
    /admin/i,
    /letmein/i,
    /welcome/i,
    /monkey/i,
    /dragon/i
  ];

  for (const pattern of weakPatterns) {
    if (pattern.test(password)) {
      errors.push('Password contains common weak patterns');
      score = Math.max(0, score - 2);
      break;
    }
  }

  // Check for repeated characters
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Password should not contain repeated characters');
    score = Math.max(0, score - 1);
  }

  return {
    isValid: errors.length === 0,
    errors,
    score: Math.min(10, score) // Cap score at 10
  };
}

/**
 * Generate secure random password
 */
export function generateSecurePassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const allChars = uppercase + lowercase + numbers + specialChars;
  
  let password = '';
  
  // Ensure at least one character from each category
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += specialChars[Math.floor(Math.random() * specialChars.length)];
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Check if password has been compromised (basic check)
 */
export function checkPasswordCompromise(password: string): boolean {
  // Basic check for very common compromised passwords
  const commonCompromisedPasswords = [
    'password',
    '123456',
    '123456789',
    'qwerty',
    'abc123',
    'password123',
    'admin',
    'letmein',
    'welcome',
    'monkey',
    'dragon',
    'master',
    'shadow',
    'superman',
    'michael',
    'football',
    'baseball',
    'liverpool',
    'jordan',
    'princess'
  ];

  return commonCompromisedPasswords.includes(password.toLowerCase());
}

/**
 * Password aging check
 */
export function isPasswordExpired(lastChanged: Date, maxAgeInDays: number = 90): boolean {
  const now = new Date();
  const ageInMs = now.getTime() - lastChanged.getTime();
  const ageInDays = ageInMs / (1000 * 60 * 60 * 24);
  
  return ageInDays > maxAgeInDays;
}

/**
 * Generate password reset token
 */
export function generatePasswordResetToken(): { token: string; expires: Date } {
  const token = require('crypto').randomBytes(32).toString('hex');
  const expires = new Date();
  expires.setHours(expires.getHours() + 1); // 1 hour expiry
  
  return { token, expires };
}

/**
 * Validate password reset token
 */
export function validatePasswordResetToken(token: string, storedToken: string, expires: Date): boolean {
  if (!token || !storedToken || !expires) {
    return false;
  }
  
  if (new Date() > expires) {
    return false;
  }
  
  return token === storedToken;
}

/**
 * Password history management
 */
export class PasswordHistory {
  private static readonly MAX_HISTORY = 5;
  
  static async addToHistory(userId: string, passwordHash: string): Promise<void> {
    try {
      const { createClient } = await import('@/utils/supabase/server');
      const supabase = await createClient();
      
      // Add new password to history
      await supabase
        .from('password_history')
        .insert({
          user_id: userId,
          password_hash: passwordHash,
          created_at: new Date().toISOString()
        });
      
      // Keep only the last MAX_HISTORY passwords
      const { data: history } = await supabase
        .from('password_history')
        .select('id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(this.MAX_HISTORY + 1);
      
      if (history && history.length > this.MAX_HISTORY) {
        const idsToDelete = history.slice(this.MAX_HISTORY).map(h => h.id);
        await supabase
          .from('password_history')
          .delete()
          .in('id', idsToDelete);
      }
    } catch (error) {
      logger.error('Failed to add password to history', error);
    }
  }
  
  static async isPasswordReused(userId: string, newPassword: string): Promise<boolean> {
    try {
      const { createClient } = await import('@/utils/supabase/server');
      const supabase = await createClient();
      
      const { data: history } = await supabase
        .from('password_history')
        .select('password_hash')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(this.MAX_HISTORY);
      
      if (!history) return false;
      
      for (const entry of history) {
        if (await verifyPassword(newPassword, entry.password_hash)) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      logger.error('Failed to check password reuse', error);
      return false;
    }
  }
}

/**
 * Account lockout management
 */
export class AccountLockout {
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION_MINUTES = 30;
  
  static async recordFailedAttempt(identifier: string): Promise<{ isLocked: boolean; attemptsRemaining: number; lockoutExpires?: Date }> {
    try {
      const { createClient } = await import('@/utils/supabase/server');
      const supabase = await createClient();
      
      const now = new Date();
      
      // Get current lockout record
      const { data: lockout } = await supabase
        .from('account_lockouts')
        .select('*')
        .eq('identifier', identifier)
        .single();
      
      if (lockout) {
        // Check if lockout has expired
        if (lockout.locked_until && new Date(lockout.locked_until) > now) {
          return {
            isLocked: true,
            attemptsRemaining: 0,
            lockoutExpires: new Date(lockout.locked_until)
          };
        }
        
        // Increment attempts
        const newAttempts = lockout.failed_attempts + 1;
        const isLocked = newAttempts >= this.MAX_ATTEMPTS;
        const lockoutExpires = isLocked ? new Date(now.getTime() + this.LOCKOUT_DURATION_MINUTES * 60000) : null;
        
        await supabase
          .from('account_lockouts')
          .update({
            failed_attempts: newAttempts,
            locked_until: lockoutExpires?.toISOString(),
            last_attempt: now.toISOString()
          })
          .eq('identifier', identifier);
        
        return {
          isLocked,
          attemptsRemaining: Math.max(0, this.MAX_ATTEMPTS - newAttempts),
          lockoutExpires
        };
      } else {
        // Create new lockout record
        await supabase
          .from('account_lockouts')
          .insert({
            identifier,
            failed_attempts: 1,
            last_attempt: now.toISOString()
          });
        
        return {
          isLocked: false,
          attemptsRemaining: this.MAX_ATTEMPTS - 1
        };
      }
    } catch (error) {
      logger.error('Failed to record failed attempt', error);
      return { isLocked: false, attemptsRemaining: this.MAX_ATTEMPTS };
    }
  }
  
  static async clearFailedAttempts(identifier: string): Promise<void> {
    try {
      const { createClient } = await import('@/utils/supabase/server');
      const supabase = await createClient();
      
      await supabase
        .from('account_lockouts')
        .delete()
        .eq('identifier', identifier);
    } catch (error) {
      logger.error('Failed to clear failed attempts', error);
    }
  }
  
  static async isAccountLocked(identifier: string): Promise<{ isLocked: boolean; lockoutExpires?: Date }> {
    try {
      const { createClient } = await import('@/utils/supabase/server');
      const supabase = await createClient();
      
      const { data: lockout } = await supabase
        .from('account_lockouts')
        .select('locked_until')
        .eq('identifier', identifier)
        .single();
      
      if (!lockout || !lockout.locked_until) {
        return { isLocked: false };
      }
      
      const lockoutExpires = new Date(lockout.locked_until);
      const isLocked = lockoutExpires > new Date();
      
      return { isLocked, lockoutExpires };
    } catch (error) {
      logger.error('Failed to check account lockout', error);
      return { isLocked: false };
    }
  }
}