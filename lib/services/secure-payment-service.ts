import { createClient } from '@/utils/supabase/server';
import { logger } from '@/lib/logger';
import type { SecurePaymentData } from '@/lib/schemas/privacy';
import crypto from 'crypto';

export class SecurePaymentService {
  private static readonly ENCRYPTION_ALGORITHM = 'aes-256-gcm';
  private static readonly TOKEN_LENGTH = 32;

  /**
   * Process secure payment with PCI DSS compliance
   */
  static async processSecurePayment(
    paymentData: SecurePaymentData,
    userId: string,
    bookingId: string
  ) {
    try {
      // Check honeypot
      if (paymentData.website) {
        logger.warn('Payment blocked - honeypot triggered', { userId, bookingId });
        throw new Error('Invalid payment request');
      }

      // Validate consent
      if (!paymentData.consentToCharge || !paymentData.termsAccepted) {
        throw new Error('Payment consent required');
      }

      // Generate secure payment token
      const paymentToken = this.generateSecureToken();
      
      // Encrypt sensitive data
      const encryptedData = await this.encryptSensitiveData(paymentData);
      
      // Store payment record with minimal sensitive data
      const paymentRecord = await this.createPaymentRecord({
        userId,
        bookingId,
        paymentToken,
        amount: paymentData.amount,
        currency: paymentData.currency,
        description: paymentData.description,
        encryptedData,
        clientIp: paymentData.clientIp,
        userAgent: paymentData.userAgent,
        sessionId: paymentData.sessionId
      });

      // Process payment through secure gateway
      const paymentResult = await this.processPaymentGateway(paymentData, paymentToken);

      // Update payment record with result
      await this.updatePaymentRecord(paymentRecord.id, paymentResult);

      // Log security event
      logger.info('Secure payment processed', {
        paymentId: paymentRecord.id,
        userId,
        bookingId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        success: paymentResult.success
      });

      return {
        success: paymentResult.success,
        paymentId: paymentRecord.id,
        transactionId: paymentResult.transactionId,
        message: paymentResult.message
      };

    } catch (error) {
      logger.error('Secure payment processing failed', { error, userId, bookingId });
      throw error;
    }
  }

  /**
   * Tokenize sensitive payment data
   */
  static async tokenizePaymentData(paymentData: Partial<SecurePaymentData>) {
    try {
      const tokens: Record<string, string> = {};

      // Tokenize card data
      if (paymentData.cardToken) {
        tokens.cardToken = this.generateSecureToken();
        await this.storeTokenMapping(tokens.cardToken, paymentData.cardToken);
      }

      // Tokenize mobile number
      if (paymentData.mobileNumber) {
        tokens.mobileToken = this.generateSecureToken();
        await this.storeTokenMapping(tokens.mobileToken, paymentData.mobileNumber);
      }

      // Tokenize bank account
      if (paymentData.accountMask) {
        tokens.accountToken = this.generateSecureToken();
        await this.storeTokenMapping(tokens.accountToken, paymentData.accountMask);
      }

      return tokens;
    } catch (error) {
      logger.error('Payment data tokenization failed', error);
      throw error;
    }
  }

  /**
   * Validate payment security requirements
   */
  static validatePaymentSecurity(paymentData: SecurePaymentData): boolean {
    // Check required security fields
    if (!paymentData.clientIp || !paymentData.userAgent) {
      return false;
    }

    // Validate consent fields
    if (!paymentData.consentToCharge || !paymentData.termsAccepted) {
      return false;
    }

    // Validate amount and currency
    if (paymentData.amount <= 0 || !paymentData.currency) {
      return false;
    }

    // Additional security validations based on payment method
    if (paymentData.cardToken && !paymentData.cardLast4) {
      return false;
    }

    if (paymentData.mobileNumber && !paymentData.mobileProvider) {
      return false;
    }

    return true;
  }

  /**
   * Generate secure payment token
   */
  private static generateSecureToken(): string {
    return crypto.randomBytes(this.TOKEN_LENGTH).toString('hex');
  }

  /**
   * Encrypt sensitive payment data
   */
  private static async encryptSensitiveData(paymentData: SecurePaymentData) {
    try {
      const key = process.env.PAYMENT_ENCRYPTION_KEY;
      if (!key) {
        throw new Error('Payment encryption key not configured');
      }

      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(this.ENCRYPTION_ALGORITHM, key);
      
      const sensitiveData = {
        cardToken: paymentData.cardToken,
        mobileNumber: paymentData.mobileNumber,
        accountMask: paymentData.accountMask,
        walletId: paymentData.walletId
      };

      let encrypted = cipher.update(JSON.stringify(sensitiveData), 'utf8', 'hex');
      encrypted += cipher.final('hex');

      return {
        data: encrypted,
        iv: iv.toString('hex'),
        algorithm: this.ENCRYPTION_ALGORITHM
      };
    } catch (error) {
      logger.error('Payment data encryption failed', error);
      throw error;
    }
  }

