/**
 * Data encryption utilities for sensitive information
 * Provides AES-256-GCM encryption for payment data, banking information, and verification documents
 */

import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 32;

/**
 * Encryption key derivation from environment secret
 */
async function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  return (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
}

/**
 * Get encryption secret from environment
 */
function getEncryptionSecret(): string {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error('ENCRYPTION_SECRET environment variable is required');
  }
  return secret;
}

/**
 * Encrypt sensitive data using AES-256-GCM
 */
export async function encryptSensitiveData(data: string): Promise<string> {
  try {
    const secret = getEncryptionSecret();
    const salt = randomBytes(SALT_LENGTH);
    const iv = randomBytes(IV_LENGTH);
    const key = await deriveKey(secret, salt);

    const cipher = createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();

    // Combine salt, iv, tag, and encrypted data
    const result = Buffer.concat([
      salt,
      iv,
      tag,
      Buffer.from(encrypted, 'hex')
    ]).toString('base64');

    return result;
  } catch (error) {
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt sensitive data using AES-256-GCM
 */
export async function decryptSensitiveData(encryptedData: string): Promise<string> {
  try {
    const secret = getEncryptionSecret();
    const buffer = Buffer.from(encryptedData, 'base64');

    // Extract components
    const salt = buffer.subarray(0, SALT_LENGTH);
    const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = buffer.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const encrypted = buffer.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

    const key = await deriveKey(secret, salt);

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Encrypt payment information (credit card, bank details)
 */
export async function encryptPaymentData(paymentData: {
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  bankAccount?: string;
  routingNumber?: string;
  iban?: string;
  bic?: string;
}): Promise<{
  encryptedCardNumber?: string;
  encryptedExpiryDate?: string;
  encryptedCvv?: string;
  encryptedBankAccount?: string;
  encryptedRoutingNumber?: string;
  encryptedIban?: string;
  encryptedBic?: string;
}> {
  const encrypted: any = {};

  if (paymentData.cardNumber) {
    encrypted.encryptedCardNumber = await encryptSensitiveData(paymentData.cardNumber);
  }
  if (paymentData.expiryDate) {
    encrypted.encryptedExpiryDate = await encryptSensitiveData(paymentData.expiryDate);
  }
  if (paymentData.cvv) {
    encrypted.encryptedCvv = await encryptSensitiveData(paymentData.cvv);
  }
  if (paymentData.bankAccount) {
    encrypted.encryptedBankAccount = await encryptSensitiveData(paymentData.bankAccount);
  }
  if (paymentData.routingNumber) {
    encrypted.encryptedRoutingNumber = await encryptSensitiveData(paymentData.routingNumber);
  }
  if (paymentData.iban) {
    encrypted.encryptedIban = await encryptSensitiveData(paymentData.iban);
  }
  if (paymentData.bic) {
    encrypted.encryptedBic = await encryptSensitiveData(paymentData.bic);
  }

  return encrypted;
}

/**
 * Decrypt payment information
 */
export async function decryptPaymentData(encryptedPaymentData: {
  encryptedCardNumber?: string;
  encryptedExpiryDate?: string;
  encryptedCvv?: string;
  encryptedBankAccount?: string;
  encryptedRoutingNumber?: string;
  encryptedIban?: string;
  encryptedBic?: string;
}): Promise<{
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  bankAccount?: string;
  routingNumber?: string;
  iban?: string;
  bic?: string;
}> {
  const decrypted: any = {};

  if (encryptedPaymentData.encryptedCardNumber) {
    decrypted.cardNumber = await decryptSensitiveData(encryptedPaymentData.encryptedCardNumber);
  }
  if (encryptedPaymentData.encryptedExpiryDate) {
    decrypted.expiryDate = await decryptSensitiveData(encryptedPaymentData.encryptedExpiryDate);
  }
  if (encryptedPaymentData.encryptedCvv) {
    decrypted.cvv = await decryptSensitiveData(encryptedPaymentData.encryptedCvv);
  }
  if (encryptedPaymentData.encryptedBankAccount) {
    decrypted.bankAccount = await decryptSensitiveData(encryptedPaymentData.encryptedBankAccount);
  }
  if (encryptedPaymentData.encryptedRoutingNumber) {
    decrypted.routingNumber = await decryptSensitiveData(encryptedPaymentData.encryptedRoutingNumber);
  }
  if (encryptedPaymentData.encryptedIban) {
    decrypted.iban = await decryptSensitiveData(encryptedPaymentData.encryptedIban);
  }
  if (encryptedPaymentData.encryptedBic) {
    decrypted.bic = await decryptSensitiveData(encryptedPaymentData.encryptedBic);
  }

  return decrypted;
}

/**
 * Generate a secure random token for verification purposes
 */
export function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString('hex');
}

/**
 * Hash sensitive data for comparison (one-way)
 */
export async function hashSensitiveData(data: string): Promise<string> {
  const { createHash } = await import('crypto');
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Mask sensitive data for display purposes
 */
export function maskSensitiveData(data: string, visibleChars: number = 4): string {
  if (data.length <= visibleChars) {
    return '*'.repeat(data.length);
  }
  
  const masked = '*'.repeat(data.length - visibleChars);
  const visible = data.slice(-visibleChars);
  return masked + visible;
}

/**
 * Validate encryption environment setup
 */
export function validateEncryptionSetup(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!process.env.ENCRYPTION_SECRET) {
    errors.push('ENCRYPTION_SECRET environment variable is missing');
  } else if (process.env.ENCRYPTION_SECRET.length < 32) {
    errors.push('ENCRYPTION_SECRET must be at least 32 characters long');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}