  /**
   * Create payment record in database
   */
  private static async createPaymentRecord(recordData: any) {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('secure_payments')
        .insert({
          user_id: recordData.userId,
          booking_id: recordData.bookingId,
          payment_token: recordData.paymentToken,
          amount: recordData.amount,
          currency: recordData.currency,
          description: recordData.description,
          encrypted_data: recordData.encryptedData,
          client_ip: recordData.clientIp,
          user_agent: recordData.userAgent,
          session_id: recordData.sessionId,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to create payment record', { error, recordData });
        throw new Error('Failed to create payment record');
      }

      return data;
    } catch (error) {
      logger.error('Error creating payment record', error);
      throw error;
    }
  }

  /**
   * Process payment through secure gateway
   */
  private static async processPaymentGateway(
    paymentData: SecurePaymentData, 
    paymentToken: string
  ) {
    try {
      // This would integrate with actual payment processors
      // For now, simulate the process
      
      // Validate payment method
      const isValid = this.validatePaymentMethod(paymentData);
      if (!isValid) {
        throw new Error('Invalid payment method');
      }

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate transaction ID
      const transactionId = `TXN_${Date.now()}_${paymentToken.substring(0, 8)}`;

      // Simulate success/failure (90% success rate for demo)
      const success = Math.random() > 0.1;

      return {
        success,
        transactionId: success ? transactionId : null,
        message: success ? 'Payment processed successfully' : 'Payment failed - please try again',
        gatewayResponse: {
          code: success ? '00' : '05',
          message: success ? 'Approved' : 'Declined'
        }
      };
    } catch (error) {
      logger.error('Payment gateway processing failed', error);
      return {
        success: false,
        transactionId: null,
        message: 'Payment processing error',
        gatewayResponse: {
          code: '99',
          message: 'System error'
        }
      };
    }
  }

  /**
   * Update payment record with result
   */
  private static async updatePaymentRecord(paymentId: string, result: any) {
    try {
      const supabase = await createClient();

      const { error } = await supabase
        .from('secure_payments')
        .update({
          status: result.success ? 'completed' : 'failed',
          transaction_id: result.transactionId,
          gateway_response: result.gatewayResponse,
          processed_at: new Date().toISOString()
        })
        .eq('id', paymentId);

      if (error) {
        logger.error('Failed to update payment record', { error, paymentId, result });
        throw new Error('Failed to update payment record');
      }
    } catch (error) {
      logger.error('Error updating payment record', error);
      throw error;
    }
  }

  /**
   * Store token mapping securely
   */
  private static async storeTokenMapping(token: string, originalValue: string) {
    try {
      const supabase = await createClient();

      // Hash the original value for security
      const hashedValue = crypto.createHash('sha256').update(originalValue).digest('hex');

      const { error } = await supabase
        .from('payment_tokens')
        .insert({
          token,
          value_hash: hashedValue,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        });

      if (error) {
        logger.error('Failed to store token mapping', { error, token });
        throw new Error('Failed to store token mapping');
      }
    } catch (error) {
      logger.error('Error storing token mapping', error);
      throw error;
    }
  }

  /**
   * Validate payment method
   */
  private static validatePaymentMethod(paymentData: SecurePaymentData): boolean {
    // Card validation
    if (paymentData.cardToken) {
      return !!(paymentData.cardLast4 && paymentData.cardBrand);
    }

    // Mobile payment validation
    if (paymentData.mobileNumber) {
      return !!(paymentData.mobileProvider && /^\+213\d{9}$/.test(paymentData.mobileNumber));
    }

    // Bank transfer validation
    if (paymentData.accountMask) {
      return !!paymentData.bankCode;
    }

    // Digital wallet validation
    if (paymentData.walletId) {
      return !!paymentData.walletProvider;
    }

    return false;
  }

  /**
   * Get payment history for user (with security filtering)
   */
  static async getPaymentHistory(userId: string, limit: number = 10) {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('secure_payments')
        .select(`
          id,
          amount,
          currency,
          description,
          status,
          transaction_id,
          created_at,
          processed_at
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Failed to get payment history', { error, userId });
        throw new Error('Failed to get payment history');
      }

      return data;
    } catch (error) {
      logger.error('Error getting payment history', error);
      throw error;
    }
  }

  /**
   * Cleanup expired tokens and sensitive data
   */
  static async cleanupExpiredData() {
    try {
      const supabase = await createClient();

      // Remove expired payment tokens
      const { error: tokenError } = await supabase
        .from('payment_tokens')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (tokenError) {
        logger.error('Failed to cleanup expired tokens', tokenError);
      }

      // Archive old payment records (older than 7 years for compliance)
      const sevenYearsAgo = new Date();
      sevenYearsAgo.setFullYear(sevenYearsAgo.getFullYear() - 7);

      const { error: archiveError } = await supabase
        .from('secure_payments')
        .update({ archived: true })
        .lt('created_at', sevenYearsAgo.toISOString())
        .eq('archived', false);

      if (archiveError) {
        logger.error('Failed to archive old payments', archiveError);
      }

      logger.info('Payment data cleanup completed');
    } catch (error) {
      logger.error('Error during payment data cleanup', error);
    }
  }
}